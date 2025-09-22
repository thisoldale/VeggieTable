// frontend/src/components/ChangeGroupModal.tsx
import React, { useState, useEffect } from 'react';
import { GardenPlan, PlantingGroup } from '../types';
import { getAllGardenPlans, createPlantingGroup } from '../api/plantService';

interface ChangeGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupChange: (newGroupId: number | null) => Promise<void>;
  currentPlanId: number;
  currentGroupId: number | null;
  plantId: number;
}

const ChangeGroupModal: React.FC<ChangeGroupModalProps> = ({
  isOpen,
  onClose,
  onGroupChange,
  currentPlanId,
  currentGroupId,
  plantId,
}) => {
  const [plans, setPlans] = useState<GardenPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number>(currentPlanId);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(currentGroupId);
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    if (isOpen) {
      getAllGardenPlans().then(setPlans);
    }
  }, [isOpen]);

  const handleCreateAndMove = async () => {
    if (!newGroupName.trim()) {
      alert('New group name cannot be empty.');
      return;
    }
    try {
      const newGroup = await createPlantingGroup({
        garden_plan_id: selectedPlanId,
        library_plant_id: plantId,
        quantity: 0, // We are just creating a group, not adding new plants
        planting_method: 'Direct Seeding', // Default value, can be changed later
      });
      await onGroupChange(newGroup.id);
      onClose();
    } catch (error) {
      console.error('Failed to create and move to new group:', error);
    }
  };

  const handleMoveToExisting = async () => {
    if (selectedGroupId === null) {
        alert('Please select a group to move to.');
        return;
    }
    await onGroupChange(selectedGroupId);
    onClose();
  };
  
  const handleRemoveFromGroup = async () => {
      await onGroupChange(null);
      onClose();
  };

  if (!isOpen) return null;

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-component-background p-6 rounded-lg shadow-xl max-w-lg w-full">
        <h2 className="text-2xl font-bold mb-4">Change Planting Group</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-muted-foreground">Select Plan</label>
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(parseInt(e.target.value, 10))}
            className="w-full p-2 border border-border bg-component-background rounded-md"
          >
            {plans.map(plan => (
              <option key={plan.id} value={plan.id}>{plan.name}</option>
            ))}
          </select>
        </div>

        <div className="mb-4 p-4 border border-border rounded-md">
            <h3 className="font-semibold mb-2">Move to Existing Group</h3>
            <select
                value={selectedGroupId ?? ''}
                onChange={(e) => setSelectedGroupId(parseInt(e.target.value, 10))}
                className="w-full p-2 border border-border bg-component-background rounded-md mb-2"
                disabled={!selectedPlan}
            >
                <option value="" disabled>Select a group</option>
                {selectedPlan?.planting_groups.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
                ))}
            </select>
            <button onClick={handleMoveToExisting} className="w-full bg-interactive-primary text-interactive-primary-foreground p-2 rounded-md">Move to Selected Group</button>
        </div>

        <div className="mb-4 p-4 border border-border rounded-md">
            <h3 className="font-semibold mb-2">Create New Group in Selected Plan</h3>
            <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="New group name"
                className="w-full p-2 border border-border bg-component-background rounded-md mb-2"
            />
            <button onClick={handleCreateAndMove} className="w-full bg-interactive-primary text-interactive-primary-foreground p-2 rounded-md">Create and Move</button>
        </div>
        
        <div className="mb-4 p-4 border border-border rounded-md">
            <h3 className="font-semibold mb-2">Remove from Group</h3>
            <p className="text-sm text-muted-foreground mb-2">This will make the planting independent.</p>
            <button onClick={handleRemoveFromGroup} className="w-full bg-interactive-destructive text-interactive-destructive-foreground p-2 rounded-md">Remove from Current Group</button>
        </div>


        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-interactive-secondary text-interactive-secondary-foreground rounded-md">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default ChangeGroupModal;
