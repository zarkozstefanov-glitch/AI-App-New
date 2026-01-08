export const EUR_RATE = 1.95583;

const numberFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function toCents(amount: number) {
  return Math.round(amount * 100);
}

export function fromCents(cents: number) {
  return cents / 100;
}

export function bgnCentsToEurCents(bgnCents: number) {
  return Math.round(bgnCents / EUR_RATE);
}

export function eurCentsToBgnCents(eurCents: number) {
  return Math.round(eurCents * EUR_RATE);
}

export function convertCents(amountCents: number, currency: string) {
  const cur = currency.toUpperCase();
  if (cur === "EUR" || cur === "€") {
    return {
      eurCents: amountCents,
      bgnCents: eurCentsToBgnCents(amountCents),
    };
  }
  return {
    bgnCents: amountCents,
    eurCents: bgnCentsToEurCents(amountCents),
  };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function resolveTotalsCents(input: {
  totalEurCents?: number | null;
  totalBgnCents?: number | null;
  totalEur?: number | null;
  totalBgn?: number | null;
  totalOriginalCents?: number | null;
  totalOriginal?: number | null;
  currencyOriginal?: string | null;
}) {
  const eurFromCents = isFiniteNumber(input.totalEurCents)
    ? input.totalEurCents
    : null;
  const bgnFromCents = isFiniteNumber(input.totalBgnCents)
    ? input.totalBgnCents
    : null;
  const eurFromFloat = isFiniteNumber(input.totalEur) ? toCents(input.totalEur) : null;
  const bgnFromFloat = isFiniteNumber(input.totalBgn) ? toCents(input.totalBgn) : null;

  let eurCents = eurFromCents ?? eurFromFloat ?? null;
  let bgnCents = bgnFromCents ?? bgnFromFloat ?? null;

  if (eurCents == null || bgnCents == null) {
    const originalCents = isFiniteNumber(input.totalOriginalCents)
      ? input.totalOriginalCents
      : isFiniteNumber(input.totalOriginal)
        ? toCents(input.totalOriginal)
        : null;
    if (originalCents != null) {
      const totals = convertCents(
        originalCents,
        input.currencyOriginal ?? "BGN",
      );
      eurCents = eurCents ?? totals.eurCents;
      bgnCents = bgnCents ?? totals.bgnCents;
    }
  }

  if (eurCents == null && bgnCents != null) {
    eurCents = bgnCentsToEurCents(bgnCents);
  }
  if (bgnCents == null && eurCents != null) {
    bgnCents = eurCentsToBgnCents(eurCents);
  }

  return { eurCents, bgnCents };
}

export function formatMoney(
  eurCents?: number | null,
  bgnCents?: number | null,
) {
  const eur = isFiniteNumber(eurCents) ? eurCents : null;
  const bgn = isFiniteNumber(bgnCents) ? bgnCents : null;
  if (eur == null && bgn == null) return "—";
  const eurFinal = eur ?? bgnCentsToEurCents(bgn ?? 0);
  const bgnFinal = bgn ?? eurCentsToBgnCents(eur ?? 0);
  return `€${numberFormatter.format(fromCents(eurFinal))} (BGN ${numberFormatter.format(fromCents(bgnFinal))})`;
}
