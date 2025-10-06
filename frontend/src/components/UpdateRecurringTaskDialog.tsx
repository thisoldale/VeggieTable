import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

interface UpdateRecurringTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateInstance: () => void;
  onUpdateSeries: () => void;
}

const UpdateRecurringTaskDialog: React.FC<UpdateRecurringTaskDialogProps> = ({
  isOpen,
  onClose,
  onUpdateInstance,
  onUpdateSeries,
}) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-component-background p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-foreground">
                  Update Recurring Task
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">
                    This is a recurring task. Do you want to save changes for this event only, or for the entire series?
                  </p>
                </div>
                 <div className="mt-4 flex flex-col space-y-2">
                  <button type="button" onClick={onUpdateInstance} className="w-full px-4 py-2 bg-interactive-primary text-interactive-primary-foreground rounded-md hover:bg-interactive-primary/90">
                    Save For This Instance Only
                  </button>
                  <button type="button" onClick={onUpdateSeries} className="w-full px-4 py-2 bg-interactive-secondary text-interactive-secondary-foreground rounded-md hover:bg-interactive-secondary/90">
                    Save For The Entire Series
                  </button>
                  <button type="button" onClick={onClose} className="w-full px-4 py-2 mt-2 bg-muted text-muted-foreground rounded-md">
                    Cancel
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

export default UpdateRecurringTaskDialog;