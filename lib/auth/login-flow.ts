import { resolveSafeInternalRedirect } from "@/lib/auth/redirects";

export type LoginErrorCode = "missing_fields" | "invalid_credentials";

export type LoginFlowResult =
  | { type: "error"; code: LoginErrorCode }
  | { type: "redirect"; path: string };

export function resolveLoginFlow(input: {
  hasRequiredFields: boolean;
  authError: boolean;
  next?: string | null;
}): LoginFlowResult {
  if (!input.hasRequiredFields) {
    return { type: "error", code: "missing_fields" };
  }

  if (input.authError) {
    return { type: "error", code: "invalid_credentials" };
  }

  return {
    type: "redirect",
    path: resolveSafeInternalRedirect(input.next),
  };
}
