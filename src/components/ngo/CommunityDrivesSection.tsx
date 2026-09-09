'use client';

import { useState, useEffect, useTransition } from 'react';
import { createPortal } from 'react-dom';
import type { CommunityDrive } from '@/app/api/ngo/community-drives/route';
import { BANGALORE_WARDS } from '@/constants/authorities';

interface CommunityDrivesSectionProps {
  orgName?: string;
}

const STORAGE_KEY = 'nagrik_joined_community_drives';

const DRIVE_TEMPLATES = [
  {
    label: '🧹 Kerb Clean-up & Desilting',
    title: 'Indiranagar 100ft Road Shramdaan & Kerb Clearing',
    description: 'Community volunteers coming together to clear broken kerb construction gravel, paint pedestrian crossings, and unblock corner storm drains.',
    driveType: 'cleanup' as const,
    wardName: 'Indiranagar',
    meetingPoint: 'Near Domlur Flyover Underpass & 12th Main Junction',
    scheduledDate: 'This Sunday · 07:30 AM',
    maxVolunteers: 35,
  },
  {
    label: '🕳️ Cold-Mix Pothole Patching',
    title: 'HSR Layout Sector 2 Cold-Mix Pothole Patching Drive',
    description: 'Volunteer drive to apply emergency cold-mix bitumen patches to 14 recurrent potholes near high-density residential school zones.',
    driveType: 'pothole_shramdaan' as const,
    wardName: 'Ward 174 - HSR Layout',
    meetingPoint: 'HSR BDA Complex Main Entrance Gate',
    scheduledDate: 'Saturday · 08:00 AM',
    maxVolunteers: 25,
  },
  {
    label: '🌱 Native Tree Plantation',
    title: 'Koramangala 4th Block Green Native Tree Plantation',
    description: 'Planting 60 native Neem and Honge saplings along footpath edges to prevent illegal garbage dumping and restore canopy shade.',
    driveType: 'plantation' as const,
    wardName: 'Ward 151 - Koramangala',
    meetingPoint: 'Koramangala 4th Block Park Gazebo',
    scheduledDate: 'Next Sunday · 07:00 AM',
    maxVolunteers: 50,
  },
];

