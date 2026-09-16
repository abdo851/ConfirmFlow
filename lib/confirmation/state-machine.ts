import type { ConfirmationStatus } from "./types";

export function canConfirm(status: ConfirmationStatus): boolean {
  return status === "pending";
}

export function isValidConfirmationTransition(
  from: ConfirmationStatus,
  to: ConfirmationStatus,
): boolean {
  return from === "pending" && to === "confirmed";
}
