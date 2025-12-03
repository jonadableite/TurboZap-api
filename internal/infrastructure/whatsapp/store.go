package whatsapp

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"go.mau.fi/whatsmeow/store"
	"go.mau.fi/whatsmeow/store/sqlstore"
	waLog "go.mau.fi/whatsmeow/util/log"
)

// StoreContainer wraps the whatsmeow SQL store container
type StoreContainer struct {
	container *sqlstore.Container
}

// NewStoreContainer creates a new store container using PostgreSQL
func NewStoreContainer(ctx context.Context, pool *pgxpool.Pool, logger waLog.Logger) (*StoreContainer, error) {
	// Get the database URL from the pool config
	config := pool.Config()
	dbURL := config.ConnString()

	// Create the SQL store container
	container, err := sqlstore.New(ctx, "pgx", dbURL, logger)
	if err != nil {
		return nil, fmt.Errorf("failed to create SQL store: %w", err)
	}

	return &StoreContainer{
		container: container,
	}, nil
}

// GetDevice retrieves or creates a device for the given instance
func (s *StoreContainer) GetDevice(ctx context.Context, instanceID string) (*store.Device, error) {
	// Try to get existing device
	devices, err := s.container.GetAllDevices(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get devices: %w", err)
	}

	// Look for device with matching instance ID
	for _, device := range devices {
		if device.ID != nil && device.ID.User == instanceID {
			return device, nil
		}
	}

	// Create new device if not found
	device := s.container.NewDevice()
	return device, nil
}

// GetDeviceByJID retrieves a device by its JID
func (s *StoreContainer) GetDeviceByJID(ctx context.Context, jid string) (*store.Device, error) {
	devices, err := s.container.GetAllDevices(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get devices: %w", err)
	}

	for _, device := range devices {
		if device.ID != nil && device.ID.String() == jid {
			return device, nil
		}
	}

	return nil, nil
}

// GetAllDevices retrieves all stored devices
func (s *StoreContainer) GetAllDevices(ctx context.Context) ([]*store.Device, error) {
	return s.container.GetAllDevices(ctx)
}

// NewDevice creates a new device
func (s *StoreContainer) NewDevice() *store.Device {
	return s.container.NewDevice()
}

// DeleteDevice deletes a device from the store
func (s *StoreContainer) DeleteDevice(ctx context.Context, device *store.Device) error {
	return device.Delete(ctx)
}

// Close closes the store container
func (s *StoreContainer) Close() error {
	// The container doesn't have a close method, but we should clean up
	return nil
}

// UpgradeSchema upgrades the database schema
func (s *StoreContainer) UpgradeSchema(ctx context.Context) error {
	// The schema is automatically upgraded when the container is created
	return nil
}
