import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Mail, MoreHorizontal, Send, Trash2, UserPlus, Clock, CheckCircle, XCircle, Copy, Link, Pencil } from "lucide-react";
import { format } from "date-fns";

interface Invitation {
  id: string;
  client_email: string;
  client_name: string;
  firm_id: string;
  status: string;
  message: string | null;
  sent_at: string;
  responded_at: string | null;
  expires_at: string | null;
  used_at: string | null;
  invite_token: string | null;
  inviter_business_name: string | null;
}

const ClientInvitations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingInvitation, setEditingInvitation] = useState<Invitation | null>(null);
  const [editName, setEditName] = useState("");
  const [quickFirmId, setQuickFirmId] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [formData, setFormData] = useState({
    client_name: "",
    client_email: "",
    firm_id: "",
    message: "",
  });

  // Auto-populate firm ID with user's ID when component mounts
  useEffect(() => {
    if (user?.id) {
      setQuickFirmId(user.id);
      setFormData(prev => ({ ...prev, firm_id: user.id }));
    }
  }, [user?.id]);

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ["client-invitations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_invitations")
        .select("*")
        .order("sent_at", { ascending: false });

      if (error) throw error;
      return data as Invitation[];
    },
    enabled: !!user,
  });

  const sendInvitationMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Get user profile for business name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, business_name')
        .eq('id', user?.id)
        .single();

      // Generate unique invite token
      const inviteToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

      // First save to database with token and expiration
      const { data: invitation, error } = await supabase.from("client_invitations").insert({
        user_id: user?.id,
        client_name: data.client_name,
        client_email: data.client_email,
        firm_id: data.firm_id,
        message: data.message || null,
        status: "pending",
        invite_token: inviteToken,
        expires_at: expiresAt.toISOString(),
        inviter_business_name: profile?.business_name || 'MAJR Books',
      }).select().single();
      if (error) throw error;

      // Then send email via edge function with token-based link
      const { error: emailError } = await supabase.functions.invoke('send-client-invitation', {
        body: {
          clientName: data.client_name,
          clientEmail: data.client_email,
          firmId: data.firm_id,
          inviteToken: inviteToken,
          message: data.message || undefined,
          senderName: profile?.business_name || 'MAJR Books',
          senderEmail: user?.email || '',
        }
      });

      if (emailError) {
        console.error("Email sending failed:", emailError);
        // Don't throw - invitation is saved, just log the email error
      }

      return invitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-invitations"] });
      toast.success("Invitation sent successfully");
      setIsDialogOpen(false);
      setFormData({ client_name: "", client_email: "", firm_id: user?.id || "", message: "" });
    },
    onError: (error) => {
      toast.error("Failed to send invitation: " + error.message);
    },
  });

  const resendInvitationMutation = useMutation({
    mutationFn: async (id: string) => {
      // Get user profile for business name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, business_name')
        .eq('id', user?.id)
        .single();

      // Get the invitation details first
      const { data: invitation, error: fetchError } = await supabase
        .from("client_invitations")
        .select("*")
        .eq("id", id)
        .single();
      if (fetchError) throw fetchError;

      // Generate new invite token and reset expiration
      const newInviteToken = crypto.randomUUID();
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 7);

      // Update the invitation with new token and expiration
      const { error } = await supabase
        .from("client_invitations")
        .update({ 
          sent_at: new Date().toISOString(), 
          status: "pending",
          invite_token: newInviteToken,
          expires_at: newExpiresAt.toISOString(),
          used_at: null, // Reset used status
        })
        .eq("id", id);
      if (error) throw error;

      // Resend the email with new token
      const { error: emailError } = await supabase.functions.invoke('send-client-invitation', {
        body: {
          clientName: invitation.client_name,
          clientEmail: invitation.client_email,
          firmId: invitation.firm_id,
          inviteToken: newInviteToken,
          message: invitation.message || undefined,
          senderName: profile?.business_name || 'MAJR Books',
          senderEmail: user?.email || '',
        }
      });

      if (emailError) {
        console.error("Email resend failed:", emailError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-invitations"] });
      toast.success("Invitation resent successfully");
    },
    onError: (error) => {
      toast.error("Failed to resend invitation: " + error.message);
    },
  });

  const deleteInvitationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("client_invitations")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-invitations"] });
      toast.success("Invitation deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete invitation: " + error.message);
    },
  });

  const updateInvitationMutation = useMutation({
    mutationFn: async ({ id, client_name }: { id: string; client_name: string }) => {
      const { error } = await supabase
        .from("client_invitations")
        .update({ client_name, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-invitations"] });
      toast.success("Invitation updated");
      setIsEditDialogOpen(false);
      setEditingInvitation(null);
      setEditName("");
    },
    onError: (error) => {
      toast.error("Failed to update invitation: " + error.message);
    },
  });

  const handleEditClick = (invitation: Invitation) => {
    setEditingInvitation(invitation);
    setEditName(invitation.client_name);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvitation || !editName.trim()) {
      toast.error("Please enter a client name");
      return;
    }
    updateInvitationMutation.mutate({ id: editingInvitation.id, client_name: editName.trim() });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_name || !formData.client_email || !formData.firm_id) {
      toast.error("Please fill in all required fields");
      return;
    }
    sendInvitationMutation.mutate(formData);
  };

  const copySignupLink = (invitation: Invitation) => {
    // Use token-based link if available, otherwise fall back to firm-based
    const signupUrl = invitation.invite_token 
      ? `${window.location.origin}/accept-client-invite?token=${invitation.invite_token}`
      : `${window.location.origin}/accept-client-invite?firm=${invitation.firm_id}`;
    navigator.clipboard.writeText(signupUrl);
    toast.success("Signup link copied to clipboard!");
  };

  const copyQuickSignupLink = (firmId: string) => {
    const signupUrl = `${window.location.origin}/accept-client-invite?firm=${firmId}`;
    navigator.clipboard.writeText(signupUrl);
    toast.success("Signup link copied to clipboard!");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case "accepted":
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Accepted</Badge>;
      case "declined":
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="h-3 w-3 mr-1" /> Declined</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Client Invitations</h1>
            <p className="text-muted-foreground mt-1">
              Now new clients can invite you to connect to their MajrBooks using your firm ID. You'll see these invitations listed here.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Send Invitation
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Send Client Invitation</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Client Name *</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    placeholder="Enter client name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_email">Client Email *</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                    placeholder="client@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firm_id">Firm ID *</Label>
                  <Input
                    id="firm_id"
                    value={formData.firm_id}
                    onChange={(e) => setFormData({ ...formData, firm_id: e.target.value })}
                    placeholder="Enter your firm ID"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Add a personal message to the invitation..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={sendInvitationMutation.isPending}>
                    <Send className="h-4 w-4 mr-2" />
                    {sendInvitationMutation.isPending ? "Sending..." : "Send Invitation"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Signup Link Generator */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Link className="h-5 w-5" />
              Quick Client Signup Link
            </CardTitle>
            <CardDescription>
              Generate a signup link to share with clients directly via text, WhatsApp, or any messaging platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label htmlFor="quick_firm_id" className="sr-only">Firm ID</Label>
                <Input
                  id="quick_firm_id"
                  placeholder="Enter your Firm ID to generate link"
                  value={quickFirmId}
                  onChange={(e) => setQuickFirmId(e.target.value)}
                />
              </div>
              <Button 
                onClick={() => {
                  if (quickFirmId) {
                    copyQuickSignupLink(quickFirmId);
                  } else {
                    toast.error("Please enter a Firm ID first");
                  }
                }}
                className="shrink-0"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Signup Link
              </Button>
            </div>
            {quickFirmId && (
              <div className="p-3 bg-background rounded-lg border">
                <Label className="text-xs text-muted-foreground mb-1 block">Your shareable signup link:</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm text-primary break-all">
                    {window.location.origin}/accept-client-invite?firm={quickFirmId}
                  </code>
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              💡 Your Firm ID is auto-filled with your account ID. Share this link with clients so they can sign up and connect with you.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Sent Invitations
            </CardTitle>
            <CardDescription>
              Track all invitations you've sent to clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading invitations...</div>
            ) : invitations.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No invitations yet</h3>
                <p className="text-muted-foreground mb-4">
                  Send your first invitation to connect with a client
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Send First Invitation
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Firm ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">{invitation.client_name}</TableCell>
                      <TableCell>{invitation.client_email}</TableCell>
                      <TableCell>{invitation.firm_id}</TableCell>
                      <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                      <TableCell>{format(new Date(invitation.sent_at), "MMM d, yyyy h:mm a")}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditClick(invitation)}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit Name
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => copySignupLink(invitation)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Signup Link
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => resendInvitationMutation.mutate(invitation.id)}
                              disabled={invitation.status === "accepted"}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Resend
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteInvitationMutation.mutate(invitation.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Client Name Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Client Name</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_client_name">Client Name *</Label>
                <Input
                  id="edit_client_name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter client name"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateInvitationMutation.isPending}>
                  {updateInvitationMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ClientInvitations;
