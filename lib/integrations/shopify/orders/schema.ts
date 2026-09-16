import { z } from "zod";

export const shopifyOrderWebhookSchema = z.object({
  id: z.union([z.number(), z.string()]).refine(
    (value) => String(value).length > 0,
    { message: "missing_order_id" },
  ),
  order_number: z.union([z.number(), z.string()]).optional(),
  name: z.string().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  currency: z.string().trim().min(3).max(3),
  subtotal_price: z.string().trim().min(1),
  total_price: z.string().trim().min(1),
  financial_status: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export type ShopifyOrderWebhookPayload = z.infer<typeof shopifyOrderWebhookSchema>;
