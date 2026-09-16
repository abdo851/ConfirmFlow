import { describe, expect, it } from "vitest";
import {
  canConfirm,
  isValidConfirmationTransition,
} from "@/lib/confirmation/state-machine";

describe("confirmation state machine", () => {
  it("allows confirmation only from pending", () => {
    expect(canConfirm("pending")).toBe(true);
    expect(canConfirm("confirmed")).toBe(false);
  });

  it("allows only pending → confirmed transitions", () => {
    expect(isValidConfirmationTransition("pending", "confirmed")).toBe(true);
    expect(isValidConfirmationTransition("confirmed", "pending")).toBe(false);
    expect(isValidConfirmationTransition("confirmed", "confirmed")).toBe(false);
    expect(isValidConfirmationTransition("pending", "pending")).toBe(false);
  });
});
