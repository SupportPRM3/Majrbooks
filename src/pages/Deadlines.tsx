import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface Deadline {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  category: string;
  status: "upcoming" | "urgent" | "overdue";
}

const deadlines: Deadline[] = [
  {
    id: 1,
    title: "Q2 Estimated Tax Payment",
    description: "Federal estimated income tax payment for Q2",
    dueDate: "2026-06-16",
    category: "Federal Tax",
    status: "overdue",
  },
  {
    id: 2,
    title: "Form 941 – Employer's Quarterly Return",
    description: "Quarterly payroll tax return for Q2",
    dueDate: "2026-07-31",
    category: "Payroll Tax",
    status: "urgent",
  },
  {
    id: 3,
    title: "Q3 Estimated Tax Payment",
    description: "Federal estimated income tax payment for Q3",
    dueDate: "2026-09-15",
    category: "Federal Tax",
    status: "upcoming",
  },
  {
    id: 4,
    title: "Form 941 – Employer's Quarterly Return",
    description: "Quarterly payroll tax return for Q3",
    dueDate: "2026-10-31",
    category: "Payroll Tax",
    status: "upcoming",
  },
  {
    id: 5,
    title: "Q4 Estimated Tax Payment",
    description: "Federal estimated income tax payment for Q4",
    dueDate: "2026-01-15",
    category: "Federal Tax",
    status: "upcoming",
  },
  {
    id: 6,
    title: "W-2 / 1099-NEC Distribution",
    description: "Distribute W-2s to employees and 1099-NECs to contractors",
    dueDate: "2027-01-31",
    category: "Year-End",
    status: "upcoming",
  },
  {
    id: 7,
    title: "Partnership & S-Corp Returns (Form 1065 / 1120-S)",
    description: "Federal tax return filing deadline",
    dueDate: "2027-03-15",
    category: "Business Tax",
    status: "upcoming",
  },
  {
    id: 8,
    title: "Individual & C-Corp Returns (Form 1040 / 1120)",
    description: "Federal tax return filing deadline",
    dueDate: "2027-04-15",
    category: "Business Tax",
    status: "upcoming",
  },
];

const statusConfig = {
  overdue: { label: "Overdue", color: "destructive", icon: AlertCircle, rowClass: "border-l-4 border-l-destructive" },
  urgent: { label: "Due Soon", color: "secondary", icon: Clock, rowClass: "border-l-4 border-l-yellow-500" },
  upcoming: { label: "Upcoming", color: "outline", icon: CheckCircle2, rowClass: "" },
} as const;

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

const Deadlines = () => {
  const overdue = deadlines.filter((d) => d.status === "overdue");
  const urgent = deadlines.filter((d) => d.status === "urgent");
  const upcoming = deadlines.filter((d) => d.status === "upcoming");

  const renderSection = (title: string, items: Deadline[], emptyMsg: string) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{emptyMsg}</p>
        ) : (
          <div className="space-y-3">
            {items.map((d) => {
              const cfg = statusConfig[d.status];
              const Icon = cfg.icon;
              return (
                <div
                  key={d.id}
                  className={`flex items-start justify-between p-4 rounded-lg bg-muted/40 ${cfg.rowClass}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{d.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{d.description}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{formatDate(d.dueDate)}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{d.category}</Badge>
                      </div>
                    </div>
                  </div>
                  <Badge variant={cfg.color as any} className="shrink-0 ml-4">{cfg.label}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Deadlines</h1>
          <p className="text-muted-foreground">Upcoming tax filing and compliance deadlines</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overdue.length}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{urgent.length}</p>
                <p className="text-xs text-muted-foreground">Due Soon</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcoming.length}</p>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {renderSection("Overdue", overdue, "No overdue deadlines.")}
        {renderSection("Due Soon", urgent, "Nothing due soon.")}
        {renderSection("Upcoming", upcoming, "No upcoming deadlines.")}
      </div>
    </Layout>
  );
};

export default Deadlines;
