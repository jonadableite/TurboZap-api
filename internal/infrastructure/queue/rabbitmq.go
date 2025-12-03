package queue

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
	"go.uber.org/zap"
)

// Config holds RabbitMQ configuration
type Config struct {
	URL              string
	Exchange         string
	ExchangeType     string
	QueuePrefix      string
	DeadLetterExch   string
	ReconnectDelay   time.Duration
	MaxRetries       int
	PrefetchCount    int
}

// DefaultConfig returns default RabbitMQ configuration
func DefaultConfig() Config {
	return Config{
		URL:              "amqp://guest:guest@localhost:5672/",
		Exchange:         "whatsapp.events",
		ExchangeType:     "topic",
		QueuePrefix:      "whatsapp",
		DeadLetterExch:   "whatsapp.dlx",
		ReconnectDelay:   5 * time.Second,
		MaxRetries:       3,
		PrefetchCount:    10,
	}
}

// Connection manages RabbitMQ connection with auto-reconnect
type Connection struct {
	config     Config
	conn       *amqp.Connection
	channel    *amqp.Channel
	logger     *zap.Logger
	mu         sync.RWMutex
	closed     bool
	notifyClose chan *amqp.Error
}

// NewConnection creates a new RabbitMQ connection
func NewConnection(cfg Config, logger *zap.Logger) (*Connection, error) {
	c := &Connection{
		config: cfg,
		logger: logger,
	}

	if err := c.connect(); err != nil {
		return nil, err
	}

	go c.handleReconnect()

	return c, nil
}

func (c *Connection) connect() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	var err error
	c.conn, err = amqp.Dial(c.config.URL)
	if err != nil {
		return fmt.Errorf("failed to connect to RabbitMQ: %w", err)
	}

	c.channel, err = c.conn.Channel()
	if err != nil {
		c.conn.Close()
		return fmt.Errorf("failed to open channel: %w", err)
	}

	// Set prefetch count
	if err := c.channel.Qos(c.config.PrefetchCount, 0, false); err != nil {
		return fmt.Errorf("failed to set QoS: %w", err)
	}

	// Declare main exchange
	if err := c.channel.ExchangeDeclare(
		c.config.Exchange,
		c.config.ExchangeType,
		true,  // durable
		false, // auto-deleted
		false, // internal
		false, // no-wait
		nil,   // arguments
	); err != nil {
		return fmt.Errorf("failed to declare exchange: %w", err)
	}

	// Declare dead letter exchange
	if err := c.channel.ExchangeDeclare(
		c.config.DeadLetterExch,
		"fanout",
		true,
		false,
		false,
		false,
		nil,
	); err != nil {
		return fmt.Errorf("failed to declare DLX: %w", err)
	}

	c.notifyClose = make(chan *amqp.Error)
	c.conn.NotifyClose(c.notifyClose)

	c.logger.Info("📡 Connected to RabbitMQ",
		zap.String("url", c.config.URL),
		zap.String("exchange", c.config.Exchange),
	)

	return nil
}

func (c *Connection) handleReconnect() {
	for {
		select {
		case err := <-c.notifyClose:
			if c.closed {
				return
			}
			c.logger.Warn("⚠️ RabbitMQ connection lost, reconnecting...",
				zap.Error(err),
			)

			for {
				time.Sleep(c.config.ReconnectDelay)
				if err := c.connect(); err != nil {
					c.logger.Error("❌ Failed to reconnect to RabbitMQ",
						zap.Error(err),
					)
					continue
				}
				c.logger.Info("✅ Reconnected to RabbitMQ")
				break
			}
		}
	}
}

// Channel returns the current channel
func (c *Connection) Channel() *amqp.Channel {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.channel
}

// Close closes the connection
func (c *Connection) Close() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.closed = true

	if c.channel != nil {
		c.channel.Close()
	}
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}

// Publisher publishes messages to RabbitMQ
type Publisher struct {
	conn   *Connection
	logger *zap.Logger
}

// NewPublisher creates a new publisher
func NewPublisher(conn *Connection, logger *zap.Logger) *Publisher {
	return &Publisher{
		conn:   conn,
		logger: logger,
	}
}

// Message represents a message to be published
type Message struct {
	ID            string                 `json:"id"`
	CorrelationID string                 `json:"correlation_id"`
	InstanceID    string                 `json:"instance_id"`
	Type          string                 `json:"type"`
	To            string                 `json:"to"`
	Payload       map[string]interface{} `json:"payload"`
	Priority      uint8                  `json:"priority"`
	Retries       int                    `json:"retries"`
	CreatedAt     time.Time              `json:"created_at"`
}

// Publish publishes a message to the exchange
func (p *Publisher) Publish(ctx context.Context, routingKey string, msg Message) error {
	body, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	publishing := amqp.Publishing{
		ContentType:   "application/json",
		DeliveryMode:  amqp.Persistent,
		Timestamp:     time.Now(),
		MessageId:     msg.ID,
		CorrelationId: msg.CorrelationID,
		Priority:      msg.Priority,
		Body:          body,
		Headers: amqp.Table{
			"x-retry-count": msg.Retries,
		},
	}

	err = p.conn.Channel().PublishWithContext(
		ctx,
		p.conn.config.Exchange,
		routingKey,
		false, // mandatory
		false, // immediate
		publishing,
	)

	if err != nil {
		return fmt.Errorf("failed to publish message: %w", err)
	}

	p.logger.Debug("📤 Message published",
		zap.String("id", msg.ID),
		zap.String("routing_key", routingKey),
		zap.String("correlation_id", msg.CorrelationID),
	)

	return nil
}

