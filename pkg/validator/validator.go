package validator

import (
	"regexp"
	"strings"
)

// PhoneNumber validates and formats a phone number
func PhoneNumber(phone string) (string, bool) {
	// Remove all non-numeric characters
	re := regexp.MustCompile(`[^0-9]`)
	cleaned := re.ReplaceAllString(phone, "")

	// Check minimum length (country code + number)
	if len(cleaned) < 10 || len(cleaned) > 15 {
		return "", false
	}

	return cleaned, true
}

// JID validates and formats a WhatsApp JID
func JID(jid string) (string, bool) {
	if jid == "" {
		return "", false
	}

	// If already has @s.whatsapp.net suffix, validate it
	if strings.HasSuffix(jid, "@s.whatsapp.net") {
		parts := strings.Split(jid, "@")
		if len(parts) != 2 {
			return "", false
		}
		phone, valid := PhoneNumber(parts[0])
		if !valid {
			return "", false
		}
		return phone + "@s.whatsapp.net", true
	}

	// If it's a group JID
	if strings.HasSuffix(jid, "@g.us") {
		return jid, true
	}

	// Otherwise, treat as phone number
	phone, valid := PhoneNumber(jid)
	if !valid {
		return "", false
	}

	return phone + "@s.whatsapp.net", true
}

// GroupJID validates a group JID
func GroupJID(jid string) (string, bool) {
	if jid == "" {
		return "", false
	}

	if strings.HasSuffix(jid, "@g.us") {
		return jid, true
	}

	// Try to append group suffix if it looks like a group ID
	if strings.Contains(jid, "-") {
		return jid + "@g.us", true
	}

	return "", false
}

// URL validates a URL
func URL(url string) bool {
	if url == "" {
		return false
	}

	// Simple URL validation
	return strings.HasPrefix(url, "http://") || strings.HasPrefix(url, "https://")
}

// InstanceName validates an instance name
func InstanceName(name string) bool {
	if name == "" || len(name) > 100 {
		return false
	}

	// Only allow alphanumeric, underscore, and hyphen
	re := regexp.MustCompile(`^[a-zA-Z0-9_-]+$`)
	return re.MatchString(name)
}

// MediaType validates a media type
func MediaType(mediaType string) bool {
	validTypes := []string{"image", "video", "audio", "document", "sticker"}
	for _, t := range validTypes {
		if mediaType == t {
			return true
		}
	}
	return false
}

// MimeType returns if a mime type is valid for WhatsApp
func MimeType(mimeType string) bool {
	validMimeTypes := map[string]bool{
		// Images
		"image/jpeg": true,
		"image/png":  true,
		"image/gif":  true,
		"image/webp": true,
		// Videos
		"video/mp4":       true,
		"video/3gpp":      true,
		"video/quicktime": true,
		// Audio
		"audio/ogg":  true,
		"audio/mpeg": true,
		"audio/mp4":  true,
		"audio/amr":  true,
		// Documents
		"application/pdf":    true,
		"application/msword": true,
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
		"application/vnd.ms-excel": true,
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":         true,
		"application/vnd.ms-powerpoint":                                             true,
		"application/vnd.openxmlformats-officedocument.presentationml.presentation": true,
		"text/plain": true,
	}

	return validMimeTypes[mimeType]
}
