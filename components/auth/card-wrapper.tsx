"use client";

import { 
  Card,
  CardContent,
  CardFooter,
  CardHeader
} from "@/components/ui/card";
import { Header } from "@/components/auth/header";
import { Social } from "@/components/auth/social";
import { BackButton } from "@/components/auth/back-button";

interface CardWrapperProps {
  children: React.ReactNode;
  headerLabel: string;
  backButtonLabel: string;
  backButtonHref: string;
  showSocial?: boolean;
};

export const CardWrapper = ({
  children,
  headerLabel,
  backButtonLabel,
  backButtonHref,
  showSocial
}: CardWrapperProps) => {
  return (
    <Card className="w-full max-w-[600px] mx-auto shadow-xl">
      <CardHeader className="bg-black text-white p-8">
        <Header label={headerLabel} />
      </CardHeader>
      <CardContent className="p-8">
        {children}
      </CardContent>
      {showSocial && (
        <CardFooter className="p-8">
          <Social />
        </CardFooter>
      )}
      <CardFooter className="p-8">
        <BackButton
          label={backButtonLabel}
          href={backButtonHref}
        />
      </CardFooter>
    </Card>
  );
};
