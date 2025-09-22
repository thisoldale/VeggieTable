import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useGetGardenPlansQuery, useAddGardenPlanMutation } from '../store/plantApi';
import { usePlan } from '../context/PlanContext';
import { GardenPlan } from '../types';

interface ChangePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePlanModal: React.FC<ChangePlanModalProps> = ({ isOpen, onClose }) => {
  const { data: plans, isLoading: isLoadingPlans } = useGetGardenPlansQuery();
  const [addGardenPlan, { isLoading: isAddingPlan }] = useAddGardenPlanMutation();
  const { setActivePlan } = usePlan();

  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanDescription, setNewPlanDescription] = useState('');

  const handleSelectPlan = (plan: GardenPlan) => {
    setActivePlan(plan);
    onClose();
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName.trim()) return;
    try {
      const newPlan = await addGardenPlan({
        name: newPlanName,
        description: newPlanDescription,
      }).unwrap();
      setActivePlan(newPlan);
      setNewPlanName('');
      setNewPlanDescription('');
      onClose();
    } catch (error) {
      console.error("Failed to create plan:", error);
    }
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-component-background p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-2xl font-bold leading-6 text-foreground mb-4"
                >
                  Change or Create Plan
                </Dialog.Title>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Select Existing Plan */}
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Select an Existing Plan</h4>
                    {isLoadingPlans ? (
                      <p>Loading plans...</p>
                    ) : (
                      <ul className="max-h-60 overflow-y-auto border border-border rounded-md divide-y divide-border">
                        {plans?.map(plan => (
                          <li key={plan.id}>
                            <button onClick={() => handleSelectPlan(plan)} className="w-full text-left p-2 hover:bg-secondary">
                              {plan.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Create New Plan */}
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Or Create a New One</h4>
                    <form onSubmit={handleCreatePlan}>
                      <div className="mb-2">
                        <label htmlFor="newPlanName" className="sr-only">Plan Name</label>
                        <input
                          id="newPlanName"
                          type="text"
                          placeholder="New plan name"
                          value={newPlanName}
                          onChange={(e) => setNewPlanName(e.target.value)}
                          className="w-full p-2 border border-border bg-component-background rounded-md"
                        />
                      </div>
                      <div className="mb-4">
                        <label htmlFor="newPlanDesc" className="sr-only">Description</label>
                        <textarea
                          id="newPlanDesc"
                          placeholder="Description (optional)"
                          value={newPlanDescription}
                          onChange={(e) => setNewPlanDescription(e.target.value)}
                          rows={2}
                          className="w-full p-2 border border-border bg-component-background rounded-md"
                        />
                      </div>
                      <button type="submit" disabled={isAddingPlan} className="w-full bg-interactive-primary text-interactive-primary-foreground p-2 rounded-md hover:bg-interactive-primary/90 disabled:opacity-50">
                        {isAddingPlan ? 'Creating...' : 'Create and Select'}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 bg-interactive-secondary text-interactive-secondary-foreground rounded-md"
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

export default ChangePlanModal;
