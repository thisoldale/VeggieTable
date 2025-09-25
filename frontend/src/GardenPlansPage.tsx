import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useGetGardenPlansQuery, useAddGardenPlanMutation, useDeleteGardenPlanMutation } from './store/plantApi';
import { usePlan } from './context/PlanContext';
import { GardenPlan } from './types';
import DeleteConfirmModal from './components/DeleteConfirmModal';

const GardenPlansPage: React.FC = () => {
  const { data: plans, error: queryError, isLoading } = useGetGardenPlansQuery();
  const [addGardenPlan, { isLoading: isAdding, isSuccess, data: newPlanData }] = useAddGardenPlanMutation();
  const [deleteGardenPlan, { isLoading: isDeleting }] = useDeleteGardenPlanMutation();
  const { activePlan, setActivePlan, clearActivePlan } = usePlan();
  const navigate = useNavigate();

  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanDescription, setNewPlanDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<GardenPlan | null>(null);

  useEffect(() => {
    if (isSuccess && newPlanData) {
      setActivePlan(newPlanData);
      navigate('/');
    }
  }, [isSuccess, newPlanData, setActivePlan, navigate]);

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName.trim()) {
      toast.error('Plan name is required.');
      return;
    }
    setError(null);

    const promise = addGardenPlan({
      name: newPlanName,
      description: newPlanDescription,
    }).unwrap();

    toast.promise(promise, {
        loading: 'Creating new plan...',
        success: (newPlan) => {
            setNewPlanName('');
            setNewPlanDescription('');
            setActivePlan(newPlan);
            navigate('/');
            return `Plan "${newPlan.name}" created successfully!`;
        },
        error: (err) => err.data?.detail || 'Failed to add plan. Please try again.',
    });
  };

  const openDeleteModal = (plan: GardenPlan) => {
    setPlanToDelete(plan);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!planToDelete) return;

    const promise = deleteGardenPlan(planToDelete.id).unwrap();

    toast.promise(promise, {
        loading: 'Deleting plan...',
        success: () => {
            if (activePlan?.id === planToDelete.id) {
                clearActivePlan();
            }
            return 'Plan deleted successfully!';
        },
        error: 'Failed to delete plan.',
    });

    setIsDeleteModalOpen(false);
    setPlanToDelete(null);
  };

  return (
    <div className="p-4 md:p-8 bg-background text-foreground min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-primary">My Garden Plans</h1>

        <div className="bg-component-background p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-bold mb-4">Create a New Plan</h2>
          <form onSubmit={handleAddPlan} className="space-y-4">
            <div>
              <label htmlFor="planName" className="block text-sm font-medium text-muted-foreground mb-1">Plan Name</label>
              <input
                id="planName"
                type="text"
                placeholder="e.g., Spring Veggie Patch 2025"
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                className="w-full p-3 bg-component-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              />
            </div>
            <div>
              <label htmlFor="planDescription" className="block text-sm font-medium text-muted-foreground mb-1">Description (Optional)</label>
              <textarea
                id="planDescription"
                placeholder="Notes about this garden plan..."
                value={newPlanDescription}
                onChange={(e) => setNewPlanDescription(e.target.value)}
                rows={3}
                className="w-full p-3 bg-component-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              />
            </div>
            {error && <p className="text-destructive text-sm mb-4">{error}</p>}
            <button
              type="submit"
              disabled={isAdding}
              className="w-full bg-interactive-primary text-interactive-primary-foreground p-3 rounded-lg hover:bg-interactive-primary/90 transition duration-300 ease-in-out transform hover:-translate-y-1 disabled:opacity-50"
            >
              {isAdding ? 'Creating...' : 'Create Plan'}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <p className="text-center text-muted-foreground">Loading plans...</p>
          ) : queryError ? (
            <p className="text-center text-destructive">Failed to load plans.</p>
          ) : plans?.length === 0 ? (
            <p className="text-center text-muted-foreground italic">No garden plans created yet.</p>
          ) : (
            plans?.map((plan) => (
              <div key={plan.id} className="bg-component-background p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 flex justify-between items-center">
                <div className="flex-grow">
                  <Link to={`/plans/${plan.id}`} className="block">
                    <h3 className="text-xl font-bold text-primary hover:text-primary/90 transition-colors">{plan.name}</h3>
                    <p className="text-muted-foreground mt-2">{plan.description}</p>
                    <p className="text-sm text-muted-foreground mt-2">Created: {new Date(plan.created_date).toLocaleDateString()}</p>
                  </Link>
                </div>
                <div className="flex flex-col items-end ml-4 space-y-2">
                  <button
                    onClick={() => {
                      setActivePlan(plan);
                      navigate('/');
                      toast.success(`Plan "${plan.name}" selected.`);
                    }}
                    className="px-4 py-2 text-sm font-medium rounded-md text-interactive-primary-foreground bg-interactive-primary hover:bg-interactive-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
                  >
                    Select
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); openDeleteModal(plan); }}
                    className="p-2 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                    disabled={isDeleting}
                    aria-label="Delete plan"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {planToDelete && (
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title={`Delete Plan: ${planToDelete.name}`}
          message={<p>Are you sure you want to delete this plan? This will also delete all associated plantings, groups, and tasks. This action cannot be undone.</p>}
        />
      )}
    </div>
  );
};

export default GardenPlansPage;
