import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Admin Settings | Social Lottery",
  description: "Admin settings for the social lottery platform",
};

export default function AdminSettingsPage() {
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
                The amount awarded to winners for each draw
              </p>
              <div className="flex items-center mt-2">
                <div className="border rounded-md px-3 py-2 w-40">
                  <div className="flex items-center">
                    <span className="text-slate-500 mr-1">$</span>
                    <span className="font-medium">50.00</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="ml-2">
                  Change
                </Button>
              </div>
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
                <Button variant="outline" size="sm">
                  Backup Database
                </Button>
                <Button variant="outline" size="sm">
                  Restore
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-0.5">
              <Label>Platform Cache</Label>
              <p className="text-sm text-slate-500">
                Clear platform cache to ensure all users see the latest data
              </p>
              <div className="mt-2">
                <Button variant="outline" size="sm">
                  Clear Cache
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 