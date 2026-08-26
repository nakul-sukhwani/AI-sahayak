'use client';

import type { Authority } from '@/types/authority';

interface AuthoritySuggestionProps {
  authority: Authority;
  aiDepartment?: string | null;
}

export function AuthoritySuggestion({ authority, aiDepartment }: AuthoritySuggestionProps) {
  return (
    <div className="border border-[#E2E8F0] rounded-xl p-4 bg-white">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-[#dbeafe] flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-[#2563EB] text-lg">
            account_balance
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-[#191c1e]">{authority.name}</p>
            {aiDepartment && (
              <span className="text-xs px-2 py-0.5 bg-[#ede9fe] text-[#7C3AED] rounded-full border border-[#7C3AED]/20">
                AI suggested
              </span>
            )}
          </div>
          <p className="text-xs text-[#545f72] mt-0.5">{authority.department}</p>

          {/* Contact info */}
          <div className="mt-2 flex flex-col gap-1">
            {authority.phone && (
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#737780] text-sm">phone</span>
                <span className="text-xs text-[#545f72]">{authority.phone}</span>
              </div>
            )}
            {authority.email && (
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#737780] text-sm">email</span>
                <span className="text-xs text-[#545f72] truncate">{authority.email}</span>
              </div>
            )}
          </div>

          {/* Coverage wards */}
          {authority.wards.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {authority.wards.slice(0, 4).map((ward) => (
                <span
                  key={ward}
                  className="text-xs px-1.5 py-0.5 bg-[#f2f4f6] text-[#43474f] rounded"
                >
                  {ward}
                </span>
              ))}
              {authority.wards.length > 4 && (
                <span className="text-xs text-[#737780]">+{authority.wards.length - 4} more</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
