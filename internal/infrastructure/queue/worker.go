package queue

import (
	"context"
	"sync"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"
)

// Worker processes messages from the queue
type Worker struct {
	id          string
	consumer    *Consumer
	publisher   *Publisher
	processor   MessageProcessor
	logger      *zap.Logger
	wg          sync.WaitGroup
	stopCh      chan struct{}
	concurrency int
}

// MessageProcessor processes messages
type MessageProcessor interface {
	Process(ctx context.Context, msg Message) error
}

// WorkerConfig holds worker configuration
type WorkerConfig struct {
	ID          string
	Concurrency int
}

// NewWorker creates a new worker
func NewWorker(cfg WorkerConfig, consumer *Consumer, publisher *Publisher, processor MessageProcessor, logger *zap.Logger) *Worker {
	if cfg.ID == "" {
		cfg.ID = uuid.New().String()[:8]
	}
	if cfg.Concurrency <= 0 {
		cfg.Concurrency = 1
	}

	return &Worker{
		id:          cfg.ID,
		consumer:    consumer,
		publisher:   publisher,
		processor:   processor,
		logger:      logger,
		stopCh:      make(chan struct{}),
		concurrency: cfg.Concurrency,
	}
}

// Start starts the worker
func (w *Worker) Start(ctx context.Context) error {
	w.logger.Info("🚀 Worker starting",
		zap.String("worker_id", w.id),
		zap.Int("concurrency", w.concurrency),
	)

	// Register message handlers
	w.consumer.RegisterHandler("send_text", w.handleSendText)
	w.consumer.RegisterHandler("send_media", w.handleSendMedia)
	w.consumer.RegisterHandler("send_buttons", w.handleSendButtons)
	w.consumer.RegisterHandler("send_list", w.handleSendList)
	w.consumer.RegisterHandler("send_poll", w.handleSendPoll)

	// Bind to routing keys
	if err := w.consumer.Bind(
		"messages.send.*",
		"messages.send.#",
	); err != nil {
		return err
	}

	// Start consumer
	return w.consumer.Start(ctx)
}

// Stop stops the worker gracefully
func (w *Worker) Stop() {
	w.logger.Info("🛑 Worker stopping",
		zap.String("worker_id", w.id),
	)
	close(w.stopCh)
	w.wg.Wait()
	w.logger.Info("✅ Worker stopped",
		zap.String("worker_id", w.id),
	)
}

func (w *Worker) handleSendText(ctx context.Context, msg Message) error {
	w.logger.Debug("📨 Processing send_text message",
		zap.String("id", msg.ID),
		zap.String("instance", msg.InstanceID),
		zap.String("to", msg.To),
	)

	// Publish queued status
	w.publishStatus(ctx, msg, "processing", "")

	// Process through processor
	if err := w.processor.Process(ctx, msg); err != nil {
		w.publishStatus(ctx, msg, "failed", err.Error())
		return err
	}

	w.publishStatus(ctx, msg, "sent", "")
	return nil
}

func (w *Worker) handleSendMedia(ctx context.Context, msg Message) error {
	w.logger.Debug("📨 Processing send_media message",
		zap.String("id", msg.ID),
		zap.String("instance", msg.InstanceID),
	)

	w.publishStatus(ctx, msg, "processing", "")

	if err := w.processor.Process(ctx, msg); err != nil {
		w.publishStatus(ctx, msg, "failed", err.Error())
		return err
	}

	w.publishStatus(ctx, msg, "sent", "")
	return nil
}

func (w *Worker) handleSendButtons(ctx context.Context, msg Message) error {
	w.logger.Debug("📨 Processing send_buttons message",
		zap.String("id", msg.ID),
		zap.String("instance", msg.InstanceID),
	)

	w.publishStatus(ctx, msg, "processing", "")

	if err := w.processor.Process(ctx, msg); err != nil {
		w.publishStatus(ctx, msg, "failed", err.Error())
		return err
	}

	w.publishStatus(ctx, msg, "sent", "")
	return nil
}

func (w *Worker) handleSendList(ctx context.Context, msg Message) error {
	w.logger.Debug("📨 Processing send_list message",
		zap.String("id", msg.ID),
		zap.String("instance", msg.InstanceID),
	)

	w.publishStatus(ctx, msg, "processing", "")

	if err := w.processor.Process(ctx, msg); err != nil {
		w.publishStatus(ctx, msg, "failed", err.Error())
		return err
	}

	w.publishStatus(ctx, msg, "sent", "")
	return nil
}

func (w *Worker) handleSendPoll(ctx context.Context, msg Message) error {
	w.logger.Debug("📨 Processing send_poll message",
		zap.String("id", msg.ID),
		zap.String("instance", msg.InstanceID),
	)

	w.publishStatus(ctx, msg, "processing", "")

	if err := w.processor.Process(ctx, msg); err != nil {
		w.publishStatus(ctx, msg, "failed", err.Error())
		return err
	}

	w.publishStatus(ctx, msg, "sent", "")
	return nil
}

func (w *Worker) publishStatus(ctx context.Context, msg Message, status, errMsg string) {
	statusMsg := StatusMessage{
		MessageID:     msg.ID,
		CorrelationID: msg.CorrelationID,
		InstanceID:    msg.InstanceID,
		Status:        status,
		Error:         errMsg,
		Timestamp:     time.Now(),
	}

	if err := w.publisher.PublishStatus(ctx, statusMsg); err != nil {
		w.logger.Error("❌ Failed to publish status",
			zap.String("message_id", msg.ID),
			zap.String("status", status),
			zap.Error(err),
		)
	}
}

// WorkerPool manages multiple workers
type WorkerPool struct {
	workers []*Worker
	logger  *zap.Logger
}

// NewWorkerPool creates a new worker pool
func NewWorkerPool(count int, consumer *Consumer, publisher *Publisher, processor MessageProcessor, logger *zap.Logger) *WorkerPool {
	workers := make([]*Worker, count)
	for i := 0; i < count; i++ {
		workers[i] = NewWorker(
			WorkerConfig{
				ID:          uuid.New().String()[:8],
				Concurrency: 1,
			},
			consumer,
			publisher,
			processor,
			logger,
		)
	}

	return &WorkerPool{
		workers: workers,
		logger:  logger,
	}
}

// Start starts all workers
func (p *WorkerPool) Start(ctx context.Context) error {
	p.logger.Info("🚀 Starting worker pool",
		zap.Int("workers", len(p.workers)),
	)

	for _, w := range p.workers {
		if err := w.Start(ctx); err != nil {
			return err
		}
	}

	return nil
}

// Stop stops all workers
func (p *WorkerPool) Stop() {
	p.logger.Info("🛑 Stopping worker pool")
	for _, w := range p.workers {
		w.Stop()
	}
}

