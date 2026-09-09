'use client';

import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
} from 'recharts';
import type { Complaint } from '@/types/complaint';

interface AnalyticsChartsProps {
  complaints: Complaint[];
}

type ChartType = 'bar' | 'line' | 'pie';

const COLORS = ['#002147', '#1565c0', '#1b5e20', '#b45309', '#00695c', '#4a148c'];

export function AnalyticsCharts({ complaints }: AnalyticsChartsProps) {
  const [activeChart, setActiveChart] = useState<ChartType>('bar');
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('weekly');

  const { statusData, typeData, timelineData } = useMemo(() => {
    // 1. Status Data
    const statusCounts: Record<string, number> = {};
    complaints.forEach((c) => {
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    });
    const statusData = Object.entries(statusCounts).map(([name, value]) => ({
      name: name.replace('_', ' ').charAt(0).toUpperCase() + name.replace('_', ' ').slice(1),
      value,
    }));

    // 2. Issue Type Data
    const typeCounts: Record<string, number> = {};
    complaints.forEach((c) => {
      const type = c.issue_type.replace('_', ' ');
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    const typeData = Object.entries(typeCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // 3. Timeline Data (Group by date)
    const dateCounts: Record<string, number> = {};
    complaints.forEach((c) => {
      const date = new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    const timelineData = Object.entries(dateCounts)
      .map(([date, count]) => ({ date, count }))
      .reverse();

    return { statusData, typeData, timelineData };
  }, [complaints]);

  return (
    <div className="bg-white border border-[#dde3ed] rounded-2xl overflow-hidden shadow-sm p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-[#1565c0]">equalizer</span>
            <h2 className="text-base font-bold text-[#1a2332]">Resolution &amp; Category Velocity</h2>
          </div>
          <p className="text-xs text-[#718096] mt-0.5">Live workload distribution across municipal services</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Timeframe Toggle (Quixotic style) */}
          <div className="flex bg-[#f4f6fa] p-1 rounded-xl border border-[#dde3ed]">
            <button
              onClick={() => setTimeframe('weekly')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                timeframe === 'weekly' ? 'bg-white text-[#002147] shadow-sm' : 'text-[#718096] hover:text-[#1a2332]'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeframe('monthly')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                timeframe === 'monthly' ? 'bg-white text-[#002147] shadow-sm' : 'text-[#718096] hover:text-[#1a2332]'
              }`}
            >
              Monthly
            </button>
          </div>

          {/* Chart Type Selector */}
          <div className="flex bg-[#f4f6fa] p-1 rounded-xl border border-[#dde3ed]">
            <button
              onClick={() => setActiveChart('bar')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeChart === 'bar' ? 'bg-[#002147] text-white shadow-sm' : 'text-[#718096] hover:text-[#1a2332]'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveChart('line')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeChart === 'line' ? 'bg-[#002147] text-white shadow-sm' : 'text-[#718096] hover:text-[#1a2332]'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setActiveChart('pie')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeChart === 'pie' ? 'bg-[#002147] text-white shadow-sm' : 'text-[#718096] hover:text-[#1a2332]'
              }`}
            >
              Status
            </button>
          </div>
        </div>
      </div>

      <div className="h-[280px] w-full">
        {activeChart === 'bar' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={typeData.slice(0, 8)} margin={{ top: 15, right: 20, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#718096' }}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#718096' }} />
              <Tooltip
                cursor={{ fill: 'rgba(21,101,192,0.05)', radius: 8 }}
                contentStyle={{ borderRadius: '12px', border: '1px solid #dde3ed', boxShadow: '0 8px 16px rgba(0,0,0,0.08)' }}
              />
              <Bar
                dataKey="value"
                name="Complaints"
                fill="#1565c0"
                radius={[8, 8, 2, 2]}
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'line' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData} margin={{ top: 15, right: 20, left: -10, bottom: 10 }}>
              <defs>
                <linearGradient id="lineColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1565c0" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1565c0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#718096' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#718096' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #dde3ed', boxShadow: '0 8px 16px rgba(0,0,0,0.08)' }}
              />
              <Line
                type="monotone"
                dataKey="count"
                name="Complaints Logged"
                stroke="#1565c0"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: '#ffffff', stroke: '#1565c0' }}
                activeDot={{ r: 6, fill: '#002147' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'pie' && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={105}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
              >
                {statusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #dde3ed', boxShadow: '0 8px 16px rgba(0,0,0,0.08)' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
