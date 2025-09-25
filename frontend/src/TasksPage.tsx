import React, { useState } from 'react';
import { usePlan } from './context/PlanContext';
import { useGetTasksForPlanQuery, useAddTaskMutation, useUpdateTaskMutation, useDeleteTaskMutation } from './store/plantApi';
import { Task, TaskStatus } from './types';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import TaskDetailModal from './components/TaskDetailModal';

const TasksPage: React.FC = () => {
  const { activePlan } = usePlan();
  const { data: tasks, error, isLoading } = useGetTasksForPlanQuery(activePlan ? activePlan.id : 0, {

    skip: !activePlan,
  });
  const [addTask] = useAddTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();

  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('weekly');

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim() || !activePlan) return;

    const taskPayload = {
      garden_plan_id: activePlan.id,
      name: newTaskName,
      description: newTaskDescription,
      due_date: newTaskDueDate || undefined,
      status: TaskStatus.PENDING,
    };

    try {
      await addTask(taskPayload).unwrap();
      setNewTaskName('');
      setNewTaskDescription('');
      setNewTaskDueDate('');
      refetch();
    } catch (err) {
      console.error("Failed to add task", err);
    }
  };

  const handleEditTask = (task: Task) => {
      setSelectedTask(task);
      setIsModalOpen(true);
  };

  const handleDeleteTask = async (taskId: number) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(taskId).unwrap();
      refetch();
    }
  };

  const groupTasksByWeek = (tasks: Task[]) => {
    const grouped: { [week: string]: Task[] } = {};
    if (!tasks) return grouped;
    tasks.forEach(task => {
      if (task.due_date) {
        const weekStart = startOfWeek(new Date(task.due_date.replace(/-/g, '/')), { weekStartsOn: 1 }); // week starts on Monday
        const weekKey = format(weekStart, 'yyyy-MM-dd');
        if (!grouped[weekKey]) {
          grouped[weekKey] = [];
        }
        grouped[weekKey].push(task);
      }
    });
    return grouped;
  };

  const groupTasksByDay = (tasks: Task[]) => {
    const grouped: { [day: string]: Task[] } = {};
    if (!tasks) return grouped;
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

  return (
    <div className="p-4 md:p-8 bg-background text-foreground min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-primary">Tasks for {activePlan.name}</h1>

        {/* Add New Task Form */}
        <div className="bg-component-background p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold mb-4">Add a New Task</h2>
          <form onSubmit={handleAddTask}>
            <div className="mb-4">
              <label htmlFor="taskName" className="block text-sm font-medium text-muted-foreground mb-1">Task Name</label>
              <input
                id="taskName"
                type="text"
                placeholder="e.g., Weed the tomato patch"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                className="w-full p-2 bg-component-background border border-border rounded-md"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="taskDescription" className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
              <textarea
                id="taskDescription"
                placeholder="Any extra details..."
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                rows={2}
                className="w-full p-2 bg-component-background border border-border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="taskDueDate" className="block text-sm font-medium text-muted-foreground mb-1">Due Date</label>
              <input
                id="taskDueDate"
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="w-full p-2 bg-component-background border border-border rounded-md"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-interactive-primary text-interactive-primary-foreground p-2 rounded-md hover:bg-interactive-primary/90 transition duration-200"
            >
              Add Task
            </button>
          </form>
        </div>

        <h2 className="text-2xl font-semibold mb-4">Task Schedule</h2>
        {/* View Toggle */}
        <div className="flex justify-center mb-4">
            <button
                onClick={() => setViewMode('weekly')}
                className={`px-4 py-2 rounded-l-md ${viewMode === 'weekly' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
            >
                Weekly
            </button>
            <button
                onClick={() => setViewMode('daily')}
                className={`px-4 py-2 rounded-r-md ${viewMode === 'daily' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
            >
                Daily
            </button>
        </div>
        {/* Task List */}
        <div className="bg-component-background p-6 rounded-lg shadow-md">
          {isLoading && <p>Loading tasks...</p>}
          {error && <p className="text-destructive">Failed to load tasks.</p>}
          {viewMode === 'weekly' && tasks && tasks.length > 0 ? (
            <div>
              {Object.entries(groupTasksByWeek(tasks))
                .sort(([weekA], [weekB]) => new Date(weekA).getTime() - new Date(weekB).getTime())
                .map(([week, weekTasks]) => {
                  const weekStart = new Date(week.replace(/-/g, '/'));
                  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
                  const startMonth = format(weekStart, 'MMMM');
                  const endMonth = format(weekEnd, 'MMMM');

                  let title;
                  if (startMonth === endMonth) {
                    title = startMonth;
                  } else {
                    title = `${startMonth}/${endMonth}`;
                  }

                  return (
                    <div key={week} className="mb-6">
                      <h3 className="text-lg font-semibold border-b-2 border-border pb-2 mb-3">
                        {title}
                      </h3>
                      <ul className="space-y-4">
                        {weekTasks.map(task => (
                      <li key={task.id} className="flex items-center justify-between p-4 border border-border rounded-md hover:bg-secondary">
                        <div className="flex items-center flex-grow cursor-pointer" onClick={() => handleEditTask(task)}>
                          <div className="ml-4">
                            <p className={`font-semibold ${task.status === TaskStatus.COMPLETED ? 'line-through text-muted-foreground' : ''}`}>{task.name}</p>
                            {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                            {task.due_date && <p className="text-xs text-muted-foreground mt-1">Due: {format(new Date(task.due_date + 'T00:00:00'), 'MMM d, yyyy')}</p>}
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="text-destructive hover:text-destructive/90 text-sm font-medium ml-4">
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                  )
                })}
            </div>
          ) : (
            viewMode === 'weekly' && !isLoading && <p className="text-center text-muted-foreground italic">No tasks for this plan yet.</p>
          )}

          {viewMode === 'daily' && tasks && tasks.length > 0 ? (
            <div>
              {Object.entries(groupTasksByDay(tasks))
                .sort(([dayA], [dayB]) => new Date(dayA).getTime() - new Date(dayB).getTime())
                .map(([day, dayTasks]) => (
                <div key={day} className="mb-6">
                  <h3 className="text-lg font-semibold border-b-2 border-border pb-2 mb-3">
                    {format(new Date(day + 'T00:00:00'), 'EEEE, MMM d, yyyy')}
                  </h3>
                  <ul className="space-y-2">
                    {dayTasks.map(task => (
                      <li key={task.id} className="flex items-center justify-between p-2 border border-border rounded-md hover:bg-secondary">
                        <div className="flex items-center flex-grow cursor-pointer" onClick={() => handleEditTask(task)}>
                          <div className="ml-2">
                            <p className={`font-semibold ${task.status === TaskStatus.COMPLETED ? 'line-through text-muted-foreground' : ''}`}>{task.name}</p>
                            {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="text-destructive hover:text-destructive/90 text-sm font-medium ml-4">
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            viewMode === 'daily' && !isLoading && <p className="text-center text-muted-foreground italic">No tasks for this plan yet.</p>
          )}
        </div>
      </div>
      <TaskDetailModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={selectedTask}
      />
    </div>
  );
};

export default TasksPage;