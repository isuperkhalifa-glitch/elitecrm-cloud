import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/components/language-provider";

export const metadata: Metadata = {
  title: "EliteCRM",
  description: "CRM System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}

