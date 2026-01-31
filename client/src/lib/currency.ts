/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currency: string): string {
  try {
    return (0).toLocaleString(undefined, {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).replace(/\d/g, '').trim();
  } catch (e) {
    const currencyMap: Record<string, string> = {
      EUR: "€",
      USD: "$",
      GBP: "£",
      CAD: "C$",
      AUD: "A$",
      JPY: "¥",
      CHF: "CHF",
      CNY: "¥",
      INR: "₹",
      BRL: "R$",
      MXN: "$",
      SEK: "kr",
      NOK: "kr",
      DKK: "kr",
      PLN: "zł",
      TRY: "₺",
      RUB: "₽",
      ZAR: "R",
      NZD: "NZ$",
      SGD: "S$",
      HKD: "HK$",
      KRW: "₩",
    };
    return currencyMap[currency.toUpperCase()] || currency.toUpperCase();
  }
}

/**
 * Format currency amount with symbol
 */
export function formatCurrency(amount: number, currency: string = "EUR"): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  } catch (e) {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

/**
 * Format cents to currency string
 */
export function formatCents(cents: number, currency: string = "EUR"): string {
  return formatCurrency(cents / 100, currency);
}
