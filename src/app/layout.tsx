import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./v8-theme.css";
import { I18nProvider } from "@/components/language-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { TiltProvider } from "@/components/tilt-provider";
import { ScopeProvider } from "@/components/scope-provider";
import { SystemSettingsProvider } from "@/components/system-settings-provider";

export const metadata: Metadata = {
  title: "EliteCRM",
  description: "CRM System",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <I18nProvider>
            <SystemSettingsProvider>
              <ScopeProvider>
                <TiltProvider>{children}</TiltProvider>
              </ScopeProvider>
            </SystemSettingsProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
