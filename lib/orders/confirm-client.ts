import type {
  MerchantOrderListItem,
  OrderConfirmationStatus,
} from "./types";

export type ConfirmOrderUiErrorKey =
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "invalidState"
  | "unexpected";

export type ConfirmOrderUiResult =
  | {
      ok: true;
      status: "confirmed" | "already_confirmed";
      confirmedAt?: string;
    }
  | {
      ok: false;
      errorKey: ConfirmOrderUiErrorKey;
    };

export function mapConfirmOrderResponse(
  httpStatus: number,
  body: unknown,
): ConfirmOrderUiResult {
  if (httpStatus === 401) {
    return { ok: false, errorKey: "unauthorized" };
  }

  if (httpStatus === 403) {
    return { ok: false, errorKey: "forbidden" };
  }

  if (httpStatus === 404) {
    return { ok: false, errorKey: "notFound" };
  }

  if (httpStatus === 409) {
    return { ok: false, errorKey: "invalidState" };
  }

  if (!body || typeof body !== "object") {
    return { ok: false, errorKey: "unexpected" };
  }

  const payload = body as {
    status?: string;
    confirmedAt?: string;
  };

  if (
    httpStatus === 200 &&
    (payload.status === "confirmed" || payload.status === "already_confirmed")
  ) {
    return {
      ok: true,
      status: payload.status,
      confirmedAt: payload.confirmedAt,
    };
  }

  return { ok: false, errorKey: "unexpected" };
}

export function shouldShowConfirmButton(
  confirmationStatus: OrderConfirmationStatus,
): boolean {
  return confirmationStatus === "pending";
}

export function getOrderStatusBadgeVariant(
  confirmationStatus: OrderConfirmationStatus,
): "default" | "warning" | "danger" | "muted" {
  if (confirmationStatus === "confirmed") {
    return "default";
  }
  if (confirmationStatus === "rejected") {
    return "danger";
  }
  if (confirmationStatus === "archived") {
    return "muted";
  }
  return "warning";
}

export function isConfirmButtonDisabled(
  confirmingOrderId: string | null,
): boolean {
  return confirmingOrderId !== null;
}

export function applyOrderConfirmation(
  orders: MerchantOrderListItem[],
  orderId: string,
  confirmedAt?: string,
): MerchantOrderListItem[] {
  return orders.map((order) =>
    order.id === orderId
      ? {
          ...order,
          confirmationStatus: "confirmed",
          confirmedAt: confirmedAt ?? order.confirmedAt,
        }
      : order,
  );
}

export async function confirmOrderRequest(
  orderId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ConfirmOrderUiResult> {
  const response = await fetchImpl(`/api/orders/${orderId}/confirm`, {
    method: "POST",
  });

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  return mapConfirmOrderResponse(response.status, body);
}
