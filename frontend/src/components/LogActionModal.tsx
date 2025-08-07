import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlantingGroup, LogActionType } from '../types';
import { useLogGroupActionMutation } from '../store/plantApi';

const logActionSchema = z.object({
  actionType: z.nativeEnum(LogActionType),
  actionDate: z.string().nonempty("Date is required."),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
});

type LogActionFormData = z.infer<typeof logActionSchema>;

interface LogActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: PlantingGroup;
}

const LogActionModal: React.FC<LogActionModalProps> = ({ isOpen, onClose, group }) => {
  const [logGroupAction, { isLoading }] = useLogGroupActionMutation();
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm<LogActionFormData>({
    resolver: zodResolver(logActionSchema),
    defaultValues: {
      actionType: LogActionType.SOW_SEEDS,
      actionDate: new Date().toISOString().split('T')[0],
      quantity: 1,
    }
  });

  const watchActionType = watch("actionType");

  const onSubmit = async (data: LogActionFormData) => {
    try {
      await logGroupAction({
        groupId: group.id,
        ...data
      }).unwrap();
      onClose();
    } catch (err) {
      console.error('Failed to log action:', err);
    }
  };

  if (!isOpen) return null;
  
  // This logic for max quantity might need to be adjusted based on your specific requirements
  const maxQuantity = group.plantings.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Log Action for {group.name}</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label htmlFor="action-type" className="block text-sm font-medium text-gray-700">Action</label>
            <select
              id="action-type"
              {...register("actionType")}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            >
              {Object.values(LogActionType).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="action-date" className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              id="action-date"
              {...register("actionDate")}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            />
            {errors.actionDate && <p className="text-red-500 text-xs mt-1">{errors.actionDate.message}</p>}
          </div>
          
          <div className="mb-4">
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
            <input
              type="number"
              id="quantity"
              {...register("quantity", { valueAsNumber: true, max: maxQuantity })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              min="1"
            />
             {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>}
             <p className="text-xs text-gray-500 mt-1">Max available: {maxQuantity}</p>
          </div>

          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50">
              {isLoading ? 'Logging...' : 'Log Action'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogActionModal;
