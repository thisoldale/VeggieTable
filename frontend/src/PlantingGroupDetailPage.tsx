import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Planting, PlantingStatus } from './types';
import { useGetPlantingGroupByIdQuery, useDeletePlantingMutation } from './store/plantApi';
import DeleteConfirmModal from './components/DeleteConfirmModal';

const PlantingGroupDetailPage: React.FC = () => {
  const { planId, groupId } = useParams<{ planId: string, groupId: string }>();
  const numericGroupId = Number(groupId);

  const { data: group, error, isLoading, refetch } = useGetPlantingGroupByIdQuery(numericGroupId, {
    skip: !numericGroupId,
  });
  const [deletePlanting, { isLoading: isDeleting }] = useDeletePlantingMutation();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number, name: string } | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const openDeleteModal = (planting: Planting) => {
    const plantName = `${planting.plant_name} #${planting.id}`;
    setItemToDelete({ id: planting.id, name: plantName });
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setMutationError(null);
    try {
        await deletePlanting(itemToDelete.id).unwrap();
        // The cache will automatically update, but we can refetch if needed
        // refetch(); 
    } catch (err) {
        console.error('Failed to delete planting', err);
        setMutationError('Could not delete the planting.');
    } finally {
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
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

  if (isLoading) return <div className="p-8 text-center">Loading group details...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Failed to fetch group details.</div>;
  if (!group) return <div className="p-8 text-center">Planting group not found.</div>;

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link to={`/plans/${planId}`} className="text-blue-600 hover:underline">&larr; Back to Plan</Link>
        </div>
        {mutationError && <div className="p-4 mb-4 text-center bg-red-100 border border-red-400 text-red-700 rounded">{mutationError}</div>}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h1 className="text-3xl font-bold text-green-700">{group.name}</h1>
          <p className="text-gray-600 mt-1">{group.notes || ''}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Individual Plants ({group.plantings.length})</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {group.plantings.map((planting) => (
                    <tr key={planting.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{planting.id}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            <Link to={`/plantings/${planting.id}`} className="text-blue-600 hover:underline">
                                {planting.plant_name} {planting.variety_name ? `(${planting.variety_name})` : ''}
                            </Link>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(planting.status)}`}>
                                {planting.status}
                            </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => openDeleteModal(planting)} className="text-red-600 hover:text-red-800" disabled={isDeleting}>Delete</button>
                        </td>
                    </tr>
                    ))}
                </tbody>
            </table>
          </div>
        </div>
      </div>
      {isDeleteModalOpen && itemToDelete && (
        <DeleteConfirmModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
            title={`Delete ${itemToDelete.name}`}
            message={<p>Are you sure you want to delete <strong>{itemToDelete.name}</strong>? This action cannot be undone.</p>}
        />
      )}
    </div>
  );
};

export default PlantingGroupDetailPage;
