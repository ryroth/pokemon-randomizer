import type { MeasurementSystem } from "@/lib/types/taxonomy";

const INCHES_PER_METER = 39.37007874015748;
const POUNDS_PER_KILOGRAM = 2.2046226218487757;

/** Official meters, shown as meters or as feet and inches. Inches are rounded. */
export function formatHeight(meters: number, system: MeasurementSystem): string {
  if (system === "metric") {
    return `${trimNumber(meters)} m`;
  }
  const { feet, inches } = metersToFeetInches(meters);
  return `${feet} ft ${inches} in`;
}

/** Official kilograms, shown as kilograms or as pounds to one decimal. */
export function formatWeight(kilograms: number, system: MeasurementSystem): string {
  if (system === "metric") {
    return `${trimNumber(kilograms)} kg`;
  }
  return `${trimNumber(kilogramsToPounds(kilograms))} lb`;
}

/** Both systems, metric first. Used once a card shows the usual Pokémon. */
export function formatHeightBoth(meters: number): string {
  return `${formatHeight(meters, "metric")} (${formatHeight(meters, "imperial")})`;
}

/** Both systems, metric first. Used once a card shows the usual Pokémon. */
export function formatWeightBoth(kilograms: number): string {
  return `${formatWeight(kilograms, "metric")} (${formatWeight(kilograms, "imperial")})`;
}

export function metersToFeetInches(meters: number): { feet: number; inches: number } {
  const totalInches = Math.max(0, Math.round(meters * INCHES_PER_METER));
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}

export function feetInchesToMeters(feet: number, inches: number): number {
  return (feet * 12 + inches) * 0.0254;
}

export function kilogramsToPounds(kilograms: number): number {
  return roundTo(kilograms * POUNDS_PER_KILOGRAM, 1);
}

export function poundsToKilograms(pounds: number): number {
  return pounds / POUNDS_PER_KILOGRAM;
}

function trimNumber(value: number, digits = 1): string {
  return String(roundTo(value, digits));
}

function roundTo(value: number, digits: number): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}
