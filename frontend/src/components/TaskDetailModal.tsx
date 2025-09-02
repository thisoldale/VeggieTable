import React, { useEffect, Fragment, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Task, TaskStatus } from '../types';
import { useUpdateTaskMutation, useAddTaskMutation, useUpdateTaskGroupMutation, useGetTasksForPlanQuery, useUnlinkTaskGroupMutation } from '../store/plantApi';
import { usePlan } from '../context/PlanContext';
import { format, differenceInDays } from 'date-fns';

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
  task?: Task | null;
  initialDate?: Date | null;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ isOpen, onClose, task, initialDate }) => {
  const { activePlan } = usePlan();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const [addTask, { isLoading: isAdding }] = useAddTaskMutation();
  const [updateTaskGroup] = useUpdateTaskGroupMutation();
  const [unlinkTaskGroup] = useUnlinkTaskGroupMutation();
  const { data: tasksForPlan } = useGetTasksForPlanQuery(activePlan?.id ?? 0, { skip: !activePlan });

  const isCreateMode = !task;
  const isLoading = isUpdating || isAdding;

  const [updateAllLinked, setUpdateAllLinked] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (isCreateMode) {
        reset({
          name: '',
          description: '',
          due_date: initialDate ? format(initialDate, 'yyyy-MM-dd') : '',
          status: TaskStatus.PENDING,
        });
      } else if (task) {
        reset({
          name: task.name,
          description: task.description || '',
          due_date: task.due_date ? format(new Date(task.due_date + 'T00:00:00'), 'yyyy-MM-dd') : '',
          status: task.status,
        });
      }
      setUpdateAllLinked(false);
    }
  }, [task, isCreateMode, isOpen, reset, initialDate]);

  const handleFormSubmit = async (data: TaskFormData) => {
    try {
      if (isCreateMode) {
        if (!activePlan) throw new Error("No active plan selected");
        await addTask({
          ...data,
          garden_plan_id: activePlan.id,
          due_date: data.due_date || undefined,
        }).unwrap();
      } else if (task) {
        if (updateAllLinked && task.task_group_id && tasksForPlan) {
          const originalTask = tasksForPlan.find(t => t.id === task.id);
          const originalDate = originalTask?.due_date ? new Date(originalTask.due_date + 'T00:00:00') : null;
          const newDate = data.due_date ? new Date(data.due_date + 'T00:00:00') : null;

          if (originalDate && newDate) {
            const dateDiffDays = differenceInDays(newDate, originalDate);
            if (dateDiffDays !== 0) {
              await updateTaskGroup({ groupId: task.task_group_id!, dateDiffDays }).unwrap();
            }
          }
          // Also update the current task's non-date fields
          await updateTask({
            id: task.id,
            name: data.name,
            description: data.description,
            status: data.status,
          }).unwrap();
        } else {
          await updateTask({
            id: task.id,
            ...data,
            due_date: data.due_date || undefined,
          }).unwrap();
        }
      }
      onClose();
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  };

  const handleUnlink = async () => {
    if (task && task.task_group_id) {
        try {
            await unlinkTaskGroup({ groupId: task.task_group_id }).unwrap();
            onClose();
        } catch (err) {
            console.error('Failed to unlink tasks:', err);
        }
    }
  };

  if (!isOpen) return null;

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
                  {isCreateMode ? 'Add New Task' : 'Edit Task'}
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

                  {task && task.task_group_id && (
                    <div className="my-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-yellow-800">This task is linked to other tasks.</p>
                        <button
                          type="button"
                          onClick={handleUnlink}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          Unlink
                        </button>
                      </div>
                      <label className="mt-2 flex items-center text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={updateAllLinked}
                          onChange={(e) => setUpdateAllLinked(e.target.checked)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2">Update due dates of all linked tasks proportionally</span>
                      </label>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">
                      Cancel
                    </button>
                    <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50">
                      {isLoading ? 'Saving...' : (isCreateMode ? 'Add Task' : 'Save Changes')}
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
