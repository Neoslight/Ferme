import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#da84d8'];

const SpeciesPieChart = ({ stats }) => {
  const chartData = useMemo(() => {
    if (!stats || !stats.bySpecies) {
      return [];
    }
    return Object.entries(stats.bySpecies).map(([name, value]) => ({ name, value }));
  }, [stats]);

  if (chartData.length === 0) {
    return <p>Pas de données pour afficher le graphique des espèces.</p>;
  }

  return (
    <div>
      <h4>Répartition par Espèce</h4>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SpeciesPieChart;
