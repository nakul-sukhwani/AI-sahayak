'use client';

import { useState } from 'react';
import type { WardScorecardReport } from '@/lib/ward-scorecard';

interface WardScorecardCardProps {
  report: WardScorecardReport;
  orgName?: string;
}

export function WardScorecardCard({ report, orgName = 'Civic Organization' }: WardScorecardCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [filterGrade, setFilterGrade] = useState<string>('all');

  const filteredScores = report.ward_scores.filter((w) => {
    if (filterGrade !== 'all' && w.grade !== filterGrade) return false;
    return true;
  });

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(`/api/ngo/ward-scorecard?format=pdf&orgName=${encodeURIComponent(orgName)}`);
      if (!res.ok) throw new Error('PDF export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ward_Civic_Audit_Scorecard_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // error
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#dde3ed] p-6 shadow-sm space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#002147] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#002147]">
              Democratic Transparency &amp; Governance Index
            </span>
          </div>
          <h2 className="text-lg font-bold text-[#002147] tracking-tight">
            Municipal Ward Accountability Scorecards
          </h2>
          <p className="text-xs text-[#718096] mt-0.5">
            Objective performance grading based on citizen complaints, SLA turnaround, and contractor delays.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="px-4 py-2 bg-[#002147] hover:bg-[#003166] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          {isDownloading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
          )}
          <span>Download Public Audit Report (PDF)</span>
        </button>
      </div>

      {/* City Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-200/80">
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Citywide SLA Rate</p>
          <p className="text-2xl font-black text-[#1565c0]">{report.city_average_sla}%</p>
          <p className="text-[11px] text-slate-500">Average resolution efficiency</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Top Performing Ward</p>
          <p className="text-lg font-bold text-emerald-900 truncate">{report.top_performing_ward}</p>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
            Grade A · High Citizen Satisfaction
          </span>
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-700">Needs Urgent Escalation</p>
          <p className="text-lg font-bold text-red-900 truncate">{report.most_neglected_ward}</p>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-800">
            Low SLA · Chronic Delays
          </span>
        </div>
      </div>

      {/* Grade Filter Pill Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none">
        <span className="text-xs font-semibold text-slate-500 mr-1">Filter:</span>
        {['all', 'A', 'B', 'C', 'D'].map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setFilterGrade(g)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
              filterGrade === g
                ? 'bg-[#002147] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {g === 'all' ? 'All Wards' : `Grade ${g}`}
          </button>
        ))}
      </div>

      {/* Ward Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {filteredScores.map((ward) => {
          const isA = ward.grade === 'A';
          const isB = ward.grade === 'B';
          const isC = ward.grade === 'C';

          const badgeBg = isA
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
            : isB
            ? 'bg-blue-100 text-blue-800 border-blue-300'
            : isC
            ? 'bg-amber-100 text-amber-800 border-amber-300'
            : 'bg-red-100 text-red-800 border-red-300';

          return (
            <div
              key={ward.ward_name}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all duration-200 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between gap-1">
                <h3 className="text-xs font-bold text-slate-900 truncate">
                  {ward.ward_name}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${badgeBg}`}>
                  Grade {ward.grade}
                </span>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                  <span>SLA Adherence</span>
                  <span>{ward.sla_rate}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isA ? 'bg-emerald-600' : isB ? 'bg-blue-600' : isC ? 'bg-amber-500' : 'bg-red-600'
                    }`}
                    style={{ width: `${ward.sla_rate}%` }}
                  />
                </div>
              </div>

              <div className="text-[11px] space-y-1 text-slate-600 pt-1 border-t border-slate-200/80">
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg Resolution:</span>
                  <span className="font-bold text-slate-800">{ward.avg_resolution_days} Days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Overdue:</span>
                  <span className={`font-bold ${ward.overdue_count > 0 ? 'text-red-700' : 'text-slate-700'}`}>
                    {ward.overdue_count} Tickets
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Frequent Issue:</span>
                  <span className="font-bold text-slate-800 truncate max-w-[120px]" title={ward.primary_issue}>
                    {ward.primary_issue}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 leading-snug line-clamp-2 italic pt-0.5">
                "{ward.accountability_verdict}"
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
