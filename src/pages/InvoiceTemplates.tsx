import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileText, Edit, Trash2, Copy } from "lucide-react";
import { InvoiceTemplateBuilder } from "@/components/InvoiceTemplateBuilder";

interface Template {
  id: string;
  name: string;
  business_name: string;
  primary_color: string;
  is_default: boolean;
  created_at: string;
}

const InvoiceTemplates = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>();

  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user]);

  const fetchTemplates = async () => {
    try {
      const { data } = await supabase
        .from("invoice_templates")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (data) setTemplates(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("invoice_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Template deleted",
        description: "Invoice template removed successfully.",
      });

      fetchTemplates();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleDuplicate = async (template: Template) => {
    try {
      const { error } = await supabase
        .from("invoice_templates")
        .insert({
          user_id: user?.id,
          name: `${template.name} (Copy)`,
          business_name: template.business_name,
          primary_color: template.primary_color,
        });

      if (error) throw error;

      toast({
        title: "Template duplicated",
        description: "Invoice template copied successfully.",
      });

      fetchTemplates();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleCreateNew = () => {
    setSelectedTemplate(undefined);
    setOpen(true);
  };

  const handleEdit = (templateId: string) => {
    setSelectedTemplate(templateId);
    setOpen(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Invoice Templates</h1>
            <p className="text-muted-foreground">
              Create customizable invoice templates with your branding
            </p>
          </div>

          <Button onClick={handleCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Template
          </Button>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedTemplate ? "Edit Template" : "Create New Template"}
              </DialogTitle>
            </DialogHeader>
            <InvoiceTemplateBuilder
              templateId={selectedTemplate}
              onSave={() => {
                setOpen(false);
                fetchTemplates();
              }}
            />
          </DialogContent>
        </Dialog>

        {templates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                No templates yet. Create your first invoice template!
              </p>
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {template.business_name || "No business name"}
                      </p>
                    </div>
                    {template.is_default && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: template.primary_color }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {template.primary_color}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(template.id)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(template)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default InvoiceTemplates;
