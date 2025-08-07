import React, { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Plant } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot,
  Legend,
} from 'recharts';

interface YieldGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  plant: Plant | null;
  onSave: (newYieldData: string) => void;
}

interface DataPoint {
  week: number;
  yield: number;
}

const YieldGraphModal: React.FC<YieldGraphModalProps> = ({ isOpen, onClose, plant, onSave }) => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [activeDotIndex, setActiveDotIndex] = useState<number | null>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen && plant) {
      // Clean the input string by removing potential leading/trailing brackets
      const cleanedYieldData = (plant.weekly_yield || '').replace(/^\[|\]$/g, '');
      const parsedData = cleanedYieldData
        .split(';')
        .filter(v => v.trim() !== '')
        .map((y, i) => ({ week: i + 1, yield: parseFloat(y) || 0 }));
      
      setData(parsedData);
    }
  }, [isOpen, plant]);

  const handleSave = () => {
    const yieldString = data.map(d => d.yield).join(';');
    onSave(yieldString);
    onClose();
  };

  const handleAddWeek = () => {
    if (data.length < 26) {
      setData([...data, { week: data.length + 1, yield: 0 }]);
    }
  };

  const handleRemoveWeek = () => {
    if (data.length > 0) {
      setData(data.slice(0, -1));
    }
  };

  const handleInputChange = (index: number, value: string) => {
    const newYield = parseFloat(value);
    const newData = data.map((point, i) => {
      if (i === index) {
        return { ...point, yield: isNaN(newYield) ? 0 : newYield };
      }
      return point;
    });
    setData(newData);
  };

  // --- Dragging Logic ---
  const getMousePosition = (e: MouseEvent) => {
    const chart = chartRef.current;
    if (!chart) return null;
    const container = chart.container;
    const containerRect = container.getBoundingClientRect();
    const chartX = e.clientX - containerRect.left;
    const chartY = e.clientY - containerRect.top;
    
    const layout = chart.state.offset;
    if (chartX < layout.left || chartX > layout.left + layout.width ||
        chartY < layout.top || chartY > layout.top + layout.height) {
      return null;
    }

    const yAxis = chart.props.children.find((child: any) => child.type.name === 'YAxis').props;
    const yDomain = yAxis.domain;
    const yRange = yAxis.scale.range();

    const yValue = yDomain[0] + (yDomain[1] - yDomain[0]) * ((yRange[0] - chartY) / (yRange[0] - yRange[1]));
    
    return Math.max(0, parseFloat(yValue.toFixed(2)));
  };

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setActiveDotIndex(null);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && activeDotIndex !== null) {
      const newYield = getMousePosition(e);
      if (newYield !== null) {
        setData(currentData =>
          currentData.map((point, index) => {
            if (index === activeDotIndex) {
              return { ...point, yield: newYield };
            }
            return point;
          })
        );
      }
    }
  }, [isDragging, activeDotIndex]);

  const handleMouseDown = (e: any, index: number) => {
    setActiveDotIndex(index);
    setIsDragging(true);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const CustomDot = (props: any) => {
    const { cx, cy, index } = props;
    return (
      <Dot
        cx={cx}
        cy={cy}
        r={8}
        fill="#22c55e"
        stroke="#ffffff"
        strokeWidth={2}
        onMouseDown={(e) => handleMouseDown(e, index)}
        style={{ cursor: 'grab' }}
      />
    );
  };
  
  const yAxisLabel = plant?.yield_units || 'Yield';

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl max-h-[90vh] transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all flex flex-col">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} ref={chartRef}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" label={{ value: 'Week', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} domain={[0, 'dataMax + 1']} />
                      <Tooltip formatter={(value) => [`${value} ${yAxisLabel}`, "Yield"]} />
                      <Legend />
                      <Line type="monotone" dataKey="yield" name={yAxisLabel} stroke="#8884d8" strokeWidth={2} dot={<CustomDot />} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <Dialog.Title
                  as="h3"
                  className="text-2xl font-bold my-4 text-gray-800 text-center"
                >
                  Edit Weekly Yield for {plant?.plant_name}
                </Dialog.Title>

                <div className="flex-shrink-0 mt-4 overflow-y-auto max-h-48">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {data.map((point, index) => (
                            <div key={index} className="flex flex-col">
                                <label className="text-sm font-medium text-gray-600">Week {point.week}</label>
                                <input
                                    type="number"
                                    value={point.yield}
                                    onChange={(e) => handleInputChange(index, e.target.value)}
                                    className="p-1 border border-gray-300 rounded-md"
                                    step="0.1"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-shrink-0 flex justify-between items-center mt-4 pt-4 border-t">
                    <div className="flex gap-2">
                        <button onClick={handleAddWeek} disabled={data.length >= 26} className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400">Add Week</button>
                        <button onClick={handleRemoveWeek} disabled={data.length === 0} className="px-4 py-2 rounded-md bg-yellow-500 text-white hover:bg-yellow-600 disabled:bg-gray-400">Remove Week</button>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-300 text-gray-800 hover:bg-gray-400">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Save Yield</button>
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

export default YieldGraphModal;
