import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const NEXT_PUBLIC_API_URL="https://api.kasaadvisory.com"
// export const NEXTAUTH_URL="http://localhost:3000"
export const NEXTAUTH_URL="https://peppol-portal-nu.vercel.app"
export const NEXTAUTH_SECRET="peppol-nextauth-secret-2026-local"
export const API_URL="https://api.kasaadvisory.com"