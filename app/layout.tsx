import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Providers from "@/app/providers";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Komunikator 5000",
  description:
    "Aplikacja do komunikacji i wymiany wiadomości w czasie rzeczywistym",
  keywords: "komunikator, chat, wiadomości, komunikacja",
  authors: [{ name: "Cezary Makowski" }],
  openGraph: {
    title: "Komunikator 5000",
    description:
      "Aplikacja do komunikacji i wymiany wiadomości w czasie rzeczywistym",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className={`${poppins.variable}`}>
      <Providers>
        <body>{children}</body>
      </Providers>
    </html>
  );
}
