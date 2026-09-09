'use client';

import { useState, useEffect, useTransition } from 'react';
import type { CommunityDrive } from '@/app/api/ngo/community-drives/route';
import { BANGALORE_WARDS } from '@/constants/authorities';

interface CommunityDrivesSectionProps {
  orgName?: string;
}

export function CommunityDrivesSection({ orgName = 'Civic Organization' }: CommunityDrivesSectionProps) {
  const [drives, setDrives] = useState<CommunityDrive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [joinedDrives, setJoinedDrives] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  // New drive form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [driveType, setDriveType] = useState<'cleanup' | 'plantation' | 'pothole_shramdaan' | 'drainage_unblock'>('cleanup');
  const [wardName, setWardName] = useState('Indiranagar');
  const [meetingPoint, setMeetingPoint] = useState('');
  const [scheduledDate, setScheduledDate] = useState('This Sunday · 07:30 AM');
  const [maxVolunteers, setMaxVolunteers] = useState(30);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/ngo/community-drives')
      .then((res) => res.json())
      .then((data) => {
        if (data.drives) setDrives(data.drives);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleJoin = (driveId: string) => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/ngo/community-drives', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'join', drive_id: driveId }),
        });
        const data = await res.json();
        if (data.success) {
          setJoinedDrives((prev) => ({ ...prev, [driveId]: true }));
          setDrives((prev) =>
            prev.map((d) => (d.id === driveId ? { ...d, volunteers_count: d.volunteers_count + 1 } : d))
          );
        }
      } catch {
        // error
      }
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !meetingPoint) {
      setMsg({ type: 'err', text: 'Please fill in all drive details.' });
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/ngo/community-drives', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            title,
            description,
            drive_type: driveType,
            ward_name: wardName,
            meeting_point: meetingPoint,
            scheduled_date: scheduledDate,
            max_volunteers: maxVolunteers,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to publish drive');

        setMsg({ type: 'ok', text: 'Community Action Drive published successfully!' });
        if (data.drive) setDrives((prev) => [data.drive, ...prev]);

        setTimeout(() => {
          setIsModalOpen(false);
          setMsg(null);
          setTitle('');
          setDescription('');
          setMeetingPoint('');
        }, 1200);
      } catch (err) {
        setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Error publishing drive' });
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-[#dde3ed] p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              Citizen Mobilization &amp; Shramdaan
            </span>
          </div>
          <h2 className="text-lg font-bold text-[#002147] tracking-tight">
            Community Action &amp; Volunteer Drives
          </h2>
          <p className="text-xs text-[#718096] mt-0.5">
            Empower citizens to solve local neighborhood problems through hands-on volunteer action.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[#00695c] hover:bg-[#004d40] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-sm">add_circle</span>
          <span>Launch Community Drive</span>
        </button>
      </div>

      {/* Grid of Drives */}
      {isLoading ? (
        <div className="p-8 flex items-center justify-center gap-2 text-xs text-slate-500">
          <span className="w-4 h-4 border-2 border-[#00695c] border-t-transparent rounded-full animate-spin" />
          <span>Loading active community drives…</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {drives.map((drive) => {
            const isJoined = joinedDrives[drive.id] || drive.is_joined;
            const progress = Math.min(100, Math.round((drive.volunteers_count / drive.max_volunteers) * 100));

            return (
              <div
                key={drive.id}
                className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-white flex flex-col justify-between transition-all duration-200 shadow-2xs space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {drive.drive_type.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {drive.ward_name}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {drive.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {drive.description}
                  </p>

                  <div className="pt-2 border-t border-slate-200/80 space-y-1.5 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-[#00695c]">event</span>
                      <span>{drive.scheduled_date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-blue-600">location_on</span>
                      <span className="truncate">{drive.meeting_point}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 space-y-2.5">
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold mb-1 text-slate-700">
                      <span>{drive.volunteers_count} Registered</span>
                      <span>Target: {drive.max_volunteers}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleJoin(drive.id)}
                    disabled={isJoined || isPending}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isJoined
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                        : 'bg-[#002147] hover:bg-[#003166] text-white shadow-xs'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {isJoined ? 'check_circle' : 'volunteer_activism'}
                    </span>
                    <span>{isJoined ? 'Volunteer Confirmed ✓' : 'Join as Volunteer'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal to launch new community drive */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
        >
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-[#00695c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-xl">groups</span>
                <div>
                  <h3 className="text-sm font-bold">Launch Community Action Drive</h3>
                  <p className="text-[11px] text-emerald-200">Organized by {orgName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-white/10 text-white flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Drive Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Indiranagar Lake Clean-up & Desilting Shramdaan"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#00695c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Action Type
                  </label>
                  <select
                    value={driveType}
                    onChange={(e) => setDriveType(e.target.value as typeof driveType)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white"
                  >
                    <option value="cleanup">Garbage &amp; Plastic Clean-up</option>
                    <option value="pothole_shramdaan">Pothole Patching Shramdaan</option>
                    <option value="plantation">Native Tree Plantation</option>
                    <option value="drainage_unblock">Drainage Debris Clearing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Municipal Ward
                  </label>
                  <select
                    value={wardName}
                    onChange={(e) => setWardName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white"
                  >
                    {BANGALORE_WARDS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Meeting Point &amp; Landmarks *
                </label>
                <input
                  type="text"
                  required
                  value={meetingPoint}
                  onChange={(e) => setMeetingPoint(e.target.value)}
                  placeholder="e.g. Near BDA Complex Main Entrance Gate"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#00695c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Scheduled Date &amp; Time
                  </label>
                  <input
                    type="text"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    placeholder="e.g. Sunday · 07:30 AM"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Volunteer Target
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={200}
                    value={maxVolunteers}
                    onChange={(e) => setMaxVolunteers(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Action Goals &amp; Citizen Instructions *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain what volunteers will do, safety gloves provided, target area to restore..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#00695c] resize-none"
                />
              </div>

              {msg && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    msg.type === 'ok'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                      : 'bg-red-50 text-red-800 border border-red-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {msg.type === 'ok' ? 'check_circle' : 'error'}
                  </span>
                  <span>{msg.text}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#00695c] hover:bg-[#004d40] rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-sm">rocket_launch</span>
                  <span>Publish Community Drive</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
