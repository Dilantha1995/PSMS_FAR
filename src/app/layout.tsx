import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProSynergy FAR — Fixed Asset Register",
  description: "Fixed Asset Register management for Pro Synergy Medical Systems Pvt Ltd",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
