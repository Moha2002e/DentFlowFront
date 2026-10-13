import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Appointment,
  AppointmentRequest,
  AppointmentStats,
  AppointmentStatus,
  CalendarMonth,
  Dentist,
  DentistRequest,
  Patient,
  PatientRecord,
  PatientRequest,
  Treatment,
} from '../models/clinic.models';

@Injectable({ providedIn: 'root' })
export class PatientsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/patients`;

  getAll(search?: string, activeOnly = false): Observable<Patient[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    if (activeOnly) {
      params = params.set('activeOnly', 'true');
    }
    return this.http.get<Patient[]>(this.baseUrl, { params });
  }

  getById(id: number): Observable<Patient> {
    return this.http.get<Patient>(`${this.baseUrl}/${id}`);
  }

  getRecord(id: number): Observable<PatientRecord> {
    return this.http.get<PatientRecord>(`${this.baseUrl}/${id}/record`);
  }

  create(request: PatientRequest): Observable<Patient> {
    return this.http.post<Patient>(this.baseUrl, request);
  }

  update(id: number, request: PatientRequest): Observable<Patient> {
    return this.http.put<Patient>(`${this.baseUrl}/${id}`, request);
  }

  archive(id: number): Observable<Patient> {
    return this.http.delete<Patient>(`${this.baseUrl}/${id}`);
  }

  restore(id: number): Observable<Patient> {
    return this.http.post<Patient>(`${this.baseUrl}/${id}/restore`, {});
  }
}

@Injectable({ providedIn: 'root' })
export class DentistsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dentists`;

  getAll(search?: string, activeOnly = false): Observable<Dentist[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    if (activeOnly) {
      params = params.set('activeOnly', 'true');
    }
    return this.http.get<Dentist[]>(this.baseUrl, { params });
  }

  getById(id: number): Observable<Dentist> {
    return this.http.get<Dentist>(`${this.baseUrl}/${id}`);
  }

  create(request: DentistRequest): Observable<Dentist> {
    return this.http.post<Dentist>(this.baseUrl, request);
  }

  update(id: number, request: DentistRequest): Observable<Dentist> {
    return this.http.put<Dentist>(`${this.baseUrl}/${id}`, request);
  }

  deactivate(id: number): Observable<Dentist> {
    return this.http.delete<Dentist>(`${this.baseUrl}/${id}`);
  }

  activate(id: number): Observable<Dentist> {
    return this.http.post<Dentist>(`${this.baseUrl}/${id}/activate`, {});
  }
}

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/appointments`;

  getAll(filters?: {
    patientId?: number;
    dentistId?: number;
    status?: AppointmentStatus;
  }): Observable<Appointment[]> {
    let params = new HttpParams();
    if (filters?.patientId) {
      params = params.set('patientId', filters.patientId);
    }
    if (filters?.dentistId) {
      params = params.set('dentistId', filters.dentistId);
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    return this.http.get<Appointment[]>(this.baseUrl, { params });
  }

  /** Compteurs du planning : calcules en base, jamais recalcules ici. */
  getStats(): Observable<AppointmentStats> {
    return this.http.get<AppointmentStats>(`${this.baseUrl}/stats`);
  }

  /** Pastilles du calendrier : un compteur par jour, regroupe par la base. */
  getCalendar(month: string): Observable<CalendarMonth> {
    const params = new HttpParams().set('month', month);
    return this.http.get<CalendarMonth>(`${this.baseUrl}/calendar`, { params });
  }

  /** Agenda d'une journee, deja trie par heure cote serveur. */
  getDayAgenda(date: string): Observable<Appointment[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<Appointment[]>(`${this.baseUrl}/day`, { params });
  }

  getById(id: number): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.baseUrl}/${id}`);
  }

  create(request: AppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(this.baseUrl, request);
  }

  update(id: number, request: AppointmentRequest): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.baseUrl}/${id}`, request);
  }

  cancel(id: number, cancellationReason: string | null): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.baseUrl}/${id}/cancel`, { cancellationReason });
  }

  complete(id: number): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.baseUrl}/${id}/complete`, {});
  }
}

@Injectable({ providedIn: 'root' })
export class TreatmentsService {
  private readonly http = inject(HttpClient);

  getActive(): Observable<Treatment[]> {
    return this.http.get<Treatment[]>(`${environment.apiUrl}/treatments`);
  }
}
