"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import { LoginSchema } from "@/schemas";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,  
} from "@/components/ui/form";
import { CardWrapper } from "@/components/auth/card-wrapper"
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { login } from "@/actions/login";
import { Mail, Lock, Shield } from "lucide-react";

export const LoginForm = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl");
  const urlError = searchParams.get("error") === "OAuthAccountNotLinked"
    ? "Email already in use with different provider!"
    : "";

  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");
    setSuccess("");
    
    startTransition(() => {
      login(values, callbackUrl)
        .then((data) => {
          if (data?.error) {
            form.reset();
            setError(data.error);
          }

          if (data?.success) {
            form.reset();
            setSuccess(data.success);
          }

          if (data?.twoFactor) {
            setShowTwoFactor(true);
          }

          // If no data returned (successful login/redirect), refresh the page
          if (!data) {
            setTimeout(() => {
              window.location.reload();
            }, 100);
          }
        })
        .catch((error) => {
          // Check if this is actually a successful login redirect
          // NextAuth throws NEXT_REDIRECT when successful login with redirectTo
          const errorMessage = error?.message || error?.toString() || '';
          
          if (errorMessage.includes('NEXT_REDIRECT') || errorMessage.includes('redirect')) {
            // This is a successful login, refresh the page
            setTimeout(() => {
              window.location.reload();
            }, 100);
          } else {
            // This is an actual error - could be network, validation, etc.
            console.error('Login error:', error);
            setError("Unable to sign in. Please check your credentials and try again.");
          }
        });
    });
  };

  return (
    <div className="w-full max-w-[600px] mx-auto">
      <CardWrapper
        headerLabel="Welcome back"
        backButtonLabel="Don't have an account?"
        backButtonHref="/auth/register"
        showSocial={false}
      >
        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 py-6"
          >
            <div className="space-y-6">
              {showTwoFactor && (
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-slate-700 font-medium">
                        <Shield className="h-4 w-4 text-blue-600" />
                        Two Factor Code
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          placeholder="123456"
                          className="bg-white/80 border-2 border-gray-200 focus:border-blue-500 transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {!showTwoFactor && (
                <>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-slate-700 font-medium">
                          <Mail className="h-4 w-4 text-blue-600" />
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isPending}
                            placeholder="Enter your email address"
                            type="email"
                            className="bg-white/80 border-2 border-gray-200 focus:border-blue-500 transition-colors"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-slate-700 font-medium">
                          <Lock className="h-4 w-4 text-blue-600" />
                          Password
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isPending}
                            placeholder="Enter your password"
                            type="password"
                            className="bg-white/80 border-2 border-gray-200 focus:border-blue-500 transition-colors"
                          />
                        </FormControl>
                        <div className="flex justify-end mt-2">
                          <Button
                            size="sm"
                            variant="link"
                            asChild
                            className="px-0 font-normal text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <Link href="/auth/reset">
                              Forgot password?
                            </Link>
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>
            
            <FormError message={error || urlError} />
            <FormSuccess message={success} />
            
            <Button
              disabled={isPending}
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white py-5 text-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {showTwoFactor ? "Verifying..." : "Signing in..."}
                </div>
              ) : (
                showTwoFactor ? "Confirm" : "Sign In"
              )}
            </Button>
          </form>
        </Form>
      </CardWrapper>
    </div>
  );
};
