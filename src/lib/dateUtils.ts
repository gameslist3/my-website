export interface ExperienceDuration {
  years: number;
  months: number;
}

/**
 * Calculates professional experience dynamically starting from a given date.
 * If the current time is before the start date, it returns 0 years and 0 months.
 */
export function getExperienceDuration(startDate: Date, currentDate: Date = new Date()): ExperienceDuration {
  let years = currentDate.getFullYear() - startDate.getFullYear();
  let months = currentDate.getMonth() - startDate.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  // Fallback in case of invalid or future dates
  if (years < 0) {
    return { years: 0, months: 0 };
  }

  return { years, months };
}

/**
 * Formats the experience duration into a human-readable string.
 */
export function formatExperience(duration: ExperienceDuration): string {
  const { years, months } = duration;
  const yearStr = years === 1 ? 'Year' : 'Years';
  const monthStr = months === 1 ? 'Month' : 'Months';

  if (years > 0 && months > 0) {
    return `${years} ${yearStr} ${months} ${monthStr}`;
  } else if (years > 0) {
    return `${years} ${yearStr}`;
  } else if (months > 0) {
    return `${months} ${monthStr}`;
  } else {
    return '0 Months';
  }
}
