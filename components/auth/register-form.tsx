"use client";

import * as z from "zod";
import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ReCAPTCHA from "react-google-recaptcha";

import { RegisterSchema } from "@/schemas";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { register } from "@/actions/register";
import { Shield, Mail, Lock, User, CheckCircle, AlertCircle } from "lucide-react";

export const RegisterForm = () => {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [referralCode, setReferralCode] = useState<string | undefined>(undefined);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);

  useEffect(() => {
    // Get referral code from localStorage if available
    try {
      if (typeof window !== 'undefined') {
        const storedReferralCode = localStorage.getItem('referralCode');
        if (storedReferralCode) {
          setReferralCode(storedReferralCode);
        }
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    }
  }, []);

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      referralCode: "",
      agreeToUpdates: false,
      subscribeNewsletter: false,
      captchaToken: "",
    },
  });

  // Update form when referral code is loaded from localStorage
  useEffect(() => {
    if (referralCode) {
      form.setValue('referralCode', referralCode);
    }
  }, [referralCode, form]);

  // Watch password fields for real-time validation
  const password = form.watch("password");
  const confirmPassword = form.watch("confirmPassword");

  useEffect(() => {
    if (password && confirmPassword) {
      setPasswordsMatch(password === confirmPassword);
    } else {
      setPasswordsMatch(null);
    }
  }, [password, confirmPassword]);

  const handleCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
    form.setValue('captchaToken', token || '');
  };

  const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
    setError("");
    setSuccess("");
    
    if (!captchaToken) {
      setError("Please complete the reCAPTCHA verification");
      return;
    }
    
    startTransition(() => {
      register(values)
        .then((data) => {
          setError(data.error);
          setSuccess(data.success);
          
          // Clear referral code from localStorage after successful registration
          try {
            if (data.success && typeof window !== 'undefined') {
              localStorage.removeItem('referralCode');
            }
          } catch (error) {
            console.error("Error clearing localStorage:", error);
          }
        });
    });
  };

  return (
    <div className="w-full max-w-md">
      <CardWrapper
        headerLabel="Create your account"
        backButtonLabel="Already have an account?"
        backButtonHref="/auth/login"
        showSocial
      >
        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <div className="space-y-4">
              {/* Full Name Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-slate-700 font-medium">
                      <User className="h-4 w-4 text-blue-600" />
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder="Enter your full name"
                        className="bg-white/80 border-2 border-gray-200 focus:border-blue-500 transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email Address Field */}
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

              {/* Password Field */}
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
                        placeholder="Create a secure password"
                        type="password"
                        className="bg-white/80 border-2 border-gray-200 focus:border-blue-500 transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirm Password Field */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-slate-700 font-medium">
                      <Lock className="h-4 w-4 text-blue-600" />
                      Confirm Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          disabled={isPending}
                          placeholder="Repeat your password"
                          type="password"
                          className={`bg-white/80 border-2 transition-colors ${
                            passwordsMatch === null 
                              ? 'border-gray-200 focus:border-blue-500' 
                              : passwordsMatch 
                                ? 'border-green-500 focus:border-green-600' 
                                : 'border-red-500 focus:border-red-600'
                          }`}
                        />
                        {passwordsMatch !== null && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {passwordsMatch ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    {passwordsMatch === false && confirmPassword && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        Passwords don&apos;t match
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Referral Code Field (if available) */}
              {referralCode && (
                <FormField
                  control={form.control}
                  name="referralCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">
                        Referral Code
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={true}
                          placeholder="Referral Code"
                          className="bg-green-50 border-2 border-green-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Agreement Checkboxes */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                {/* Mandatory Updates Checkbox */}
                <FormField
                  control={form.control}
                  name="agreeToUpdates"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isPending}
                          className="mt-1"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium text-slate-700 cursor-pointer">
                          I agree to receive updates about the lottery and prize draws{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <p className="text-xs text-slate-500">
                          Required to participate in lottery draws and receive winning notifications
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Optional Newsletter Checkbox */}
                <FormField
                  control={form.control}
                  name="subscribeNewsletter"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isPending}
                          className="mt-1"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium text-slate-700 cursor-pointer">
                          I want to subscribe to the 0mninet newsletter
                        </FormLabel>
                        <p className="text-xs text-slate-500">
                          Get updates about global connectivity projects and platform features
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="agreeToUpdates"
                  render={() => (
                    <FormMessage />
                  )}
                />
              </div>

              {/* reCAPTCHA */}
              <div className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-slate-700">Security Verification</span>
                </div>
                <div className="bg-white/50 p-4 rounded-lg border-2 border-gray-200">
                  {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ? (
                    <ReCAPTCHA
                      sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                      onChange={handleCaptchaChange}
                      theme="light"
                    />
                  ) : (
                    <div className="text-red-500 text-sm p-4 bg-red-50 rounded border">
                      reCAPTCHA configuration error. Please contact support.
                    </div>
                  )}
                </div>
                <FormField
                  control={form.control}
                  name="captchaToken"
                  render={() => (
                    <FormMessage />
                  )}
                />
              </div>
            </div>

            <FormError message={error} />
            <FormSuccess message={success} />
            
            <Button
              disabled={isPending || !captchaToken}
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white py-3 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating account...
                </div>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </Form>
      </CardWrapper>
    </div>
  );
};
