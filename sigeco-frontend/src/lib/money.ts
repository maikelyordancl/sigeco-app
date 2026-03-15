export function parseMoneyLikeValue(value: unknown): number {
  if (value === null || typeof value === "undefined" || value === "") return 0;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  let raw = String(value)
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^\d.,-]/g, "");

  if (!raw || raw === "-" || raw === "." || raw === ",") return 0;

  const hasComma = raw.includes(",");
  const hasDot = raw.includes(".");

  if (hasComma && hasDot) {
    const lastComma = raw.lastIndexOf(",");
    const lastDot = raw.lastIndexOf(".");
    const decimalSeparator = lastComma > lastDot ? "," : ".";
    const thousandSeparator = decimalSeparator === "," ? "." : ",";

    raw = raw.split(thousandSeparator).join("");
    if (decimalSeparator === ",") {
      raw = raw.replace(",", ".");
    }
  } else if (hasComma) {
    const parts = raw.split(",");
    raw = parts.length === 2 && parts[1].length <= 2
      ? `${parts[0]}.${parts[1]}`
      : raw.replace(/,/g, "");
  } else if (hasDot) {
    const parts = raw.split(".");
    raw = parts.length === 2 && parts[1].length <= 2
      ? `${parts[0]}.${parts[1]}`
      : raw.replace(/\./g, "");
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCLPCurrency(value: unknown): string {
  const amount = parseMoneyLikeValue(value);

  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}
