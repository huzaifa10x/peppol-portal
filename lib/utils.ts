import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeOnly(rawTime: any) {
  if (!rawTime) return "";

  const timeStr = String(rawTime);

  const hasTimezone = timeStr.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(timeStr);
  const utcString = hasTimezone ? timeStr : timeStr + "Z";

  return new Date(utcString).toLocaleString("en-GB", {
    timeZone: "Asia/Dubai",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}