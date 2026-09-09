'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ComplaintCard } from '@/components/complaints/ComplaintCard';
import type { Complaint } from '@/types/complaint';

interface FeedClientProps {
  feed: Complaint[];
}

export function FeedClient({ feed }: FeedClientProps) {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    { value: 'all', label: 'All Reports', icon: 'grid_view' },
    { value: 'pothole', label: 'Potholes', icon: 'report_problem' },
    { value: 'streetlight', label: 'Streetlights', icon: 'lightbulb' },
    { value: 'garbage', label: 'Sanitation', icon: 'delete' },
    { value: 'water_leakage', label: 'Water Leakage', icon: 'water_drop' },
  ];

  const filteredFeed = useMemo(() => {
    return feed.filter((c) => {
      const matchesCategory =
        selectedCategory === 'all' || c.issue_type === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        c.description_en.toLowerCase().includes(query) ||
        c.issue_type.toLowerCase().includes(query) ||
        (c.ward_name && c.ward_name.toLowerCase().includes(query)) ||
        (c.address && c.address.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [feed, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Bento Hero Header Card */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-7 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#e8f5e9]/70 via-[#e8f5e9]/20 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ background: '#1b5e20', color: '#ffffff' }}
            >
              <span
                className="material-symbols-outlined text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                public
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#e8f5e9] text-[#1b5e20] border border-[#a5d6a7]">
                  Transparency Portal
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#002147] tracking-tight mt-1">
                {t('public_feed') || 'Public Civic Feed'}
              </h1>
              <p className="text-sm text-[#545f72] max-w-2xl mt-1">
                {t('public_feed_subtitle') || 'Transparent public stream of civic issues logged across all city wards and neighborhoods.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center shadow-xs">
              <p className="text-[10px] font-bold uppercase text-slate-400">Total Live</p>
              <p className="text-lg font-bold text-slate-900">{feed.length}</p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-center shadow-xs">
              <p className="text-[10px] font-bold uppercase text-emerald-700">Resolved</p>
              <p className="text-lg font-bold text-emerald-800">
                {feed.filter((c) => c.status === 'resolved').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Dock */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 border ${
                    isSelected
                      ? 'bg-[#002147] text-white border-[#002147] shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {cat.icon}
                  </span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ward, issue, keyword…"
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#002147] focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* Feed List */}
      {filteredFeed.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
            <span className="material-symbols-outlined text-3xl">filter_alt_off</span>
          </div>
          <div>
            <p className="text-base font-bold text-slate-800">
              No matching civic complaints found
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your category filter or search query.
            </p>
          </div>
          {(selectedCategory !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
              className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors mt-2"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredFeed.map((c) => (
            <ComplaintCard key={c.id} complaint={c} />
          ))}
        </div>
      )}
    </div>
  );
}
