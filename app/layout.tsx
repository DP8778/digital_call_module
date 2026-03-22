import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Obvolávání",
  description: "Interní CRM modul",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased dark:bg-[#1f2937] dark:text-[#f9fafb]">
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
