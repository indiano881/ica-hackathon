import { v4 as uuidv4 } from "uuid";

/**
 * Generate a prefixed UUID for use as a document ID segment.
 * Example: generateId("cart") => "cart_a1b2c3d4"
 */
export function generateId(prefix: string): string {
  const short = uuidv4().replace(/-/g, "").slice(0, 8);
  return `${prefix}_${short}`;
}

/**
 * Calculate VAT amount from a price and VAT rate percentage.
 * Swedish food VAT is typically 12%.
 * Price is VAT-inclusive, so VAT = price - (price / (1 + rate/100))
 */
export function calculateVat(priceInclVat: number, vatRatePercent: number): number {
  const vat = priceInclVat - priceInclVat / (1 + vatRatePercent / 100);
  return Math.round(vat * 100) / 100;
}

/**
 * Calculate line total for a cart item.
 */
export function lineTotal(unitPrice: number, qty: number): number {
  return Math.round(unitPrice * qty * 100) / 100;
}

/**
 * Calculate points earned from a purchase total.
 * 1 point per 1 SEK spent (floor).
 */
export function pointsFromTotal(totalSek: number): number {
  return Math.floor(totalSek);
}

/**
 * Get current ISO timestamp.
 */
export function nowISO(): string {
  return new Date().toISOString();
}
