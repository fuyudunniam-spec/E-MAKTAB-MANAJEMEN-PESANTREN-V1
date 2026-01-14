import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine tailwind classes safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number to Rupiah currency string
 */
export const formatRupiah = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "Rp 0";
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format date to Indonesian locale string (long month name)
 */
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Get Indonesian month names array
 * Index 0 is often empty or "Pilih Bulan" depending on usage in project
 */
export const getBulanNames = (): string[] => {
  return [
    '',
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
};

/**
 * Get current period string (e.g., "Januari 2026")
 */
export const getCurrentPeriod = (): string => {
  const now = new Date();
  const months = getBulanNames();
  return `${months[now.getMonth() + 1]} ${now.getFullYear()}`;
};

/**
 * Parse formatted rupiah back to number
 */
export const parseRupiah = (value: string): number => {
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9]/g, '');
  return parseInt(cleaned) || 0;
};
