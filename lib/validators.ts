import { z } from "zod";
import { categoryKeys } from "@/lib/categories";

export const registerSchema = z.object({
  firstName: z.string().min(2, "Минимум 2 букви"),
  lastName: z.string().min(2, "Минимум 2 букви"),
  email: z.string().email("Невалиден имейл"),
  phone: z.string().optional(),
  password: z.string().min(8, "Парола минимум 8 символа"),
  nickname: z.string().optional(),
  monthlyBudgetGoal: z.number().optional(),
});

export const transactionFiltersSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  category: z.string().optional(),
  merchant: z.string().optional(),
  min: z.string().optional(),
  max: z.string().optional(),
});

export const settingsSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(6),
  nickname: z.string().optional(),
  monthlyBudgetGoal: z.number().nullable().optional(),
});

export const transactionCreateSchema = z.object({
  sourceType: z.enum(["receipt", "bank", "unknown", "manual"]),
  merchantName: z.string().nullable().optional(),
  transactionDate: z.string().nullable().optional(),
  totalOriginalCents: z.number().int(),
  currencyOriginal: z.string(),
  category: z.enum(categoryKeys),
  categoryConfidence: z.number().min(0).max(1).optional(),
  aiExtractedJson: z.any().optional(),
  overallConfidence: z.number().min(0).max(1).optional(),
  paymentMethod: z.string().nullable().optional(),
  notes: z.string().optional(),
  originalImageUrl: z.string().nullable().optional(),
  totalBgnCents: z.number().int().optional(),
  totalEurCents: z.number().int().optional(),
  lineItems: z
    .array(
      z.object({
        name: z.string().nullable().optional(),
        quantity: z.number().optional(),
        priceOriginalCents: z.number().int().optional(),
      }),
    )
    .optional(),
});
