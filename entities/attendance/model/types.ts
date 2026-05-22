/** Response shape from deltadb `GET /api/attendance/admin/all`. */
export type AttendanceAdminUser = {
  _id: string;
  name?: string;
  email?: string;
  mobile?: string;
  role?: string;
  level?: string;
};

export type AttendanceAdminRecord = {
  id: string;
  user: AttendanceAdminUser | null;
  date: string;
  checkIn: {
    time?: string | null;
    location?: { address?: string | null } | null;
    notes?: string | null;
    selfie?: string | null;
  } | null;
  checkOut: {
    time?: string | null;
    location?: { address?: string | null } | null;
    notes?: string | null;
    selfie?: string | null;
  } | null;
  totalHours?: number | null;
  totalBreakTime?: number | null;
  status: "checked-in" | "checked-out" | "absent" | "on-leave";
  isManualEntry?: boolean;
  manualEntryBy?: { _id?: string; name?: string; email?: string } | string;
  manualEntryReason?: string;
  createdAt?: string;
};

export type AttendanceAdminAllResponse = {
  attendance: AttendanceAdminRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    total: number;
    checkedIn: number;
    checkedOut: number;
    absent: number;
  };
};
