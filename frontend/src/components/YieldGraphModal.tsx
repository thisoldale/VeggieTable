import React, { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Plant } from '../types';
import { useTheme } from '../context/ThemeContext';
import { hslToHex } from '../utils/colors';
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
  const { theme } = useTheme();
  const [data, setData] = useState<DataPoint[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [activeDotIndex, setActiveDotIndex] = useState<number | null>(null);
  const chartRef = useRef<any>(null);

  // Theme colors
  const primaryColor = hslToHex(theme.colors.primary);
  const primaryForegroundColor = hslToHex(theme.colors['primary-foreground']);
  const secondaryColor = hslToHex(theme.colors.secondary);
  const secondaryForegroundColor = hslToHex(theme.colors['secondary-foreground']);
  const destructiveColor = hslToHex(theme.colors.destructive);
  const destructiveForegroundColor = hslToHex(theme.colors['destructive-foreground']);
  const textColor = hslToHex(theme.colors.foreground);
  const mutedTextColor = hslToHex(theme.colors['muted-foreground']);
  const backgroundColor = hslToHex(theme.colors.background);
  const componentBackgroundColor = hslToHex(theme.colors['component-background']);
  const gridColor = hslToHex(theme.colors.border);

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
        fill={primaryColor}
        stroke={componentBackgroundColor}
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
              <Dialog.Panel className="w-full max-w-4xl max-h-[90vh] transform overflow-hidden rounded-lg bg-component-background p-6 text-left align-middle shadow-xl transition-all flex flex-col">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} ref={chartRef}>
                      <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                      <XAxis dataKey="week" stroke={textColor} label={{ value: 'Week', position: 'insideBottom', offset: -5, fill: textColor }} />
                      <YAxis stroke={textColor} label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fill: textColor }} domain={[0, 'dataMax + 1']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: componentBackgroundColor, border: `1px solid ${gridColor}` }}
                        labelStyle={{ color: textColor }}
                        formatter={(value) => [`${value} ${yAxisLabel}`, "Yield"]}
                      />
                      <Legend wrapperStyle={{ color: textColor }}/>
                      <Line type="monotone" dataKey="yield" name={yAxisLabel} stroke={primaryColor} strokeWidth={2} dot={<CustomDot />} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <Dialog.Title
                  as="h3"
                  className="text-2xl font-bold my-4 text-foreground text-center"
                >
                  Edit Weekly Yield for {plant?.plant_name}
                </Dialog.Title>

                <div className="flex-shrink-0 mt-4 overflow-y-auto max-h-48">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {data.map((point, index) => (
                            <div key={index} className="flex flex-col">
                                <label className="text-sm font-medium text-muted-foreground">Week {point.week}</label>
                                <input
                                    type="number"
                                    value={point.yield}
                                    onChange={(e) => handleInputChange(index, e.target.value)}
                                    className="p-1 border border-border rounded-md bg-background text-foreground"
                                    step="0.1"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-shrink-0 flex justify-between items-center mt-4 pt-4 border-t border-border">
                    <div className="flex gap-2">
                        <button onClick={handleAddWeek} disabled={data.length >= 26} className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">Add Week</button>
                        <button onClick={handleRemoveWeek} disabled={data.length === 0} className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50">Remove Week</button>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Save Yield</button>
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
