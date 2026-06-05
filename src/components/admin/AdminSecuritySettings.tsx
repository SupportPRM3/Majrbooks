import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Shield,
  Lock,
  Key,
  Clock,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminSecuritySettingsProps {
  onBackToOverview?: () => void;
}

const AdminSecuritySettings = ({ onBackToOverview }: AdminSecuritySettingsProps) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    twoFactorRequired: true,
    autoLogoutMinutes: 15,
    passwordMinLength: 12,
    passwordRequireSpecial: true,
    passwordRequireNumbers: true,
    passwordRequireUppercase: true,
    passwordExpiryDays: 90,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 30,
    sessionTimeout: true,
  });

  const handleSaveSettings = () => {
    toast({
      title: "Security settings updated",
      description: "Your security configuration has been saved",
    });
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      {onBackToOverview && (
        <Button variant="outline" size="sm" onClick={onBackToOverview}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Overview
        </Button>
      )}

      {/* Security Status */}
      <Card className="border-green-500/50 bg-green-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Security Status: Strong
          </CardTitle>
          <CardDescription>
            All recommended security measures are enabled
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Require 2FA for all administrator accounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require 2FA for Administrators</Label>
              <p className="text-sm text-muted-foreground">
                All admin accounts must use two-factor authentication
              </p>
            </div>
            <Switch
              checked={settings.twoFactorRequired}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, twoFactorRequired: checked })
              }
            />
          </div>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Recommended</AlertTitle>
            <AlertDescription>
              Two-factor authentication significantly reduces the risk of unauthorized access.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Password Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Password Policy
          </CardTitle>
          <CardDescription>
            Configure password requirements for all users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minLength">Minimum Password Length</Label>
              <Input
                id="minLength"
                type="number"
                value={settings.passwordMinLength}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    passwordMinLength: parseInt(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDays">Password Expiry (Days)</Label>
              <Input
                id="expiryDays"
                type="number"
                value={settings.passwordExpiryDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    passwordExpiryDays: parseInt(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Require Special Characters (!@#$%)</Label>
              <Switch
                checked={settings.passwordRequireSpecial}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, passwordRequireSpecial: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Require Numbers</Label>
              <Switch
                checked={settings.passwordRequireNumbers}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, passwordRequireNumbers: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Require Uppercase Letters</Label>
              <Switch
                checked={settings.passwordRequireUppercase}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, passwordRequireUppercase: checked })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Session Management
          </CardTitle>
          <CardDescription>
            Configure automatic logout and session timeouts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Logout on Inactivity</Label>
              <p className="text-sm text-muted-foreground">
                Automatically sign out after period of inactivity
              </p>
            </div>
            <Switch
              checked={settings.sessionTimeout}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, sessionTimeout: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="autoLogout">Inactivity Timeout (Minutes)</Label>
            <Input
              id="autoLogout"
              type="number"
              value={settings.autoLogoutMinutes}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  autoLogoutMinutes: parseInt(e.target.value),
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Login Attempts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Brute Force Protection
          </CardTitle>
          <CardDescription>
            Protect against unauthorized login attempts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="maxAttempts">Max Login Attempts</Label>
              <Input
                id="maxAttempts"
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxLoginAttempts: parseInt(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lockout">Lockout Duration (Minutes)</Label>
              <Input
                id="lockout"
                type="number"
                value={settings.lockoutDurationMinutes}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    lockoutDurationMinutes: parseInt(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <Alert variant="destructive" className="bg-destructive/10 border-destructive/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Accounts will be temporarily locked after {settings.maxLoginAttempts} failed
              login attempts for {settings.lockoutDurationMinutes} minutes.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Save Security Settings
        </Button>
      </div>
    </div>
  );
};

export default AdminSecuritySettings;
