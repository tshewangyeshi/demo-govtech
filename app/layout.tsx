import type { Metadata } from "next";
import { IBM_Plex_Sans, Uchen } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n/LocaleContext";

// Typography decision (docs/designs/jdwnrh-hospital-booking.md, Pass 4A):
// IBM Plex Sans for Latin text, Uchen for Dzongkha -- Uchen is confirmed
// available via next/font/google (verified against Google Fonts metadata).
const plexSans = IBM_Plex_Sans({
  variable: "--font-latin",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dzongkha = Uchen({
  variable: "--font-dzongkha",
  weight: "400",
  subsets: ["tibetan"],
});

export const metadata: Metadata = {
  title: "JDWNRH Wait Times",
  description: "Crowd-sourced hospital wait-time estimates for JDWNRH, Bhutan",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${dzongkha.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-latin">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
