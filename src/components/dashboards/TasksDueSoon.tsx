import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTasks } from '@/hooks/useDashboardData';
import { Check, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import { differenceInDays, format, isToday, isTomorrow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const priorityColors: Record<string, string> = {
  low: 'bg-slate-500/10 text-slate-500',
  medium: 'bg-blue-500/10 text-blue-500',
  high: 'bg-orange-500/10 text-orange-500',
  urgent: 'bg-red-500/10 text-red-500'
};

export function TasksDueSoon() {
  const { tasks, loading, error, completeTask } = useTasks();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load tasks: {error}</p>
        </CardContent>
      </Card>
    );
  }

  const getDueDateLabel = (dueDate: string) => {
    const date = new Date(dueDate);
    if (isToday(date)) return { label: 'Today', urgent: true };
    if (isTomorrow(date)) return { label: 'Tomorrow', urgent: true };
    const daysUntil = differenceInDays(date, new Date());
    if (daysUntil <= 3) return { label: `In ${daysUntil} days`, urgent: true };
    return { label: format(date, 'MMM dd'), urgent: false };
  };

  const groupedTasks = {
    today: tasks.filter(t => isToday(new Date(t.due_date))),
    thisWeek: tasks.filter(t => {
      const daysUntil = differenceInDays(new Date(t.due_date), new Date());
      return daysUntil > 0 && daysUntil <= 7;
    })
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tasks Due Soon</CardTitle>
        <Badge variant="secondary">{tasks.length} tasks</Badge>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Check className="h-12 w-12 mb-2 text-emerald-500" />
            <p className="font-medium">All tasks complete!</p>
            <p className="text-sm">No tasks due in the next 7 days</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {groupedTasks.today.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-destructive mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Due Today ({groupedTasks.today.length})
                  </h4>
                  <div className="space-y-2">
                    {groupedTasks.today.map((task) => (
                      <TaskItem 
                        key={task.id} 
                        task={task} 
                        onComplete={completeTask}
                        navigate={navigate}
                      />
                    ))}
                  </div>
                </div>
              )}

              {groupedTasks.thisWeek.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    This Week ({groupedTasks.thisWeek.length})
                  </h4>
                  <div className="space-y-2">
                    {groupedTasks.thisWeek.map((task) => (
                      <TaskItem 
                        key={task.id} 
                        task={task} 
                        onComplete={completeTask}
                        navigate={navigate}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

interface TaskItemProps {
  task: {
    id: string;
    title: string;
    due_date: string;
    priority: string;
    client_name?: string;
    client_id: string | null;
  };
  onComplete: (id: string) => void;
  navigate: (path: string) => void;
}

function TaskItem({ task, onComplete, navigate }: TaskItemProps) {
  const dueInfo = getDueDateLabel(task.due_date);
  
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors group">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0 rounded-full"
        onClick={() => onComplete(task.id)}
      >
        <Check className="h-4 w-4" />
      </Button>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{task.title}</p>
        <div className="flex items-center gap-2 mt-1">
          {task.client_name && (
            <span className="text-xs text-muted-foreground truncate">
              {task.client_name}
            </span>
          )}
          <Badge variant="outline" className={`text-xs ${priorityColors[task.priority]}`}>
            {task.priority}
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs ${dueInfo.urgent ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
          {dueInfo.label}
        </span>
        {task.client_id && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => navigate(`/client/${task.client_id}`)}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

function getDueDateLabel(dueDate: string) {
  const date = new Date(dueDate);
  if (isToday(date)) return { label: 'Today', urgent: true };
  if (isTomorrow(date)) return { label: 'Tomorrow', urgent: true };
  const daysUntil = differenceInDays(date, new Date());
  if (daysUntil <= 3) return { label: `In ${daysUntil} days`, urgent: true };
  return { label: format(date, 'MMM dd'), urgent: false };
}
