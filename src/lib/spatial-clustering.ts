/**
 * Spatial Clustering & Duplicate Complaint Matching Engine
 * Implements Haversine distance calculations and spatial clustering
 * to identify duplicate civic reports within a 150m radius.
 */

export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export interface ExistingComplaintRecord {
  id: string;
  latitude: number;
  longitude: number;
  issue_type: string;
  description_en: string;
  severity: string;
  status: string;
  address: string | null;
  ward_name: string | null;
  created_at: string;
}

export interface ClusterMatchCandidate {
  id: string;
  issue_type: string;
  description_en: string;
  severity: string;
  status: string;
  address: string | null;
  ward_name: string | null;
  distance_meters: number;
  created_at: string;
  urgency_boost?: number;
}

export interface SpatialClusterCheckResult {
  is_potential_duplicate: boolean;
  cluster_count: number;
  nearby_candidates: ClusterMatchCandidate[];
  master_ticket: ClusterMatchCandidate | null;
  reason: string;
}

/**
 * Evaluates candidate complaints against target coordinate and category.
 * If within radius (default 150m) and category matches or is structurally related,
 * flags as potential duplicate and designates the oldest active report as the Master Ticket.
 */
export function findSpatialDuplicates(
  targetLat: number,
  targetLng: number,
  targetIssueType: string,
  existingComplaints: ExistingComplaintRecord[],
  radiusMeters: number = 150
): SpatialClusterCheckResult {
  const candidates: ClusterMatchCandidate[] = [];

  for (const c of existingComplaints) {
    if (!c.latitude || !c.longitude) continue;

    const dist = calculateHaversineDistance(
      targetLat,
      targetLng,
      Number(c.latitude),
      Number(c.longitude)
    );

    if (dist <= radiusMeters) {
      // Check for exact category match or broad infrastructural overlap
      const isExactCategory =
        targetIssueType.toLowerCase() === c.issue_type.toLowerCase();

      // Related category overlaps (e.g. road cave-in and pothole, or drainage and water leakage)
      const isRelated =
        (targetIssueType.includes('water') && c.issue_type.includes('water')) ||
        (targetIssueType.includes('road') && c.issue_type.includes('pothole')) ||
        (targetIssueType.includes('garbage') && c.issue_type.includes('sanitation'));

      if (isExactCategory || isRelated) {
        candidates.push({
          id: c.id,
          issue_type: c.issue_type,
          description_en: c.description_en,
          severity: c.severity,
          status: c.status,
          address: c.address,
          ward_name: c.ward_name,
          distance_meters: dist,
          created_at: c.created_at,
        });
      }
    }
  }

  // Sort by distance (closest first), then by age (oldest first as master)
  candidates.sort((a, b) => {
    if (a.distance_meters !== b.distance_meters) {
      return a.distance_meters - b.distance_meters;
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  const isDuplicate = candidates.length > 0;
  const master = isDuplicate ? candidates[0] : null;

  let reason = 'No duplicate complaints found in the immediate vicinity.';
  if (isDuplicate && master) {
    reason = `Found ${candidates.length} active civic report(s) within ${master.distance_meters}m of your coordinates. Nearest ticket: #${master.id.slice(0, 8)} (${master.issue_type.toUpperCase()}).`;
  }

  return {
    is_potential_duplicate: isDuplicate,
    cluster_count: candidates.length,
    nearby_candidates: candidates,
    master_ticket: master,
    reason,
  };
}
