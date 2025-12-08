import api from "./api";

export interface WebhookConfig {
  url: string;
  events: string[];
  enabled: boolean;
  headers?: Record<string, string>;
  webhook_by_events?: boolean;
  webhook_base64?: boolean;
}

export interface WebhookResponse {
  success: boolean;
  data: WebhookConfig;
}

export const webhookApi = {
  // Get webhook configuration
  get: async (instanceName: string): Promise<WebhookConfig> => {
    const response = await api.get<WebhookResponse | { configured?: boolean; webhook?: WebhookConfig }>(
      `/api/webhook/${instanceName}`
    );
    const data = (response.data as { data?: unknown }).data || response.data;
    const payload = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
    if (payload.configured === false) {
      return {
        url: "",
        events: [],
        enabled: false,
      };
    }
    const webhook = (payload.webhook as WebhookConfig | undefined) || (payload as unknown as WebhookConfig);
    return {
      url: webhook?.url || "",
      events: webhook?.events || [],
      enabled: webhook?.enabled ?? false,
      headers: webhook?.headers,
      webhook_by_events: webhook?.webhook_by_events ?? false,
      webhook_base64: webhook?.webhook_base64 ?? false,
    };
  },

  // Set webhook configuration
  set: async (
    instanceName: string,
    config: Partial<WebhookConfig>
  ): Promise<WebhookConfig> => {
    const response = await api.post<{ data?: WebhookConfig }>(
      `/api/webhook/${instanceName}/set`,
      {
        url: config.url,
        events: config.events,
        headers: config.headers,
        enabled: config.enabled,
        webhook_by_events: config.webhook_by_events,
        webhook_base64: config.webhook_base64,
      }
    );
    const data = response.data.data || response.data;
    const webhook = (data as { webhook?: WebhookConfig }).webhook || (data as WebhookConfig);
    return {
      url: webhook?.url || "",
      events: webhook?.events || [],
      enabled: webhook?.enabled ?? false,
      headers: webhook?.headers,
      webhook_by_events: webhook?.webhook_by_events ?? false,
      webhook_base64: webhook?.webhook_base64 ?? false,
    };
  },

  // Delete webhook
  delete: async (instanceName: string): Promise<void> => {
    await api.delete(`/api/webhook/${instanceName}`);
  },

  // Enable webhook
  enable: async (instanceName: string): Promise<void> => {
    await api.post(`/api/webhook/${instanceName}/enable`);
  },

  // Disable webhook
  disable: async (instanceName: string): Promise<void> => {
    await api.post(`/api/webhook/${instanceName}/disable`);
  },

  // List available webhook events
  listEvents: async (): Promise<string[]> => {
    try {
      const response = await api.get<{ success: boolean; data: string[] }>(
        "/api/webhook/events"
      );
      return response.data.data || [];
    } catch {
      // Silently handle errors for this endpoint - it's optional
      // If endpoint doesn't exist (404) or any other error, return default events list
      // We don't want to show errors to the user for this optional endpoint
      return [
        "application.startup",
        "qrcode.updated",
        "connection.update",
        "messages.set",
        "messages.upsert",
        "messages.update",
        "messages.delete",
        "send.message",
        "message.ack",
        "message.revoked",
        "contacts.set",
        "contacts.upsert",
        "contacts.update",
        "presence.update",
        "chats.set",
        "chats.update",
        "chats.upsert",
        "chats.delete",
        "groups.upsert",
        "groups.update",
        "group.participants.update",
        "call.received",
        "call.missed",
        "poll.vote",
        "button.response",
        "list.response",
        "story.viewed",
        "typebot.start",
        "typebot.change_status",
        "new.jwt",
        "errors",
      ];
    }
  },
};

