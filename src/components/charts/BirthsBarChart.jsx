import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BirthsBarChart = ({ animals }) => {
  const chartData = useMemo(() => {
    const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    const monthlyBirths = Array(12).fill(0).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        name: `${monthNames[d.getMonth()]} '${d.getFullYear().toString().slice(-2)}`,
        naissances: 0,
        year: d.getFullYear(),
        month: d.getMonth()
      };
    }).reverse();

    animals.forEach(animal => {
      if (animal.dateDeNaissance) {
        const birthDate = animal.dateDeNaissance.toDate ? animal.dateDeNaissance.toDate() : new Date(animal.dateDeNaissance);
        const birthMonth = birthDate.getMonth();
        const birthYear = birthDate.getFullYear();

        const targetMonth = monthlyBirths.find(m => m.month === birthMonth && m.year === birthYear);
        if (targetMonth) {
          targetMonth.naissances += 1;
        }
      }
    });

    return monthlyBirths;
  }, [animals]);

  return (
    <div>
      <h4>Naissances par Mois (12 derniers mois)</h4>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="naissances" fill="#82ca9d" name="Naissances" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BirthsBarChart;
