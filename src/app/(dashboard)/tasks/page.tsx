'use client';

import React, { useState, useMemo } from 'react';
import {
  CheckCircle2, Circle, Clock, AlertTriangle, Plus, Trash2, ChevronDown, User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/auth-context';
import { useMyTasks, useCreateTask, useUpdateTaskStatus, useDeleteTask } from '@/hooks/use-tasks';
import { useEmployees } from '@/hooks/use-employees';
import { Task } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ── Helpers ───────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<Task['priority'], { label: string; color: string; icon: React.ReactNode }> = {
  low:    { label: 'Niski',    color: 'bg-slate-50 text-slate-600 border-slate-200',    icon: <Circle size={12} /> },
  medium: { label: 'Średni',   color: 'bg-amber-50 text-amber-700 border-amber-200',   icon: <AlertTriangle size={12} /> },
  high:   { label: 'Wysoki',   color: 'bg-red-50 text-red-700 border-red-200',         icon: <AlertTriangle size={12} /> },
};

const STATUS_CONFIG: Record<Task['status'], { label: string; color: string }> = {
  todo:        { label: 'Do zrobienia',  color: 'bg-slate-100 text-slate-600 border-slate-200' },
  in_progress: { label: 'W toku',        color: 'bg-blue-50 text-blue-700 border-blue-200' },
  done:        { label: 'Zrobione',      color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

const STATUS_NEXT: Record<Task['status'], Task['status']> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
};

function isOverdue(dueDate: string, status: Task['status']) {
  return status !== 'done' && dueDate < new Date().toISOString().split('T')[0];
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Task Card ─────────────────────────────────────────────────────────────────

function TaskCard({
  task, canManage, onStatusChange, onDelete,
}: {
  task: Task;
  canManage: boolean;
  onStatusChange: (id: string, status: Task['status']) => void;
  onDelete: (id: string) => void;
}) {
  const overdue = isOverdue(task.dueDate, task.status);
  const p = PRIORITY_CONFIG[task.priority];
  const s = STATUS_CONFIG[task.status];

  return (
    <Card className={cn(
      'shadow-none border-border transition-all',
      task.status === 'done' && 'opacity-60',
      overdue && 'border-red-200 bg-red-50/30',
    )}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <button
              onClick={() => onStatusChange(task.id, STATUS_NEXT[task.status])}
              className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
              title="Zmień status"
            >
              {task.status === 'done'
                ? <CheckCircle2 size={18} className="text-emerald-500" />
                : task.status === 'in_progress'
                  ? <Clock size={18} className="text-blue-500" />
                  : <Circle size={18} />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-medium', task.status === 'done' && 'line-through text-muted-foreground')}>
                {task.title}
              </p>
              {task.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>
              )}
            </div>
          </div>
          {canManage && (
            <button
              onClick={() => onDelete(task.id)}
              className="shrink-0 text-muted-foreground/40 hover:text-destructive transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={cn('text-[10px] gap-1 shadow-none', p.color)}>
            {p.icon} {p.label}
          </Badge>
          <Badge variant="outline" className={cn('text-[10px] shadow-none', s.color)}>
            {s.label}
          </Badge>
          {overdue && (
            <Badge variant="outline" className="text-[10px] shadow-none bg-red-50 text-red-600 border-red-200">
              Przeterminowane
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <User size={10} /> {task.assignerName}
          </span>
          <span className={cn('flex items-center gap-1', overdue && 'text-red-500 font-medium')}>
            <Clock size={10} /> Termin: {formatDate(task.dueDate)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── New Task Dialog ────────────────────────────────────────────────────────────

function NewTaskDialog({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const { data: employees = [] } = useEmployees();
  const createMutation = useCreateTask();

  const [form, setForm] = useState({
    title: '',
    description: '',
    assigneeId: '',
    dueDate: '',
    priority: 'medium' as Task['priority'],
  });

  const assignee = employees.find(e => e.id === form.assigneeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignee || !user) return;
    try {
      await createMutation.mutateAsync({
        title: form.title,
        description: form.description || undefined,
        assigneeId: form.assigneeId,
        assigneeEmail: assignee.email,
        assignerId: user.uid,
        assignerName: user.displayName ?? user.email ?? '',
        dueDate: form.dueDate,
        priority: form.priority,
        status: 'todo',
        createdAt: new Date().toISOString(),
      } as Omit<Task, 'id'>);
      toast.success('Zadanie dodane');
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('Błąd', { description: msg });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Nowe zadanie</DialogTitle>
        <DialogDescription>Przypisz zadanie pracownikowi z terminem wykonania.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="title">Tytuł zadania</Label>
          <Input id="title" required placeholder="np. Przygotuj raport miesięczny"
            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="desc">Opis <span className="text-muted-foreground text-xs">(opcjonalnie)</span></Label>
          <textarea
            id="desc" rows={3}
            placeholder="Szczegóły zadania..."
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="assignee">Pracownik</Label>
          <select id="assignee" required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={form.assigneeId}
            onChange={e => setForm({ ...form, assigneeId: e.target.value })}>
            <option value="">Wybierz pracownika...</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="due">Termin</Label>
            <Input id="due" type="date" required
              value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priorytet</Label>
            <select id="priority"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={form.priority}
              onChange={e => setForm({ ...form, priority: e.target.value as Task['priority'] })}>
              <option value="low">Niski</option>
              <option value="medium">Średni</option>
              <option value="high">Wysoki</option>
            </select>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Anuluj</Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Dodawanie...' : 'Dodaj zadanie'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'manager' || user?.role === 'hr' || user?.role === 'admin';

  // canManage → null → getAllTasks; employee → email → getMyTasks
  const tasksEmail = canManage ? null : (user?.email ?? null);
  const { data: myTasks = [], isLoading } = useMyTasks(tasksEmail);

  const updateStatus = useUpdateTaskStatus();
  const deleteTaskMutation = useDeleteTask();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<Task['status'] | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Task['priority'] | 'all'>('all');

  const filtered = useMemo(() => myTasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  }), [myTasks, filterStatus, filterPriority]);

  const stats = useMemo(() => ({
    total: myTasks.length,
    todo: myTasks.filter(t => t.status === 'todo').length,
    inProgress: myTasks.filter(t => t.status === 'in_progress').length,
    done: myTasks.filter(t => t.status === 'done').length,
    overdue: myTasks.filter(t => isOverdue(t.dueDate, t.status)).length,
  }), [myTasks]);

  const handleStatusChange = (id: string, status: Task['status']) => {
    updateStatus.mutate({ id, status });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Usunąć to zadanie?')) return;
    deleteTaskMutation.mutate(id, {
      onSuccess: () => toast.success('Zadanie usunięte'),
      onError: () => toast.error('Błąd podczas usuwania'),
    });
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 px-8 py-10 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Zadania</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {canManage ? 'Przypisuj i śledź zadania pracowników.' : 'Twoje przypisane zadania do wykonania.'}
          </p>
        </div>
        {canManage && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9"><Plus size={16} className="mr-2" /> Nowe zadanie</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <NewTaskDialog onClose={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Wszystkich', value: stats.total, color: 'text-foreground' },
          { label: 'Do zrobienia', value: stats.todo, color: 'text-slate-600' },
          { label: 'W toku', value: stats.inProgress, color: 'text-blue-600' },
          { label: 'Zrobione', value: stats.done, color: 'text-emerald-600' },
        ].map(s => (
          <Card key={s.label} className="shadow-none border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={cn('text-2xl font-bold mt-1', s.color)}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
              Status: {filterStatus === 'all' ? 'Wszystkie' : STATUS_CONFIG[filterStatus].label}
              <ChevronDown size={12} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterStatus('all')}>Wszystkie</DropdownMenuItem>
            {(Object.keys(STATUS_CONFIG) as Task['status'][]).map(s => (
              <DropdownMenuItem key={s} onClick={() => setFilterStatus(s)}>
                {STATUS_CONFIG[s].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
              Priorytet: {filterPriority === 'all' ? 'Wszystkie' : PRIORITY_CONFIG[filterPriority].label}
              <ChevronDown size={12} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterPriority('all')}>Wszystkie</DropdownMenuItem>
            {(Object.keys(PRIORITY_CONFIG) as Task['priority'][]).map(p => (
              <DropdownMenuItem key={p} onClick={() => setFilterPriority(p)}>
                {PRIORITY_CONFIG[p].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {stats.overdue > 0 && (
          <Badge variant="outline" className="text-[11px] bg-red-50 text-red-600 border-red-200">
            {stats.overdue} przeterminowanych
          </Badge>
        )}
      </div>

      {/* Task list */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-36 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
          <CheckCircle2 size={32} className="opacity-30" />
          <p className="text-sm">Brak zadań spełniających kryteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              canManage={canManage}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
