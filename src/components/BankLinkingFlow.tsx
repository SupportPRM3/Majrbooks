import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Shield, Lock, CheckCircle2, Search, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type BankLinkingStep = "intro" | "select-bank" | "auth" | "select-accounts" | "syncing" | "success";

export interface LinkedBankAccount {
  id: string;
  institution_name: string;
  account_name: string;
  account_type: string;
  account_number_last4: string;
  balance: number;
  status: string;
  last_synced: string;
}

interface BankLinkingFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (accounts: LinkedBankAccount[]) => void;
  clientId?: string;
}

const popularBanks = [
  { id: "chase", name: "Chase", logo: "🏦" },
  { id: "boa", name: "Bank of America", logo: "🏦" },
  { id: "wells", name: "Wells Fargo", logo: "🏦" },
  { id: "citi", name: "Citibank", logo: "🏦" },
  { id: "capital", name: "Capital One", logo: "🏦" },
  { id: "usbank", name: "U.S. Bank", logo: "🏦" },
  { id: "pnc", name: "PNC Bank", logo: "🏦" },
  { id: "truist", name: "Truist", logo: "🏦" },
];

const mockAccounts = [
  { id: "1", name: "Checking Account", type: "checking", balance: 5234.12, accountNumber: "1234" },
  { id: "2", name: "Savings Account", type: "savings", balance: 12450.00, accountNumber: "5678" },
  { id: "3", name: "Credit Card", type: "credit_card", balance: -1234.56, accountNumber: "9012" },
];

