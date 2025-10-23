import React, { useEffect, Fragment, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Task, TaskStatus } from '../types';
import {
  useUpdateTaskMutation,
  useAddTaskMutation,
  useDeleteTaskMutation,
} from '../store/plantApi';
import { usePlan } from '../context/PlanContext';
import { format } from 'date-fns';
import RecurrenceEditor from './RecurrenceEditor';
import { Trash2 } from 'lucide-react';

const taskSchema = z.object({
  name: z.string().min(1, 'Task name cannot be empty.'),
  description: z.string().optional(),
  due_date: z.string().optional(),
  status: z.nativeEnum(TaskStatus),
  recurrence_rule: z.string().optional(),
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
  const [updateTask] = useUpdateTaskMutation();
  const [addTask] = useAddTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();

  const isCreateMode = !task;

  const [isRecurring, setIsRecurring] = useState(false);
  const [rrule, setRrule] = useState('');

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<TaskFormData>({
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
          recurrence_rule: '',
        });
        setIsRecurring(false);
        setRrule('');
      } else if (task) {
        reset({
          name: task.name,
          description: task.description || '',
          due_date: task.due_date ? format(new Date(task.due_date + 'T00:00:00'), 'yyyy-MM-dd') : '',
          status: task.status,
          recurrence_rule: task.recurrence_rule || '',
        });
        setIsRecurring(!!task.recurrence_rule);
        setRrule(task.recurrence_rule || '');
      }
    }
  }, [task, isCreateMode, isOpen, reset, initialDate]);

  const handleFormSubmit = async (data: TaskFormData) => {
    if (!activePlan) return;

    const taskData = {
      ...data,
      garden_plan_id: activePlan.id,
      due_date: data.due_date || undefined,
      recurrence_rule: isRecurring ? rrule : undefined,
    };

    if (isCreateMode) {
      await addTask(taskData).unwrap();
    } else if (task) {
      await updateTask({ id: task.id, ...taskData }).unwrap();
    }

    onClose();
  };

  const handleDelete = () => {
    if (!task) return;
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(task.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-lg bg-component-background p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-foreground mb-4">
                    {isCreateMode ? 'Add New Task' : 'Edit Task'}
                  </Dialog.Title>
                  <form onSubmit={handleSubmit(handleFormSubmit)}>
                    <div className="space-y-4">
                      {/* Form fields */}
                      <div>
                          <label htmlFor="taskNameModal" className="block text-sm font-medium text-muted-foreground mb-1">Task Name</label>
                          <input id="taskNameModal" type="text" {...register("name")} className="w-full p-2 border border-border rounded-md bg-background text-foreground"/>
                          {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
                      </div>
                      <div>
                          <label htmlFor="taskDescriptionModal" className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                          <textarea id="taskDescriptionModal" {...register("description")} rows={3} className="w-full p-2 border border-border rounded-md bg-background text-foreground"/>
                      </div>
                      <div>
                          <label htmlFor="taskDueDateModal" className="block text-sm font-medium text-muted-foreground mb-1">{isRecurring ? 'Start Date' : 'Due Date'}</label>
                          <input id="taskDueDateModal" type="date" {...register("due_date")} className="w-full p-2 border border-border rounded-md bg-background text-foreground"/>
                      </div>
                      <div className="mb-4">
                          <label htmlFor="taskStatusModal" className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
                          <select id="taskStatusModal" {...register("status")} className="w-full p-2 border border-border rounded-md bg-component-background text-foreground">
                              {Object.values(TaskStatus).map(status => (<option key={status} value={status}>{status}</option>))}
                          </select>
                      </div>

                      {/* Recurrence Section */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isRecurring"
                          checked={isRecurring}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setIsRecurring(checked);
                            if (checked) {
                              setRrule('FREQ=WEEKLY;INTERVAL=1;BYWEEKDAY=MO');
                            } else {
                              setRrule('');
                            }
                          }}
                          className="h-4 w-4 text-primary border-border rounded focus:ring-ring"
                        />
                        <label htmlFor="isRecurring" className="ml-2 text-sm font-medium text-foreground">This is a recurring task</label>
                      </div>

                      {isRecurring && (
                        <RecurrenceEditor value={rrule} onChange={setRrule} />
                      )}
                    </div>

                    {/* Modal Footer */}
                    <div className="flex justify-between items-center mt-6">
                        <div>
                          {!isCreateMode && (
                              <button type="button" onClick={handleDelete} className="p-2 text-destructive hover:bg-destructive/10 rounded-md">
                                  <Trash2 size={20} />
                              </button>
                          )}
                        </div>
                        <div className="flex space-x-2">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-muted text-muted-foreground rounded-md">
                                Cancel
                            </button>
                            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
                                {isCreateMode ? 'Add Task' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default TaskDetailModal;