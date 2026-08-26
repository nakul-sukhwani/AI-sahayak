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
} from 'recharts';
import type { Complaint } from '@/types/complaint';

interface AnalyticsChartsProps {
  complaints: Complaint[];
}

type ChartType = 'bar' | 'pie' | 'line';

const COLORS = ['#001e40', '#2563EB', '#059669', '#D97706', '#DC2626', '#8B5CF6'];

export function AnalyticsCharts({ complaints }: AnalyticsChartsProps) {
  const [activeChart, setActiveChart] = useState<ChartType>('bar');

  const { statusData, typeData, timelineData } = useMemo(() => {
    // 1. Status Data
    const statusCounts: Record<string, number> = {};
    complaints.forEach((c) => {
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    });
    const statusData = Object.entries(statusCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));

    // 2. Issue Type Data
    const typeCounts: Record<string, number> = {};
    complaints.forEach((c) => {
      typeCounts[c.issue_type] = (typeCounts[c.issue_type] || 0) + 1;
    });
    const typeData = Object.entries(typeCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Sort descending

    // 3. Timeline Data (Group by date)
    const dateCounts: Record<string, number> = {};
    complaints.forEach((c) => {
      const date = new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });
    
    // Sort dates (basic string sort for now, assuming recent dates)
    const timelineData = Object.entries(dateCounts)
      .map(([date, count]) => ({ date, count }))
      .reverse(); // Assuming descending from DB, we want ascending for timeline

    return { statusData, typeData, timelineData };
  }, [complaints]);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm mb-8">
      <div className="p-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#191c1e]">Complaint Analytics</h2>
          <p className="text-xs text-[#545f72] mt-0.5">Visual breakdown of civic issues.</p>
        </div>
        
        {/* Chart Selector */}
        <div className="flex bg-[#f7f9fb] p-1 rounded-lg border border-[#E2E8F0] w-fit">
          <button
            onClick={() => setActiveChart('bar')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeChart === 'bar' ? 'bg-white text-[#001e40] shadow-sm' : 'text-[#545f72] hover:text-[#191c1e]'
            }`}
          >
            Issue Types (Bar)
          </button>
          <button
            onClick={() => setActiveChart('pie')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeChart === 'pie' ? 'bg-white text-[#001e40] shadow-sm' : 'text-[#545f72] hover:text-[#191c1e]'
            }`}
          >
            Status (Pie)
          </button>
          <button
            onClick={() => setActiveChart('line')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeChart === 'line' ? 'bg-white text-[#001e40] shadow-sm' : 'text-[#545f72] hover:text-[#191c1e]'
            }`}
          >
            Timeline (Line)
          </button>
        </div>
      </div>

      <div className="p-4 h-[350px] w-full">
        {activeChart === 'bar' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={typeData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#545f72' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#545f72' }} />
              <Tooltip
                cursor={{ fill: '#f0f4ff' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="value" name="Complaints" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'pie' && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'line' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#545f72' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#545f72' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Line type="monotone" dataKey="count" name="Complaints Filed" stroke="#059669" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
