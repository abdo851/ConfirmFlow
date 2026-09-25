export type SignupErrorCode =
  | "missing_fields"
  | "password_mismatch"
  | "signup_failed";

export type SignupFlowResult =
  | { type: "error"; code: SignupErrorCode }
  | { type: "confirm_email" }
  | { type: "redirect"; path: string };

export function resolveSignupFlow(input: {
  hasRequiredFields: boolean;
  passwordsMatch: boolean;
  authError: boolean;
  hasSession: boolean;
  hasUser: boolean;
  fullName?: string;
}): SignupFlowResult {
  if (!input.hasRequiredFields) {
    return { type: "error", code: "missing_fields" };
  }

  if (!input.passwordsMatch) {
    return { type: "error", code: "password_mismatch" };
  }

  if (input.authError) {
    return { type: "error", code: "signup_failed" };
  }

  if (input.hasSession) {
    return { type: "redirect", path: "/onboarding" };
  }

  if (input.hasUser) {
    return { type: "confirm_email" };
  }

  return { type: "error", code: "signup_failed" };
}
