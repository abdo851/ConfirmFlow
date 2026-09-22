import { z } from "zod";

export const wooCommerceOrderSchema = z
  .object({
    id: z.union([z.number(), z.string()]).refine((value) => String(value).trim().length > 0, {
      message: "missing_order_id",
    }),
    number: z.union([z.number(), z.string()]).optional(),
    status: z.string().nullable().optional(),
    currency: z.string().optional(),
    total: z.union([z.string(), z.number()]).optional(),
    date_created_gmt: z.string().nullable().optional(),
    billing: z
      .object({
        email: z.string().nullable().optional(),
        phone: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
  })
  .passthrough();

export type WooCommerceOrderPayload = z.infer<typeof wooCommerceOrderSchema>;
