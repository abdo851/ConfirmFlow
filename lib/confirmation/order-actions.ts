"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { isAppLocale } from "@/lib/i18n/locales";
import { withLocalePath } from "@/lib/i18n/paths";
import { archiveOrder, rejectOrder } from "./state-machine";

async function requireUserId(): Promise<string | null> {
  const user = await getAuthenticatedUser();
  return user?.id ?? null;
}

async function revalidateOrder(orderId: string) {
  const locale = await getLocale();
  const safeLocale = isAppLocale(locale) ? locale : "en";
  revalidatePath(withLocalePath(safeLocale, "/dashboard/orders"));
  revalidatePath(withLocalePath(safeLocale, `/dashboard/orders/${orderId}`));
}

export async function rejectOrderAction(orderId: string): Promise<void> {
  const userId = await requireUserId();
  if (!userId) {
    return;
  }

  await rejectOrder({ orderId, actor: { userId } });
  await revalidateOrder(orderId);
}

export async function archiveOrderAction(orderId: string): Promise<void> {
  const userId = await requireUserId();
  if (!userId) {
    return;
  }

  await archiveOrder({ orderId, actor: { userId } });
  await revalidateOrder(orderId);
}
