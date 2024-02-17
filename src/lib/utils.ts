import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Inter } from "next/font/google"


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});