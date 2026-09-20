import { NextResponse } from "next/server";

export interface ApiSuccessBody<T = Record<string, unknown>> {
  ok: true;
  data: T;
}

export interface ApiErrorBody {
  ok: false;
  error: string;
  details?: Record<string, unknown>;
}

export function ok<T extends Record<string, unknown>>(
  data: T,
  init?: ResponseInit,
): NextResponse<ApiSuccessBody<T>> {
  return NextResponse.json({ ok: true, data }, init);
}

export function badRequest(
  error: string,
  details?: Record<string, unknown>,
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { ok: false, error, ...(details ? { details } : {}) },
    { status: 400 },
  );
}

export function unauthorized(
  error = "Unauthorized",
): NextResponse<ApiErrorBody> {
  return NextResponse.json({ ok: false, error }, { status: 401 });
}

export function notFound(error = "Not found"): NextResponse<ApiErrorBody> {
  return NextResponse.json({ ok: false, error }, { status: 404 });
}

export function serverError(
  error = "Internal server error",
  details?: Record<string, unknown>,
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { ok: false, error, ...(details ? { details } : {}) },
    { status: 500 },
  );
}
