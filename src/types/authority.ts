export interface Authority {
  id: number;
  name: string;
  department: string;
  email: string | null;
  phone: string | null;
  city: string;
  issue_types: string[];
  wards: string[];
}

export interface Ward {
  id: number;
  name: string;
  city: string;
  center_lat: number | null;
  center_lng: number | null;
  boundary_geo: Record<string, unknown> | null;
}
