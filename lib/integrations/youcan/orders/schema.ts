import { z } from "zod";

const youCanCustomerSchema = z
  .object({
    email: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
  })
  .passthrough();

export const youCanOrderWebhookSchema = z.object({
  id: z.union([z.number(), z.string()]).refine(
    (value) => String(value).length > 0,
    { message: "missing_order_id" },
  ),
  ref: z.union([z.number(), z.string()]).optional(),
  status: z.union([z.number(), z.string()]).optional(),
  status_text: z.string().nullable().optional(),
  total: z.union([z.number(), z.string()]),
  subtotal: z.union([z.number(), z.string()]).optional(),
  currency: z.string().trim().min(3).max(3),
  store_id: z.string().optional(),
  created_at: z.string().optional(),
  customer: youCanCustomerSchema.optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
});

export const youCanWebhookEnvelopeSchema = z.object({
  event_name: z.string(),
  event_happened_at: z.string().optional(),
  data: youCanOrderWebhookSchema,
});

export type YouCanOrderWebhookPayload = z.infer<typeof youCanOrderWebhookSchema>;

export type YouCanWebhookEnvelope = z.infer<typeof youCanWebhookEnvelopeSchema>;
