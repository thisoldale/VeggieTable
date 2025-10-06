import React, { useState } from 'react';
import { usePlan } from './context/PlanContext';
import { useGetTasksForPlanQuery, useDeleteTaskMutation } from './store/plantApi';
import { Task, TaskStatus } from './types';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import TaskDetailModal from './components/TaskDetailModal';
import { Trash2, PlusCircle, Repeat } from 'lucide-react';

const TasksPage: React.FC = () => {
  const { activePlan } = usePlan();
  const { data: tasks, error, isLoading, refetch } = useGetTasksForPlanQuery(activePlan ? activePlan.id : 0, {
    skip: !activePlan,
  });
  const [deleteTask] = useDeleteTaskMutation();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('weekly');

  const handleOpenCreateModal = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if(activePlan) {
        refetch();
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    // Note: Deletion logic for recurring tasks will be handled in a subsequent step.
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(taskId).unwrap();
    }
  };

  const groupTasksByWeek = (tasks: Task[] = []) => {
    const grouped: { [week: string]: Task[] } = {};
    tasks.forEach(task => {
      if (task.due_date) {
        const weekStart = startOfWeek(new Date(task.due_date.replace(/-/g, '/')), { weekStartsOn: 1 });
        const weekKey = format(weekStart, 'yyyy-MM-dd');
        if (!grouped[weekKey]) {
          grouped[weekKey] = [];
        }
        grouped[weekKey].push(task);
      }
    });
    return grouped;
  };

  const groupTasksByDay = (tasks: Task[] = []) => {
    const grouped: { [day: string]: Task[] } = {};
    tasks.forEach(task => {
      if (task.due_date) {
        const dayKey = task.due_date;
        if (!grouped[dayKey]) {
          grouped[dayKey] = [];
        }
        grouped[dayKey].push(task);
      }
    });
    return grouped;
  };

  if (!activePlan) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Please select an active garden plan to view tasks.</h2>
      </div>
    );
  }

  const sortedTasks = tasks ? [...tasks].sort((a, b) => new Date(a.due_date || 0).getTime() - new Date(b.due_date || 0).getTime()) : [];

  return (
    <div className="p-4 md:p-8 bg-background text-foreground min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-primary">Tasks for {activePlan.name}</h1>
            <button
                onClick={handleOpenCreateModal}
                className="flex items-center px-4 py-2 bg-interactive-primary text-interactive-primary-foreground rounded-md hover:bg-interactive-primary/90 transition duration-200"
            >
                <PlusCircle size={20} className="mr-2" />
                Add Task
            </button>
        </div>

        <h2 className="text-2xl font-semibold mb-4">Task Schedule</h2>
        <div className="flex justify-center mb-4">
            <button onClick={() => setViewMode('weekly')} className={`px-4 py-2 rounded-l-md ${viewMode === 'weekly' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>Weekly</button>
            <button onClick={() => setViewMode('daily')} className={`px-4 py-2 rounded-r-md ${viewMode === 'daily' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>Daily</button>
        </div>

        <div className="bg-component-background p-6 rounded-lg shadow-md">
          {isLoading && <p>Loading tasks...</p>}
          {error && <p className="text-destructive">Failed to load tasks.</p>}

          {viewMode === 'weekly' && !isLoading && (
            Object.entries(groupTasksByWeek(sortedTasks)).length > 0 ? (
              Object.entries(groupTasksByWeek(sortedTasks)).map(([week, weekTasks]) => {
                const weekStart = new Date(week.replace(/-/g, '/'));
                const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
                return (
                  <div key={week} className="mb-6">
                    <h3 className="text-lg font-semibold border-b-2 border-border pb-2 mb-3">
                      Week of {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                    </h3>
                    <ul className="space-y-4">
                      {weekTasks.map(task => (
                        <li key={task.id} className="group flex items-center justify-between p-4 border border-border rounded-md hover:bg-secondary">
                          <div className="flex items-center flex-grow cursor-pointer" onClick={() => handleEditTask(task)}>
                            {task.recurring_task_id && <Repeat size={16} className="mr-3 text-muted-foreground" />}
                            <div className="flex-grow">
                              <p className={`font-semibold ${task.status === TaskStatus.COMPLETED ? 'line-through text-muted-foreground' : ''}`}>{task.name}</p>
                              {task.due_date && <p className="text-xs text-muted-foreground mt-1">Due: {format(new Date(task.due_date + 'T00:00:00'), 'MMM d, yyyy')}</p>}
                            </div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="text-destructive hover:text-destructive/90 text-sm font-medium ml-4">
                            <Trash2 size={20} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })
            ) : <p className="text-center text-muted-foreground italic">No tasks with due dates for this plan yet.</p>
          )}

          {viewMode === 'daily' && !isLoading && (
             Object.entries(groupTasksByDay(sortedTasks)).length > 0 ? (
              Object.entries(groupTasksByDay(sortedTasks)).map(([day, dayTasks]) => (
                <div key={day} className="mb-6">
                  <h3 className="text-lg font-semibold border-b-2 border-border pb-2 mb-3">
                    {format(new Date(day + 'T00:00:00'), 'EEEE, MMM d, yyyy')}
                  </h3>
                  <ul className="space-y-2">
                    {dayTasks.map(task => (
                      <li key={task.id} className="group flex items-center justify-between p-2 border border-border rounded-md hover:bg-secondary">
                        <div className="flex items-center flex-grow cursor-pointer" onClick={() => handleEditTask(task)}>
                           {task.recurring_task_id && <Repeat size={16} className="mr-2 text-muted-foreground" />}
                           <div className="flex-grow">
                            <p className={`font-semibold ${task.status === TaskStatus.COMPLETED ? 'line-through text-muted-foreground' : ''}`}>{task.name}</p>
                           </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="text-destructive hover:text-destructive/90 text-sm font-medium ml-4">
                          <Trash2 size={20} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : <p className="text-center text-muted-foreground italic">No tasks with due dates for this plan yet.</p>
          )}
        </div>
      </div>
      <TaskDetailModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        task={selectedTask}
      />
    </div>
  );
};

export default TasksPage;