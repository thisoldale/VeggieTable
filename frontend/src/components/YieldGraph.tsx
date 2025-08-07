import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface YieldGraphProps {
  weeklyYield: string | null | undefined;
  unit?: string | null;
}

const YieldGraph: React.FC<YieldGraphProps> = ({ weeklyYield, unit }) => {
  // Clean and parse the data robustly, just like in the modal.
  const cleanedYieldData = (weeklyYield || '').replace(/^\[|\]$/g, '');
  const data = cleanedYieldData
    .split(';')
    .filter(v => v.trim() !== '')
    .map((yieldValue, index) => ({
      week: `Week ${index + 1}`,
      yield: parseFloat(yieldValue) || 0,
    }));

  if (data.length === 0) {
    return <p className="text-gray-500 italic">No weekly yield data available to display.</p>;
  }

  const yAxisLabel = unit || 'Yield';

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 20,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week" />
        <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
        <Tooltip formatter={(value) => [`${value} ${yAxisLabel}`, "Yield"]} />
        <Legend />
        <Line type="monotone" dataKey="yield" name={yAxisLabel} stroke="#8884d8" activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default YieldGraph;
