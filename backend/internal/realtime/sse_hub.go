package realtime

import "sync"

type SSEHub struct {
	mu          sync.RWMutex
	subscribers map[string]map[chan []byte]struct{}
}

func NewSSEHub() *SSEHub {
	return &SSEHub{
		subscribers: make(map[string]map[chan []byte]struct{}),
	}
}

func (h *SSEHub) Subscribe(userID string) (<-chan []byte, func()) {
	ch := make(chan []byte, 16)

	h.mu.Lock()
	if _, ok := h.subscribers[userID]; !ok {
		h.subscribers[userID] = make(map[chan []byte]struct{})
	}
	h.subscribers[userID][ch] = struct{}{}
	h.mu.Unlock()

	unsubscribe := func() {
		h.mu.Lock()
		defer h.mu.Unlock()

		channels, ok := h.subscribers[userID]
		if !ok {
			return
		}

		if _, exists := channels[ch]; exists {
			delete(channels, ch)
			close(ch)
		}

		if len(channels) == 0 {
			delete(h.subscribers, userID)
		}
	}

	return ch, unsubscribe
}

func (h *SSEHub) Publish(userID string, payload []byte) {
	h.mu.RLock()
	channels := h.subscribers[userID]
	h.mu.RUnlock()

	for ch := range channels {
		select {
		case ch <- payload:
		default:
		}
	}
}
