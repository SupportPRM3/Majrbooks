import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, startOfWeek, endOfWeek } from 'date-fns';

export interface Task {
  id: string;
  user_id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  due_date: string;
  priority: string;
  status: string;
  category: string;
  assigned_to: string | null;
  completed_at: string | null;
  completed_by?: string | null;
  created_at: string;
  clients?: { client_name: string } | null;
  employees?: { first_name: string; last_name: string } | null;
}

export interface TaskTemplate {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  recurrence_type: string | null;
  recurrence_day: number | null;
  is_active: boolean;
}

export interface DocumentReminder {
  id: string;
  client_id: string | null;
  document_type: string;
  title: string;
  description: string | null;
  due_date: string;
  status: string;
  file_url: string | null;
  reminder_sent_at?: string | null;
  clients?: { client_name: string } | null;
}

export interface TaskFilters {
  category: string;
  status: string;
  priority: string;
  search: string;
  dateRange: 'all' | 'today' | 'week' | 'overdue';
}

export function useTasks(filters: TaskFilters) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const filtersRef = useRef(filters);
  const toastRef = useRef(toast);
  
  // Update refs
  filtersRef.current = filters;
  toastRef.current = toast;

  const fetchTasks = useCallback(async () => {
    const currentFilters = filtersRef.current;
    try {
      setLoading(true);
      let query = supabase
        .from('tasks')
        .select(`
          *,
          clients (client_name),
          employees!tasks_assigned_to_fkey (first_name, last_name)
        `)
        .order('due_date', { ascending: true });

      if (currentFilters.category && currentFilters.category !== 'all') {
        query = query.eq('category', currentFilters.category);
      }

      if (currentFilters.status && currentFilters.status !== 'all') {
        query = query.eq('status', currentFilters.status);
      }

      if (currentFilters.priority && currentFilters.priority !== 'all') {
        query = query.eq('priority', currentFilters.priority);
      }

      if (currentFilters.search) {
        query = query.ilike('title', `%${currentFilters.search}%`);
      }

      const today = new Date();
      if (currentFilters.dateRange === 'today') {
        query = query.eq('due_date', format(today, 'yyyy-MM-dd'));
      } else if (currentFilters.dateRange === 'week') {
        query = query
          .gte('due_date', format(startOfWeek(today), 'yyyy-MM-dd'))
          .lte('due_date', format(endOfWeek(today), 'yyyy-MM-dd'));
      } else if (currentFilters.dateRange === 'overdue') {
        query = query
          .lt('due_date', format(today, 'yyyy-MM-dd'))
          .neq('status', 'completed');
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setTasks(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
      toastRef.current({
        title: 'Error',
        description: 'Failed to load tasks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Serialize filters for stable dependency
  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, filtersKey]);

  const createTask = async (task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'clients' | 'employees'>) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...task, user_id: userData.user.id })
      .select()
      .single();

    if (error) throw error;

    // Log status history
    await supabase.from('task_status_history').insert({
      task_id: data.id,
      user_id: userData.user.id,
      old_status: null,
      new_status: task.status,
      notes: 'Task created',
    });

    toast({ title: 'Task created successfully' });
    fetchTasks();
    return data;
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const currentTask = tasks.find(t => t.id === id);

    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    // Log status change
    if (updates.status && currentTask && updates.status !== currentTask.status) {
      await supabase.from('task_status_history').insert({
        task_id: id,
        user_id: userData.user.id,
        old_status: currentTask.status,
        new_status: updates.status,
      });
    }

    toast({ title: 'Task updated successfully' });
    fetchTasks();
  };

  const completeTask = async (id: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    await updateTask(id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_by: userData.user.id,
    });
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    toast({ title: 'Task deleted' });
    fetchTasks();
  };

  const assignTask = async (taskId: string, employeeId: string | null) => {
    await updateTask(taskId, { assigned_to: employeeId });
  };

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    assignTask,
    refetch: fetchTasks,
  };
}

export function useTaskTemplates() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load task templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (template: Omit<TaskTemplate, 'id'>) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('task_templates')
      .insert({ ...template, user_id: userData.user.id });

    if (error) throw error;
    toast({ title: 'Template created' });
    fetchTemplates();
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase.from('task_templates').delete().eq('id', id);
    if (error) throw error;
    toast({ title: 'Template deleted' });
    fetchTemplates();
  };

  return { templates, loading, createTemplate, deleteTemplate, refetch: fetchTemplates };
}

export function useDocumentReminders() {
  const [reminders, setReminders] = useState<DocumentReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('document_reminders')
        .select(`*, clients (client_name)`)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load document reminders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createReminder = async (reminder: Omit<DocumentReminder, 'id' | 'clients'>) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('document_reminders')
      .insert({ ...reminder, user_id: userData.user.id });

    if (error) throw error;
    toast({ title: 'Reminder created' });
    fetchReminders();
  };

  const updateReminder = async (id: string, updates: Partial<DocumentReminder>) => {
    const { error } = await supabase
      .from('document_reminders')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    toast({ title: 'Reminder updated' });
    fetchReminders();
  };

  const deleteReminder = async (id: string) => {
    const { error } = await supabase.from('document_reminders').delete().eq('id', id);
    if (error) throw error;
    toast({ title: 'Reminder deleted' });
    fetchReminders();
  };

  return { reminders, loading, createReminder, updateReminder, deleteReminder, refetch: fetchReminders };
}
