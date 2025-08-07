import React, { useState, useEffect } from 'react';
import { useParams, Link, useOutletContext, useNavigate } from 'react-router-dom';
import { Planting, PlantingStatus, AppContextType, Plant, PlantingMethod } from './types';
import { useGetPlantingByIdQuery, useUpdatePlantingMutation, useDeletePlantingMutation } from './store/plantApi';
import YieldGraphModal from './components/YieldGraphModal';
import YieldGraph from './components/YieldGraph';
import DeleteConfirmModal from './components/DeleteConfirmModal';

const PlantingDetailPage: React.FC = () => {
  const { plantingId } = useParams<{ plantingId: string }>();
  const numericPlantingId = Number(plantingId);
  const navigate = useNavigate();

  const { data: planting, error: queryError, isLoading } = useGetPlantingByIdQuery(numericPlantingId, {
    skip: !numericPlantingId,
  });
  const [updatePlanting, { isLoading: isUpdating }] = useUpdatePlantingMutation();
  const [deletePlanting] = useDeletePlantingMutation();

  const [editedPlanting, setEditedPlanting] = useState<Partial<Planting>>({});
  const [error, setError] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isYieldModalOpen, setIsYieldModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { setIsPageDirty } = useOutletContext<AppContextType>();

  useEffect(() => {
    if (planting) {
      setEditedPlanting(planting);
    }
  }, [planting]);

  useEffect(() => {
    const hasChanges = JSON.stringify(planting) !== JSON.stringify(editedPlanting);
    setIsPageDirty(hasChanges && isEditing);
  }, [editedPlanting, planting, isEditing, setIsPageDirty]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checkedValue = (e.target as HTMLInputElement).checked;
  
    setEditedPlanting(prev => ({
      ...prev,
      [name]: isCheckbox ? checkedValue : value,
    }));
  };

  const handleSave = async () => {
    if (!planting) return;
    setError(null);
    try {
      await updatePlanting({ id: planting.id, ...editedPlanting }).unwrap();
      setIsEditing(false);
    } catch (err: any) {
      console.error('Failed to update planting:', err);
      setError(err.data?.detail || 'Failed to save changes.');
    }
  };

  const handleCancel = () => {
    setEditedPlanting(planting || {});
    setIsEditing(false);
    setError(null);
  };
  
  const handleSaveYield = async (newYieldData: string) => {
    if (!planting) return;
    try {
        await updatePlanting({ id: planting.id, weekly_yield: newYieldData }).unwrap();
        setIsYieldModalOpen(false);
    } catch (err: any) {
        console.error('Failed to update yield data:', err);
        setError(err.data?.detail || 'Failed to update yield data.');
    }
  };

  const handleDelete = async () => {
      if (!planting) return;
      try {
          await deletePlanting(planting.id).unwrap();
          navigate(`/plans/${planting.garden_plan_id}`);
      } catch (err) {
          console.error("Failed to delete planting", err);
          setError("Failed to delete planting.");
      } finally {
          setIsDeleteModalOpen(false);
      }
  };

  const getNextStatus = (currentStatus: PlantingStatus, method: PlantingMethod | null | undefined): PlantingStatus | null => {
      const flow = {
          [PlantingStatus.PLANNED]: method === PlantingMethod.DIRECT_SEEDING ? PlantingStatus.DIRECT_SOWN : PlantingStatus.STARTED,
          [PlantingStatus.STARTED]: PlantingStatus.TRANSPLANTED,
          [PlantingStatus.DIRECT_SOWN]: PlantingStatus.GROWING,
          [PlantingStatus.TRANSPLANTED]: PlantingStatus.GROWING,
          [PlantingStatus.GROWING]: PlantingStatus.HARVESTING,
          [PlantingStatus.HARVESTING]: PlantingStatus.DONE,
      };
      return flow[currentStatus] || null;
  }

  const handleAdvanceStatus = async () => {
      if (!planting) return;
      const nextStatus = getNextStatus(planting.status, planting.planting_method);
      if (nextStatus) {
          await updatePlanting({ id: planting.id, status: nextStatus });
      }
  };

  if (isLoading) return <div className="p-8 text-center">Loading planting details...</div>;
  if (queryError) return <div className="p-8 text-center text-red-500">Failed to load planting details.</div>;
  if (!planting) return <div className="p-8 text-center">Planting not found.</div>;

  const renderDetail = (key: keyof Plant, label: string) => {
    const value = planting[key as keyof Planting];
    if (value === null || value === undefined || value === '' || key === 'weekly_yield') return null;
    const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
    return (
      <div key={key} className="py-2">
        <p className="font-bold text-gray-600">{label}</p>
        <p className="text-gray-800">{displayValue}</p>
      </div>
    );
  };
  
  const renderInputField = (key: keyof Plant, label: string) => {
    if (key === 'weekly_yield') return null;
    const value = editedPlanting[key as keyof Planting];
    const originalValue = planting[key as keyof Planting];
    const type = typeof originalValue;

    if (type === 'boolean') {
      return (
        <div key={key} className="flex items-center">
          <input
            type="checkbox"
            id={key}
            name={key}
            checked={!!value}
            onChange={handleInputChange}
            className="form-checkbox h-5 w-5 text-green-600 rounded"
          />
          <label htmlFor={key} className="ml-2 text-gray-700">{label}</label>
        </div>
      );
    }
    
    if (key === 'notes_observations') {
        return (
             <div key={key} className="col-span-1 md:col-span-2 lg:col-span-3">
                <label htmlFor={key} className="block text-sm font-medium text-gray-700">{label}</label>
                <textarea
                  id={key}
                  name={key}
                  value={value as string || ''}
                  onChange={handleInputChange}
                  rows={4}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
            </div>
        )
    }

    return (
      <div key={key}>
        <label htmlFor={key} className="block text-sm font-medium text-gray-700">{label}</label>
        <input
          type={type === 'number' ? 'number' : 'text'}
          id={key}
          name={key}
          value={value as string | number ?? ''}
          onChange={handleInputChange}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
        />
      </div>
    );
  };
  
  const fieldGroups = {
      "General Information": ['plant_name', 'variety_name', 'scientific_name', 'plant_family', 'plant_type', 'growth_habit', 'origin_heirloom_status', 'seed_company_source', 'year_acquired', 'url', 'organic'],
      "Germination": ['seed_size', 'seed_longevity_storage_life', 'germination_temperature_min', 'germination_temperature_max', 'germination_temperature_ideal', 'germination_time_days', 'light_requirement_for_germination', 'stratification_required', 'scarification_required'],
      "Sowing & Spacing": ['sowing_depth', 'spacing_in_row', 'spacing_low', 'spacing_high'],
      "Transplanting": ['direct_seedable', 'transplantable', 'days_to_transplant_low', 'days_to_transplant_high'],
      "Growth & Care": ['time_to_maturity', 'mature_plant_height', 'mature_plant_spread_width', 'sunlight_requirement', 'water_needs', 'fertilizer_needs', 'support_required', 'pruning_required'],
      "Health": ['pest_resistance', 'disease_resistance', 'heat_tolerance', 'drought_tolerance', 'bolting_tendency', 'cold_hardiness_frost_tolerance'],
      "Harvest & Storage": ['harvest_window_low', 'harvest_window_high', 'typical_yield', 'yield_units', 'storage_life_post_harvest', 'requires_pollinator'],
      "Notes": ['notes_observations']
  } as const;

  const nextStatusAction = getNextStatus(planting.status, planting.planting_method);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h1 className="text-4xl font-bold text-green-700">{planting.plant_name} <span className="text-3xl text-green-600">{planting.variety_name}</span></h1>
            <div className="flex items-center space-x-2">
                {!isEditing && (
                    <>
                        {nextStatusAction && (
                            <button onClick={handleAdvanceStatus} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">
                                Mark as {nextStatusAction}
                            </button>
                        )}
                        <button onClick={() => setIsDeleteModalOpen(true)} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">Delete</button>
                    </>
                )}
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Edit</button>
                ) : (
                  <div className="flex space-x-2">
                    <button onClick={handleCancel} className="px-4 py-2 bg-gray-300 rounded-md">Cancel</button>
                    <button onClick={handleSave} disabled={isUpdating} className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50">
                      {isUpdating ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
            </div>
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Planting-Specific Fields */}
        <div className="mb-8 p-4 border rounded-md bg-green-50">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Planting Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status */}
                <div>
                    <label className="block text-sm font-medium text-gray-500">Status</label>
                    {isEditing ? (
                        <select name="status" value={editedPlanting.status} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md">
                            {Object.values(PlantingStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    ) : (
                        <p className="mt-1">{planting.status}</p>
                    )}
                </div>
                {/* Quantity */}
                <div>
                    <label className="block text-sm font-medium text-gray-500">Quantity</label>
                    {isEditing ? (
                        <input
                            type="number"
                            name="quantity"
                            value={editedPlanting.quantity ?? 1}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        />
                    ) : (
                        <p className="mt-1">{planting.quantity}</p>
                    )}
                </div>
                {/* Dates */}
                {(planting.planting_method === PlantingMethod.DIRECT_SEEDING || planting.planting_method === PlantingMethod.SEED_STARTING) && (
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Sow Date</label>
                        {isEditing ? ( <input type="date" name="planned_sow_date" value={editedPlanting.planned_sow_date || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md"/> ) : ( <p className="mt-1">{planting.planned_sow_date}</p> )}
                    </div>
                )}
                {(planting.planting_method === PlantingMethod.SEEDLING || planting.planting_method === PlantingMethod.SEED_STARTING) && (
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Transplant Date</label>
                        {isEditing ? ( <input type="date" name="planned_transplant_date" value={editedPlanting.planned_transplant_date || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md"/> ) : ( <p className="mt-1">{planting.planned_transplant_date}</p> )}
                    </div>
                )}
                 <div>
                    <label className="block text-sm font-medium text-gray-500">Harvest Date</label>
                    {isEditing ? ( <input type="date" name="planned_harvest_start_date" value={editedPlanting.planned_harvest_start_date || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md"/> ) : ( <p className="mt-1">{planting.planned_harvest_start_date}</p> )}
                </div>
            </div>
        </div>
        
        {/* General Plant Fields */}
        <div className="space-y-8">
            {Object.entries(fieldGroups).map(([groupTitle, fields]) => (
                <div key={groupTitle}>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">{groupTitle}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                        {fields.map(key => isEditing 
                            ? renderInputField(key as keyof Plant, key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
                            : renderDetail(key as keyof Plant, key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
                        )}
                    </div>
                </div>
            ))}
            <div>
                <div className="flex justify-between items-center mt-8 mb-4 border-b pb-2">
                    <h2 className="text-2xl font-semibold text-gray-800">Weekly Yield Graph</h2>
                </div>
                <div
                    onClick={() => setIsYieldModalOpen(true)}
                    className="cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                    title="Click to edit yield graph"
                >
                    <YieldGraph weeklyYield={planting.weekly_yield} unit={planting.yield_units} />
                </div>
            </div>
        </div>

      </div>
      {isYieldModalOpen && (
        <YieldGraphModal
            isOpen={isYieldModalOpen}
            onClose={() => setIsYieldModalOpen(false)}
            plant={planting}
            onSave={handleSaveYield}
        />
      )}
      {isDeleteModalOpen && (
        <DeleteConfirmModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDelete}
            title={`Delete Planting`}
            message={<p>Are you sure you want to delete this planting of {planting.plant_name}? This action cannot be undone.</p>}
        />
      )}
    </div>
  );
};

export default PlantingDetailPage;
