import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, FileText } from "lucide-react";

interface Client {
  id: string;
  client_name: string;
  status: string;
}

const MultiEntity = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadClients();
  }, [user]);

  const loadClients = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase.from("clients").select("id, client_name, status").eq("user_id", user.id).order("created_at", { ascending: false });
      setClients(data || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Multi-entity</h1>
            <p className="text-muted-foreground mt-1">Group related clients for consolidated reporting and management</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90">+ Create Group</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Entities</p><p className="text-2xl font-bold mt-1">{clients.length}</p></div><div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><Users className="h-5 w-5 text-blue-600" /></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Entity Groups</p><p className="text-2xl font-bold mt-1">0</p></div><div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-green-600" /></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Consolidated Reports</p><p className="text-2xl font-bold mt-1">0</p></div><div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"><FileText className="h-5 w-5 text-purple-600" /></div></div></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entity Groups</CardTitle>
            <p className="text-sm text-muted-foreground">Group related entities — parent companies, subsidiaries — and run consolidated reports.</p>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-sm font-medium mb-1">No entity groups yet</p>
              <p className="text-xs text-muted-foreground mb-4">Create a group to link related clients and run consolidated reports across them.</p>
              <Button variant="outline" onClick={() => navigate("/financial-planning")}>Go to Financial Planning</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">All Entities</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Entity Name</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Type</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Group</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="p-12 text-center"><div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></td></tr>
                  ) : clients.length === 0 ? (
                    <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">No clients added yet.</td></tr>
                  ) : clients.map((client) => (
                    <tr key={client.id} className="border-b border-border hover:bg-accent/50">
                      <td className="p-3"><div className="font-medium text-sm">{client.client_name}</div></td>
                      <td className="p-3"><span className="text-sm text-muted-foreground">Business</span></td>
                      <td className="p-3"><Badge variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 text-xs">Ungrouped</Badge></td>
                      <td className="p-3"><Badge variant="secondary" className={`text-xs ${client.status === "active" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-gray-100 text-gray-700"}`}>{client.status}</Badge></td>
                      <td className="p-3"><Button variant="ghost" size="sm" onClick={() => navigate(`/client/${client.id}`)}>View</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MultiEntity;