// PublishStatus publishes a status update
func (p *Publisher) PublishStatus(ctx context.Context, msg StatusMessage) error {
	body, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("failed to marshal status message: %w", err)
	}

	publishing := amqp.Publishing{
		ContentType:   "application/json",
		DeliveryMode:  amqp.Persistent,
		Timestamp:     time.Now(),
		MessageId:     msg.MessageID,
		CorrelationId: msg.CorrelationID,
		Body:          body,
	}

	return p.conn.Channel().PublishWithContext(
		ctx,
		p.conn.config.Exchange,
		"messages.status",
		false,
		false,
		publishing,
	)
}

// StatusMessage represents a message status update
type StatusMessage struct {
	MessageID     string    `json:"message_id"`
	CorrelationID string    `json:"correlation_id"`
	InstanceID    string    `json:"instance_id"`
	Status        string    `json:"status"` // queued, sent, delivered, read, failed
	Error         string    `json:"error,omitempty"`
	Timestamp     time.Time `json:"timestamp"`
}

// Consumer consumes messages from RabbitMQ
type Consumer struct {
	conn      *Connection
	logger    *zap.Logger
	queueName string
	handlers  map[string]MessageHandler
	mu        sync.RWMutex
}

// MessageHandler handles incoming messages
type MessageHandler func(ctx context.Context, msg Message) error

// NewConsumer creates a new consumer
func NewConsumer(conn *Connection, queueName string, logger *zap.Logger) (*Consumer, error) {
	c := &Consumer{
		conn:      conn,
		logger:    logger,
		queueName: queueName,
		handlers:  make(map[string]MessageHandler),
	}

	// Declare queue with dead letter exchange
	args := amqp.Table{
		"x-dead-letter-exchange": conn.config.DeadLetterExch,
	}

	_, err := conn.Channel().QueueDeclare(
		queueName,
		true,  // durable
		false, // delete when unused
		false, // exclusive
		false, // no-wait
		args,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to declare queue: %w", err)
	}

	return c, nil
}

// Bind binds the queue to routing keys
func (c *Consumer) Bind(routingKeys ...string) error {
	for _, key := range routingKeys {
		if err := c.conn.Channel().QueueBind(
			c.queueName,
			key,
			c.conn.config.Exchange,
			false,
			nil,
		); err != nil {
			return fmt.Errorf("failed to bind queue to %s: %w", key, err)
		}
		c.logger.Debug("🔗 Queue bound",
			zap.String("queue", c.queueName),
			zap.String("routing_key", key),
		)
	}
	return nil
}

// RegisterHandler registers a handler for a message type
func (c *Consumer) RegisterHandler(msgType string, handler MessageHandler) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.handlers[msgType] = handler
}

// Start starts consuming messages
func (c *Consumer) Start(ctx context.Context) error {
	msgs, err := c.conn.Channel().Consume(
		c.queueName,
		"",    // consumer tag
		false, // auto-ack
		false, // exclusive
		false, // no-local
		false, // no-wait
		nil,
	)
	if err != nil {
		return fmt.Errorf("failed to start consumer: %w", err)
	}

	c.logger.Info("📥 Consumer started",
		zap.String("queue", c.queueName),
	)

	go func() {
		for {
			select {
			case <-ctx.Done():
				c.logger.Info("🛑 Consumer stopped",
					zap.String("queue", c.queueName),
				)
				return
			case delivery, ok := <-msgs:
				if !ok {
					return
				}
				c.handleDelivery(ctx, delivery)
			}
		}
	}()

	return nil
}

func (c *Consumer) handleDelivery(ctx context.Context, delivery amqp.Delivery) {
	var msg Message
	if err := json.Unmarshal(delivery.Body, &msg); err != nil {
		c.logger.Error("❌ Failed to unmarshal message",
			zap.Error(err),
		)
		delivery.Nack(false, false)
		return
	}

	c.mu.RLock()
	handler, exists := c.handlers[msg.Type]
	c.mu.RUnlock()

	if !exists {
		c.logger.Warn("⚠️ No handler for message type",
			zap.String("type", msg.Type),
		)
		delivery.Nack(false, false)
		return
	}

	// Process message
	if err := handler(ctx, msg); err != nil {
		c.logger.Error("❌ Failed to process message",
			zap.String("id", msg.ID),
			zap.String("type", msg.Type),
			zap.Error(err),
		)

		// Check retry count
		retryCount := 0
		if rc, ok := delivery.Headers["x-retry-count"].(int32); ok {
			retryCount = int(rc)
		}

		if retryCount < c.conn.config.MaxRetries {
			// Requeue with incremented retry count
			delivery.Nack(false, true)
		} else {
			// Send to dead letter queue
			delivery.Nack(false, false)
		}
		return
	}

	c.logger.Debug("✅ Message processed",
		zap.String("id", msg.ID),
		zap.String("type", msg.Type),
		zap.String("correlation_id", msg.CorrelationID),
	)

	delivery.Ack(false)
}

// QueueStats holds queue statistics
type QueueStats struct {
	Name      string `json:"name"`
	Messages  int    `json:"messages"`
	Consumers int    `json:"consumers"`
	Ready     int    `json:"ready"`
	Unacked   int    `json:"unacked"`
}

// GetQueueStats returns queue statistics
func (c *Connection) GetQueueStats(queueName string) (*QueueStats, error) {
	queue, err := c.channel.QueueInspect(queueName)
	if err != nil {
		return nil, fmt.Errorf("failed to inspect queue: %w", err)
	}

	return &QueueStats{
		Name:      queue.Name,
		Messages:  queue.Messages,
		Consumers: queue.Consumers,
	}, nil
}

