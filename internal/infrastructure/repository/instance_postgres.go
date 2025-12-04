package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jonadableite/turbozap-api/internal/domain/entity"
	"github.com/jonadableite/turbozap-api/internal/domain/repository"
)

// instancePostgresRepository implements InstanceRepository using PostgreSQL
type instancePostgresRepository struct {
	pool *pgxpool.Pool
}

// NewInstancePostgresRepository creates a new PostgreSQL-based instance repository
func NewInstancePostgresRepository(pool *pgxpool.Pool) repository.InstanceRepository {
	return &instancePostgresRepository{pool: pool}
}

// Create creates a new instance
func (r *instancePostgresRepository) Create(ctx context.Context, instance *entity.Instance) error {
	query := `
		INSERT INTO instances (id, name, api_key, status, phone_number, profile_name, profile_pic, qr_code, device_jid, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`
	_, err := r.pool.Exec(ctx, query,
		instance.ID,
		instance.Name,
		instance.APIKey,
		string(instance.Status),
		instance.PhoneNumber,
		instance.ProfileName,
		instance.ProfilePic,
		instance.QRCode,
		instance.DeviceJID,
		instance.CreatedAt,
		instance.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create instance: %w", err)
	}
	return nil
}

// GetByID retrieves an instance by ID
func (r *instancePostgresRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Instance, error) {
	query := `
		SELECT id, name, api_key, status, phone_number, profile_name, profile_pic, qr_code, device_jid, created_at, updated_at
		FROM instances WHERE id = $1
	`
	return r.scanInstance(ctx, query, id)
}

// GetByName retrieves an instance by name
func (r *instancePostgresRepository) GetByName(ctx context.Context, name string) (*entity.Instance, error) {
	query := `
		SELECT id, name, api_key, status, phone_number, profile_name, profile_pic, qr_code, device_jid, created_at, updated_at
		FROM instances WHERE name = $1
	`
	return r.scanInstance(ctx, query, name)
}

// GetByAPIKey retrieves an instance by API key
func (r *instancePostgresRepository) GetByAPIKey(ctx context.Context, apiKey string) (*entity.Instance, error) {
	query := `
		SELECT id, name, api_key, status, phone_number, profile_name, profile_pic, qr_code, device_jid, created_at, updated_at
		FROM instances WHERE api_key = $1
	`
	return r.scanInstance(ctx, query, apiKey)
}

// GetAll retrieves all instances
func (r *instancePostgresRepository) GetAll(ctx context.Context) ([]*entity.Instance, error) {
	query := `
		SELECT id, name, api_key, status, phone_number, profile_name, profile_pic, qr_code, device_jid, created_at, updated_at
		FROM instances ORDER BY created_at DESC
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query instances: %w", err)
	}
	defer rows.Close()

	var instances []*entity.Instance
	for rows.Next() {
		instance, err := r.scanInstanceRow(rows)
		if err != nil {
			return nil, err
		}
		instances = append(instances, instance)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating instances: %w", err)
	}

	return instances, nil
}

// Update updates an instance
func (r *instancePostgresRepository) Update(ctx context.Context, instance *entity.Instance) error {
	query := `
		UPDATE instances 
		SET name = $2, status = $3, phone_number = $4, profile_name = $5, profile_pic = $6, qr_code = $7, device_jid = $8, updated_at = $9
		WHERE id = $1
	`
	instance.UpdatedAt = time.Now()
	_, err := r.pool.Exec(ctx, query,
		instance.ID,
		instance.Name,
		string(instance.Status),
		instance.PhoneNumber,
		instance.ProfileName,
		instance.ProfilePic,
		instance.QRCode,
		instance.DeviceJID,
		instance.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to update instance: %w", err)
	}
	return nil
}

// UpdateStatus updates only the status of an instance
func (r *instancePostgresRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status entity.InstanceStatus) error {
	query := `UPDATE instances SET status = $2, updated_at = $3 WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id, string(status), time.Now())
	if err != nil {
		return fmt.Errorf("failed to update instance status: %w", err)
	}
	return nil
}

// Delete deletes an instance
func (r *instancePostgresRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM instances WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete instance: %w", err)
	}
	return nil
}

// Exists checks if an instance with the given name exists
func (r *instancePostgresRepository) Exists(ctx context.Context, name string) (bool, error) {
	var count int
	query := `SELECT COUNT(*) FROM instances WHERE name = $1`
	err := r.pool.QueryRow(ctx, query, name).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check instance existence: %w", err)
	}
	return count > 0, nil
}

// Helper function to scan a single instance
func (r *instancePostgresRepository) scanInstance(ctx context.Context, query string, args ...interface{}) (*entity.Instance, error) {
	row := r.pool.QueryRow(ctx, query, args...)

	var instance entity.Instance
	var status string
	var phoneNumber, profileName, profilePic, qrCode, deviceJID *string

	err := row.Scan(
		&instance.ID,
		&instance.Name,
		&instance.APIKey,
		&status,
		&phoneNumber,
		&profileName,
		&profilePic,
		&qrCode,
		&deviceJID,
		&instance.CreatedAt,
		&instance.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to scan instance: %w", err)
	}

	instance.Status = entity.InstanceStatus(status)
	if phoneNumber != nil {
		instance.PhoneNumber = *phoneNumber
	}
	if profileName != nil {
		instance.ProfileName = *profileName
	}
	if profilePic != nil {
		instance.ProfilePic = *profilePic
	}
	if qrCode != nil {
		instance.QRCode = *qrCode
	}
	if deviceJID != nil {
		instance.DeviceJID = *deviceJID
	}

	return &instance, nil
}

// Helper function to scan instance from rows
func (r *instancePostgresRepository) scanInstanceRow(rows pgx.Rows) (*entity.Instance, error) {
	var instance entity.Instance
	var status string
	var phoneNumber, profileName, profilePic, qrCode, deviceJID *string

	err := rows.Scan(
		&instance.ID,
		&instance.Name,
		&instance.APIKey,
		&status,
		&phoneNumber,
		&profileName,
		&profilePic,
		&qrCode,
		&deviceJID,
		&instance.CreatedAt,
		&instance.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to scan instance row: %w", err)
	}

	instance.Status = entity.InstanceStatus(status)
	if phoneNumber != nil {
		instance.PhoneNumber = *phoneNumber
	}
	if profileName != nil {
		instance.ProfileName = *profileName
	}
	if profilePic != nil {
		instance.ProfilePic = *profilePic
	}
	if qrCode != nil {
		instance.QRCode = *qrCode
	}
	if deviceJID != nil {
		instance.DeviceJID = *deviceJID
	}

	return &instance, nil
}
