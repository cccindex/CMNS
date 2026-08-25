import type { Metadata } from "next";
import { IBM_Plex_Mono, Young_Serif } from "next/font/google";
import "./globals.css";

const serif = Young_Serif({ subsets: ["latin"], weight: "400", variable: "--font-commons-serif" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-commons-mono" });

export const metadata: Metadata = {
  title: "CMNS Holder Intelligence",
  description: "Live holder intelligence for Commons by Virtuals on Solana.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${serif.variable} ${mono.variable}`}>{children}</body></html>;
}
