import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { I18nProvider } from "@/components/language-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { TiltProvider } from "@/components/tilt-provider";

export const metadata: Metadata = {
  title: "EliteCRM",
  description: "CRM System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <ThemeProvider>
          <I18nProvider>
            <TiltProvider>{children}</TiltProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
