import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useGetPlantsQuery } from '../store/plantApi';
import { Plant } from '../types';

interface PlantSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlant: (plant: Plant) => void;
}

const PlantSelectionModal: React.FC<PlantSelectionModalProps> = ({ isOpen, onClose, onSelectPlant }) => {
  const { data: plants, error, isLoading } = useGetPlantsQuery();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPlants = searchTerm && plants
    ? plants.filter(p =>
        p.plant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.variety_name && p.variety_name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : plants;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900">
                  Select a Plant
                </Dialog.Title>
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Search plant library..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md mb-4"
                  />
                  <div className="max-h-96 overflow-y-auto">
                    {isLoading && <p>Loading plants...</p>}
                    {error && <p className="text-red-500">Error loading plants.</p>}
                    {filteredPlants?.map(plant => (
                      <div key={plant.id} onClick={() => onSelectPlant(plant)} className="p-2 border-b hover:bg-gray-100 cursor-pointer">
                        <p className="font-semibold">{plant.plant_name}</p>
                        {plant.variety_name && <p className="text-sm text-gray-500">{plant.variety_name}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default PlantSelectionModal;
