import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  Calendar, 
  User, 
  Building2,
  Clock,
  Edit,
  Trash2,
  UserPlus
} from 'lucide-react';
import { format, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Task } from '@/hooks/useTasksData';

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onAssign: (taskId: string) => void;
}

const priorityConfig: Record<string, { color: string; label: string }> = {
  low: { color: 'bg-slate-500/10 text-slate-500', label: 'Low' },
  medium: { color: 'bg-blue-500/10 text-blue-500', label: 'Medium' },
  high: { color: 'bg-orange-500/10 text-orange-500', label: 'High' },
  urgent: { color: 'bg-red-500/10 text-red-500', label: 'Urgent' },
};

const categoryConfig: Record<string, { color: string; label: string }> = {
  general: { color: 'bg-gray-500/10 text-gray-500', label: 'General' },
  bookkeeping: { color: 'bg-emerald-500/10 text-emerald-500', label: 'Bookkeeping' },
  tax: { color: 'bg-purple-500/10 text-purple-500', label: 'Tax' },
  payroll: { color: 'bg-cyan-500/10 text-cyan-500', label: 'Payroll' },
  document: { color: 'bg-amber-500/10 text-amber-500', label: 'Document' },
};

export function TaskCard({ task, onComplete, onEdit, onDelete, onAssign }: TaskCardProps) {
  const dueDate = new Date(task.due_date);
  const isOverdue = isPast(dueDate) && task.status !== 'completed';
  const isDueToday = isToday(dueDate);
  const isDueTomorrow = isTomorrow(dueDate);
  const daysUntilDue = differenceInDays(dueDate, new Date());

  const getDueDateColor = () => {
    if (isOverdue) return 'text-red-500';
    if (isDueToday) return 'text-orange-500';
    if (isDueTomorrow) return 'text-yellow-500';
    if (daysUntilDue <= 3) return 'text-amber-500';
    return 'text-muted-foreground';
  };

  const getDueDateLabel = () => {
    if (isOverdue) return `Overdue (${format(dueDate, 'MMM dd')})`;
    if (isDueToday) return 'Due Today';
    if (isDueTomorrow) return 'Due Tomorrow';
    if (daysUntilDue <= 7) return `Due in ${daysUntilDue} days`;
    return format(dueDate, 'MMM dd, yyyy');
  };

  return (
    <Card className={cn(
      'group hover:shadow-md transition-all',
      task.status === 'completed' && 'opacity-60',
      isOverdue && 'border-red-500/50'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.status === 'completed'}
            onCheckedChange={() => onComplete(task.id)}
            className="mt-1"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className={cn(
                  'font-medium',
                  task.status === 'completed' && 'line-through text-muted-foreground'
                )}>
                  {task.title}
                </h4>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAssign(task.id)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete(task.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Badge variant="outline" className={categoryConfig[task.category]?.color}>
                {categoryConfig[task.category]?.label || task.category}
              </Badge>
              
              <Badge variant="outline" className={priorityConfig[task.priority]?.color}>
                {priorityConfig[task.priority]?.label || task.priority}
              </Badge>

              <div className={cn('flex items-center gap-1 text-xs', getDueDateColor())}>
                <Calendar className="h-3 w-3" />
                {getDueDateLabel()}
              </div>

              {task.clients?.client_name && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  {task.clients.client_name}
                </div>
              )}

              {task.employees && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  {task.employees.first_name} {task.employees.last_name}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