export function CommunityDrivesSection({ orgName = 'Civic Organization' }: CommunityDrivesSectionProps) {
  const [drives, setDrives] = useState<CommunityDrive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [joinedDrives, setJoinedDrives] = useState<Record<string, boolean>>({});
  const [loadingDriveId, setLoadingDriveId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  // New drive form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [driveType, setDriveType] = useState<'cleanup' | 'plantation' | 'pothole_shramdaan' | 'drainage_unblock'>('cleanup');
  const [wardName, setWardName] = useState('Indiranagar');
  const [meetingPoint, setMeetingPoint] = useState('');
  const [scheduledDate, setScheduledDate] = useState('This Sunday · 07:30 AM');
  const [maxVolunteers, setMaxVolunteers] = useState(30);
  const [formMsg, setFormMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    setMounted(true);

    // 1. Load saved user RSVPs from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setJoinedDrives(JSON.parse(saved));
      }
    } catch {
      // ignore
    }

    // 2. Fetch drives from API
    fetch('/api/ngo/community-drives')
      .then((res) => res.json())
      .then((data) => {
        if (data.drives) setDrives(data.drives);
      })
      .catch((err) => {
        console.error('Failed to load drives:', err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const showToast = (type: 'ok' | 'err', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleToggleRsvp = async (drive: CommunityDrive) => {
    const isCurrentlyJoined = Boolean(joinedDrives[drive.id]);
    const action = isCurrentlyJoined ? 'leave' : 'join';

    setLoadingDriveId(drive.id);

    try {
      const res = await fetch('/api/ngo/community-drives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, drive_id: drive.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update RSVP');

      // Update local joined states
      const newJoined = { ...joinedDrives, [drive.id]: !isCurrentlyJoined };
      setJoinedDrives(newJoined);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newJoined));
      } catch {
        // ignore
      }

      // Update volunteer count in drive list
      setDrives((prev) =>
        prev.map((d) =>
          d.id === drive.id
            ? {
                ...d,
                volunteers_count: Math.max(
                  0,
                  d.volunteers_count + (isCurrentlyJoined ? -1 : 1)
                ),
                is_joined: !isCurrentlyJoined,
              }
            : d
        )
      );

      if (!isCurrentlyJoined) {
        showToast(
          'ok',
          `🎉 Registered for "${drive.title}"! See you on ${drive.scheduled_date} at ${drive.meeting_point}.`
        );
      } else {
        showToast('ok', `Cancelled volunteer RSVP for "${drive.title}".`);
      }
    } catch (err) {
      showToast(
        'err',
        err instanceof Error ? err.message : 'Could not process RSVP. Please try again.'
      );
    } finally {
      setLoadingDriveId(null);
    }
  };

  const applyTemplate = (t: typeof DRIVE_TEMPLATES[number]) => {
    setTitle(t.title);
    setDescription(t.description);
    setDriveType(t.driveType);
    setWardName(t.wardName);
    setMeetingPoint(t.meetingPoint);
    setScheduledDate(t.scheduledDate);
    setMaxVolunteers(t.maxVolunteers);
    setFormMsg(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !meetingPoint.trim()) {
      setFormMsg({ type: 'err', text: 'Please fill in all required fields.' });
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/ngo/community-drives', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            title: title.trim(),
            description: description.trim(),
            drive_type: driveType,
            ward_name: wardName,
            meeting_point: meetingPoint.trim(),
            scheduled_date: scheduledDate.trim() || 'This Sunday · 08:00 AM',
            max_volunteers: Number(maxVolunteers) || 30,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to publish drive');

        setFormMsg({ type: 'ok', text: 'Community Action Drive published successfully!' });
        if (data.drive) {
          setDrives((prev) => [data.drive, ...prev]);
          // Mark creator as joined
          const newJoined = { ...joinedDrives, [data.drive.id]: true };
          setJoinedDrives(newJoined);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newJoined));
          } catch {
            // ignore
          }
        }

        setTimeout(() => {
          setIsModalOpen(false);
          setFormMsg(null);
          setTitle('');
          setDescription('');
          setMeetingPoint('');
          showToast('ok', `🚀 "${title}" has been launched and is live for community RSVPs!`);
        }, 1000);
      } catch (err) {
        setFormMsg({
          type: 'err',
          text: err instanceof Error ? err.message : 'Error publishing drive',
        });
      }
    });
  };

  const modalContent = isModalOpen && (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#00695c] text-white flex items-center justify-between flex-shrink-0">
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
            className="w-8 h-8 rounded-lg hover:bg-white/10 text-white flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto">
          {/* Quick Template Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Quick Fill Templates
            </span>
            <div className="flex flex-wrap gap-1.5">
              {DRIVE_TEMPLATES.map((t, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              Action Goals &amp; Volunteer Instructions *
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what volunteers will do, equipment/gloves provided, target area to restore..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#00695c] resize-none"
            />
          </div>

          {formMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                formMsg.type === 'ok'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  : 'bg-red-50 text-red-800 border border-red-300'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {formMsg.type === 'ok' ? 'check_circle' : 'error'}
              </span>
              <span>{formMsg.text}</span>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 text-xs font-bold text-white bg-[#00695c] hover:bg-[#004d40] rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-sm">rocket_launch</span>
              )}
              <span>Publish Community Drive</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

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
          onClick={() => {
            setFormMsg(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-[#00695c] hover:bg-[#004d40] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
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
            const isJoined = Boolean(joinedDrives[drive.id]);
            const isDriveLoading = loadingDriveId === drive.id;
            const progress = Math.min(
              100,
              Math.round((drive.volunteers_count / drive.max_volunteers) * 100)
            );

            return (
              <div
                key={drive.id}
                className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-white flex flex-col justify-between transition-all duration-200 shadow-2xs space-y-4 group"
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
                      <span className={isJoined ? 'text-emerald-700 font-bold' : ''}>
                        {drive.volunteers_count} Registered {isJoined ? '(You + others)' : ''}
                      </span>
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
                    onClick={() => handleToggleRsvp(drive)}
                    disabled={isDriveLoading}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-xs ${
                      isJoined
                        ? 'bg-emerald-100 hover:bg-red-50 text-emerald-900 hover:text-red-700 border border-emerald-300 hover:border-red-300'
                        : 'bg-[#002147] hover:bg-[#003166] text-white'
                    }`}
                  >
                    {isDriveLoading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Updating RSVP…</span>
                      </>
                    ) : isJoined ? (
                      <>
                        <span className="material-symbols-outlined text-sm text-emerald-700">check_circle</span>
                        <span>Volunteer Confirmed ✓ (Click to Cancel)</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">volunteer_activism</span>
                        <span>Join as Volunteer</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-[9999] px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-bottom-5 duration-200 border ${
            toastMessage.type === 'ok'
              ? 'bg-slate-900 text-white border-slate-700'
              : 'bg-red-900 text-white border-red-700'
          }`}
        >
          <span className="material-symbols-outlined text-base text-emerald-400">
            {toastMessage.type === 'ok' ? 'task_alt' : 'error'}
          </span>
          <span className="max-w-xs">{toastMessage.text}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Render Modal into document.body to avoid stacking context traps */}
      {mounted && modalContent && createPortal(modalContent, document.body)}
    </div>
  );
}
