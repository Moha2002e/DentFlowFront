export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  birthDate: string | null;
  age: number | null;
  nationalNumber: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  iban: string | null;
  medicalNotes: string | null;
  active: boolean;
  createdAt: string | null;
}

export interface PatientRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  birthDate: string | null;
  nationalNumber: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  iban: string | null;
  medicalNotes: string | null;
}

export interface Dentist {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  specialization: string | null;
  inami: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  iban: string | null;
  active: boolean;
}

export interface DentistRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  specialization: string | null;
  inami: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  iban: string | null;
}

export interface Treatment {
  id: number;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number | null;
  active: boolean;
}

export type AppointmentStatus = 'SCHEDULED' | 'CANCELLED' | 'COMPLETED' | 'RESCHEDULED';

export interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  dentistId: number;
  dentistName: string;
  treatmentId: number | null;
  treatmentName: string | null;
  treatmentPrice: number | null;
  appointmentDate: string;
  endDate: string | null;
  durationMinutes: number;
  status: AppointmentStatus;
  reason: string | null;
  notes: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  /** Actions autorisees, decidees par le backend. */
  canEdit: boolean;
  canCancel: boolean;
  canComplete: boolean;
}

export interface AppointmentStats {
  total: number;
  upcoming: number;
  completed: number;
  cancelled: number;
}

/** Nombre de rendez-vous actifs pour une journee, calcule par le backend. */
export interface CalendarDay {
  date: string;
  count: number;
}

export interface AppointmentRequest {
  patientId: number;
  dentistId: number;
  treatmentId: number | null;
  appointmentDate: string;
  durationMinutes: number | null;
  reason: string | null;
  notes: string | null;
}

export interface PatientRecordStats {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  upcomingAppointments: number;
  lastVisit: string | null;
  nextAppointment: string | null;
  totalBilled: number;
}

export interface PatientRecord {
  patient: Patient;
  appointments: Appointment[];
  stats: PatientRecordStats;
}

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: 'Planifié',
  RESCHEDULED: 'Reporté',
  COMPLETED: 'Réalisé',
  CANCELLED: 'Annulé',
};

export const APPOINTMENT_STATUS_SEVERITIES: Record<
  AppointmentStatus,
  'success' | 'info' | 'warn' | 'danger'
> = {
  SCHEDULED: 'info',
  RESCHEDULED: 'warn',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};
