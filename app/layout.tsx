import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Action Shift",
  description: "Owner seat. Last night. One number. One text.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
