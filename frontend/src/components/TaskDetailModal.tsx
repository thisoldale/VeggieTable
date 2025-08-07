import React, { useEffect, Fragment } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Task, TaskStatus } from '../types';
import { useUpdateTaskMutation } from '../store/plantApi';
import { format } from 'date-fns';

const taskSchema = z.object({
  name: z.string().min(1, 'Task name cannot be empty.'),
  description: z.string().optional(),
  due_date: z.string().optional(),
  status: z.nativeEnum(TaskStatus),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ isOpen, onClose, task }) => {
  const [updateTask, { isLoading }] = useUpdateTaskMutation();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
  });

  useEffect(() => {
    if (task) {
      reset({
        name: task.name,
        description: task.description || '',
        due_date: task.due_date ? format(new Date(task.due_date + 'T00:00:00'), 'yyyy-MM-dd') : '',
        status: task.status,
      });
    }
  }, [task, isOpen, reset]);

  const handleFormSubmit = async (data: TaskFormData) => {
    if (!task) return;
    try {
      await updateTask({
        id: task.id,
        garden_plan_id: task.garden_plan_id,
        ...data,
        due_date: data.due_date || undefined,
      }).unwrap();
      onClose();
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  if (!isOpen || !task) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-gray-900 mb-4">
                  Edit Task
                </Dialog.Title>
                <form onSubmit={handleSubmit(handleFormSubmit)}>
                  <div className="mb-4">
                    <label htmlFor="taskNameModal" className="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
                    <input
                      id="taskNameModal"
                      type="text"
                      {...register("name")}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div className="mb-4">
                    <label htmlFor="taskDescriptionModal" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      id="taskDescriptionModal"
                      {...register("description")}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="taskDueDateModal" className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      id="taskDueDateModal"
                      type="date"
                      {...register("due_date")}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                   <div className="mb-4">
                    <label htmlFor="taskStatusModal" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      id="taskStatusModal"
                      {...register("status")}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      {Object.values(TaskStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end space-x-2 mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">
                      Cancel
                    </button>
                    <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50">
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default TaskDetailModal;
