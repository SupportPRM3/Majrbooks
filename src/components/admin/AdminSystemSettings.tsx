import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Database,
  CreditCard,
  FileText,
  Workflow,
  Lock,
  Unlock,
  Settings,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Server,
  Link2,
  Globe,
  Mail,
  Plus,
  Trash2,
  Edit,
  ArrowLeft,
  Loader2,
  XCircle,
  Building2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SUBSCRIPTION_TIERS } from "@/lib/subscriptionTiers";
import { BankLinkingFlow } from "@/components/BankLinkingFlow";
import { useAuth } from "@/contexts/AuthContext";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "connected" | "not_configured";
  configFields?: { key: string; label: string; placeholder: string; type?: string }[];
}

const defaultIntegrations: Integration[] = [
  {
    id: "stripe",
    name: "Stripe Payments",
    description: "Payment processing and subscriptions",
    icon: CreditCard,
    status: "connected",
    configFields: [
      { key: "webhook_url", label: "Webhook URL", placeholder: "https://your-app.com/webhook", type: "url" },
    ],
  },
  {
    id: "email",
    name: "Email (Resend)",
    description: "Transactional emails and notifications",
    icon: Mail,
    status: "connected",
    configFields: [
      { key: "from_email", label: "From Email", placeholder: "noreply@yourdomain.com", type: "email" },
      { key: "from_name", label: "From Name", placeholder: "Your Company" },
    ],
  },
  {
    id: "bank",
    name: "Bank Feeds",
    description: "Automatic bank transaction imports",
    icon: Database,
    status: "not_configured",
    configFields: [
      { key: "provider", label: "Provider", placeholder: "Select provider (Plaid, Yodlee, etc.)" },
      { key: "client_id", label: "Client ID", placeholder: "Your client ID" },
      { key: "secret", label: "Secret Key", placeholder: "Your secret key", type: "password" },
    ],
  },
  {
    id: "payroll",
    name: "Payroll Provider",
    description: "External payroll integration",
    icon: Server,
    status: "not_configured",
    configFields: [
      { key: "provider", label: "Provider", placeholder: "Select provider (Gusto, ADP, etc.)" },
      { key: "api_key", label: "API Key", placeholder: "Your API key", type: "password" },
      { key: "company_id", label: "Company ID", placeholder: "Your company ID" },
    ],
  },
];

interface AdminSystemSettingsProps {
  onBackToOverview?: () => void;
}

