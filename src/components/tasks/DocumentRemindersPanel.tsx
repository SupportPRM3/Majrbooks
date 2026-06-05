import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useDocumentReminders, type DocumentReminder } from '@/hooks/useTasksData';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, 
  Plus, 
  Upload, 
  Calendar, 
  Building2,
  Check,
  Clock,
  AlertTriangle,
  Send
} from 'lucide-react';
import { format, isPast } from 'date-fns';

const documentTypeConfig: Record<string, { label: string; icon: typeof FileText }> = {
  financial_statement: { label: 'Financial Statement', icon: FileText },
  receipt: { label: 'Receipt', icon: FileText },
  '1099': { label: '1099 Form', icon: FileText },
  w2: { label: 'W-2 Form', icon: FileText },
  vendor_form: { label: 'Vendor Form', icon: FileText },
  compliance: { label: 'Compliance Doc', icon: FileText },
  other: { label: 'Other', icon: FileText },
};

const statusConfig: Record<string, { color: string; icon: typeof Clock }> = {
  pending: { color: 'bg-yellow-500/10 text-yellow-500', icon: Clock },
  requested: { color: 'bg-blue-500/10 text-blue-500', icon: Send },
  received: { color: 'bg-emerald-500/10 text-emerald-500', icon: Check },
  overdue: { color: 'bg-red-500/10 text-red-500', icon: AlertTriangle },
};

export function DocumentRemindersPanel() {
  const { reminders, loading, createReminder, updateReminder, deleteReminder } = useDocumentReminders();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [clients, setClients] = useState<{ id: string; client_name: string }[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    document_type: 'other' as const,
    due_date: format(new Date(), 'yyyy-MM-dd'),
    client_id: '',
  });

  const loadClients = async () => {
    const { data } = await supabase.from('clients').select('id, client_name').eq('status', 'active');
    setClients(data || []);
  };

  const handleOpenCreate = () => {
    loadClients();
    setShowCreateDialog(true);
  };

  const handleCreate = async () => {
    await createReminder({
      ...formData,
      client_id: formData.client_id || null,
      status: 'pending',
      file_url: null,
    });
    setShowCreateDialog(false);
    setFormData({
      title: '',
      description: '',
      document_type: 'other',
      due_date: format(new Date(), 'yyyy-MM-dd'),
      client_id: '',
    });
  };

  const handleMarkReceived = async (id: string) => {
    await updateReminder(id, { status: 'received' });
  };

  const handleSendRequest = async (id: string) => {
    await updateReminder(id, { 
      status: 'requested',
      reminder_sent_at: new Date().toISOString()
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingReminders = reminders.filter(r => r.status !== 'received');
  const overdueCount = reminders.filter(r => r.status === 'overdue' || (r.status === 'pending' && isPast(new Date(r.due_date)))).length;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Document Reminders</CardTitle>
            {overdueCount > 0 && (
              <Badge variant="destructive">{overdueCount} overdue</Badge>
            )}
          </div>
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Add Reminder
          </Button>
        </CardHeader>
        <CardContent>
          {pendingReminders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No pending document reminders</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {pendingReminders.map((reminder) => {
                  const StatusIcon = statusConfig[reminder.status]?.icon || Clock;
                  const isOverdue = isPast(new Date(reminder.due_date)) && reminder.status !== 'received';
                  
                  return (
                    <div
                      key={reminder.id}
                      className={`p-3 border rounded-lg ${isOverdue ? 'border-red-500/50' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">{reminder.title}</h4>
                            <Badge variant="outline" className={statusConfig[reminder.status]?.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {reminder.status}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {documentTypeConfig[reminder.document_type]?.label || reminder.document_type}
                            </span>
                            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}>
                              <Calendar className="h-3 w-3" />
                              {format(new Date(reminder.due_date), 'MMM dd, yyyy')}
                            </span>
                            {reminder.clients?.client_name && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {reminder.clients.client_name}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {reminder.status === 'pending' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleSendRequest(reminder.id)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleMarkReceived(reminder.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Document Reminder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Document title"
              />
            </div>
            <div>
              <Label>Document Type</Label>
              <Select
                value={formData.document_type}
                onValueChange={(v: any) => setFormData({ ...formData, document_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(documentTypeConfig).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Client (Optional)</Label>
            <Select
                value={formData.client_id || "__none__"}
                onValueChange={(v) => setFormData({ ...formData, client_id: v === "__none__" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No client</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.client_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
