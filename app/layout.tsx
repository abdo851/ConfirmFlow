import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Confirma",
  description: "Order confirmation and conversion tracking platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
