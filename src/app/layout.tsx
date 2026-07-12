import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MailSift — Sort domains by mail provider",
  description:
    "Paste or upload thousands of domains and emails. MailSift reads MX & NS records and sorts them into their mail providers in seconds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
