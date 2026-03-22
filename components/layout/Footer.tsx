import Image from "next/image";

import logo from "@/app/MMReality_logo.webp";

export default function Footer() {
  return (
    <footer
      className="shrink-0 border-t border-zinc-200 bg-white py-4 dark:border-zinc-700 dark:bg-[#111827]"
      role="contentinfo"
    >
      <div className="flex flex-col items-center justify-center gap-2 px-4">
        <Image
          src={logo}
          alt="MM Reality"
          width={180}
          height={40}
          className="h-9 w-auto max-w-[min(180px,45vw)] object-contain object-center"
          sizes="180px"
        />
        <span className="text-sm font-semibold text-zinc-800 dark:text-[#f9fafb]">
          Call Module
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Interní CRM
        </span>
      </div>
    </footer>
  );
}
