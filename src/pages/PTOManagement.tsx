import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import PTOBalanceCard from "@/components/pto/PTOBalanceCard";
import PTORequestsTable from "@/components/pto/PTORequestsTable";
import CreatePTORequestDialog from "@/components/pto/CreatePTORequestDialog";

export default function PTOManagement() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("status", "active")
        .order("last_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: ptoBalances } = useQuery({
    queryKey: ["pto_balances"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pto_balances")
        .select(`
          *,
          employees:employee_id (
            first_name,
            last_name
          )
        `)
        .order("employee_id");
      if (error) throw error;
      return data;
    },
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">PTO Management</h1>
            <p className="text-muted-foreground">
              Manage paid time off requests and balances
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Request Time Off
          </Button>
        </div>

        <Tabs defaultValue="balances" className="w-full">
          <TabsList>
            <TabsTrigger value="balances">PTO Balances</TabsTrigger>
            <TabsTrigger value="requests">Time Off Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="balances" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {employees?.map((employee) => (
                <PTOBalanceCard
                  key={employee.id}
                  employee={employee}
                  balances={ptoBalances?.filter(
                    (b) => b.employee_id === employee.id
                  )}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="requests" className="mt-6">
            <PTORequestsTable />
          </TabsContent>
        </Tabs>

        <CreatePTORequestDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          employees={employees || []}
        />
      </div>
    </Layout>
  );
}
