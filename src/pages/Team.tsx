import { useState } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RolesTab } from "@/components/team/RolesTab";
import { UsersTab } from "@/components/team/UsersTab";
import { CertificationsTab } from "@/components/team/CertificationsTab";
import { TimeTrackingTab } from "@/components/team/TimeTrackingTab";
import { toast } from "@/hooks/use-toast";

const Team = () => {
  const [activeTab, setActiveTab] = useState("users");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const tabNames: Record<string, string> = {
      users: "Users",
      roles: "Roles",
      certifications: "Certifications",
      "time-tracking": "Time Tracking"
    };
    toast({ title: `Switched to ${tabNames[value]} tab` });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Team</h1>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto p-0">
            <TabsTrigger 
              value="users"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent px-6 py-3"
            >
              Users
            </TabsTrigger>
            <TabsTrigger 
              value="roles"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent px-6 py-3"
            >
              Roles
            </TabsTrigger>
            <TabsTrigger 
              value="certifications"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent px-6 py-3"
            >
              Certifications
            </TabsTrigger>
            <TabsTrigger 
              value="time-tracking"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent px-6 py-3"
            >
              Time Tracking
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="mt-6">
            <UsersTab />
          </TabsContent>
          
          <TabsContent value="roles" className="mt-6">
            <RolesTab />
          </TabsContent>
          
          <TabsContent value="certifications" className="mt-6">
            <CertificationsTab />
          </TabsContent>

          <TabsContent value="time-tracking" className="mt-6">
            <TimeTrackingTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Team;
