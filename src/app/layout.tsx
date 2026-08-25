import type { Metadata } from "next";
import { Inter, Young_Serif } from "next/font/google";
import "./globals.css";

const serif = Young_Serif({ subsets: ["latin"], weight: "400", variable: "--font-commons-serif" });
const sans = Inter({ subsets: ["latin"], variable: "--font-commons-sans" });

export const metadata: Metadata = {
  title: "CMNS Holder Intelligence",
  description: "Live holder intelligence for Commons by Virtuals on Solana.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${serif.variable} ${sans.variable}`}>{children}</body></html>;
}
