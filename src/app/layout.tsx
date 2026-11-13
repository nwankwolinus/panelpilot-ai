import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PanelPilot AI",
  description: "LV Electrical Panel Engineering and Quotation Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
