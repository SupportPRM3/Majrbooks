import { useState } from 'react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTasks, type TaskFilters, type Task } from '@/hooks/useTasksData';
import { toast } from '@/hooks/use-toast';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskFilters as TaskFiltersComponent } from '@/components/tasks/TaskFilters';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { DocumentRemindersPanel } from '@/components/tasks/DocumentRemindersPanel';
import { TaskTemplatesPanel } from '@/components/tasks/TaskTemplatesPanel';
import { 
  Plus, 
  CheckSquare, 
  BookOpen, 
  Calculator, 
  Users, 
  FileText,
  Calendar,
  Clock,
  AlertTriangle
} from 'lucide-react';

export default function Tasks() {
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({
    category: 'all',
    status: 'all',
    priority: 'all',
    search: '',
    dateRange: 'all',
  });

  // Apply category filter based on tab
  const effectiveFilters = {
    ...filters,
    category: activeTab === 'all' ? filters.category : activeTab,
  };

  const { tasks, loading, createTask, updateTask, completeTask, deleteTask, assignTask } = useTasks(effectiveFilters);

  const handleEditTask = (task: Task) => {
    setEditTask(task);
    setShowCreateDialog(true);
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setEditTask(null);
  };

  const handleSubmitTask = async (taskData: Omit<Task, 'id' | 'user_id' | 'created_at' | 'clients' | 'employees'>) => {
    if (editTask) {
      await updateTask(editTask.id, taskData);
    } else {
      await createTask(taskData);
    }
  };

  // Stats
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    overdue: tasks.filter(t => {
      const dueDate = new Date(t.due_date);
      return dueDate < new Date() && t.status !== 'completed';
    }).length,
  };

  const tabs = [
    { id: 'all', label: 'All Tasks', icon: CheckSquare },
    { id: 'bookkeeping', label: 'Bookkeeping', icon: BookOpen },
    { id: 'tax', label: 'Tax', icon: Calculator },
    { id: 'payroll', label: 'Payroll', icon: Users },
    { id: 'document', label: 'Documents', icon: FileText },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <CheckSquare className="h-8 w-8 text-primary" />
              Tasks
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage all your bookkeeping, tax, payroll, and document tasks
            </p>
          </div>
          <Button onClick={() => {
            toast({ title: "Opening task creator..." });
            setShowCreateDialog(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <CheckSquare className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className={stats.overdue > 0 ? 'border-red-500/50' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className={`text-2xl font-bold ${stats.overdue > 0 ? 'text-red-500' : ''}`}>
                    {stats.overdue}
                  </p>
                </div>
                <AlertTriangle className={`h-8 w-8 ${stats.overdue > 0 ? 'text-red-500' : 'text-muted-foreground'} opacity-50`} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Task List */}
          <div className="lg:col-span-2 space-y-4">
            <Tabs value={activeTab} onValueChange={(value) => {
              setActiveTab(value);
              const tab = tabs.find(t => t.id === value);
              toast({ title: `Switched to ${tab?.label || value}` });
            }}>
              <TabsList className="w-full justify-start">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="mt-4">
                <TaskFiltersComponent 
                  filters={filters} 
                  onFiltersChange={setFilters} 
                />
              </div>

              <TabsContent value={activeTab} className="mt-4">
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : tasks.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="font-medium text-lg">No tasks found</h3>
                      <p className="text-muted-foreground text-sm mt-1">
                        {filters.search || filters.dateRange !== 'all' 
                          ? 'Try adjusting your filters'
                          : 'Create a new task to get started'
                        }
                      </p>
                      <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Task
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={completeTask}
                        onEdit={handleEditTask}
                        onDelete={deleteTask}
                        onAssign={(taskId) => {
                          // For now, just open edit dialog
                          const task = tasks.find(t => t.id === taskId);
                          if (task) handleEditTask(task);
                        }}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <TaskTemplatesPanel />
            <DocumentRemindersPanel />
          </div>
        </div>
      </div>

      <CreateTaskDialog
        open={showCreateDialog}
        onOpenChange={handleCloseDialog}
        onSubmit={handleSubmitTask}
        editTask={editTask}
      />
    </Layout>
  );
}
