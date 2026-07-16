import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MailSift — Sort domains by mail provider",
  description:
    "Paste or upload thousands of domains and emails. MailSift reads MX & NS records and sorts them into their mail providers in seconds.",
};

// Apply the saved theme before first paint so there's no flash of the wrong one.
// Falls back to the OS preference, then dark.
const themeInit = `(function(){try{var t=localStorage.getItem('mailsift-theme');if(!t)t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
