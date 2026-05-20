export const noExpiryDate = "2099-12-31";

function padMonth(month: number) {
  return String(month).padStart(2, "0");
}

function normalizeYear(twoOrFourDigitYear: string) {
  if (twoOrFourDigitYear.length === 2) {
    return `20${twoOrFourDigitYear}`;
  }
  return twoOrFourDigitYear;
}

export function normalizeExpiryMonth(value: string | undefined) {
  const raw = value?.trim() ?? "";
  if (!raw || raw === noExpiryDate) {
    return raw;
  }

  const isoMonth = raw.match(/^(\d{4})-(\d{2})$/);
  if (isoMonth) {
    return raw;
  }

  const isoDate = raw.match(/^(\d{4})-(\d{2})-\d{2}$/);
  if (isoDate) {
    return `${isoDate[1]}-${isoDate[2]}`;
  }

  const dottedDate = raw.match(/^\d{1,2}\.(\d{1,2})\.(\d{2}|\d{4})$/);
  if (dottedDate) {
    return `${normalizeYear(dottedDate[2])}-${padMonth(Number(dottedDate[1]))}`;
  }

  const monthYear = raw.match(/^(\d{1,2})[./-](\d{2}|\d{4})$/);
  if (monthYear) {
    return `${normalizeYear(monthYear[2])}-${padMonth(Number(monthYear[1]))}`;
  }

  const compact = raw.match(/^(\d{2})(\d{2})$/);
  if (compact) {
    return `${normalizeYear(compact[2])}-${compact[1]}`;
  }

  return raw;
}

export function isValidExpiryMonth(value: string) {
  const normalized = normalizeExpiryMonth(value);
  if (!normalized || normalized === noExpiryDate) {
    return true;
  }
  const match = normalized.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return false;
  }
  const month = Number(match[2]);
  return month >= 1 && month <= 12;
}

export function formatExpiryMonth(value: string) {
  const normalized = normalizeExpiryMonth(value);
  if (!normalized || normalized === noExpiryDate) {
    return "ohne Ablauf";
  }
  const match = normalized.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return value;
  }
  return `${match[2]}/${match[1].slice(2)}`;
}

export function expiryMonthToMonthEndIso(value: string) {
  const normalized = normalizeExpiryMonth(value);
  if (!normalized || normalized === noExpiryDate) {
    return normalized || noExpiryDate;
  }
  const match = normalized.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return normalized;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const lastDay = new Date(year, month, 0).getDate();
  return `${match[1]}-${match[2]}-${String(lastDay).padStart(2, "0")}`;
}
