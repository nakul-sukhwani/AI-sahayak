/**
 * Autonomous Civic Dispatch Engine
 * Calculates multi-dimensional match scores between municipal complaints
 * and active field personnel based on skill/department, ward proximity,
 * queue load, and SLA urgency.
 */

export interface WorkerCandidate {
  id: string;
  name: string;
  department?: string | null;
  area_name?: string | null;
  active_tasks_count: number;
  max_concurrent_tasks?: number;
  is_available?: boolean;
}

export interface DispatchEvaluation {
  worker_id: string;
  worker_name: string;
  department: string;
  area_name: string;
  active_tasks_count: number;
  dispatch_score: number; // 0 to 100
  recommendation_reason: string;
  is_recommended: boolean;
  score_breakdown: {
    skill_score: number;
    workload_score: number;
    proximity_score: number;
    urgency_multiplier: number;
  };
}

export interface ComplaintDispatchInput {
  id: string;
  issue_type: string;
  severity: string;
  ward_name: string | null;
  ai_suggested_department: string | null;
}

const ISSUE_DEPT_MAPPING: Record<string, string[]> = {
  pothole: ['Roads & Infrastructure', 'Civil Works', 'Public Works'],
  road: ['Roads & Infrastructure', 'Civil Works'],
  footpath: ['Roads & Infrastructure', 'Civil Works'],
  garbage: ['Solid Waste Management', 'Sanitation', 'Public Health'],
  sanitation: ['Solid Waste Management', 'Sanitation'],
  streetlight: ['Electrical', 'Streetlight Maintenance', 'Power & Lighting'],
  electrical: ['Electrical', 'Power & Lighting'],
  water_leakage: ['Water Supply & Sewerage', 'Drainage & Water Supply', 'BWSSB'],
  water: ['Water Supply & Sewerage', 'Drainage & Water Supply'],
  drainage: ['Water Supply & Sewerage', 'Storm Water Drains', 'Civil Works'],
};

/**
 * Evaluates and ranks candidate field personnel for an incoming complaint.
 */
export function rankWorkersForDispatch(
  complaint: ComplaintDispatchInput,
  workers: WorkerCandidate[]
): DispatchEvaluation[] {
  if (!workers || workers.length === 0) return [];

  const issueLower = (complaint.issue_type || '').toLowerCase();
  const relevantDepts =
    ISSUE_DEPT_MAPPING[issueLower] ||
    (complaint.ai_suggested_department ? [complaint.ai_suggested_department] : ['General Maintenance']);

  const evaluations: DispatchEvaluation[] = workers.map((w) => {
    const workerDept = w.department || 'General Maintenance';
    const workerArea = w.area_name || '';
    const activeTasks = w.active_tasks_count || 0;
    const maxTasks = w.max_concurrent_tasks || 3;

    // 1. Skill / Department Score (0 - 40)
    let skillScore = 15;
    const matchesDept = relevantDepts.some((d) =>
      workerDept.toLowerCase().includes(d.toLowerCase())
    );
    if (matchesDept) {
      skillScore = 40;
    } else if (
      complaint.ai_suggested_department &&
      workerDept.toLowerCase().includes(complaint.ai_suggested_department.toLowerCase())
    ) {
      skillScore = 35;
    }

    // 2. Proximity / Ward Score (0 - 30)
    let proximityScore = 10;
    if (
      complaint.ward_name &&
      workerArea &&
      (complaint.ward_name.toLowerCase().includes(workerArea.toLowerCase()) ||
        workerArea.toLowerCase().includes(complaint.ward_name.toLowerCase()))
    ) {
      proximityScore = 30;
    } else if (workerArea) {
      proximityScore = 18;
    }

    // 3. Workload / Queue Capacity Score (0 - 30)
    let workloadScore = 0;
    if (activeTasks === 0) {
      workloadScore = 30;
    } else if (activeTasks === 1) {
      workloadScore = 22;
    } else if (activeTasks < maxTasks) {
      workloadScore = 14;
    } else {
      workloadScore = 5; // Capacity saturated
    }

    // 4. Urgency Multiplier
    const isCritical = complaint.severity === 'critical';
    const isHigh = complaint.severity === 'high';
    const urgencyMultiplier = isCritical ? 1.15 : isHigh ? 1.05 : 1.0;

    const rawTotal = (skillScore + proximityScore + workloadScore) * urgencyMultiplier;
    const finalScore = Math.min(100, Math.round(rawTotal));

    // Construct human-readable reasoning
    const reasons: string[] = [];
    if (skillScore >= 35) reasons.push(`Specialist in ${workerDept}`);
    if (proximityScore >= 30) reasons.push(`Stationed in ${complaint.ward_name}`);
    if (activeTasks === 0) reasons.push('Zero active tickets in queue');
    else reasons.push(`${activeTasks} active task(s)`);

    if (reasons.length === 0) reasons.push('General municipality field personnel');

    return {
      worker_id: w.id,
      worker_name: w.name,
      department: workerDept,
      area_name: workerArea || 'Citywide Division',
      active_tasks_count: activeTasks,
      dispatch_score: finalScore,
      recommendation_reason: reasons.join(' · '),
      is_recommended: false,
      score_breakdown: {
        skill_score: skillScore,
        workload_score: workloadScore,
        proximity_score: proximityScore,
        urgency_multiplier: urgencyMultiplier,
      },
    };
  });

  // Sort descending by dispatch score
  evaluations.sort((a, b) => b.dispatch_score - a.dispatch_score);

  // Mark top rank as recommended
  if (evaluations.length > 0) {
    evaluations[0].is_recommended = true;
  }

  return evaluations;
}
