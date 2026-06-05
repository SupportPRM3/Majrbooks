import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, FileText, Users as UsersIcon, ChevronLeft, ChevronRight, X, Plus } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import TimerWidget from "@/components/time-tracking/TimerWidget";
import ManualTimeEntryDialog from "@/components/time-tracking/ManualTimeEntryDialog";
import ConvertTimeToInvoiceDialog from "@/components/time-tracking/ConvertTimeToInvoiceDialog";
import TimeEntriesTable from "@/components/time-tracking/TimeEntriesTable";

export function TimeTrackingTab() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"day" | "week" | "month" | "all">("day");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [convertToInvoiceOpen, setConvertToInvoiceOpen] = useState(false);
  const [showPromoCard, setShowPromoCard] = useState(true);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["time_entries"] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Time Tracking</h2>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setManualEntryOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Log Time
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => setConvertToInvoiceOpen(true)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate Invoice
          </Button>
        </div>
      </div>

      {/* Timer Widget */}
      <TimerWidget onTimerStop={handleRefresh} />

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg w-fit">
          <Button
            variant={viewMode === "day" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("day")}
            className={viewMode === "day" ? "bg-primary text-primary-foreground" : ""}
          >
            Day
          </Button>
          <Button
            variant={viewMode === "week" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("week")}
          >
            Week
          </Button>
          <Button
            variant={viewMode === "month" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("month")}
          >
            Month
          </Button>
          <Button
            variant={viewMode === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("all")}
          >
            All
          </Button>
        </div>
        
        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate(prev => subDays(prev, viewMode === "week" ? 7 : viewMode === "month" ? 30 : 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium min-w-[140px] text-center">{format(currentDate, "MMM d, yyyy")}</span>
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate(prev => addDays(prev, viewMode === "week" ? 7 : viewMode === "month" ? 30 : 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>
      </div>

      {/* Promotional Card */}
      {showPromoCard && (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold text-blue-700 dark:text-blue-400">
                Track Time and Never Lose Another Billable Minute
              </h2>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowPromoCard(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center">
                <div className="bg-blue-500 rounded-full p-4 mb-3">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold mb-1">Get Paid for All Your Time</h3>
                <p className="text-sm text-muted-foreground">
                  Track time with the timer above, or log time manually with the Log Time button.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="bg-yellow-500 rounded-full p-4 mb-3">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold mb-1">Convert Time into Invoices</h3>
                <p className="text-sm text-muted-foreground">
                  Click Generate Invoice to convert billable hours into client invoices.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="bg-pink-500 rounded-full p-4 mb-3">
                  <UsersIcon className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold mb-1">Track Everything for Everyone</h3>
                <p className="text-sm text-muted-foreground">
                  Assign time to projects and clients to stay on top of billable hours.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Time Entries Table */}
      <TimeEntriesTable viewMode={viewMode} selectedDate={currentDate} />

      {/* Dialogs */}
      <ManualTimeEntryDialog 
        open={manualEntryOpen} 
        onOpenChange={setManualEntryOpen}
        onSuccess={handleRefresh}
      />
      <ConvertTimeToInvoiceDialog 
        open={convertToInvoiceOpen} 
        onOpenChange={setConvertToInvoiceOpen}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
