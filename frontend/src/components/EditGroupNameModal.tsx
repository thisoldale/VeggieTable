import React, { useEffect, Fragment } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, Transition } from '@headlessui/react';

const groupNameSchema = z.object({
  name: z.string().min(1, 'Group name cannot be empty.'),
});

type GroupNameFormData = z.infer<typeof groupNameSchema>;

interface EditGroupNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newName: string) => Promise<void>;
  initialName: string;
  title: string;
}

const EditGroupNameModal: React.FC<EditGroupNameModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialName,
  title,
}) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<GroupNameFormData>({
    resolver: zodResolver(groupNameSchema),
  });

  useEffect(() => {
    if (isOpen) {
      reset({ name: initialName });
    }
  }, [isOpen, initialName, reset]);

  const handleFormSubmit = async (data: GroupNameFormData) => {
    await onSubmit(data.name);
  };

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
                <Dialog.Title
                  as="h3"
                  className="text-2xl font-bold leading-6 text-gray-900 mb-4"
                >
                  {title}
                </Dialog.Title>
                <form onSubmit={handleSubmit(handleFormSubmit)}>
                  <input
                    type="text"
                    {...register("name")}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    autoFocus
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 bg-gray-200 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving...' : 'Save'}
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

export default EditGroupNameModal;