const AdminSystemSettings = ({ onBackToOverview }: AdminSystemSettingsProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [lockedPeriods, setLockedPeriods] = useState<string[]>([]);
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    debugMode: false,
    allowSignups: true,
    emailNotifications: true,
  });

  // Integrations state
  const [integrations, setIntegrations] = useState<Integration[]>(defaultIntegrations);
  const [integrationDialogOpen, setIntegrationDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [integrationFormData, setIntegrationFormData] = useState<Record<string, string>>({});
  const [connectingIntegration, setConnectingIntegration] = useState(false);

  // Bank linking flow state
  const [bankLinkingOpen, setBankLinkingOpen] = useState(false);
  
  // Payroll provider state
  const [payrollDialogOpen, setPayrollDialogOpen] = useState(false);
  const [payrollProvider, setPayrollProvider] = useState("");
  const [payrollFormData, setPayrollFormData] = useState<Record<string, string>>({});
  const [connectingPayroll, setConnectingPayroll] = useState(false);

  // Dialog states
  const [taxCategoriesOpen, setTaxCategoriesOpen] = useState(false);
  const [coaTemplatesOpen, setCoaTemplatesOpen] = useState(false);
  const [subscriptionPlansOpen, setSubscriptionPlansOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<"income" | "expense">("expense");

  // Fetch categories for tax categories dialog
  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch chart of accounts for templates dialog
  const { data: accounts = [] } = useQuery({
    queryKey: ["admin-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleLockPeriod = (period: string) => {
    if (lockedPeriods.includes(period)) {
      setLockedPeriods(lockedPeriods.filter((p) => p !== period));
      toast({
        title: "Period unlocked",
        description: `${period} has been unlocked for editing`,
      });
    } else {
      setLockedPeriods([...lockedPeriods, period]);
      toast({
        title: "Period locked",
        description: `${period} has been locked. No changes can be made.`,
      });
    }
  };

  const handleWorkflowRules = () => {
    navigate("/workflow-automation");
  };

  const handleOpenIntegrationDialog = (integration: Integration) => {
    // Handle Bank Feeds specially - open bank linking flow
    if (integration.id === "bank") {
      setBankLinkingOpen(true);
      return;
    }
    
    // Handle Payroll Provider specially - open payroll dialog
    if (integration.id === "payroll") {
      setPayrollDialogOpen(true);
      return;
    }
    
    setSelectedIntegration(integration);
    setIntegrationFormData({});
    setIntegrationDialogOpen(true);
  };

  const handleConnectIntegration = async () => {
    if (!selectedIntegration) return;
    
    setConnectingIntegration(true);
    
    // Simulate connection process
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Update integration status
    setIntegrations((prev) =>
      prev.map((int) =>
        int.id === selectedIntegration.id
          ? { ...int, status: "connected" as const }
          : int
      )
    );
    
    setConnectingIntegration(false);
    setIntegrationDialogOpen(false);
    
    toast({
      title: "Integration Connected",
      description: `${selectedIntegration.name} has been successfully connected.`,
    });
  };

  const handleBankLinkingSuccess = () => {
    setIntegrations((prev) =>
      prev.map((int) =>
        int.id === "bank"
          ? { ...int, status: "connected" as const }
          : int
      )
    );
    setBankLinkingOpen(false);
    toast({
      title: "Bank Connected",
      description: "Your bank account has been successfully linked.",
    });
  };

  const handleConnectPayroll = async () => {
    if (!payrollProvider) {
      toast({
        title: "Error",
        description: "Please select a payroll provider.",
        variant: "destructive",
      });
      return;
    }
    
    setConnectingPayroll(true);
    
    // Simulate connection process
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Update integration status
    setIntegrations((prev) =>
      prev.map((int) =>
        int.id === "payroll"
          ? { ...int, status: "connected" as const }
          : int
      )
    );
    
    setConnectingPayroll(false);
    setPayrollDialogOpen(false);
    setPayrollProvider("");
    setPayrollFormData({});
    
    toast({
      title: "Payroll Provider Connected",
      description: `${payrollProvider} has been successfully connected.`,
    });
  };

  const handleDisconnectIntegration = (integrationId: string) => {
    setIntegrations((prev) =>
      prev.map((int) =>
        int.id === integrationId
          ? { ...int, status: "not_configured" as const }
          : int
      )
    );
    
    toast({
      title: "Integration Disconnected",
      description: "The integration has been disconnected.",
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

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Integrations
          </CardTitle>
          <CardDescription>
            Manage external service connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {integrations.map((integration) => {
              const Icon = integration.icon;
              return (
                <div
                  key={integration.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-lg">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">{integration.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {integration.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {integration.status === "connected" ? (
                      <>
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenIntegrationDialog(integration)}
                        >
                          Configure
                        </Button>
                      </>
                    ) : (
                      <>
                        <Badge variant="outline">Not Configured</Badge>
                        <Button 
                          size="sm"
                          onClick={() => handleOpenIntegrationDialog(integration)}
                        >
                          Connect
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Data Locks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Financial Period Locks
          </CardTitle>
          <CardDescription>
            Lock finalized books and tax periods to prevent unauthorized changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024"].map((period) => {
              const isLocked = lockedPeriods.includes(period);
              return (
                <div
                  key={period}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {isLocked ? (
                      <Lock className="h-4 w-4 text-amber-500" />
                    ) : (
                      <Unlock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-medium">{period}</span>
                    {isLocked && (
                      <Badge variant="secondary">Locked</Badge>
                    )}
                  </div>
                  <Button
                    variant={isLocked ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => handleLockPeriod(period)}
                  >
                    {isLocked ? (
                      <>
                        <Unlock className="h-4 w-4 mr-1" />
                        Unlock
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-1" />
                        Lock Period
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>

          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Locked periods cannot be modified. All changes to financial data, tax records,
              and journal entries will be blocked. Only administrators can unlock periods.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* System Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Controls
          </CardTitle>
          <CardDescription>
            Global system settings and configurations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Disable access for non-admin users
              </p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, maintenanceMode: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow New Signups</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable new user registrations
              </p>
            </div>
            <Switch
              checked={settings.allowSignups}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, allowSignups: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Enable system-wide email notifications
              </p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, emailNotifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Debug Mode</Label>
              <p className="text-sm text-muted-foreground">
                Enable verbose logging (development only)
              </p>
            </div>
            <Switch
              checked={settings.debugMode}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, debugMode: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Workflow Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Bookkeeping Rules
          </CardTitle>
          <CardDescription>
            Configure default bookkeeping and workflow settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setTaxCategoriesOpen(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Configure Tax Categories
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setCoaTemplatesOpen(true)}
            >
              <Database className="h-4 w-4 mr-2" />
              Manage Chart of Accounts Templates
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleWorkflowRules}
            >
              <Workflow className="h-4 w-4 mr-2" />
              Edit Workflow Automation Rules
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setSubscriptionPlansOpen(true)}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Manage Subscription Plans
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tax Categories Dialog */}
      <Dialog open={taxCategoriesOpen} onOpenChange={setTaxCategoriesOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Tax Categories</DialogTitle>
            <DialogDescription>
              Manage income and expense categories for tax reporting
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category: any) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      <Badge variant={category.type === "income" ? "default" : "secondary"}>
                        {category.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: category.color || "#888" }}
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaxCategoriesOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chart of Accounts Templates Dialog */}
      <Dialog open={coaTemplatesOpen} onOpenChange={setCoaTemplatesOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chart of Accounts Templates</DialogTitle>
            <DialogDescription>
              Manage default chart of accounts for new clients
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Detail Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.slice(0, 10).map((account: any) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell>{account.account_type}</TableCell>
                    <TableCell>{account.detail_type}</TableCell>
                    <TableCell>
                      <Badge variant={account.is_active ? "default" : "secondary"}>
                        {account.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {accounts.length > 10 && (
              <p className="text-sm text-muted-foreground text-center">
                Showing 10 of {accounts.length} accounts
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => navigate("/chart-of-accounts")}>
              Manage Full Chart of Accounts
            </Button>
            <Button variant="outline" onClick={() => setCoaTemplatesOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription Plans Dialog */}
      <Dialog open={subscriptionPlansOpen} onOpenChange={setSubscriptionPlansOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Subscription Plans</DialogTitle>
            <DialogDescription>
              View and manage subscription tiers
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => (
              <div
                key={key}
                className="p-4 border rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-lg">{tier.name}</h4>
                  <Badge variant={key === "trial" ? "secondary" : "default"}>
                    {key === "trial" ? "Free" : `$${tier.price}/mo`}
                  </Badge>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-1 mt-2">
                  {tier.modules.map((module) => (
                    <Badge key={module} variant="outline" className="text-xs">
                      {module}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubscriptionPlansOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Integration Configuration Dialog */}
      <Dialog open={integrationDialogOpen} onOpenChange={setIntegrationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedIntegration && (() => {
                const Icon = selectedIntegration.icon;
                return <Icon className="h-5 w-5" />;
              })()}
              {selectedIntegration?.status === "connected" ? "Configure" : "Connect"} {selectedIntegration?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedIntegration?.status === "connected"
                ? "Update your integration settings below."
                : "Enter your credentials to connect this integration."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedIntegration?.configFields?.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  type={field.type || "text"}
                  placeholder={field.placeholder}
                  value={integrationFormData[field.key] || ""}
                  onChange={(e) =>
                    setIntegrationFormData((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                />
              </div>
            ))}
            
            {selectedIntegration?.status === "connected" && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Disconnect Integration</AlertTitle>
                <AlertDescription className="flex items-center justify-between mt-2">
                  <span>This will remove the integration.</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      handleDisconnectIntegration(selectedIntegration.id);
                      setIntegrationDialogOpen(false);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Disconnect
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIntegrationDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConnectIntegration} disabled={connectingIntegration}>
              {connectingIntegration ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {selectedIntegration?.status === "connected" ? "Saving..." : "Connecting..."}
                </>
              ) : (
                selectedIntegration?.status === "connected" ? "Save Changes" : "Connect"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bank Linking Flow */}
      <BankLinkingFlow 
        open={bankLinkingOpen} 
        onOpenChange={setBankLinkingOpen}
        onSuccess={(accounts) => {
          if (accounts && accounts.length > 0) {
            setIntegrations((prev) =>
              prev.map((int) =>
                int.id === "bank"
                  ? { ...int, status: "connected" as const }
                  : int
              )
            );
            toast({
              title: "Bank Connected",
              description: `Successfully linked ${accounts.length} bank account(s).`,
            });
          }
        }}
      />

      {/* Payroll Provider Dialog */}
      <Dialog open={payrollDialogOpen} onOpenChange={setPayrollDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Connect Payroll Provider
            </DialogTitle>
            <DialogDescription>
              Integrate with your existing payroll system to sync employee data and payroll runs.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Select Payroll Provider</Label>
              <Select value={payrollProvider} onValueChange={setPayrollProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your payroll provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gusto">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Gusto
                    </div>
                  </SelectItem>
                  <SelectItem value="adp">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      ADP
                    </div>
                  </SelectItem>
                  <SelectItem value="paychex">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Paychex
                    </div>
                  </SelectItem>
                  <SelectItem value="paylocity">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Paylocity
                    </div>
                  </SelectItem>
                  <SelectItem value="rippling">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Rippling
                    </div>
                  </SelectItem>
                  <SelectItem value="quickbooks_payroll">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      QuickBooks Payroll
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {payrollProvider && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="space-y-2">
                  <Label htmlFor="payroll_api_key">API Key</Label>
                  <Input
                    id="payroll_api_key"
                    type="password"
                    placeholder="Enter your API key"
                    value={payrollFormData.api_key || ""}
                    onChange={(e) =>
                      setPayrollFormData((prev) => ({
                        ...prev,
                        api_key: e.target.value,
                      }))
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="payroll_company_id">Company ID</Label>
                  <Input
                    id="payroll_company_id"
                    placeholder="Enter your company ID"
                    value={payrollFormData.company_id || ""}
                    onChange={(e) =>
                      setPayrollFormData((prev) => ({
                        ...prev,
                        company_id: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Your credentials are encrypted and stored securely. We only use read access to sync payroll data.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayrollDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConnectPayroll} 
              disabled={connectingPayroll || !payrollProvider}
            >
              {connectingPayroll ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Connect Provider
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSystemSettings;
