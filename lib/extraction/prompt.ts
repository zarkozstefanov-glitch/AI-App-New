import { assistantCategories } from "@/lib/extraction/schema";

export function buildExtractionPrompts(sourceHint: "receipt" | "bank" | "unknown") {
  const categories = assistantCategories.join(", ");

  const system = [
    "You are an expert Financial AI Assistant.",
    "Extract data from Bulgarian receipt images, translate to English, and return JSON only.",
    "Output ONLY a single valid JSON object matching the provided schema.",
    "Do not wrap the JSON in markdown or add commentary.",
    "Use null for missing fields (never empty string).",
    "Normalize numbers using dot decimal separator.",
    "Bulgarian receipts: merchant at top, items in middle, total at bottom.",
    "If multiple totals exist, choose the final payable amount.",
    "Keep dates as YYYY-MM-DD when possible.",
    "Ignore discounts & quantities; use final price paid for each item.",
    "Receipt parsing precision rules:",
    "1) Vertical sync pairing: match the first text on the LEFT with the first price on the FAR RIGHT.",
    "2) Right-margin lock: valid prices are ONLY the numbers immediately to the LEFT of a tax letter [А, Б, В, Г].",
    "3) Noise filter: strictly ignore quantities and unit prices (e.g., skip '1.500 x 2.00').",
    "Return prices in both BGN and EUR using 1 EUR = 1.95583 BGN.",
  ].join(" ");

  const user = [
    `Source hint: ${sourceHint}.`,
    "Return this JSON structure exactly with no extra keys:",
    '{"status":"success","error_message":null,"data":{"merchant_name":"string","date":"YYYY-MM-DD","total_sum_bgn":0,"total_sum_eur":0,"items":[{"name_en":"string","category":"string","price_bgn":0,"price_eur":0}]}}',
    `Category must be one of: ${categories}.`,
    'If not a receipt: status="error", error_message="Not a receipt".',
    'If unreadable: status="error", error_message="Image too blurry".',
  ].join(" ");

  return { system, user };
}
