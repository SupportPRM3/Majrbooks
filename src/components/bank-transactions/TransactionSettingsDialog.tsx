import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface TransactionSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TransactionSettingsDialog = ({
  open,
  onOpenChange,
}: TransactionSettingsDialogProps) => {
  const [showDescriptions, setShowDescriptions] = useState(true);
  const [showCategories, setShowCategories] = useState(true);
  const [defaultDateRange, setDefaultDateRange] = useState("30");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [compactView, setCompactView] = useState(false);
  const [showRunningBalance, setShowRunningBalance] = useState(true);

  const handleSave = () => {
    // Save settings to localStorage for persistence
    const settings = {
      showDescriptions,
      showCategories,
      defaultDateRange,
      autoRefresh,
      compactView,
      showRunningBalance,
    };
    localStorage.setItem("transactionSettings", JSON.stringify(settings));
    toast.success("Settings saved successfully");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transaction Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Display Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Display Options</h4>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="showDescriptions" className="flex flex-col gap-1">
                <span>Show Descriptions</span>
                <span className="text-xs text-muted-foreground font-normal">
                  Display transaction descriptions in the table
                </span>
              </Label>
              <Switch
                id="showDescriptions"
                checked={showDescriptions}
                onCheckedChange={setShowDescriptions}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showCategories" className="flex flex-col gap-1">
                <span>Show Categories</span>
                <span className="text-xs text-muted-foreground font-normal">
                  Display category badges in the table
                </span>
              </Label>
              <Switch
                id="showCategories"
                checked={showCategories}
                onCheckedChange={setShowCategories}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="compactView" className="flex flex-col gap-1">
                <span>Compact View</span>
                <span className="text-xs text-muted-foreground font-normal">
                  Show more transactions with less spacing
                </span>
              </Label>
              <Switch
                id="compactView"
                checked={compactView}
                onCheckedChange={setCompactView}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showRunningBalance" className="flex flex-col gap-1">
                <span>Show Running Balance</span>
                <span className="text-xs text-muted-foreground font-normal">
                  Display running balance column
                </span>
              </Label>
              <Switch
                id="showRunningBalance"
                checked={showRunningBalance}
                onCheckedChange={setShowRunningBalance}
              />
            </div>
          </div>

          <Separator />

          {/* Behavior Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Behavior</h4>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="defaultDateRange" className="flex flex-col gap-1">
                <span>Default Date Range</span>
                <span className="text-xs text-muted-foreground font-normal">
                  Default filter when loading transactions
                </span>
              </Label>
              <Select value={defaultDateRange} onValueChange={setDefaultDateRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="autoRefresh" className="flex flex-col gap-1">
                <span>Auto-Refresh</span>
                <span className="text-xs text-muted-foreground font-normal">
                  Automatically refresh transactions every 5 minutes
                </span>
              </Label>
              <Switch
                id="autoRefresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