export const BankLinkingFlow = ({ open, onOpenChange, onSuccess, clientId }: BankLinkingFlowProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<BankLinkingStep>("intro");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [syncProgress, setSyncProgress] = useState(0);
  const [savedAccounts, setSavedAccounts] = useState<LinkedBankAccount[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = () => {
    const wasSuccess = step === "success";
    setStep("intro");
    setSearchQuery("");
    setSelectedBank("");
    setSelectedAccounts([]);
    setCredentials({ username: "", password: "" });
    setSyncProgress(0);
    onOpenChange(false);
    if (wasSuccess && onSuccess && savedAccounts.length > 0) {
      onSuccess(savedAccounts);
    }
  };

  const handleContinueIntro = () => {
    setStep("select-bank");
  };

  const handleSelectBank = (bankId: string) => {
    setSelectedBank(bankId);
    setStep("auth");
  };

  const handleAuthenticate = () => {
    setStep("select-accounts");
  };

  const saveAccountsToDatabase = async () => {
    if (!user) {
      toast.error("You must be logged in to link bank accounts");
      return false;
    }

    setIsSaving(true);
    const bankName = popularBanks.find(b => b.id === selectedBank)?.name || "Unknown Bank";
    const accountsToSave = mockAccounts.filter(acc => selectedAccounts.includes(acc.id));
    const savedAccountsList: LinkedBankAccount[] = [];

    try {
      for (const account of accountsToSave) {
        const { data, error } = await supabase
          .from("client_bank_accounts")
          .insert({
            client_id: clientId || user.id, // Use clientId if provided, otherwise use user.id as a fallback
            user_id: user.id,
            institution_name: bankName,
            account_name: account.name,
            account_type: account.type,
            account_number_last4: account.accountNumber,
            balance: account.balance,
            status: "connected",
            last_synced: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error("Error saving bank account:", error);
          toast.error(`Failed to link ${account.name}`);
          continue;
        }

        if (data) {
          savedAccountsList.push(data as LinkedBankAccount);
        }
      }

      if (savedAccountsList.length > 0) {
        setSavedAccounts(savedAccountsList);
        toast.success(`Successfully linked ${savedAccountsList.length} account(s)`);
        return true;
      } else {
        toast.error("Failed to link any accounts");
        return false;
      }
    } catch (error) {
      console.error("Error saving accounts:", error);
      toast.error("Failed to link bank accounts");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinueAccounts = async () => {
    setStep("syncing");
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setSyncProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        // Save accounts to database
        saveAccountsToDatabase().then((success) => {
          if (success) {
            setTimeout(() => setStep("success"), 500);
          } else {
            setStep("select-accounts");
            setSyncProgress(0);
          }
        });
      }
    }, 300);
  };

  const handleAccountToggle = (accountId: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]
    );
  };

  const filteredBanks = popularBanks.filter((bank) =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border">
        {/* Step 1: Introduction */}
        {step === "intro" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">
                Securely Connect Your Bank Account
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-6">
              <p className="text-center text-muted-foreground">
                We partner with industry-leading providers to securely link your bank account. This allows MAJR Books to
                automatically sync your transactions for effortless bookkeeping.
              </p>

              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="flex flex-col items-center text-center space-y-2 p-4 rounded-lg bg-muted/50">
                  <Lock className="h-10 w-10 text-primary" />
                  <p className="text-sm font-medium">Your credentials are never stored by MAJR Books</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-2 p-4 rounded-lg bg-muted/50">
                  <Shield className="h-10 w-10 text-primary" />
                  <p className="text-sm font-medium">Industry-leading encryption standards</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button onClick={handleContinueIntro} className="w-full bg-green-600 hover:bg-green-700 h-12 text-base">
                  Continue to Secure Login
                </Button>
                <Button variant="link" className="w-full text-blue-600">
                  Why do we use secure banking partners?
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step 2: Select Bank */}
        {step === "select-bank" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">
                Select Your Financial Institution
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for your bank..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                {filteredBanks.map((bank) => (
                  <button
                    key={bank.id}
                    onClick={() => handleSelectBank(bank.id)}
                    className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-accent hover:border-primary transition-all"
                  >
                    <div className="text-3xl">{bank.logo}</div>
                    <span className="font-medium">{bank.name}</span>
                  </button>
                ))}
              </div>

              <Button variant="outline" onClick={() => setStep("intro")} className="w-full">
                Back
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Authentication */}
        {step === "auth" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">
                Login to Your Bank
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-6">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Building2 className="h-5 w-5" />
                <span>
                  {popularBanks.find((b) => b.id === selectedBank)?.name} Secure Login
                </span>
              </div>

              <div className="space-y-4 p-6 border-2 border-dashed border-muted rounded-lg">
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Enter your online banking credentials
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Username</label>
                    <Input
                      type="text"
                      value={credentials.username}
                      onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                      placeholder="Enter your username"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <Input
                      type="password"
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
                  <Lock className="h-3 w-3" />
                  <span>Your credentials are encrypted and secure</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleAuthenticate}
                  disabled={!credentials.username || !credentials.password}
                  className="w-full bg-green-600 hover:bg-green-700 h-12 text-base"
                >
                  Connect and Share Data
                </Button>
                <Button variant="outline" onClick={() => setStep("select-bank")} className="w-full">
                  Back
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step 4: Select Accounts */}
        {step === "select-accounts" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">
                Select Accounts to Connect
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-6">
              <p className="text-center text-muted-foreground">
                Choose which accounts you'd like to sync with MAJR Books
              </p>

              <div className="space-y-3">
                {mockAccounts.map((account) => (
                  <div
                    key={account.id}
                    className={cn(
                      "flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all",
                      selectedAccounts.includes(account.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-accent"
                    )}
                    onClick={() => handleAccountToggle(account.id)}
                  >
                    <Checkbox
                      checked={selectedAccounts.includes(account.id)}
                      onCheckedChange={() => handleAccountToggle(account.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{account.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {account.type} • ****{account.accountNumber}
                      </div>
                    </div>
                    <div className="font-semibold">${Math.abs(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleContinueAccounts}
                  disabled={selectedAccounts.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700 h-12 text-base"
                >
                  Continue ({selectedAccounts.length} selected)
                </Button>
                <Button variant="outline" onClick={() => setStep("auth")} className="w-full">
                  Back
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step 5: Syncing */}
        {step === "syncing" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">
                Connecting Accounts & Fetching Transactions
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="h-6 w-6 rounded-full bg-primary animate-ping" />
                  </div>
                </div>

                <Progress value={syncProgress} className="w-full max-w-sm" />

                <div className="text-center space-y-2">
                  <p className="text-lg font-medium">Syncing your transactions...</p>
                  <p className="text-sm text-muted-foreground">
                    We are performing the initial sync to bring in your last 90 days of transactions.
                  </p>
                  <p className="text-xs text-muted-foreground mt-4">
                    Please keep this window open. This may take a minute or two.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Step 6: Success */}
        {step === "success" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">
                Success! Your Bank is Connected
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-16 w-16 text-green-600" />
                </div>

                <div className="text-center space-y-2">
                  <p className="text-lg">We are now syncing transactions for:</p>
                  <div className="space-y-1">
                    {savedAccounts.length > 0 ? (
                      savedAccounts.map((acc) => (
                        <div key={acc.id} className="text-sm font-medium">
                          • {acc.account_name} (****{acc.account_number_last4})
                        </div>
                      ))
                    ) : (
                      mockAccounts
                        .filter((acc) => selectedAccounts.includes(acc.id))
                        .map((acc) => (
                          <div key={acc.id} className="text-sm font-medium">
                            • {acc.name} (****{acc.accountNumber})
                          </div>
                        ))
                    )}
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg w-full">
                  <p className="text-sm text-center">
                    <span className="font-semibold">Next step:</span> Review and categorize these transactions on your
                    dashboard
                  </p>
                </div>
              </div>

              <Button onClick={handleClose} className="w-full bg-green-600 hover:bg-green-700 h-12 text-base">
                Go to Transactions
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
