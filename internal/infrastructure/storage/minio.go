package storage

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"path"
	"time"

	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"go.uber.org/zap"
)

// Client wraps MinIO client
type Client struct {
	mc         *minio.Client
	bucket     string
	logger     *zap.Logger
	publicURL  string
}

// Config holds MinIO configuration
type Config struct {
	Endpoint        string
	AccessKeyID     string
	SecretAccessKey string
	BucketName      string
	UseSSL          bool
	PublicURL       string // Optional: public URL for accessing files
}

// NewClient creates a new MinIO client
func NewClient(cfg Config, logger *zap.Logger) (*Client, error) {
	mc, err := minio.New(cfg.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.AccessKeyID, cfg.SecretAccessKey, ""),
		Secure: cfg.UseSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create MinIO client: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Check if bucket exists, create if not
	exists, err := mc.BucketExists(ctx, cfg.BucketName)
	if err != nil {
		return nil, fmt.Errorf("failed to check bucket existence: %w", err)
	}

	if !exists {
		if err := mc.MakeBucket(ctx, cfg.BucketName, minio.MakeBucketOptions{}); err != nil {
			return nil, fmt.Errorf("failed to create bucket: %w", err)
		}

		// Set public read policy for the bucket
		policy := fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Principal": {"AWS": ["*"]},
					"Action": ["s3:GetObject"],
					"Resource": ["arn:aws:s3:::%s/*"]
				}
			]
		}`, cfg.BucketName)

		if err := mc.SetBucketPolicy(ctx, cfg.BucketName, policy); err != nil {
			logger.Warn("Failed to set bucket policy", zap.Error(err))
		}
	}

	publicURL := cfg.PublicURL
	if publicURL == "" {
		scheme := "http"
		if cfg.UseSSL {
			scheme = "https"
		}
		publicURL = fmt.Sprintf("%s://%s", scheme, cfg.Endpoint)
	}

	logger.Info("📦 Connected to MinIO",
		zap.String("endpoint", cfg.Endpoint),
		zap.String("bucket", cfg.BucketName),
	)

	return &Client{
		mc:        mc,
		bucket:    cfg.BucketName,
		logger:    logger,
		publicURL: publicURL,
	}, nil
}

// UploadResult holds the result of an upload operation
type UploadResult struct {
	Key         string    `json:"key"`
	URL         string    `json:"url"`
	Size        int64     `json:"size"`
	ContentType string    `json:"content_type"`
	UploadedAt  time.Time `json:"uploaded_at"`
}

// Upload uploads data to MinIO
func (c *Client) Upload(ctx context.Context, data []byte, contentType, folder string) (*UploadResult, error) {
	// Generate unique filename
	ext := getExtensionFromMimeType(contentType)
	key := path.Join(folder, fmt.Sprintf("%s%s", uuid.New().String(), ext))

	reader := bytes.NewReader(data)

	info, err := c.mc.PutObject(ctx, c.bucket, key, reader, int64(len(data)), minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to upload object: %w", err)
	}

	url := fmt.Sprintf("%s/%s/%s", c.publicURL, c.bucket, key)

	c.logger.Debug("📤 File uploaded",
		zap.String("key", key),
		zap.Int64("size", info.Size),
		zap.String("content_type", contentType),
	)

	return &UploadResult{
		Key:         key,
		URL:         url,
		Size:        info.Size,
		ContentType: contentType,
		UploadedAt:  time.Now(),
	}, nil
}

// UploadFromURL downloads and uploads a file from URL
func (c *Client) UploadFromURL(ctx context.Context, sourceURL, folder string) (*UploadResult, error) {
	// Download file
	resp, err := http.Get(sourceURL)
	if err != nil {
		return nil, fmt.Errorf("failed to download file: %w", err)
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	contentType := resp.Header.Get("Content-Type")
	if contentType == "" {
		contentType = http.DetectContentType(data)
	}

	return c.Upload(ctx, data, contentType, folder)
}

// Download downloads a file from MinIO
func (c *Client) Download(ctx context.Context, key string) ([]byte, string, error) {
	obj, err := c.mc.GetObject(ctx, c.bucket, key, minio.GetObjectOptions{})
	if err != nil {
		return nil, "", fmt.Errorf("failed to get object: %w", err)
	}
	defer obj.Close()

	info, err := obj.Stat()
	if err != nil {
		return nil, "", fmt.Errorf("failed to stat object: %w", err)
	}

	data, err := io.ReadAll(obj)
	if err != nil {
		return nil, "", fmt.Errorf("failed to read object: %w", err)
	}

	return data, info.ContentType, nil
}

// Delete removes a file from MinIO
func (c *Client) Delete(ctx context.Context, key string) error {
	if err := c.mc.RemoveObject(ctx, c.bucket, key, minio.RemoveObjectOptions{}); err != nil {
		return fmt.Errorf("failed to delete object: %w", err)
	}

	c.logger.Debug("🗑️ File deleted",
		zap.String("key", key),
	)

	return nil
}

// GetPresignedURL generates a presigned URL for temporary access
func (c *Client) GetPresignedURL(ctx context.Context, key string, expiry time.Duration) (string, error) {
	reqParams := make(url.Values)
	presignedURL, err := c.mc.PresignedGetObject(ctx, c.bucket, key, expiry, reqParams)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}
	return presignedURL.String(), nil
}

// GetPublicURL returns the public URL for a file
func (c *Client) GetPublicURL(key string) string {
	return fmt.Sprintf("%s/%s/%s", c.publicURL, c.bucket, key)
}

// ListFiles lists files in a folder
func (c *Client) ListFiles(ctx context.Context, prefix string, limit int) ([]FileInfo, error) {
	var files []FileInfo

	opts := minio.ListObjectsOptions{
		Prefix:    prefix,
		Recursive: true,
	}

	count := 0
	for obj := range c.mc.ListObjects(ctx, c.bucket, opts) {
		if obj.Err != nil {
			return nil, fmt.Errorf("error listing objects: %w", obj.Err)
		}

		files = append(files, FileInfo{
			Key:          obj.Key,
			Size:         obj.Size,
			ContentType:  obj.ContentType,
			LastModified: obj.LastModified,
			URL:          c.GetPublicURL(obj.Key),
		})

		count++
		if limit > 0 && count >= limit {
			break
		}
	}

	return files, nil
}

// FileInfo holds file metadata
type FileInfo struct {
	Key          string    `json:"key"`
	Size         int64     `json:"size"`
	ContentType  string    `json:"content_type"`
	LastModified time.Time `json:"last_modified"`
	URL          string    `json:"url"`
}

// GetStats returns bucket statistics
func (c *Client) GetStats(ctx context.Context) (*BucketStats, error) {
	var totalSize int64
	var totalCount int64

	for obj := range c.mc.ListObjects(ctx, c.bucket, minio.ListObjectsOptions{Recursive: true}) {
		if obj.Err != nil {
			return nil, fmt.Errorf("error listing objects: %w", obj.Err)
		}
		totalSize += obj.Size
		totalCount++
	}

	return &BucketStats{
		Bucket:     c.bucket,
		TotalSize:  totalSize,
		TotalCount: totalCount,
	}, nil
}

// BucketStats holds bucket statistics
type BucketStats struct {
	Bucket     string `json:"bucket"`
	TotalSize  int64  `json:"total_size"`
	TotalCount int64  `json:"total_count"`
}

// getExtensionFromMimeType returns file extension from mime type
func getExtensionFromMimeType(mimeType string) string {
	extensions := map[string]string{
		"image/jpeg":      ".jpg",
		"image/png":       ".png",
		"image/gif":       ".gif",
		"image/webp":      ".webp",
		"video/mp4":       ".mp4",
		"video/webm":      ".webm",
		"audio/mpeg":      ".mp3",
		"audio/ogg":       ".ogg",
		"audio/wav":       ".wav",
		"application/pdf": ".pdf",
		"text/plain":      ".txt",
	}

	if ext, ok := extensions[mimeType]; ok {
		return ext
	}
	return ""
}

// MediaType represents different media types
type MediaType string

const (
	MediaTypeImage    MediaType = "images"
	MediaTypeVideo    MediaType = "videos"
	MediaTypeAudio    MediaType = "audio"
	MediaTypeDocument MediaType = "documents"
	MediaTypeSticker  MediaType = "stickers"
)

// GetMediaTypeFolder returns the folder for a media type
func GetMediaTypeFolder(mimeType string) string {
	switch {
	case len(mimeType) > 5 && mimeType[:5] == "image":
		return string(MediaTypeImage)
	case len(mimeType) > 5 && mimeType[:5] == "video":
		return string(MediaTypeVideo)
	case len(mimeType) > 5 && mimeType[:5] == "audio":
		return string(MediaTypeAudio)
	default:
		return string(MediaTypeDocument)
	}
}

