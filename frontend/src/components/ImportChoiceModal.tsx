import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

interface ImportChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAppend: () => void;
  onReplace: () => void;
}

const ImportChoiceModal: React.FC<ImportChoiceModalProps> = ({ isOpen, onClose, onAppend, onReplace }) => {
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
              <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-bold leading-6 text-gray-800"
                >
                  CSV Import Options
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-700">
                    Choose how to import the CSV data:
                  </p>
                </div>

                <div className="mt-4 flex flex-col space-y-3">
                  <button
                    type="button"
                    className="w-full px-4 py-2 rounded-md transition duration-200 bg-blue-500 text-white hover:bg-blue-600 text-sm"
                    onClick={onAppend}
                  >
                    Append (Add new or update existing by ID)
                  </button>
                  <button
                    type="button"
                    className="w-full px-4 py-2 rounded-md transition duration-200 bg-red-500 text-white hover:bg-red-600 text-sm"
                    onClick={onReplace}
                  >
                    Replace (Delete all existing, then add new)
                  </button>
                  <button
                    type="button"
                    className="w-full px-4 py-2 rounded-md transition duration-200 bg-gray-300 text-gray-800 hover:bg-gray-400 text-sm"
                    onClick={onClose}
                  >
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

export default ImportChoiceModal;
