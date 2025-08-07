import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Planting, Task, PlantingStatus } from '../types';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    type: 'sow' | 'transplant' | 'harvest' | 'task';
    name: string;
    date: Date;
    data: Planting | Task | Planting[];
  } | null;
  onMarkComplete: (item: any, status: PlantingStatus) => void;
}

const QuickActionModal: React.FC<QuickActionModalProps> = ({ isOpen, onClose, item, onMarkComplete }) => {
  const navigate = useNavigate();

  if (!isOpen || !item) return null;

  const isGroup = Array.isArray(item.data);
  const singleItem = isGroup ? item.data[0] : item.data;

  const handleViewDetails = () => {
    if (isGroup && singleItem.planting_group_id) {
      navigate(`/plans/${(singleItem as Planting).garden_plan_id}/groups/${singleItem.planting_group_id}`);
    } else if ('planting_group_id' in singleItem) { // It's a Planting
      navigate(`/plantings/${singleItem.id}`);
    } else { // It's a Task
      // You might want a dedicated task page or a different interaction here
    }
    onClose();
  };
  
  const getCompletionAction = () => {
      switch(item.type) {
          case 'sow':
              return { label: "Mark as Sown", status: PlantingStatus.DIRECT_SOWN };
          case 'transplant':
              return { label: "Mark as Transplanted", status: PlantingStatus.TRANSPLANTED };
          case 'harvest':
               return { label: "Mark as Harvesting", status: PlantingStatus.HARVESTING };
          default:
              return null;
      }
  }
  
  const completionAction = getCompletionAction();

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
          <div className="fixed inset-0 bg-black bg-opacity-30" />
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
                <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900">
                  {item.name}
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    Scheduled for: {format(item.date, 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>

                <div className="mt-6 space-y-2">
                  {completionAction && (
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                      onClick={() => {
                          onMarkComplete(item.data, completionAction.status);
                          onClose();
                      }}
                    >
                      {completionAction.label}
                    </button>
                  )}
                   <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    onClick={handleViewDetails}
                  >
                    View Details
                  </button>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default QuickActionModal;
