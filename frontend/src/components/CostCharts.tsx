import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';



interface CostChartsProps {
    providerData?: { name: string; cost: number }[];
    serviceData?: { name: string; value: number }[];
}

const COLORS = ['#60A5FA', '#34D399', '#FB923C', '#A78BFA'];

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="glass-card p-8 rounded-3xl relative overflow-hidden group">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white tracking-tight">Cost Distribution</h3>
            <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded-lg uppercase tracking-widest">Provider View</span>
        </div>
        <div className="h-72 chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={providerData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="rgba(255,255,255,0.3)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.3)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    borderColor: 'rgba(255,255,255,0.1)', 
                    borderRadius: '12px',
                    backdropFilter: 'blur(8px)',
                    color: '#fff',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                }}
                itemStyle={{ color: '#60A5FA' }}
              />
              <Bar 
                dataKey="cost" 
                fill="url(#barGradient)" 
                name="Cost" 
                radius={[6, 6, 0, 0]}
                barSize={40}
              />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-8 rounded-3xl relative overflow-hidden group">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white tracking-tight">Resource Allocation</h3>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg uppercase tracking-widest">Service View</span>
        </div>
        <div className="h-72 chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={serviceData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={95}
                fill="#8884d8"
                paddingAngle={8}
                dataKey="value"
                stroke="none"
              >
                {serviceData.map((_, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    borderColor: 'rgba(255,255,255,0.1)', 
                    borderRadius: '12px',
                    backdropFilter: 'blur(8px)',
                    color: '#fff'
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                align="center"
                iconType="circle"
                wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default CostCharts;
