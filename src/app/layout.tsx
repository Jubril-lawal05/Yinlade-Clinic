import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yinlade Clinic",
  description: "Digital patient care portal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

