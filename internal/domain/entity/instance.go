package entity

import (
	"time"

	"github.com/google/uuid"
)

// InstanceStatus represents the connection status of an instance
type InstanceStatus string

const (
	InstanceStatusDisconnected InstanceStatus = "disconnected"
	InstanceStatusConnecting   InstanceStatus = "connecting"
	InstanceStatusConnected    InstanceStatus = "connected"
	InstanceStatusQRCode       InstanceStatus = "qrcode"
	InstanceStatusError        InstanceStatus = "error"
)

// Instance represents a WhatsApp instance/session
type Instance struct {
	ID          uuid.UUID      `json:"id"`
	Name        string         `json:"name"`
	APIKey      string         `json:"api_key"`
	Status      InstanceStatus `json:"status"`
	PhoneNumber string         `json:"phone_number,omitempty"`
	ProfileName string         `json:"profile_name,omitempty"`
	ProfilePic  string         `json:"profile_pic,omitempty"`
	QRCode      string         `json:"qr_code,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

// NewInstance creates a new instance with default values
func NewInstance(name string) *Instance {
	now := time.Now()
	return &Instance{
		ID:        uuid.New(),
		Name:      name,
		APIKey:    generateAPIKey(),
		Status:    InstanceStatusDisconnected,
		CreatedAt: now,
		UpdatedAt: now,
	}
}

// generateAPIKey generates a random API key
func generateAPIKey() string {
	return uuid.New().String() + "-" + uuid.New().String()
}

// IsConnected returns true if the instance is connected
func (i *Instance) IsConnected() bool {
	return i.Status == InstanceStatusConnected
}

// SetConnected updates the instance status to connected
func (i *Instance) SetConnected(phoneNumber, profileName, profilePic string) {
	i.Status = InstanceStatusConnected
	i.PhoneNumber = phoneNumber
	i.ProfileName = profileName
	i.ProfilePic = profilePic
	i.QRCode = ""
	i.UpdatedAt = time.Now()
}

// SetDisconnected updates the instance status to disconnected
func (i *Instance) SetDisconnected() {
	i.Status = InstanceStatusDisconnected
	i.QRCode = ""
	i.UpdatedAt = time.Now()
}

// SetQRCode updates the instance with a new QR code
func (i *Instance) SetQRCode(qrCode string) {
	i.Status = InstanceStatusQRCode
	i.QRCode = qrCode
	i.UpdatedAt = time.Now()
}

// SetConnecting updates the instance status to connecting
func (i *Instance) SetConnecting() {
	i.Status = InstanceStatusConnecting
	i.UpdatedAt = time.Now()
}

// SetError updates the instance status to error
func (i *Instance) SetError() {
	i.Status = InstanceStatusError
	i.UpdatedAt = time.Now()
}
