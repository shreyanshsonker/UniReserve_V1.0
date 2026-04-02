export type UserRole = 'STUDENT' | 'MANAGER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  student_id?: string | null;
  employee_id?: string | null;
  department?: string | null;
  year_of_study?: number | null;
  profile_picture?: string | null;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message: string;
  meta?: {
    total: number;
    next: string | null;
    previous: string | null;
  };
}

export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ValidationErrors = Record<string, string | string[]>;

export interface AuthTokenPayload {
  access: string;
}

export interface FacilitySummary {
  id: string;
  name: string;
  facility_type: string;
  building: string;
  total_capacity: number;
  is_active: boolean;
  manager_name?: string;
}

export interface FacilityDetail extends FacilitySummary {
  description?: string | null;
  floor?: string | null;
  room_number?: string | null;
  requires_approval: boolean;
  min_group_size: number;
  max_booking_duration_mins: number;
  slot_duration_mins: number;
  images?: string[] | null;
  amenities?: string[] | null;
  manager?: string | null;
}

export interface SlotAvailability {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  available_capacity: number;
  booked_count: number;
  is_blocked: boolean;
  status_color: string;
}

export interface BookingStudentSummary {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
}

export interface BookingSlotSummary {
  id: string;
  facility_id: string;
  facility_name: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  available_capacity: number;
  booked_count: number;
  is_blocked: boolean;
}

export interface BookingSummary {
  id: string;
  student: BookingStudentSummary;
  facility: string;
  facility_name: string;
  slot: BookingSlotSummary;
  booking_reference: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  seat_number: number | null;
  group_size: number;
  group_members: string[] | null;
  purpose: string | null;
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  checked_in_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}
