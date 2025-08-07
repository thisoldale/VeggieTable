import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PlantingStatus } from './types';
import { useGetGardenPlanByIdQuery, useDeleteGardenPlanMutation } from './store/plantApi';
import { usePlan } from './context/PlanContext';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import { format } from 'date-fns';

const GardenPlanDetailPage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const numericPlanId = Number(planId);
  const navigate = useNavigate();
  const { activePlan, clearActivePlan } = usePlan();

  const { data: plan, error, isLoading } = useGetGardenPlanByIdQuery(numericPlanId, {
    skip: !numericPlanId,
  });
  const [deleteGardenPlan] = useDeleteGardenPlanMutation();
  
  const [isDeletePlanModalOpen, setIsDeletePlanModalOpen] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  
  const handleConfirmDeletePlan = async () => {
    if (!plan) return;
    try {
      await deleteGardenPlan(plan.id).unwrap();
      if (activePlan?.id === plan.id) {
        clearActivePlan();
      }
      navigate('/plans');
    } catch (err) {
      console.error("Failed to delete plan", err);
      setMutationError("Could not delete the plan.");
    } finally {
      setIsDeletePlanModalOpen(false);
    }
  };

  const getStatusBadgeColor = (status: PlantingStatus) => {
    const colors: Record<PlantingStatus, string> = {
      [PlantingStatus.PLANNED]: 'bg-blue-100 text-blue-800',
      [PlantingStatus.STARTED]: 'bg-yellow-100 text-yellow-800',
      [PlantingStatus.DIRECT_SOWN]: 'bg-yellow-100 text-yellow-800',
      [PlantingStatus.TRANSPLANTED]: 'bg-indigo-100 text-indigo-800',
      [PlantingStatus.GROWING]: 'bg-green-100 text-green-800',
      [PlantingStatus.HARVESTING]: 'bg-purple-100 text-purple-800',
      [PlantingStatus.DONE]: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) return <div className="p-8 text-center">Loading plan...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Failed to fetch plan details. It may not exist.</div>;
  if (!plan) return <div className="p-8 text-center">Garden plan not found.</div>;

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link to="/plans" className="text-blue-600 hover:underline">&larr; Back to All Plans</Link>
        </div>
        {mutationError && <div className="p-4 mb-4 text-center bg-red-100 border border-red-400 text-red-700 rounded">{mutationError}</div>}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-green-700">{plan.name}</h1>
              <p className="text-gray-600 mt-2">{plan.description}</p>
            </div>
            <button 
              onClick={() => setIsDeletePlanModalOpen(true)}
              className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 transition-colors"
            >
              Delete Plan
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-2xl font-bold text-gray-700 mb-4">Plantings</h3>
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sow Date</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {plan.plantings.map((planting) => (
                    <tr key={planting.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            <Link to={`/plantings/${planting.id}`} className="text-blue-600 hover:underline">
                                {planting.plant_name} {planting.variety_name ? `(${planting.variety_name})` : ''}
                            </Link>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{planting.quantity}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(planting.status)}`}>
                                {planting.status}
                            </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            {planting.planned_sow_date ? format(new Date(planting.planned_sow_date + 'T00:00:00'), 'MMM d, yyyy') : 'N/A'}
                        </td>
                    </tr>
                    ))}
                </tbody>
            </table>
            </div>
        </div>
      </div>
      
      {isDeletePlanModalOpen && plan && (
        <DeleteConfirmModal
          isOpen={isDeletePlanModalOpen}
          onClose={() => setIsDeletePlanModalOpen(false)}
          onConfirm={handleConfirmDeletePlan}
          title={`Delete Plan: ${plan.name}`}
          message={<p>Are you sure you want to delete this plan? This will also delete all associated plantings and tasks. This action cannot be undone.</p>}
        />
      )}
    </div>
  );
};

export default GardenPlanDetailPage;
