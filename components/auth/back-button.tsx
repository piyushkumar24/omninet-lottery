"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

interface BackButtonProps {
  href: string;
  label: string;
};

export const BackButton = ({
  href,
  label,
}: BackButtonProps) => {
  return (
    <Button
      variant="link"
      className="font-medium w-full text-base text-slate-600 hover:text-blue-600 transition-colors duration-200 py-3 h-auto"
      asChild
    >
      <Link href={href}>
        {label}
      </Link>
    </Button>
  );
};
