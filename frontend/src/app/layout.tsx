import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ApexiveAI Marketplace | Discover Something Exceptional",
  description:
    "A considered marketplace for exceptional finds from independent sellers.",
  applicationName: "ApexiveAI Marketplace",
  keywords: [
    "ApexiveAI",
    "Marketplace",
    "Independent Sellers",
    "Shopping",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}