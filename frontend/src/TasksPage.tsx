import React, { useState } from 'react';
import { usePlan } from './context/PlanContext';
import { useGetTasksForPlanQuery, useAddTaskMutation, useUpdateTaskMutation, useDeleteTaskMutation } from './store/plantApi';
import { Task, TaskStatus } from './types';
import { format } from 'date-fns';
import TaskDetailModal from './components/TaskDetailModal';

const TasksPage: React.FC = () => {
  const { activePlan } = usePlan();
  // The line below is the corrected one
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
      await deleteTask(taskId);
    }
  };

  if (!activePlan) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-gray-700">Please select an active garden plan to view tasks.</h2>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-green-700">Tasks for {activePlan.name}</h1>

        {/* Add New Task Form */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Add a New Task</h2>
          <form onSubmit={handleAddTask}>
            <div className="mb-4">
              <label htmlFor="taskName" className="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
              <input
                id="taskName"
                type="text"
                placeholder="e.g., Weed the tomato patch"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                id="taskDescription"
                placeholder="Any extra details..."
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                rows={2}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="taskDueDate" className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                id="taskDueDate"
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition duration-200"
            >
              Add Task
            </button>
          </form>
        </div>

        {/* Task List */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          {isLoading && <p>Loading tasks...</p>}
          {error && <p className="text-red-500">Failed to load tasks.</p>}
          {tasks && tasks.length > 0 ? (
            <ul className="space-y-4">
              {tasks.map(task => (
                <li key={task.id} className="flex items-center justify-between p-4 border rounded-md hover:bg-gray-50">
                  <div className="flex items-center flex-grow cursor-pointer" onClick={() => handleEditTask(task)}>
                    <div className="ml-4">
                      <p className={`font-semibold ${task.status === TaskStatus.COMPLETED ? 'line-through text-gray-500' : 'text-gray-900'}`}>{task.name}</p>
                      {task.description && <p className="text-sm text-gray-600">{task.description}</p>}
                      {task.due_date && <p className="text-xs text-gray-500 mt-1">Due: {format(new Date(task.due_date + 'T00:00:00'), 'MMM d, yyyy')}</p>}
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="text-red-500 hover:text-red-700 text-sm font-medium ml-4">
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            !isLoading && <p className="text-center text-gray-500 italic">No tasks for this plan yet.</p>
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