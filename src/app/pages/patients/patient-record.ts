import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { finalize } from 'rxjs';
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_SEVERITIES,
  AppointmentStatus,
  PatientRecord,
} from '../../models/clinic.models';
import { PatientsService } from '../../services/clinic.service';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-patient-record',
  imports: [DatePipe, DecimalPipe, RouterLink, TableModule, Tag],
  templateUrl: './patient-record.html',
})
export class PatientRecordPage {
  private readonly patientsService = inject(PatientsService);
  private readonly usersService = inject(UsersService);
  private readonly route = inject(ActivatedRoute);

  readonly record = signal<PatientRecord | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isFinite(id) || id <= 0) {
      this.error.set('Identifiant de patient invalide.');
      this.loading.set(false);
      return;
    }

    this.patientsService
      .getRecord(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (record) => this.record.set(record),
        error: (error) => this.error.set(this.usersService.errorMessage(error)),
      });
  }

  statusLabel(status: AppointmentStatus): string {
    return APPOINTMENT_STATUS_LABELS[status] ?? status;
  }

  statusSeverity(status: AppointmentStatus): 'success' | 'info' | 'warn' | 'danger' {
    return APPOINTMENT_STATUS_SEVERITIES[status] ?? 'info';
  }
}
