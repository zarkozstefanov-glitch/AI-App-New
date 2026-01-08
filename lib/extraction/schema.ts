import { z } from "zod";

export const assistantCategories = [
  "Fuel",
  "Groceries & Food",
  "Restaurants & Cafes",
  "Transport",
  "Home & Utilities",
  "Clothing",
  "Subscriptions",
  "Entertainment",
  "Health",
  "Alcohol",
  "Cigarettes & Tobacco",
  "Cosmetics",
  "Gifts",
  "Other",
] as const;

const itemSchema = z.object({
  name_en: z.string().min(1),
  category: z.enum(assistantCategories),
  price_bgn: z.number(),
  price_eur: z.number(),
});

const dataSchema = z.object({
  merchant_name: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  total_sum_bgn: z.number(),
  total_sum_eur: z.number(),
  items: z.array(itemSchema),
});

export const extractionSchema = z
  .object({
    status: z.enum(["success", "error"]),
    error_message: z.string().nullable(),
    data: dataSchema.nullable(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.status === "success") {
      if (!value.data) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "data is required when status=success",
          path: ["data"],
        });
      }
      if (value.error_message) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "error_message must be null when status=success",
          path: ["error_message"],
        });
      }
    }
    if (value.status === "error") {
      if (!value.error_message) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "error_message is required when status=error",
          path: ["error_message"],
        });
      }
    }
  });

export type ExtractionResult = z.infer<typeof extractionSchema>;
