import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';



const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface CostChartsProps {
    providerData?: { name: string; cost: number }[];
    serviceData?: { name: string; value: number }[];
}

const CostCharts: React.FC<CostChartsProps> = ({ 
    providerData = [
       { name: 'AWS', cost: 0 },
       { name: 'Azure', cost: 0 },
       { name: 'GCP', cost: 0 },
    ], 
    serviceData = [
       { name: 'Compute', value: 0 },
       { name: 'Storage', value: 0 },
    ] 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">Cost by Provider</h3>
        <div className="h-64 chart-container min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
            <BarChart data={providerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="cost" fill="#3B82F6" name="Cost ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">Cost by Service Type</h3>
        <div className="h-64 chart-container min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
            <PieChart>
              <Pie
                data={serviceData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {serviceData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                 contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default CostCharts;
