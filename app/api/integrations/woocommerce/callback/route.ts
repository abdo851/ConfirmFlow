import { NextResponse } from "next/server";
import { buildAppPath } from "@/lib/config/app-url";
import { getAppBaseUrl } from "@/lib/config/urls";
import { getLocalizedPath } from "@/lib/i18n/server-locale";
import { createDatabaseClient } from "@/lib/database/client";
import { logger } from "@/lib/logging/logger";
import {
  WOOCOMMERCE_OAUTH_STATE_TTL_SECONDS,
  getWooCommerceEnv,
  persistWooCommerceConnectionForUser,
  verifyState,
  verifyWooCommerceCallbackPayload,
} from "@/lib/integrations/woocommerce";
import { encryptSecret } from "@/lib/integrations/woocommerce/oauth/crypto";
import {
  buildWooCommerceWebhookDeliveryUrl,
  generateWooCommerceWebhookSecret,
  registerOrderWebhooks,
} from "@/lib/integrations/woocommerce/webhooks/register";
import { unregisterWebhooks } from "@/lib/integrations/woocommerce/webhooks/unregister";

async function redirectWithReason(path: string): Promise<NextResponse> {
  const localizedPath = await getLocalizedPath(path);
  return NextResponse.redirect(buildAppPath(getAppBaseUrl(), localizedPath));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const success = searchParams.get("success");

  if (success === "1") {
    return redirectWithReason("/onboarding/store?woocommerce=connected");
  }

  return redirectWithReason(
    "/onboarding/store?woocommerce=error&reason=callback_failed",
  );
}

export async function POST(request: Request) {
  let env: ReturnType<typeof getWooCommerceEnv>;
  try {
    env = getWooCommerceEnv();
  } catch {
    return NextResponse.json({ error: "configuration" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const stateToken = searchParams.get("state");
  const state = stateToken
    ? verifyState(
        stateToken,
        env.WOOCOMMERCE_SESSION_SECRET,
        WOOCOMMERCE_OAUTH_STATE_TTL_SECONDS * 1000,
      )
    : null;

  if (!state) {
    return NextResponse.json({ error: "invalid_state" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const verified = verifyWooCommerceCallbackPayload(body);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: 400 });
  }

  if (verified.credentials.userId !== state.userId) {
    return NextResponse.json({ error: "user_mismatch" }, { status: 400 });
  }

  try {
    const db = createDatabaseClient();
    const { data: profile } = await db
      .from("profiles")
      .select("email")
      .eq("id", state.userId)
      .maybeSingle();

    const saved = await persistWooCommerceConnectionForUser({
      userId: state.userId,
      userEmail: profile?.email ?? "",
      storeUrl: state.storeUrl,
      consumerKey: verified.credentials.consumerKey,
      consumerSecret: verified.credentials.consumerSecret,
      scope: verified.credentials.keyPermissions,
    });
    logger.info("woocommerce_callback_persisted", {
      storeId: saved.storeId,
      userId: state.userId,
    });

    try {
      const { data: existingWoo } = await db
        .from("woocommerce_connections")
        .select("webhook_ids")
        .eq("store_connection_id", saved.storeConnectionId)
        .maybeSingle();
      const previousIds = Array.isArray(existingWoo?.webhook_ids)
        ? existingWoo.webhook_ids.map((id: unknown) => String(id)).filter(Boolean)
        : [];

      if (previousIds.length > 0) {
        await unregisterWebhooks({
          store_url: state.storeUrl,
          consumer_key: verified.credentials.consumerKey,
          consumer_secret: verified.credentials.consumerSecret,
          webhook_ids: previousIds,
        });
      }

      const webhookSecret = generateWooCommerceWebhookSecret();
      const { error: secretError } = await db
        .from("woocommerce_connection_secrets")
        .update({
          encrypted_webhook_secret: encryptSecret(
            webhookSecret,
            env.WOOCOMMERCE_SESSION_SECRET,
          ),
        })
        .eq("store_connection_id", saved.storeConnectionId);

      if (secretError) {
        throw new Error(secretError.message);
      }

      const webhookIds = await registerOrderWebhooks({
        store_url: state.storeUrl,
        consumer_key: verified.credentials.consumerKey,
        consumer_secret: verified.credentials.consumerSecret,
        delivery_url: buildWooCommerceWebhookDeliveryUrl(
          env.NEXT_PUBLIC_APP_URL,
          saved.storeConnectionId,
        ),
        secret: webhookSecret,
      });

      const { error: idsError } = await db
        .from("woocommerce_connections")
        .update({ webhook_ids: webhookIds })
        .eq("store_connection_id", saved.storeConnectionId);

      if (idsError) {
        throw new Error(idsError.message);
      }

      logger.info("woocommerce_webhooks_registered", {
        storeId: saved.storeId,
        count: webhookIds.length,
      });
    } catch (webhookError) {
      logger.error("woocommerce_webhook_registration_failed", {
        message: webhookError instanceof Error ? webhookError.message : "unknown",
        storeId: saved.storeId,
      });
    }
  } catch (error) {
    logger.error("woocommerce_callback_persist_failed", {
      message: error instanceof Error ? error.message : "unknown",
      userId: state.userId,
    });
    return NextResponse.json({ error: "persistence_failed" }, { status: 400 });
  }

  return new NextResponse("OK", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
