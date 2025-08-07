import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGetGardenPlansQuery, useAddGardenPlanMutation, useDeleteGardenPlanMutation } from './store/plantApi';
import { usePlan } from './context/PlanContext';
import { GardenPlan } from './types';
import DeleteConfirmModal from './components/DeleteConfirmModal';

const GardenPlansPage: React.FC = () => {
  const { data: plans, error: queryError, isLoading } = useGetGardenPlansQuery();
  const [addGardenPlan, { isLoading: isAdding, isSuccess, data: newPlanData }] = useAddGardenPlanMutation();
  const [deleteGardenPlan] = useDeleteGardenPlanMutation();
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
      setError('Plan name is required.');
      return;
    }
    setError(null);

    try {
      await addGardenPlan({
        name: newPlanName,
        description: newPlanDescription,
      }).unwrap();
      
      setNewPlanName('');
      setNewPlanDescription('');

    } catch (err: any) {
      console.error('Error adding garden plan:', err);
      setError(err.data?.detail || 'Failed to add plan. Please try again.');
    }
  };

  const openDeleteModal = (plan: GardenPlan) => {
    setPlanToDelete(plan);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!planToDelete) return;
    try {
      await deleteGardenPlan(planToDelete.id).unwrap();
      if (activePlan?.id === planToDelete.id) {
        clearActivePlan();
      }
    } catch (err) {
      console.error("Failed to delete plan", err);
    } finally {
      setIsDeleteModalOpen(false);
      setPlanToDelete(null);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-green-700">My Garden Plans</h1>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Create a New Plan</h2>
          <form onSubmit={handleAddPlan}>
            <div className="mb-4">
              <label htmlFor="planName" className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
              <input
                id="planName"
                type="text"
                placeholder="e.g., Spring Veggie Patch 2025"
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="planDescription" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <textarea
                id="planDescription"
                placeholder="Notes about this garden plan..."
                value={newPlanDescription}
                onChange={(e) => setNewPlanDescription(e.target.value)}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button
              type="submit"
              disabled={isAdding}
              className="w-full bg-green-600 text-white p-2 rounded-md hover:bg-green-700 transition duration-200 disabled:opacity-50"
            >
              {isAdding ? 'Creating...' : 'Create Plan'}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <p className="text-center text-gray-600">Loading plans...</p>
          ) : queryError ? (
            <p className="text-center text-red-500">Failed to load plans.</p>
          ) : plans?.length === 0 ? (
            <p className="text-center text-gray-500 italic">No garden plans created yet.</p>
          ) : (
            plans?.map((plan) => (
              <div key={plan.id} className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow flex justify-between items-center">
                <Link to={`/plans/${plan.id}`} className="block flex-grow">
                  <h3 className="text-xl font-bold text-blue-600 hover:underline">{plan.name}</h3>
                  <p className="text-gray-600 mt-1">{plan.description}</p>
                  <p className="text-xs text-gray-400 mt-2">Created: {new Date(plan.created_date).toLocaleDateString()}</p>
                </Link>
                <button 
                  onClick={(e) => { e.stopPropagation(); openDeleteModal(plan); }} 
                  className="ml-4 px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
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
