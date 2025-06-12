'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTransition, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SettingsSchema } from '@/schemas';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { settings } from '@/actions/settings';
import {
  Form,
  FormField,
  FormControl,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useCurrentUser } from '@/hooks/use-current-user';
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import { UserRole } from '@prisma/client';
import { 
  User, 
  Mail, 
  Lock, 
  Shield, 
  Settings as SettingsIcon,
  Home,
  ArrowLeft,
  Save
} from 'lucide-react';

const SettingsPage = () => {
  const user = useCurrentUser();
  const router = useRouter();

  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof SettingsSchema>>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      password: undefined,
      newPassword: undefined,
      name: user?.name || undefined,
      email: user?.email || undefined,
      role: user?.role || undefined,
      isTwoFactorEnabled: user?.isTwoFactorEnabled || undefined,
    },
  });

  const onSubmit = (values: z.infer<typeof SettingsSchema>) => {
    startTransition(() => {
      settings(values)
        .then((data) => {
          if (data.error) {
            setError(data.error);
          }

          if (data.success) {
            update();
            setSuccess(data.success);
          }
        })
        .catch(() => setError('Something went wrong!'));
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-emerald-400/20 to-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header with back button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2 bg-white/80 border-2 border-slate-200 hover:bg-white hover:border-slate-300 transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg">
                  <SettingsIcon className="h-6 w-6" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Account Settings</h1>
              </div>
              <p className="text-slate-600">Manage your account preferences and security</p>
            </div>
          </div>
          
          <Link href="/">
            <Button 
              variant="outline"
              className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 text-blue-700 hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-200 font-medium"
            >
              <Home className="h-4 w-4" />
              Back to Landing
            </Button>
          </Link>
        </div>

        {/* Main settings card */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Profile Information</h2>
                <p className="text-sm text-slate-600">Update your personal details and security settings</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            <Form {...form}>
              <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-6">
                  {/* Name Field */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-slate-700 font-medium text-base">
                          <User className="h-4 w-4 text-blue-600" />
                          Full Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter your full name"
                            disabled={isPending}
                            className="bg-white/90 border-2 border-gray-200 focus:border-blue-500 transition-colors h-12 text-base"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* OAuth conditional fields */}
                  {user?.isOAuth === false && (
                    <div className="space-y-6">
                      {/* Email Field */}
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-slate-700 font-medium text-base">
                              <Mail className="h-4 w-4 text-blue-600" />
                              Email Address
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter your email address"
                                type="email"
                                disabled={isPending}
                                className="bg-white/90 border-2 border-gray-200 focus:border-blue-500 transition-colors h-12 text-base"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Current Password */}
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-slate-700 font-medium text-base">
                              <Lock className="h-4 w-4 text-blue-600" />
                              Current Password
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter current password to make changes"
                                type="password"
                                disabled={isPending}
                                className="bg-white/90 border-2 border-gray-200 focus:border-blue-500 transition-colors h-12 text-base"
                              />
                            </FormControl>
                            <FormDescription className="text-sm text-slate-500">
                              Required when updating email or password
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* New Password */}
                      <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-slate-700 font-medium text-base">
                              <Lock className="h-4 w-4 text-emerald-600" />
                              New Password (Optional)
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter new password (leave blank to keep current)"
                                type="password"
                                disabled={isPending}
                                className="bg-white/90 border-2 border-gray-200 focus:border-emerald-500 transition-colors h-12 text-base"
                              />
                            </FormControl>
                            <FormDescription className="text-sm text-slate-500">
                              Leave empty if you don&apos;t want to change your password
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Role Field - Only visible to admins */}
                  {user?.role === UserRole.ADMIN && (
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-slate-700 font-medium text-base">
                            <Shield className="h-4 w-4 text-purple-600" />
                            Account Role
                          </FormLabel>
                          <Select
                            disabled={isPending}
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-white/90 border-2 border-gray-200 focus:border-purple-500 transition-colors h-12 text-base">
                                <SelectValue placeholder="Select your role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={UserRole.ADMIN}>Administrator</SelectItem>
                              <SelectItem value={UserRole.USER}>User</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-sm text-slate-500">
                            Your current role in the system
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Two Factor Authentication */}
                  {user?.isOAuth === false && (
                    <FormField
                      control={form.control}
                      name="isTwoFactorEnabled"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex flex-row items-center justify-between rounded-xl border-2 border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-sm">
                            <div className="space-y-2">
                              <FormLabel className="flex items-center gap-2 text-slate-700 font-medium text-base">
                                <Shield className="h-5 w-5 text-blue-600" />
                                Two-Factor Authentication
                              </FormLabel>
                              <FormDescription className="text-sm text-slate-600 max-w-md">
                                Add an extra layer of security to your account with 2FA verification codes
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                disabled={isPending}
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-blue-600"
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Error and Success Messages */}
                <div className="space-y-4">
                  <FormError message={error} />
                  <FormSuccess message={success} />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-6 border-t border-gray-100">
                  <Button 
                    disabled={isPending} 
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-base font-semibold transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-w-[140px]"
                  >
                    {isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Save Changes
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage; 