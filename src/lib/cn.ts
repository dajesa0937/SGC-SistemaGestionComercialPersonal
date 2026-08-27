import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Combina clases de Tailwind resolviendo conflictos a favor de la ultima. */
export function cn(...entradas: ClassValue[]): string {
  return twMerge(clsx(entradas))
}
