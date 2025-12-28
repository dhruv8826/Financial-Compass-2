import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { MonthlyRecord, DashboardMetrics } from '../types';
import { calculateMetrics, formatCurrency, sumValues, sumInvestedValues } from '../utils/calculations';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, Activity } from 'lucide-react';

interface DashboardProps {
  data: MonthlyRecord[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const latestRecord = data[data.length - 1];
  const previousRecord = data.length > 1 ? data[data.length - 2] : undefined;

  const metrics = useMemo(() => {
    if (!latestRecord) return null;
    return calculateMetrics(latestRecord, previousRecord);
  }, [latestRecord, previousRecord]);

  const trendData = useMemo(() => {
    return data.map(record => {
      const m = calculateMetrics(record);
      return {
        name: record.monthLabel,
        "Final Total": m.finalTotal,
        "Ultimate Total": m.ultimateTotal
      };
    });
  }, [data]);

  const allocationData = useMemo(() => {
    if (!latestRecord) return [];
    return [
      { name: 'Banks', value: sumValues(latestRecord.banks) },
      { name: 'Investments', value: sumValues(latestRecord.investments) },
      { name: 'Others', value: sumValues(latestRecord.others) },
    ].filter(i => i.value > 0);
  }, [latestRecord]);

  const investmentComparisonData = useMemo(() => {
    if (!latestRecord) return [];
    return latestRecord.investments.map(inv => ({
      name: inv.name,
      "Invested": inv.investedValue || 0,
      "Current": inv.value
    })).filter(i => i.Current > 0 || i.Invested > 0);
  }, [latestRecord]);

  if (!metrics) return <div className="p-8 text-center text-gray-500">No data available. Please add a month or import Excel.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Ultimate Total</h3>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold">{formatCurrency(metrics.ultimateTotal)}</div>
          <div className={`text-xs mt-1 flex items-center ${metrics.netWorthChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {metrics.netWorthChange >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {Math.abs(metrics.netWorthChange).toFixed(2)}% from last month
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
           <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Final Total (Liquid)</h3>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">{formatCurrency(metrics.finalTotal)}</div>
          <p className="text-xs text-muted-foreground mt-1">Excludes 'Other' assets</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
           <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Assets</h3>
            <PieIcon className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold">{formatCurrency(metrics.totalAssets)}</div>
          <p className="text-xs text-muted-foreground mt-1">Banks + Investments</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
           <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Deductions</h3>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-500">-{formatCurrency(metrics.totalDeductions)}</div>
          <p className="text-xs text-muted-foreground mt-1">Liabilities</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Net Worth Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Line type="monotone" dataKey="Ultimate Total" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Final Total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Asset Allocation</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Investments: Invested vs Current Value</h3>
        <div className="h-80">
           <ResponsiveContainer width="100%" height="100%">
              <BarChart data={investmentComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                   formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Bar dataKey="Invested" fill="#64748b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Current" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
