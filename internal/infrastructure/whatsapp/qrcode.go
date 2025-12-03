package whatsapp

import (
	"encoding/base64"
	"fmt"

	"github.com/skip2/go-qrcode"
)

// QRCodeGenerator handles QR code generation
type QRCodeGenerator struct{}

// NewQRCodeGenerator creates a new QR code generator
func NewQRCodeGenerator() *QRCodeGenerator {
	return &QRCodeGenerator{}
}

// Generate generates a QR code as base64 encoded PNG
func (g *QRCodeGenerator) Generate(data string, size int) (string, error) {
	if size <= 0 {
		size = 256
	}

	// Generate QR code
	png, err := qrcode.Encode(data, qrcode.Medium, size)
	if err != nil {
		return "", fmt.Errorf("failed to generate QR code: %w", err)
	}

	// Encode as base64
	b64 := base64.StdEncoding.EncodeToString(png)
	return "data:image/png;base64," + b64, nil
}

// GenerateRaw generates a QR code as raw PNG bytes
func (g *QRCodeGenerator) GenerateRaw(data string, size int) ([]byte, error) {
	if size <= 0 {
		size = 256
	}

	return qrcode.Encode(data, qrcode.Medium, size)
}

