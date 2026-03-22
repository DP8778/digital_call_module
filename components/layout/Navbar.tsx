"use client";

import { useTheme } from "@/components/theme/ThemeProvider";
import { Moon, Sun } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import logo from "@/app/MMReality_logo.webp";

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header
      className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200/80 bg-[#AEE5C8] px-4 shadow-md dark:border-emerald-950/50 dark:bg-[#2d5c4d]"
      role="banner"
    >
      <Link href="/" className="flex shrink-0 items-center">
        <Image
          src={logo}
          alt="MM Reality"
          width={180}
          height={40}
          className="h-9 w-auto max-w-[min(180px,45vw)] object-contain object-left"
          priority
          sizes="180px"
        />
      </Link>
      <button
        type="button"
        onClick={toggleTheme}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-800 shadow-sm transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-[#f9fafb] dark:hover:bg-zinc-700"
        aria-label={isDark ? "Přepnout na světlý režim" : "Přepnout na tmavý režim"}
        title={isDark ? "Světlý režim" : "Tmavý režim"}
      >
        {isDark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
      </button>
    </header>
  );
}
