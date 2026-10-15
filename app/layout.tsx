import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Digital Call – interaktivní portfolio demo",
  description: "Syntetické demo pracovního modulu pro správu kontaktů a navazujících aktivit.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){var d=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;try{var s=localStorage.getItem('digital-call-theme');if(s==='dark'||s==='light')d=s==='dark'}catch(e){}document.documentElement.classList.toggle('dark',!!d);document.documentElement.style.colorScheme=d?'dark':'light'})();` }} />
      </head>
      <body className="min-h-screen antialiased">
        <ThemeProvider><div className="flex min-h-screen flex-col">{children}</div></ThemeProvider>
      </body>
    </html>
  );
}
