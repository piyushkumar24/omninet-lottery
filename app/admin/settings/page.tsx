import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PrizeAmountManager } from "@/components/admin/prize-amount-manager";
import { getPrizeAmount, initializeDefaultSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Admin Settings | 0mninet Lottery",
  description: "Admin settings for the 0mninet lottery platform",
};

export default async function AdminSettingsPage() {
  // Initialize default settings first
  await initializeDefaultSettings();
  
  const currentPrizeAmount = await getPrizeAmount();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Draw Settings</CardTitle>
          <CardDescription>
            Configure automatic weekly draws and prize amounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="automatic-draws">Automatic Weekly Draws</Label>
                <p className="text-sm text-slate-500">
                  Enable automatic weekly draws every Thursday at 18:30 IST
                </p>
              </div>
              <Switch id="automatic-draws" defaultChecked />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-slate-500">
                  Send email notifications to winners after each draw
                </p>
              </div>
              <Switch id="email-notifications" defaultChecked />
            </div>
            
            <Separator />
            
            <div className="space-y-0.5">
              <Label>Default Prize Amount</Label>
              <p className="text-sm text-slate-500">
                The amount awarded to winners for each draw. Changes will apply to new draws.
              </p>
              <PrizeAmountManager currentAmount={currentPrizeAmount} />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>
            Platform configuration and maintenance options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                <p className="text-sm text-slate-500">
                  Put the platform in maintenance mode, blocking all user access
                </p>
              </div>
              <Switch id="maintenance-mode" />
            </div>
            
            <Separator />
            
            <div className="space-y-0.5">
              <Label>Database</Label>
              <p className="text-sm text-slate-500">
                Manage database backup and restoration
              </p>
              <div className="flex space-x-2 mt-2">
                <button className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 rounded border transition-colors">
                  Backup Database
                </button>
                <button className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 rounded border transition-colors">
                  Restore
                </button>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-0.5">
              <Label>Platform Cache</Label>
              <p className="text-sm text-slate-500">
                Clear platform cache to ensure all users see the latest data
              </p>
              <div className="mt-2">
                <button className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 rounded border transition-colors">
                  Clear Cache
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 