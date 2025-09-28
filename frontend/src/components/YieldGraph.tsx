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
import { useTheme } from '../context/ThemeContext';
import { hslToHex } from '../utils/colors';

interface YieldGraphProps {
  weeklyYield: string | null | undefined;
  unit?: string | null;
}

const YieldGraph: React.FC<YieldGraphProps> = ({ weeklyYield, unit }) => {
  const { theme } = useTheme();
  const primaryColor = hslToHex(theme.colors.primary);
  const textColor = hslToHex(theme.colors.foreground);
  const gridColor = hslToHex(theme.colors.border);

  // Clean and parse the data robustly.
  const cleanedYieldData = (weeklyYield || '').replace(/^\[|\]$/g, '');
  const data = cleanedYieldData
    .split(';')
    .filter(v => v.trim() !== '')
    .map((yieldValue, index) => ({
      week: `Week ${index + 1}`,
      yield: parseFloat(yieldValue) || 0,
    }));

  if (data.length === 0) {
    return <p className="text-muted-foreground italic">No weekly yield data available to display.</p>;
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
        <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
        <XAxis dataKey="week" stroke={textColor} />
        <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fill: textColor }} stroke={textColor} />
        <Tooltip
          formatter={(value) => [`${value} ${yAxisLabel}`, "Yield"]}
          contentStyle={{ backgroundColor: hslToHex(theme.colors['component-background']), border: `1px solid ${gridColor}` }}
          labelStyle={{ color: textColor }}
        />
        <Legend wrapperStyle={{ color: textColor }} />
        <Line type="monotone" dataKey="yield" name={yAxisLabel} stroke={primaryColor} activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default YieldGraph;
