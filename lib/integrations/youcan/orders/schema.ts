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
  customer: youCanCustomerSchema.nullish(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  custom_fields: z
    .object({
      customerName: z.string().optional(),
      customerPhone: z.string().optional(),
      customerPhone2: z.string().optional().nullable(),
      customerAddress: z.string().optional(),
      customerCity: z.string().optional(),
    })
    .nullish(),
  extra_fields: z
    .object({
      name: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      "المدينة": z.string().optional(),
    })
    .passthrough()
    .nullish(),
  variants: z
    .array(
      z
        .object({
          id: z.string().optional(),
          price: z.number().optional(),
          quantity: z.number().optional(),
          variant: z
            .object({
              id: z.string().optional(),
              sku: z.string().nullable().optional(),
              product: z
                .object({
                  id: z.string().optional(),
                  name: z.string().optional(),
                  thumbnail: z.string().optional(),
                })
                .passthrough()
                .optional(),
            })
            .passthrough()
            .optional(),
        })
        .passthrough(),
    )
    .optional(),
  shipping: z
    .object({
      address: z
        .object({
          first_name: z.string().optional(),
          last_name: z.string().optional(),
          full_name: z.string().optional(),
          phone: z.string().nullable().optional(),
          city: z.string().optional(),
          address: z.string().optional(),
          first_line: z.string().nullable().optional(),
          second_line: z.string().nullable().optional(),
          region: z.string().optional(),
          state: z.string().optional(),
          country: z.string().optional(),
          country_name: z.string().optional(),
        })
        .passthrough()
        .optional(),
    })
    .passthrough()
    .nullish(),
});

export const youCanWebhookEnvelopeSchema = z.object({
  event_name: z.string(),
  event_happened_at: z.string().optional(),
  data: youCanOrderWebhookSchema,
});

export type YouCanOrderWebhookPayload = z.infer<typeof youCanOrderWebhookSchema>;

export type YouCanWebhookEnvelope = z.infer<typeof youCanWebhookEnvelopeSchema>;
