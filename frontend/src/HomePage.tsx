import React, { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePlan } from './context/PlanContext';
import { useGetGardenPlanByIdQuery, useUpdatePlantingMutation, useUpdateTaskMutation, useDeletePlantingMutation, useDeleteTaskMutation } from './store/plantApi';
import { Plant, Planting, PlantingMethod, GardenPlan, Task, TaskStatus, PlantingStatus } from './types';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, isToday, isSameWeek } from 'date-fns';
import { Popover, Transition } from '@headlessui/react';
import PlantSelectionModal from './components/PlantSelectionModal';
import AddToPlanModal from './components/AddToPlanModal';
import TaskDetailModal from './components/TaskDetailModal';

type CalendarItem = {
  id: string;
  type: 'sow' | 'transplant' | 'harvest' | 'task';
  name: string;
  date: Date;
  data: Planting | Task;
};

const CalendarDay: React.FC<{ 
  day: Date; 
  dayIndex: number; // Index of the day in the week (0-6)
  onActionSelect: (action: PlantingMethod | 'harvest' | 'task', date: Date) => void;
}> = ({ day, dayIndex, onActionSelect }) => {
  const dayIsToday = isToday(day);
  const popoverPanelClasses = dayIndex < 4 ? 'left-0' : 'right-0';

  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button
    className={`w-full h-24 border-t border-r border-gray-200 dark:border-gray-700 p-2 flex flex-col justify-center items-center cursor-pointer transition-colors duration-150 ${open ? 'bg-green-100 dark:bg-green-800/50' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
    <span className="text-xs text-gray-500 dark:text-gray-400">{format(day, 'EEE')}</span>
    <span className={`text-2xl mt-1 ${dayIsToday ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
              {format(day, 'd')}
            </span>
          </Popover.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
    <Popover.Panel className={`absolute z-10 w-48 p-2 mt-2 bg-white dark:bg-gray-800 rounded-md shadow-lg ${popoverPanelClasses}`}>
        <div className="flex flex-col space-y-1 text-gray-800 dark:text-gray-200">
            <button onClick={() => onActionSelect(PlantingMethod.DIRECT_SEEDING, day)} className="w-full text-left p-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Direct Seed</button>
            <button onClick={() => onActionSelect(PlantingMethod.SEED_STARTING, day)} className="w-full text-left p-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Start Seeds</button>
            <button onClick={() => onActionSelect(PlantingMethod.SEEDLING, day)} className="w-full text-left p-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Plant Seedling</button>
            <button onClick={() => onActionSelect('harvest', day)} className="w-full text-left p-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Harvest</button>
            <div className="border-t my-1 dark:border-gray-600"></div>
            <button onClick={() => onActionSelect('task', day)} className="w-full text-left p-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Add Task</button>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
};

const CalendarWeek: React.FC<{
    week: Date;
    tasks: Record<string, CalendarItem[]>;
    onActionSelect: (action: PlantingMethod | 'harvest' | 'task', date: Date) => void;
    onItemClick: (item: CalendarItem) => void;
    onComplete: (item: CalendarItem) => void;
    onUndo: (item: CalendarItem) => void;
    onDelete: (item: CalendarItem) => void;
}> = ({ week, tasks, onActionSelect, onItemClick, onComplete, onUndo, onDelete }) => {
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(week, i));
    const weeklyTasks = weekDays.flatMap(day => tasks[format(day, 'yyyy-MM-dd')] || []).sort((a, b) => a.date.getTime() - b.date.getTime());
    const isCurrent = isSameWeek(new Date(), week, { weekStartsOn: 0 });

    const getTaskColor = (type: CalendarItem['type']) => {
        switch (type) {
            case 'sow': return 'text-blue-600';
            case 'transplant': return 'text-purple-600';
            case 'harvest': return 'text-green-600';
            case 'task': return 'text-yellow-700';
            default: return 'text-gray-800';
        }
    };
    
    const getTaskIcon = (type: CalendarItem['type']) => {
        switch (type) {
            case 'sow': return '🌱';
            case 'transplant': return '🌿';
            case 'harvest': return '🧺';
            case 'task': return '📝';
            default: return '•';
        }
    };

    const isComplete = (item: CalendarItem): boolean => {
        if (item.type === 'task') {
            return (item.data as Task).status === TaskStatus.COMPLETED;
        }
        const planting = item.data as Planting;
        switch (item.type) {
            case 'sow':
                return [PlantingStatus.DIRECT_SOWN, PlantingStatus.STARTED, PlantingStatus.TRANSPLANTED, PlantingStatus.GROWING, PlantingStatus.HARVESTING, PlantingStatus.DONE].includes(planting.status);
            case 'transplant':
                return [PlantingStatus.TRANSPLANTED, PlantingStatus.GROWING, PlantingStatus.HARVESTING, PlantingStatus.DONE].includes(planting.status);
            case 'harvest':
                return [PlantingStatus.HARVESTING, PlantingStatus.DONE].includes(planting.status);
            default:
                return false;
        }
    };

    return (
<div className={`mb-8 p-4 rounded-lg transition-colors duration-300 ${isCurrent ? 'bg-green-100 dark:bg-green-900/50' : 'bg-white dark:bg-gray-900'}`}>
    <h2 className="text-xl font-bold mb-2 text-gray-700 dark:text-gray-200">{format(week, 'MMMM yyyy')} - Week of {format(week, 'do')}</h2>
    <div className="grid grid-cols-7 border-l border-b border-gray-200 dark:border-gray-700 rounded-lg">
                {weekDays.map((day, index) => (
                    <CalendarDay key={day.toString()} day={day} dayIndex={index} onActionSelect={onActionSelect} />
                ))}
            </div>
    <div className="p-4 bg-gray-50 dark:bg-gray-800 border-l border-r border-b border-gray-200 dark:border-gray-700 rounded-b-lg -mt-2">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">This Week's Actions</h3>
                {weeklyTasks.length > 0 ? (
                    <ul className="space-y-1">
                        {weeklyTasks.map(item => {
                            const itemIsComplete = isComplete(item);
                            return (
<li key={item.id} className="text-sm flex items-center justify-between p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
    <div className={`flex items-center cursor-pointer flex-grow ${itemIsComplete ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'}`} onClick={() => onItemClick(item)}>
                                        <span className="font-medium w-24 flex-shrink-0">{format(item.date, 'EEE, MMM d')}:</span>
                                        <span className={`font-medium mr-2 ${getTaskColor(item.type)}`}>
                                            {getTaskIcon(item.type)} {item.type.charAt(0).toUpperCase() + item.type.slice(1)}:
                                        </span> 
        <span className="text-gray-800 dark:text-gray-200">
                                          {item.name}
          {item.type === 'task' && <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">({(item.data as Task).status})</span>}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                                        {itemIsComplete ? (
            <button onClick={(e) => { e.stopPropagation(); onUndo(item); }} className="px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700">Undo</button>
                                        ) : (
            <button onClick={(e) => { e.stopPropagation(); onComplete(item); }} className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700">Done</button>
                                        )}
        <button onClick={(e) => { e.stopPropagation(); onDelete(item); }} className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700">Delete</button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500 italic">No actions planned for this week.</p>
                )}
            </div>
        </div>
    );
};


const CalendarView: React.FC = () => {
  const { activePlan, clearActivePlan } = usePlan();
  const { data: fullActivePlan, isLoading, error, refetch, originalArgs } = useGetGardenPlanByIdQuery(activePlan!.id, { skip: !activePlan });
  const [updatePlanting] = useUpdatePlantingMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deletePlanting] = useDeletePlantingMutation();
  const [deleteTask] = useDeleteTaskMutation();

  const [weeks, setWeeks] = useState<Date[]>([]);
  const [tasks, setTasks] = useState<Record<string, CalendarItem[]>>({});
  const loaderRef = useRef(null);
  const navigate = useNavigate();

  // State for modals
  const [plantSelectionModalOpen, setPlantSelectionModalOpen] = useState(false);
  const [addToPlanModalOpen, setAddToPlanModalOpen] = useState(false);
  const [taskDetailModalOpen, setTaskDetailModalOpen] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAction, setSelectedAction] = useState<PlantingMethod | 'harvest' | null>(null);
  const [plantForModal, setPlantForModal] = useState<Plant | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    if (error && 'status' in error && error.status === 404 && activePlan?.id === originalArgs) {
      clearActivePlan();
    }
  }, [error, clearActivePlan, activePlan, originalArgs]);

  useEffect(() => {
    const today = new Date();
    const startDate = startOfWeek(subWeeks(today, 2));
    const initialWeeks = Array.from({ length: 10 }).map((_, i) => addWeeks(startDate, i));
    setWeeks(initialWeeks);
  }, []);

  useEffect(() => {
    if (fullActivePlan) {
        const allItems: CalendarItem[] = [];

        (fullActivePlan.plantings || []).forEach(p => {
            const taskName = `${p.plant_name}${p.variety_name ? ` (${p.variety_name})` : ''} - ${p.quantity} Plants`;
            if (p.planned_sow_date) {
                const date = new Date(p.planned_sow_date + 'T00:00:00');
                allItems.push({ id: `planting-sow-${p.id}`, type: 'sow', name: taskName, date, data: p });
            }
            if (p.planned_transplant_date) {
                const date = new Date(p.planned_transplant_date + 'T00:00:00');
                allItems.push({ id: `planting-transplant-${p.id}`, type: 'transplant', name: taskName, date, data: p });
            }
            if (p.weekly_yield) {
                const yields = p.weekly_yield.split(';').map(y => parseFloat(y));
                const sowOrTransplantDate = p.planned_transplant_date || p.planned_sow_date;
                if (sowOrTransplantDate) {
                    const startDate = new Date(sowOrTransplantDate + 'T00:00:00');
                    yields.forEach((y, weekIndex) => {
                        if (y > 0) {
                            const harvestDate = addDays(startDate, (weekIndex + 1) * 7);
                            allItems.push({ id: `planting-harvest-${p.id}-w${weekIndex}`, type: 'harvest', name: taskName, date: harvestDate, data: p });
                        }
                    });
                }
            }
        });
      
      (fullActivePlan.tasks || []).forEach(t => {
          if (t.due_date) {
              const date = new Date(t.due_date + 'T00:00:00');
              allItems.push({ id: `task-${t.id}`, type: 'task', name: t.name, date, data: t });
          }
      });

      const newTasks: Record<string, CalendarItem[]> = {};
      allItems.forEach(item => {
        const dateKey = format(item.date, 'yyyy-MM-dd');
        if (!newTasks[dateKey]) newTasks[dateKey] = [];
        newTasks[dateKey].push(item);
      });

      setTasks(newTasks);
    }
  }, [fullActivePlan]);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting) {
      setWeeks(prev => {
        const lastWeek = prev[prev.length - 1];
        const nextWeek = addWeeks(lastWeek, 1);
        return [...prev, nextWeek];
      });
    }
  }, []);

  useEffect(() => {
    const element = loaderRef.current;
    const option = { root: null, rootMargin: "20px", threshold: 0 };
    const observer = new IntersectionObserver(handleObserver, option);
    if (element) {
        observer.observe(element);
    }
    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [handleObserver]);

  const handleActionSelect = (action: PlantingMethod | 'harvest' | 'task', date: Date) => {
    setSelectedDate(date);
    if (action === 'task') {
      setSelectedTask(null); // Ensure we're in create mode
      setTaskDetailModalOpen(true);
    } else {
      setSelectedAction(action);
      setPlantSelectionModalOpen(true);
    }
  };

  const handlePlantSelected = (plant: Plant) => {
    setPlantForModal(plant);
    setPlantSelectionModalOpen(false);
    setAddToPlanModalOpen(true);
  };
  
  const closeAddToPlanModal = () => {
    setAddToPlanModalOpen(false);
    setPlantForModal(null);
    setSelectedDate(null);
    setSelectedAction(null);
  };

  const handlePlantingsAdded = () => {
    refetch();
    closeAddToPlanModal();
  };
  
  const handleItemClick = (item: CalendarItem) => {
      if (item.type === 'task') {
          setSelectedTask(item.data as Task);
          setTaskDetailModalOpen(true);
      } else {
          navigate(`/plantings/${(item.data as Planting).id}`);
      }
  };

  const handleComplete = async (item: CalendarItem) => {
    try {
      if (item.type === 'task') {
        const task = item.data as Task;
        await updateTask({ id: task.id, status: TaskStatus.COMPLETED, garden_plan_id: task.garden_plan_id });
      } else {
        const planting = item.data as Planting;
        let newStatus = planting.status;
        if (item.type === 'sow') newStatus = PlantingStatus.DIRECT_SOWN;
        if (item.type === 'transplant') newStatus = PlantingStatus.TRANSPLANTED;
        if (item.type === 'harvest') newStatus = PlantingStatus.HARVESTING;
        await updatePlanting({ id: planting.id, status: newStatus });
      }
      refetch();
    } catch (err) {
      console.error("Failed to mark item as complete:", err);
    }
  };
  
  const handleUndo = async (item: CalendarItem) => {
    try {
      if (item.type === 'task') {
        const task = item.data as Task;
        await updateTask({ id: task.id, status: TaskStatus.PENDING, garden_plan_id: task.garden_plan_id });
      } else {
        const planting = item.data as Planting;
        await updatePlanting({ id: planting.id, status: PlantingStatus.PLANNED });
      }
      refetch();
    } catch (err) {
      console.error("Failed to undo item status:", err);
    }
  };

  const handleDelete = async (item: CalendarItem) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${item.name}"?`);
    if (!confirmDelete) return;

    try {
      if (item.type === 'task') {
        await deleteTask((item.data as Task).id);
      } else {
        await deletePlanting((item.data as Planting).id);
      }
      refetch();
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  if (isLoading) return <p className="p-8 text-center">Loading Calendar...</p>;

  return (
    <div className="p-4 md:px-8">
      {weeks.map(week => (
        <CalendarWeek
            key={week.toString()}
            week={week}
            tasks={tasks}
            onActionSelect={handleActionSelect}
            onItemClick={handleItemClick}
            onComplete={handleComplete}
            onUndo={handleUndo}
            onDelete={handleDelete}
        />
      ))}
      <div ref={loaderRef} className="h-10">
        <p className="text-center py-4 text-gray-500">Loading more...</p>
      </div>

      <PlantSelectionModal 
        isOpen={plantSelectionModalOpen}
        onClose={() => setPlantSelectionModalOpen(false)}
        onSelectPlant={handlePlantSelected}
      />

      {plantForModal && fullActivePlan && (
        <AddToPlanModal
            isOpen={addToPlanModalOpen}
            onClose={closeAddToPlanModal}
            plant={plantForModal}
            gardenPlan={fullActivePlan}
            onPlantingAdd={handlePlantingsAdded}
            initialDate={selectedDate}
            initialAction={selectedAction}
        />
      )}
      
      <TaskDetailModal 
        isOpen={taskDetailModalOpen}
        onClose={() => setTaskDetailModalOpen(false)}
        task={selectedTask}
        initialDate={selectedDate}
      />
    </div>
  );
};

const HomePage: React.FC = () => {
  const { activePlan } = usePlan();

  if (!activePlan) {
    return (
        <div className="p-8 text-center">
    <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">Welcome to Your Digital Garden</h1>
    <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">Before you start, create a new Plan to organize your garden.</p>
    <Link to="/plans" className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 transition-colors">
                Create a Plan
            </Link>
        </div>
    );
  }

  return <CalendarView />;
};

export default HomePage;
