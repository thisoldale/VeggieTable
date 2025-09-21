import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
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
  const [deleteGardenPlan, { isLoading: isDeleting }] = useDeleteGardenPlanMutation();
  
  const [isDeletePlanModalOpen, setIsDeletePlanModalOpen] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  
  const handleConfirmDeletePlan = async () => {
    if (!plan) return;

    const promise = deleteGardenPlan(plan.id).unwrap();

    toast.promise(promise, {
        loading: 'Deleting plan...',
        success: () => {
            if (activePlan?.id === plan.id) {
                clearActivePlan();
            }
            navigate('/plans');
            return 'Plan deleted successfully!';
        },
        error: 'Failed to delete plan.',
    });

    setIsDeletePlanModalOpen(false);
  };

  const getStatusBadgeColor = (status: PlantingStatus) => {
    const colors: Record<PlantingStatus, string> = {
      [PlantingStatus.PLANNED]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      [PlantingStatus.STARTED]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      [PlantingStatus.DIRECT_SOWN]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      [PlantingStatus.TRANSPLANTED]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      [PlantingStatus.GROWING]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      [PlantingStatus.HARVESTING]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      [PlantingStatus.DONE]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  if (isLoading) return <div className="p-8 text-center">Loading plan...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Failed to fetch plan details. It may not exist.</div>;
  if (!plan) return <div className="p-8 text-center">Garden plan not found.</div>;

  return (
    <div className="p-4 md:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link to="/plans" className="text-blue-600 dark:text-blue-400 hover:underline">&larr; Back to All Plans</Link>
        </div>
        {mutationError && <div className="p-4 mb-4 text-center bg-red-100 border border-red-400 text-red-700 rounded dark:bg-red-900/50 dark:border-red-800 dark:text-red-300">{mutationError}</div>}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-green-800 dark:text-green-300">{plan.name}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">{plan.description}</p>
            </div>
            <button 
              onClick={() => setIsDeletePlanModalOpen(true)}
              className="p-2 rounded-full text-gray-400 hover:bg-red-100 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
              disabled={isDeleting}
              aria-label="Delete plan"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl">
            <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Plantings</h3>
            <div className="overflow-x-auto">
            <table className="min-w-full">
                <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Sow Date</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {plan.plantings.map((planting) => (
                    <tr key={planting.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-800 dark:text-gray-100">
                            <Link to={`/plantings/${planting.id}`} className="text-green-700 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300">
                                {planting.plant_name} {planting.variety_name ? `(${planting.variety_name})` : ''}
                            </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-600 dark:text-gray-400">{planting.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadgeColor(planting.status)}`}>
                                {planting.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-600 dark:text-gray-400">
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
