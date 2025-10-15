import React, { useEffect, Fragment, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Task, TaskStatus } from '../types';
import {
  useUpdateTaskMutation,
  useAddTaskMutation,
  useAddRecurringTaskMutation,
  useDeleteTaskMutation,
  useDeleteRecurringTaskMutation,
  useDeleteTaskInstanceMutation,
  useUpdateRecurringTaskMutation,
  useUpdateTaskInstanceMutation
} from '../store/plantApi';
import { usePlan } from '../context/PlanContext';
import { format } from 'date-fns';
import RecurrenceEditor from './RecurrenceEditor';
import DeleteRecurringTaskDialog from './DeleteRecurringTaskDialog';
import UpdateRecurringTaskDialog from './UpdateRecurringTaskDialog';
import { Trash2 } from 'lucide-react';

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
  const [updateTask] = useUpdateTaskMutation();
  const [addTask] = useAddTaskMutation();
  const [addRecurringTask] = useAddRecurringTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [deleteRecurringTask] = useDeleteRecurringTaskMutation();
  const [deleteTaskInstance] = useDeleteTaskInstanceMutation();
  const [updateRecurringTask] = useUpdateRecurringTaskMutation();
  const [updateTaskInstance] = useUpdateTaskInstanceMutation();

  const isCreateMode = !task;

  const [isRecurring, setIsRecurring] = useState(false);
  const [rrule, setRrule] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [formData, setFormData] = useState<TaskFormData | null>(null);

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
        setIsRecurring(false);
        setRrule('');
      } else if (task) {
        reset({
          name: task.name,
          description: task.description || '',
          due_date: task.due_date ? format(new Date(task.due_date + 'T00:00:00'), 'yyyy-MM-dd') : '',
          status: task.status,
        });
        // A more complete implementation would fetch the RecurringTask details to get the full rule
        setIsRecurring(!!task.recurring_task_id);
        if (task.recurring_task_id) {
            // In a real app, you'd fetch the recurring task details here
            // For now, we'll just allow creating a new rule if they edit the series.
            setRrule('');
        }
      }
    }
  }, [task, isCreateMode, isOpen, reset, initialDate]);

  const handleFormSubmit = async (data: TaskFormData) => {
    if (isCreateMode) {
      handleCreate(data);
    } else {
      handleUpdate(data);
    }
  };

  const handleCreate = async (data: TaskFormData) => {
    if (!activePlan) return;
    if (isRecurring) {
      if (!data.due_date) {
        alert("Please select a start date for the recurring task.");
        return;
      }
      await addRecurringTask({
        name: data.name,
        description: data.description,
        garden_plan_id: activePlan.id,
        recurrence_rule: rrule,
        start_date: data.due_date,
      }).unwrap();
    } else {
      await addTask({
        ...data,
        garden_plan_id: activePlan.id,
        due_date: data.due_date || undefined,
      }).unwrap();
    }
    onClose();
  };

  const handleUpdate = (data: TaskFormData) => {
    if (!task) return;
    setFormData(data); // Store form data to use after dialog confirmation
    if (task.recurring_task_id) {
      setShowUpdateDialog(true);
    } else {
      // It's a non-recurring task, update directly
      updateTask({ id: task.id, ...data, due_date: data.due_date || undefined });
      onClose();
    }
  };

  const executeUpdateInstance = async () => {
    if (!task || !formData || !task.recurring_task_id) return;
    await updateTaskInstance({
      recurring_task_id: task.recurring_task_id,
      task_id: task.id,
      task_update: { ...formData, due_date: formData.due_date || undefined }
    }).unwrap();
    setShowUpdateDialog(false);
    onClose();
  };

  const executeUpdateSeries = async () => {
    if (!task || !formData || !task.recurring_task_id) return;
    await updateRecurringTask({
      id: task.recurring_task_id,
      name: formData.name,
      description: formData.description,
      recurrence_rule: rrule, // Assumes rrule state is updated for series edit
    }).unwrap();
    setShowUpdateDialog(false);
    onClose();
  };

  const handleDelete = () => {
    if (!task) return;
    if (task.recurring_task_id) {
      setShowDeleteDialog(true);
    } else {
      if (window.confirm('Are you sure you want to delete this task?')) {
        deleteTask(task.id);
        onClose();
      }
    }
  };

  const executeDeleteInstance = async () => {
    if (!task || !task.recurring_task_id) return;
    await deleteTaskInstance({ recurring_task_id: task.recurring_task_id, task_id: task.id }).unwrap();
    setShowDeleteDialog(false);
    onClose();
  };

  const executeDeleteSeries = async () => {
    if (!task || !task.recurring_task_id) return;
    await deleteRecurringTask(task.recurring_task_id).unwrap();
    setShowDeleteDialog(false);
    onClose();
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
                      {isCreateMode && (
                        <div className="flex items-center">
                          <input type="checkbox" id="isRecurring" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="h-4 w-4 text-primary border-border rounded focus:ring-ring"/>
                          <label htmlFor="isRecurring" className="ml-2 text-sm font-medium text-foreground">This is a recurring task</label>
                        </div>
                      )}

                      {(isCreateMode && isRecurring) && (
                        <RecurrenceEditor value={rrule} onChange={setRrule} />
                      )}

                      {!isCreateMode && task?.recurring_task_id && (
                          <div className="p-3 bg-secondary/20 border border-border rounded-md">
                            <p className="text-sm text-foreground font-semibold">This is a recurring task.</p>
                            <p className="text-xs text-muted-foreground mb-3">To change the recurrence rule, edit the entire series.</p>
                             <RecurrenceEditor value={rrule} onChange={setRrule} />
                          </div>
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

      <DeleteRecurringTaskDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onDeleteInstance={executeDeleteInstance}
        onDeleteSeries={executeDeleteSeries}
      />

      <UpdateRecurringTaskDialog
        isOpen={showUpdateDialog}
        onClose={() => setShowUpdateDialog(false)}
        onUpdateInstance={executeUpdateInstance}
        onUpdateSeries={executeUpdateSeries}
      />
    </>
  );
};

export default TaskDetailModal;