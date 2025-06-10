import { Poppins } from "next/font/google";
import Image from "next/image";

import { cn } from "@/lib/utils";

const font = Poppins({
  subsets: ["latin"],
  weight: ["600"],
});

interface HeaderProps {
  label: string;
};

export const Header = ({
  label,
}: HeaderProps) => {
  return (
    <div className="w-full flex flex-col gap-y-4 items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="bg-blue-50 rounded-full p-2">
          <Image
            src="/main-logo.png"
            alt="Omninet Logo"
            width={32}
            height={32}
            className="rounded-lg"
          />
        </div>
        <h1 className={cn(
          "text-3xl font-semibold text-slate-800",
          font.className,
        )}>
          Omninet
        </h1>
      </div>
      <p className="text-muted-foreground text-sm">
        {label}
      </p>
    </div>
  );
};
