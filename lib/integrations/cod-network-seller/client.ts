import type { CodeNetworkSellerCreateOrderInput, CodeNetworkSellerOrder } from "./types";

const DEFAULT_BASE_URL = "https://api.cod.network";
const PREFIX = "/v2/seller";
const TIMEOUT_MS = 10_000;

type SellerError = Error & {
  code?: string;
  httpStatus?: number;
  responseBody?: unknown;
  responseText?: string;
};

function readCode(body: unknown): string | undefined {
  if (!body || typeof body !== "object" || !("code" in body)) return undefined;
  const code = body.code;
  return typeof code === "string" || typeof code === "number" ? String(code) : undefined;
}

function readMessage(body: unknown): string {
  if (body && typeof body === "object" && "message" in body && typeof body.message === "string") return body.message;
  return "cod_network_seller_error";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function requestJson(url: string, token: string, init: { method: string; body?: string }): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: init.method,
      body: init.body,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const text = await response.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text) as unknown;
      } catch {
        body = null;
      }
    }
    const code = readCode(body);
    if (code === "20000") {
      throw new Error("cod_network_seller_duplicate_lead");
    }
    if (!response.ok) {
      const error = new Error(`cod_network_seller_http_${response.status}`) as SellerError;
      if (code) error.code = code;
      error.httpStatus = response.status;
      error.responseBody = body ?? text;
      error.responseText = text;
      throw error;
    }
    if (isRecord(body) && body.status === "error") {
      throw new Error(readMessage(body));
    }
    return body;
  } finally {
    clearTimeout(timer);
  }
}

function readOrder(body: unknown): CodeNetworkSellerOrder {
  if (!isRecord(body) || body.status !== "success" || !isRecord(body.data)) {
    throw new Error("cod_network_seller_invalid_response");
  }
  return body.data as unknown as CodeNetworkSellerOrder;
}

function readOrders(body: unknown): CodeNetworkSellerOrder[] {
  if (!isRecord(body) || body.status !== "success" || !Array.isArray(body.data)) {
    throw new Error("cod_network_seller_invalid_response");
  }
  return body.data as CodeNetworkSellerOrder[];
}

export function createCodeNetworkSellerClient(config: { apiToken: string; baseUrl?: string }): {
  createOrder(input: CodeNetworkSellerCreateOrderInput): Promise<CodeNetworkSellerOrder>;
  getOrder(id: number): Promise<CodeNetworkSellerOrder>;
  listOrders(params?: {
    page?: number;
    limit?: number;
    status?: number[];
    reference?: string;
  }): Promise<CodeNetworkSellerOrder[]>;
} {
  const base = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
  const token = config.apiToken;

  return {
    async createOrder(input) {
      return readOrder(await requestJson(`${base}${PREFIX}/orders`, token, { method: "POST", body: JSON.stringify(input) }));
    },
    async getOrder(id) {
      return readOrder(await requestJson(`${base}${PREFIX}/orders/${id}`, token, { method: "GET" }));
    },
    async listOrders(params) {
      const search = new URLSearchParams();
      if (params?.page !== undefined) search.set("page", String(params.page));
      if (params?.limit !== undefined) search.set("limit", String(params.limit));
      if (params?.reference) search.set("reference", params.reference);
      for (const status of params?.status ?? []) search.append("status", String(status));
      const query = search.toString();
      return readOrders(
        await requestJson(`${base}${PREFIX}/orders${query ? `?${query}` : ""}`, token, { method: "GET" }),
      );
    },
  };
}
