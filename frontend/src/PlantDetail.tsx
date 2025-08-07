import React, { useState, useEffect } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import { Plant, AppContextType } from './types';
import { useGetPlantByIdQuery, useUpdatePlantMutation } from './store/plantApi';
import YieldGraphModal from './components/YieldGraphModal';
import YieldGraph from './components/YieldGraph';

const PlantDetail: React.FC = () => {
  const { plantId } = useParams<{ plantId: string }>();
  const numericPlantId = Number(plantId);

  const { data: plant, error: queryError, isLoading } = useGetPlantByIdQuery(numericPlantId, {
    skip: !plantId,
  });
  const [updatePlant, { isLoading: isUpdating }] = useUpdatePlantMutation();

  const [editedPlant, setEditedPlant] = useState<Partial<Plant>>({});
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isYieldModalOpen, setIsYieldModalOpen] = useState(false);
  const { setIsPageDirty } = useOutletContext<AppContextType>();

  useEffect(() => {
    if (plant) {
      setEditedPlant(plant);
    }
  }, [plant]);

  useEffect(() => {
    const hasChanges = JSON.stringify(plant) !== JSON.stringify(editedPlant);
    setIsPageDirty(hasChanges && isEditing);
  }, [editedPlant, plant, isEditing, setIsPageDirty]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checkedValue = (e.target as HTMLInputElement).checked;
  
    setEditedPlant(prev => ({
      ...prev,
      [name]: isCheckbox ? checkedValue : value,
    }));
  };

  const handleSaveClick = async () => {
    if (!plant) return;

    try {
      setError(null);
      await updatePlant({ id: plant.id, ...editedPlant }).unwrap();
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error updating plant:', err);
      setError(err.data?.detail || 'Failed to update plant. Please try again.');
    }
  };
  
  const handleSaveYield = async (newYieldData: string) => {
    if (!plant) return;
    try {
        await updatePlant({ id: plant.id, weekly_yield: newYieldData }).unwrap();
        setIsYieldModalOpen(false);
    } catch (err) {
        console.error('Failed to update yield data:', err);
    }
  };

  const handleCancelClick = () => {
    setEditedPlant(plant || {});
    setIsEditing(false);
    setError(null);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading plant details...</div>;
  }

  if (queryError) {
    return (
      <div className="p-8 text-center bg-red-100 border border-red-400 text-red-700 rounded">
        <p className="mb-4">{'data' in queryError ? (queryError.data as any).detail : 'Failed to load plant details.'}</p>
        <Link to="/bulk-edit" className="text-blue-600 hover:underline">Back to Plant Library</Link>
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="p-8 text-center bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
        <p className="mb-4">No plant data available.</p>
        <Link to="/bulk-edit" className="text-blue-600 hover:underline">Back to Plant Library</Link>
      </div>
    );
  }

  const renderDetail = (key: keyof Plant, label: string) => {
    const value = plant[key];
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
    const value = editedPlant[key];
    const originalValue = plant[key];
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

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-lg shadow-lg max-w-6xl mx-auto p-8">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h1 className="text-4xl font-bold text-green-700">{plant.plant_name} - <span className="text-3xl text-green-600">{plant.variety_name}</span></h1>
                {!isEditing ? (
                <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200"
                >
                    Edit
                </button>
                ) : (
                <div className="flex space-x-2">
                    <button
                    onClick={handleSaveClick}
                    disabled={isUpdating}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 disabled:opacity-50"
                    >
                    {isUpdating ? 'Saving...' : 'Save'}
                    </button>
                    <button
                    onClick={handleCancelClick}
                    className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200"
                    >
                    Cancel
                    </button>
                </div>
                )}
            </div>

            {error && isEditing && <p className="text-red-500 mb-4">{error}</p>}

            {isEditing ? (
                <div className="space-y-8">
                    {Object.entries(fieldGroups).map(([groupTitle, fields]) => (
                        <div key={groupTitle}>
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">{groupTitle}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {fields.map(key => renderInputField(key as keyof Plant, key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                 <div className="space-y-8">
                    {Object.entries(fieldGroups).map(([groupTitle, fields]) => (
                        <div key={groupTitle}>
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">{groupTitle}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                                {fields.map(key => renderDetail(key as keyof Plant, key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())))}
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
                            <YieldGraph weeklyYield={plant.weekly_yield} unit={plant.yield_units} />
                        </div>
                    </div>
                 </div>
            )}
        </div>
        {isYieldModalOpen && (
            <YieldGraphModal
                isOpen={isYieldModalOpen}
                onClose={() => setIsYieldModalOpen(false)}
                plant={plant}
                onSave={handleSaveYield}
            />
        )}
    </div>
  );
}

export default PlantDetail;
