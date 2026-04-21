import { Platform } from "react-native";

const DEFAULT_API_ORIGIN = "https://fitness-uinz.onrender.com";

function normalizeBaseUrl(rawUrl: string) {
  return rawUrl.replace(/\/+$/, "");
}

export const API_BASE_URL = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_URL ?? `${DEFAULT_API_ORIGIN}/api/v1`);

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = RequestInit & {
  timeoutMs?: number;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 30000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
      signal: controller.signal,
    });

    const rawText = await response.text();
    const payload = rawText ? safeJsonParse(rawText) : null;

    if (!response.ok) {
      const message = extractErrorMessage(payload) ?? `Request failed with status ${response.status}`;
      throw new ApiError(message, response.status);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Сервер не ответил вовремя. Проверьте подключение и адрес API.");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function safeJsonParse(rawText: string) {
  try {
    return JSON.parse(rawText);
  } catch {
    return rawText;
  }
}

function extractErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload as Record<string, unknown>;
  const message = candidate.message ?? candidate.error ?? candidate.details;

  return typeof message === "string" ? message : null;
}
