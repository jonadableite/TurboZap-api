package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jonadableite/turbozap-api/internal/domain/entity"
	"github.com/jonadableite/turbozap-api/internal/domain/repository"
)

type apiKeyPostgresRepository struct {
	pool *pgxpool.Pool
}

// NewApiKeyPostgresRepository creates a PostgreSQL-based API key repository.
func NewApiKeyPostgresRepository(pool *pgxpool.Pool) repository.ApiKeyRepository {
	return &apiKeyPostgresRepository{pool: pool}
}

func (r *apiKeyPostgresRepository) Create(ctx context.Context, key *entity.ApiKey) error {
	query := `
		INSERT INTO api_keys (id, name, key, user_id, permissions, last_used_at, expires_at, created_at, revoked_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`

	_, err := r.pool.Exec(ctx, query,
		key.ID,
		key.Name,
		key.Key,
		key.UserID,
		key.Permissions,
		key.LastUsedAt,
		key.ExpiresAt,
		key.CreatedAt,
		key.RevokedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create api key: %w", err)
	}

	return nil
}

func (r *apiKeyPostgresRepository) GetByKey(ctx context.Context, keyValue string) (*entity.ApiKey, error) {
	query := `
		SELECT id, name, key, user_id, permissions, last_used_at, expires_at, created_at, revoked_at
		FROM api_keys
		WHERE key = $1
	`

	return r.scanSingle(ctx, query, keyValue)
}

func (r *apiKeyPostgresRepository) GetByUserID(ctx context.Context, userID string) ([]*entity.ApiKey, error) {
	query := `
		SELECT id, name, key, user_id, permissions, last_used_at, expires_at, created_at, revoked_at
		FROM api_keys
		WHERE user_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query api keys by user: %w", err)
	}
	defer rows.Close()

	var keys []*entity.ApiKey
	for rows.Next() {
		apiKey, err := r.scanRow(rows)
		if err != nil {
			return nil, err
		}
		keys = append(keys, apiKey)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating api keys: %w", err)
	}

	return keys, nil
}

func (r *apiKeyPostgresRepository) GetByID(ctx context.Context, id string) (*entity.ApiKey, error) {
	query := `
		SELECT id, name, key, user_id, permissions, last_used_at, expires_at, created_at, revoked_at
		FROM api_keys
		WHERE id = $1
	`

	return r.scanSingle(ctx, query, id)
}

func (r *apiKeyPostgresRepository) Update(ctx context.Context, key *entity.ApiKey) error {
	query := `
		UPDATE api_keys
		SET name = $1,
			permissions = $2,
			expires_at = $3,
			revoked_at = $4
		WHERE id = $5
	`

	_, err := r.pool.Exec(ctx, query,
		key.Name,
		key.Permissions,
		key.ExpiresAt,
		key.RevokedAt,
		key.ID,
	)
	if err != nil {
		return fmt.Errorf("failed to update api key: %w", err)
	}

	return nil
}

func (r *apiKeyPostgresRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM api_keys WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete api key: %w", err)
	}
	return nil
}

func (r *apiKeyPostgresRepository) UpdateLastUsed(ctx context.Context, id string, ts time.Time) error {
	query := `UPDATE api_keys SET last_used_at = $1 WHERE id = $2`
	_, err := r.pool.Exec(ctx, query, ts, id)
	if err != nil {
		return fmt.Errorf("failed to update last_used_at: %w", err)
	}
	return nil
}

func (r *apiKeyPostgresRepository) scanSingle(ctx context.Context, query string, arg any) (*entity.ApiKey, error) {
	row := r.pool.QueryRow(ctx, query, arg)
	return r.scanRow(row)
}

func (r *apiKeyPostgresRepository) scanRow(row pgx.Row) (*entity.ApiKey, error) {
	var (
		lastUsedAt  *time.Time
		expiresAt   *time.Time
		revokedAt   *time.Time
		permissions []string
		apiKey      entity.ApiKey
	)

	err := row.Scan(
		&apiKey.ID,
		&apiKey.Name,
		&apiKey.Key,
		&apiKey.UserID,
		&permissions,
		&lastUsedAt,
		&expiresAt,
		&apiKey.CreatedAt,
		&revokedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to scan api key: %w", err)
	}

	apiKey.Permissions = permissions
	apiKey.LastUsedAt = lastUsedAt
	apiKey.ExpiresAt = expiresAt
	apiKey.RevokedAt = revokedAt

	return &apiKey, nil
}
