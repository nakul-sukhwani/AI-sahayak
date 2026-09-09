'use client';

import { useState } from 'react';
import type { PredictiveMaintenanceReport, WardRiskProfile } from '@/lib/predictive-maintenance';

interface PredictiveHotspotsCardProps {
  report: PredictiveMaintenanceReport;
}

export function PredictiveHotspotsCard({ report }: PredictiveHotspotsCardProps) {
  const [selectedWard, setSelectedWard] = useState<WardRiskProfile>(
    report.ward_profiles[0] || null
  );
  const [dispatchedWards, setDispatchedWards] = useState<Record<string, boolean>>({});

  const handlePreemptiveDispatch = (wardName: string) => {
    setDispatchedWards((prev) => ({ ...prev, [wardName]: true }));
  };

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6 relative overflow-hidden">
      {/* Decorative ambient gradient */}
      <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-blue-50/60 via-indigo-50/20 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#002147] text-white flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              radar
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-[#1565c0] border border-blue-200">
                Predictive AI Hotspots
              </span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Forecast
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#002147] tracking-tight mt-0.5">
              Infrastructure Vulnerability &amp; Preventive Maintenance
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-400 font-medium">Monitored Zones:</span>{' '}
            <strong className="text-slate-900">{report.ward_profiles.length} Wards</strong>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-red-50 border border-red-200 text-xs">
            <span className="text-red-500 font-medium">Elevated Risk:</span>{' '}
            <strong className="text-red-800">{report.high_risk_wards_count} Wards</strong>
          </div>
        </div>
      </div>

      {/* Top Advisory Banner */}
      {selectedWard && (
        <div className="relative z-10 p-4 rounded-2xl bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-red-50/60 border border-amber-300 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-xl">warning</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900">{selectedWard.ward_name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      selectedWard.risk_level === 'CRITICAL'
                        ? 'bg-red-200 text-red-900'
                        : selectedWard.risk_level === 'HIGH'
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-blue-100 text-blue-900'
                    }`}
                  >
                    {selectedWard.risk_level} · Risk Index: {selectedWard.overall_risk_score}/100
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-1 font-medium leading-relaxed">
                  {selectedWard.preventive_advisory}
                </p>
                <p className="text-xs text-slate-900 font-semibold mt-0.5 flex items-center gap-1.5 text-amber-950">
                  <span className="material-symbols-outlined text-sm text-amber-700">bolt</span>
                  Recommended Pre-Emptive Action: {selectedWard.suggested_action}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => handlePreemptiveDispatch(selectedWard.ward_name)}
                disabled={dispatchedWards[selectedWard.ward_name]}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all ${
                  dispatchedWards[selectedWard.ward_name]
                    ? 'bg-emerald-600 text-white cursor-default'
                    : 'bg-[#002147] hover:bg-[#003166] text-white'
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {dispatchedWards[selectedWard.ward_name] ? 'check_circle' : 'send_time_extension'}
                </span>
                <span>
                  {dispatchedWards[selectedWard.ward_name]
                    ? 'Pre-Emptive Work Order Dispatched!'
                    : 'Issue Preventive Work Order'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ward Radar Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {report.ward_profiles.slice(0, 8).map((ward) => {
          const isSelected = selectedWard?.ward_name === ward.ward_name;
          const isCritical = ward.risk_level === 'CRITICAL';
          const isHigh = ward.risk_level === 'HIGH';

          return (
            <div
              key={ward.ward_name}
              onClick={() => setSelectedWard(ward)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'bg-blue-50/50 border-[#1565c0] shadow-sm ring-2 ring-[#1565c0]/15'
                  : 'bg-slate-50/70 hover:bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-xs font-bold text-slate-800 truncate max-w-[150px]">
                  {ward.ward_name.replace('Ward ', 'W-')}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isCritical
                      ? 'bg-red-100 text-red-700'
                      : isHigh
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {ward.overall_risk_score}%
                </span>
              </div>

              {/* Progress bars */}
              <div className="space-y-1.5 text-[11px]">
                <div>
                  <div className="flex justify-between text-slate-500 text-[10px] font-medium">
                    <span>Monsoon Drainage</span>
                    <span className="font-semibold text-slate-700">{ward.waterlogging_risk}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        ward.waterlogging_risk > 70 ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${ward.waterlogging_risk}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-500 text-[10px] font-medium">
                    <span>Road Surface Wear</span>
                    <span className="font-semibold text-slate-700">{ward.road_wear_score}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        ward.road_wear_score > 70 ? 'bg-amber-600' : 'bg-amber-400'
                      }`}
                      style={{ width: `${ward.road_wear_score}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-500 text-[10px] font-medium">
                    <span>Electrical Feeder</span>
                    <span className="font-semibold text-slate-700">{ward.electrical_grid_risk}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-purple-500 transition-all"
                      style={{ width: `${ward.electrical_grid_risk}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
