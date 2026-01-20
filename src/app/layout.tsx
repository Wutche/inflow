import type { Metadata } from "next";
import { Sora, Inter, EB_Garamond } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const formGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Inflow | Cross-Chain Invoicing & Payments",
  description:
    "Seamless USDC transfers between Ethereum and Stacks powered by Circle's xReserve.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sora.variable} ${inter.variable} ${formGaramond.variable} font-sans antialiased selection:bg-brand-orange selection:text-white`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
