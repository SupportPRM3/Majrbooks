import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Landmark, AlertCircle, Link2Off } from "lucide-react";
import { toast } from "sonner";

interface BankAccount {
  id: string;
  institution_name: string;
  account_name: string;
  account_number_last4: string | null;
  balance: number;
  status: string;
  last_synced: string | null;
}

interface ClientBankingCellProps {
  clientId: string;
  bankAccounts: BankAccount[];
  onConnectBank: (clientId: string) => void;
}

export const ClientBankingCell = ({ clientId, bankAccounts, onConnectBank }: ClientBankingCellProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getStatus = () => {
    if (bankAccounts.length === 0) return "no_bank";
    const needsReconnect = bankAccounts.some(acc => acc.status === "needs_reconnect");
    if (needsReconnect) return "needs_reconnect";
    return "connected";
  };

  const status = getStatus();
  const totalBalance = bankAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  const getStatusDisplay = () => {
    switch (status) {
      case "connected":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 cursor-pointer hover:bg-green-100">
            <Landmark className="h-3 w-3 mr-1" />
            ${totalBalance.toLocaleString()}
          </Badge>
        );
      case "needs_reconnect":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 cursor-pointer hover:bg-yellow-100">
            <AlertCircle className="h-3 w-3 mr-1" />
            Reconnect
          </Badge>
        );
      default:
        return (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-primary hover:text-primary/80 p-0 h-auto"
            onClick={(e) => {
              e.stopPropagation();
              onConnectBank(clientId);
            }}
          >
            <Link2Off className="h-3 w-3 mr-1" />
            Connect Bank
          </Button>
        );
    }
  };

  return (
    <>
      <div 
        className="cursor-pointer"
        onClick={() => bankAccounts.length > 0 && setIsModalOpen(true)}
      >
        {getStatusDisplay()}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5" />
              Bank Accounts
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {bankAccounts.map((account) => (
              <div key={account.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{account.institution_name}</p>
                    <p className="text-sm text-muted-foreground">{account.account_name}</p>
                    {account.account_number_last4 && (
                      <p className="text-xs text-muted-foreground">****{account.account_number_last4}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${account.balance.toLocaleString()}</p>
                    <Badge 
                      variant="outline" 
                      className={account.status === "connected" 
                        ? "bg-green-50 text-green-700 border-green-200" 
                        : "bg-yellow-50 text-yellow-700 border-yellow-200"
                      }
                    >
                      {account.status === "connected" ? "Connected" : "Needs Reconnect"}
                    </Badge>
                  </div>
                </div>
                {account.last_synced && (
                  <p className="text-xs text-muted-foreground">
                    Last synced: {new Date(account.last_synced).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
            {bankAccounts.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No bank accounts connected</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
