import { API_BASE_URL, apiRequest } from "@/services/api";
import { ensureAccessToken, refreshAccessToken } from "@/services/auth-service";

export type ChatDialog = {
  conversationId: string;
  peerUserId: string;
  peerName: string;
  peerLogin: string;
  lastMessageText: string;
  lastMessageAt?: string;
  unreadCount: number;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  kind: string;
  text: string;
  metadata?: ChatMessageMetadata;
  createdAt: string;
};

export type SharedWorkoutExercise = {
  exerciseId: string;
  name: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  rest: number;
  weight?: number;
};

export type SharedWorkoutMetadata = {
  type: "shared_workout";
  title: string;
  exercises: SharedWorkoutExercise[];
};

export type AssignedWorkoutMetadata = {
  type: "assigned_workout";
  scheduledAt: string;
};

export type ChatMessageMetadata = SharedWorkoutMetadata | AssignedWorkoutMetadata | Record<string, unknown>;

export type ChatEvent = {
  type: "message.new" | "conversation.read";
  conversationId?: string;
  message?: ChatMessage;
  readByUserId?: string;
  readMessageId?: string;
};

export type ChatUserSearchResult = {
  id: string;
  name: string;
  login: string;
};

export async function getChatDialogs(userId: string) {
  return requestWithAuth<ChatDialog[]>("/chats/dialogs", { method: "GET" }, userId);
}

export async function ensureDialog(userId: string, peerUserId: string) {
  return requestWithAuth<ChatDialog>(
    "/chats/dialogs",
    {
      method: "POST",
      body: JSON.stringify({ peerUserId }),
    },
    userId,
  );
}

export async function getDialogMessages(
  userId: string,
  conversationId: string,
  options: { limit?: number; beforeMessageId?: string } = {},
) {
  const query = new URLSearchParams();

  if (options.limit) {
    query.set("limit", String(options.limit));
  }

  if (options.beforeMessageId) {
    query.set("beforeMessageId", options.beforeMessageId);
  }

  const suffix = query.toString().length > 0 ? `?${query.toString()}` : "";
  return requestWithAuth<ChatMessage[]>(`/chats/dialogs/${conversationId}/messages${suffix}`, { method: "GET" }, userId);
}

export async function sendDialogMessage(
  userId: string,
  conversationId: string,
  text: string,
  options: {
    kind?: string;
    metadata?: ChatMessageMetadata;
  } = {},
) {
  return requestWithAuth<ChatMessage>(
    `/chats/dialogs/${conversationId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({
        text,
        kind: options.kind,
        metadata: options.metadata,
      }),
    },
    userId,
  );
}

export async function markDialogRead(userId: string, conversationId: string, messageId?: string) {
  return requestWithAuth<{ status: string }>(
    `/chats/dialogs/${conversationId}/read`,
    {
      method: "POST",
      body: JSON.stringify({ messageId }),
    },
    userId,
  );
}

export async function searchUsersByLogin(userId: string, loginQuery: string) {
  const query = encodeURIComponent(loginQuery.trim());
  if (!query) {
    return [] as ChatUserSearchResult[];
  }

  return requestWithAuth<ChatUserSearchResult[]>(`/users/search?login=${query}`, { method: "GET" }, userId);
}

export async function importSharedWorkout(
  userId: string,
  payload: {
    exercises: Array<{
      exerciseId: string;
      sets: number;
      reps: number;
      rest: number;
      weight?: number;
    }>;
  },
) {
  return requestWithAuth<{ id: string; userId: string }>(
    "/workouts/import-shared",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    userId,
  );
}

export async function connectChatEvents(
  userId: string,
  onEvent: (event: ChatEvent) => void,
  onError?: (error: unknown) => void,
) {
  const accessToken = await ensureAccessToken(userId);

  const response = await fetch(`${API_BASE_URL}/chats/events`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "text/event-stream",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to connect events: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Streaming is not supported on this platform.");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let isClosed = false;

  const pump = async () => {
    try {
      while (!isClosed) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const line = chunk
            .split("\n")
            .find((entry) => entry.startsWith("data: "));
          if (!line) {
            continue;
          }

          const rawPayload = line.slice(6);
          try {
            const payload = JSON.parse(rawPayload) as ChatEvent;
            onEvent(payload);
          } catch {
            // Ignore malformed events.
          }
        }
      }
    } catch (error) {
      onError?.(error);
    }
  };

  void pump();

  return () => {
    isClosed = true;
    void reader.cancel();
  };
}

async function requestWithAuth<T>(path: string, options: RequestInit, legacyUserIdForLogin?: string) {
  const accessToken = await ensureAccessToken();

  try {
    return await apiRequest<T>(path, {
      ...options,
      headers: {
        ...(options.headers ?? {}),
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (error) {
    const refreshedAccessToken = await refreshAccessToken();
    if (!refreshedAccessToken) {
      throw error;
    }

    return apiRequest<T>(path, {
      ...options,
      headers: {
        ...(options.headers ?? {}),
        Authorization: `Bearer ${refreshedAccessToken}`,
      },
    });
  }
}
