package dto

import (
	"time"

	"github.com/google/uuid"
	"github.com/jonadableite/turbozap-api/internal/domain/entity"
)

// CreateInstanceRequest represents the request to create a new instance
type CreateInstanceRequest struct {
	Name string `json:"name" validate:"required,min=1,max=100"`
}

// CreateInstanceResponse represents the response after creating an instance
type CreateInstanceResponse struct {
	ID     uuid.UUID `json:"id"`
	Name   string    `json:"name"`
	APIKey string    `json:"api_key"`
	Status string    `json:"status"`
}

// InstanceResponse represents the instance information response
type InstanceResponse struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Status      string    `json:"status"`
	PhoneNumber string    `json:"phone_number,omitempty"`
	ProfileName string    `json:"profile_name,omitempty"`
	ProfilePic  string    `json:"profile_pic,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

// InstanceStatusResponse represents the connection status response
type InstanceStatusResponse struct {
	Name        string `json:"name"`
	Status      string `json:"status"`
	PhoneNumber string `json:"phone_number,omitempty"`
	ProfileName string `json:"profile_name,omitempty"`
	ProfilePic  string `json:"profile_pic,omitempty"`
}

// QRCodeResponse represents the QR code response
type QRCodeResponse struct {
	Name   string `json:"name"`
	Status string `json:"status"`
	QRCode string `json:"qr_code,omitempty"` // Base64 encoded QR code image
	Code   string `json:"code,omitempty"`    // Raw QR code string
}

// ListInstancesResponse represents the list of instances response
type ListInstancesResponse struct {
	Instances []InstanceResponse `json:"instances"`
	Total     int                `json:"total"`
}

// ToInstanceResponse converts an entity to DTO
func ToInstanceResponse(instance *entity.Instance) InstanceResponse {
	return InstanceResponse{
		ID:          instance.ID,
		Name:        instance.Name,
		Status:      string(instance.Status),
		PhoneNumber: instance.PhoneNumber,
		ProfileName: instance.ProfileName,
		ProfilePic:  instance.ProfilePic,
		CreatedAt:   instance.CreatedAt,
	}
}

// ToInstanceStatusResponse converts an entity to status DTO
func ToInstanceStatusResponse(instance *entity.Instance) InstanceStatusResponse {
	return InstanceStatusResponse{
		Name:        instance.Name,
		Status:      string(instance.Status),
		PhoneNumber: instance.PhoneNumber,
		ProfileName: instance.ProfileName,
		ProfilePic:  instance.ProfilePic,
	}
}

// ToCreateInstanceResponse converts an entity to create response DTO
func ToCreateInstanceResponse(instance *entity.Instance) CreateInstanceResponse {
	return CreateInstanceResponse{
		ID:     instance.ID,
		Name:   instance.Name,
		APIKey: instance.APIKey,
		Status: string(instance.Status),
	}
}

// ToListInstancesResponse converts a list of entities to DTO
func ToListInstancesResponse(instances []*entity.Instance) ListInstancesResponse {
	responses := make([]InstanceResponse, len(instances))
	for i, inst := range instances {
		responses[i] = ToInstanceResponse(inst)
	}
	return ListInstancesResponse{
		Instances: responses,
		Total:     len(instances),
	}
}
