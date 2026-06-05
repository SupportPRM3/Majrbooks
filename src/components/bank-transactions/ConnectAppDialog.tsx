import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CheckCircle2,
  Shield,
  RefreshCw,
  Loader2,
  ArrowRight,
  Link as LinkIcon,
} from "lucide-react";

export interface AppInfo {
  id: string;
  name: string;
  icon: string;
  description: string;
  authFields: { label: string; placeholder: string; type: string }[];
}

const appConfigs: Record<string, AppInfo> = {
  shopify: {
    id: "shopify",
    name: "Shopify",
    icon: "🛍️",
    description: "Import your Shopify store transactions automatically.",
    authFields: [
      { label: "Store URL", placeholder: "your-store.myshopify.com", type: "text" },
      { label: "API Key", placeholder: "Enter your Shopify API key", type: "password" },
    ],
  },
  paypal: {
    id: "paypal",
    name: "PayPal",
    icon: "💳",
    description: "Sync your PayPal payments and transactions.",
    authFields: [
      { label: "Client ID", placeholder: "Enter PayPal Client ID", type: "text" },
      { label: "Client Secret", placeholder: "Enter PayPal Client Secret", type: "password" },
    ],
  },
  square: {
    id: "square",
    name: "Square",
    icon: "◼️",
    description: "Import Square POS transactions seamlessly.",
    authFields: [
      { label: "Access Token", placeholder: "Enter Square Access Token", type: "password" },
      { label: "Location ID", placeholder: "Enter Location ID (optional)", type: "text" },
    ],
  },
  stripe: {
    id: "stripe",
    name: "Stripe",
    icon: "💰",
    description: "Sync Stripe payments and subscriptions.",
    authFields: [
      { label: "API Key", placeholder: "Enter Stripe Secret Key (sk_...)", type: "password" },
    ],
  },
  quickbooks: {
    id: "quickbooks",
    name: "QuickBooks",
    icon: "📊",
    description: "Import transactions from QuickBooks Online.",
    authFields: [
      { label: "Client ID", placeholder: "Enter QuickBooks Client ID", type: "text" },
      { label: "Client Secret", placeholder: "Enter QuickBooks Client Secret", type: "password" },
    ],
  },
  amazon: {
    id: "amazon",
    name: "Amazon Business",
    icon: "📦",
    description: "Import your Amazon Business purchases.",
    authFields: [
      { label: "Email", placeholder: "Enter your Amazon Business email", type: "email" },
      { label: "Access Key", placeholder: "Enter your access key", type: "password" },
    ],
  },
};

type Step = "intro" | "auth" | "connecting" | "success";

interface ConnectAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appId: string | null;
  onConnected: (appId: string) => void;
}

export function ConnectAppDialog({
  open,
  onOpenChange,
  appId,
  onConnected,
}: ConnectAppDialogProps) {
  const [step, setStep] = useState<Step>("intro");
  const [formData, setFormData] = useState<Record<string, string>>({});

  const app = appId ? appConfigs[appId] : null;

  const handleClose = () => {
    setStep("intro");
    setFormData({});
    onOpenChange(false);
  };

  const handleStartAuth = () => {
    setStep("auth");
  };

  const handleConnect = async () => {
    if (!app) return;

    // Validate all fields are filled
    const hasEmptyFields = app.authFields.some(
      (field) => !formData[field.label]?.trim()
    );
    if (hasEmptyFields) {
      toast.error("Please fill in all required fields");
      return;
    }

    setStep("connecting");

    // Simulate connection process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setStep("success");
    toast.success(`${app.name} connected successfully!`);
  };

  const handleFinish = () => {
    if (appId) {
      onConnected(appId);
    }
    handleClose();
  };

  if (!app) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-2xl">{app.icon}</span>
            Connect {app.name}
          </DialogTitle>
        </DialogHeader>

        {step === "intro" && (
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <p className="text-muted-foreground">{app.description}</p>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Secure Connection</p>
                    <p className="text-xs text-muted-foreground">
                      Your credentials are encrypted and never stored in plain text
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <RefreshCw className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Auto-Sync</p>
                    <p className="text-xs text-muted-foreground">
                      Transactions sync automatically every few hours
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleStartAuth}>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "auth" && (
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              {app.authFields.map((field) => (
                <div key={field.label} className="space-y-2">
                  <Label htmlFor={field.label}>{field.label}</Label>
                  <Input
                    id={field.label}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={formData[field.label] || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        [field.label]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Need help finding your credentials?{" "}
              <a href="#" className="text-primary hover:underline">
                View setup guide
              </a>
            </p>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("intro")}>
                Back
              </Button>
              <Button onClick={handleConnect}>
                <LinkIcon className="h-4 w-4 mr-2" />
                Connect
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "connecting" && (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <div className="text-center">
              <p className="font-medium">Connecting to {app.name}...</p>
              <p className="text-sm text-muted-foreground">
                Please wait while we establish a secure connection
              </p>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="py-8 flex flex-col items-center justify-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-medium text-lg">Successfully Connected!</p>
              <p className="text-sm text-muted-foreground">
                {app.name} is now linked to your account
              </p>
            </div>
            <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
              Syncing transactions...
            </Badge>

            <DialogFooter className="w-full pt-4">
              <Button onClick={handleFinish} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export { appConfigs };
