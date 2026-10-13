import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { DatePicker } from 'primeng/datepicker';
import { Dialog } from 'primeng/dialog';
import { Drawer } from 'primeng/drawer';
import { SortIcon, TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Timeline } from 'primeng/timeline';
import { DatePipe, DecimalPipe } from '@angular/common';
import { finalize, forkJoin } from 'rxjs';
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_SEVERITIES,
  Appointment,
  AppointmentRequest,
  AppointmentStats,
  AppointmentStatus,
  CalendarDay,
  Dentist,
  Patient,
  Treatment,
} from '../../models/clinic.models';
import {
  AppointmentsService,
  DentistsService,
  PatientsService,
  TreatmentsService,
} from '../../services/clinic.service';
import { UsersService } from '../../services/users.service';

/**
 * Ecran de planning. Aucun filtrage ni calcul n'est fait ici : la liste filtree,
 * les compteurs, les listes de patients et dentistes selectionnables et les
 * actions autorisees proviennent tous du backend.
 */
@Component({
  selector: 'app-appointments',
  imports: [
    ConfirmDialog,
    DatePicker,
    DatePipe,
    DecimalPipe,
    Dialog,
    FormsModule,
    Drawer,
    ReactiveFormsModule,
    SortIcon,
    TableModule,
    Tag,
    Timeline,
  ],
  providers: [ConfirmationService],
  templateUrl: './appointments.html',
})
export class Appointments {
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly patientsService = inject(PatientsService);
  private readonly dentistsService = inject(DentistsService);
  private readonly treatmentsService = inject(TreatmentsService);
  private readonly usersService = inject(UsersService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);

  readonly appointments = signal<Appointment[]>([]);
  readonly stats = signal<AppointmentStats>({ total: 0, upcoming: 0, completed: 0, cancelled: 0 });
  readonly patients = signal<Patient[]>([]);
  readonly dentists = signal<Dentist[]>([]);
  readonly treatments = signal<Treatment[]>([]);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly pendingId = signal<number | null>(null);
  readonly editedAppointment = signal<Appointment | null>(null);
  readonly statusFilter = signal<AppointmentStatus | ''>('');

  // --- Vue calendrier -------------------------------------------------------
  readonly view = signal<'list' | 'calendar'>('list');
  /** Compteur par jour, indexe sur « yyyy-MM-dd » pour un accès direct au rendu. */
  readonly dayCounts = signal<Record<string, number>>({});
  readonly dayAppointments = signal<Appointment[]>([]);
  readonly selectedDate = signal<Date>(new Date());
  readonly calendarLoading = signal(false);

  /** Lie au p-datepicker : PrimeNG exige une Date mutable. */
  pickedDate: Date = new Date();

  /** Rendez-vous a annuler, pilote par la boite de dialogue dediee. */
  readonly cancelTarget = signal<Appointment | null>(null);

  drawerVisible = false;
  cancelDialogVisible = false;
  cancellationReason = '';

  readonly form = this.formBuilder.nonNullable.group({
    patientId: [null as number | null, Validators.required],
    dentistId: [null as number | null, Validators.required],
    treatmentId: [null as number | null],
    appointmentDate: ['', Validators.required],
    durationMinutes: [null as number | null],
    reason: [''],
    notes: [''],
  });

  constructor() {
    this.loadReferenceData();
    this.loadAppointments();
  }

  /** Listes de selection : seuls les dossiers actifs, filtres par le serveur. */
  private loadReferenceData(): void {
    forkJoin({
      patients: this.patientsService.getAll(undefined, true),
      dentists: this.dentistsService.getAll(undefined, true),
      treatments: this.treatmentsService.getActive(),
    }).subscribe({
      next: (data) => {
        this.patients.set(data.patients);
        this.dentists.set(data.dentists);
        this.treatments.set(data.treatments);
      },
      error: (error) => this.error.set(this.usersService.errorMessage(error)),
    });
  }

  /** Liste et compteurs rechargees depuis le serveur apres chaque changement. */
  loadAppointments(): void {
    this.loading.set(true);
    const status = this.statusFilter();

    forkJoin({
      appointments: this.appointmentsService.getAll(status ? { status } : undefined),
      stats: this.appointmentsService.getStats(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          this.appointments.set(data.appointments);
          this.stats.set(data.stats);
          this.error.set(null);
        },
        error: (error) => this.error.set(this.usersService.errorMessage(error)),
      });
  }

  onStatusFilter(value: string): void {
    this.statusFilter.set((value as AppointmentStatus) || '');
    this.loadAppointments();
  }

  // --- Vue calendrier -------------------------------------------------------

  switchView(view: 'list' | 'calendar'): void {
    this.view.set(view);

    if (view === 'calendar') {
      const current = this.selectedDate();
      this.loadMonth(current.getFullYear(), current.getMonth() + 1);
      this.loadDay(current);
    }
  }

  /** Pastilles du mois affiché. PrimeNG envoie un mois 1-based, parfois incomplet. */
  onMonthChange(event: { month?: number; year?: number }): void {
    const current = this.selectedDate();
    this.loadMonth(event.year ?? current.getFullYear(), event.month ?? current.getMonth() + 1);
  }

  onDateSelect(date: Date): void {
    this.selectedDate.set(date);
    this.loadDay(date);
  }

  private loadMonth(year: number, month: number): void {
    this.appointmentsService
      .getCalendar(`${year}-${String(month).padStart(2, '0')}`)
      .subscribe({
        next: (days) => {
          const counts: Record<string, number> = {};
          for (const day of days) {
            counts[day.date] = day.count;
          }
          this.dayCounts.set(counts);
        },
        error: (error) => this.error.set(this.usersService.errorMessage(error)),
      });
  }

  private loadDay(date: Date): void {
    this.calendarLoading.set(true);
    this.appointmentsService
      .getDayAgenda(this.toIsoDate(date))
      .pipe(finalize(() => this.calendarLoading.set(false)))
      .subscribe({
        next: (appointments) => {
          this.dayAppointments.set(appointments);
          this.error.set(null);
        },
        error: (error) => this.error.set(this.usersService.errorMessage(error)),
      });
  }

  /** Nombre de rendez-vous d'une case du calendrier, 0 si aucun. */
  countFor(day: { day: number; month: number; year: number }): number {
    const key = `${day.year}-${String(day.month + 1).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`;
    return this.dayCounts()[key] ?? 0;
  }

  /** Recharge la vue courante après une création, annulation ou clôture. */
  private refreshCurrentView(): void {
    this.loadAppointments();

    if (this.view() === 'calendar') {
      const current = this.selectedDate();
      this.loadMonth(current.getFullYear(), current.getMonth() + 1);
      this.loadDay(current);
    }
  }

  private toIsoDate(date: Date): string {
    const pad = (part: number) => String(part).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  openCreate(): void {
    this.error.set(null);
    this.editedAppointment.set(null);
    this.form.reset({
      patientId: null,
      dentistId: null,
      treatmentId: null,
      appointmentDate: this.defaultSlot(),
      durationMinutes: null,
      reason: '',
      notes: '',
    });
    this.drawerVisible = true;
  }

  openEdit(appointment: Appointment): void {
    this.error.set(null);
    this.editedAppointment.set(appointment);
    this.form.reset({
      patientId: appointment.patientId,
      dentistId: appointment.dentistId,
      treatmentId: appointment.treatmentId,
      appointmentDate: appointment.appointmentDate.slice(0, 16),
      durationMinutes: appointment.durationMinutes,
      reason: appointment.reason ?? '',
      notes: appointment.notes ?? '',
    });
    this.drawerVisible = true;
  }

  closeDrawer(): void {
    this.drawerVisible = false;
    this.editedAppointment.set(null);
  }

  /**
   * Pre-remplit la duree avec celle du soin choisi. Simple confort de saisie :
   * c'est le backend qui fixe la duree retenue si le champ reste vide.
   */
  onTreatmentChange(value: string): void {
    const treatmentId = value ? Number(value) : null;
    this.form.controls.treatmentId.setValue(treatmentId);

    const treatment = this.treatments().find((item) => item.id === treatmentId);
    if (treatment?.durationMinutes) {
      this.form.controls.durationMinutes.setValue(treatment.durationMinutes);
    }
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) {
      return;
    }

    const raw = this.form.getRawValue();
    const request: AppointmentRequest = {
      patientId: Number(raw.patientId),
      dentistId: Number(raw.dentistId),
      treatmentId: raw.treatmentId ? Number(raw.treatmentId) : null,
      // L'input datetime-local renvoie « yyyy-MM-ddTHH:mm » : on complete les
      // secondes attendues par LocalDateTime cote Spring.
      appointmentDate: this.toLocalDateTime(raw.appointmentDate),
      durationMinutes: raw.durationMinutes ? Number(raw.durationMinutes) : null,
      reason: this.emptyToNull(raw.reason),
      notes: this.emptyToNull(raw.notes),
    };

    const existing = this.editedAppointment();
    const call = existing
      ? this.appointmentsService.update(existing.id, request)
      : this.appointmentsService.create(request);

    this.saving.set(true);
    this.error.set(null);
    call.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.closeDrawer();
        this.refreshCurrentView();
      },
      error: (error) => this.error.set(this.usersService.errorMessage(error)),
    });
  }

  openCancelDialog(appointment: Appointment): void {
    this.error.set(null);
    this.cancelTarget.set(appointment);
    this.cancellationReason = '';
    this.cancelDialogVisible = true;
  }

  closeCancelDialog(): void {
    this.cancelDialogVisible = false;
    this.cancelTarget.set(null);
    this.cancellationReason = '';
  }

  confirmCancel(): void {
    const appointment = this.cancelTarget();
    if (!appointment) {
      return;
    }

    this.pendingId.set(appointment.id);
    this.appointmentsService
      .cancel(appointment.id, this.cancellationReason.trim() || null)
      .pipe(finalize(() => this.pendingId.set(null)))
      .subscribe({
        next: () => {
          this.closeCancelDialog();
          this.refreshCurrentView();
        },
        error: (error) => this.error.set(this.usersService.errorMessage(error)),
      });
  }

  confirmComplete(appointment: Appointment, event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      header: 'Clôturer le rendez-vous',
      message: `Marquer le rendez-vous de ${appointment.patientName} comme réalisé ?`,
      acceptLabel: 'Marquer réalisé',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-success p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-sm',
      accept: () => this.complete(appointment),
    });
  }

  complete(appointment: Appointment): void {
    this.pendingId.set(appointment.id);
    this.appointmentsService
      .complete(appointment.id)
      .pipe(finalize(() => this.pendingId.set(null)))
      .subscribe({
        next: () => this.refreshCurrentView(),
        error: (error) => this.error.set(this.usersService.errorMessage(error)),
      });
  }

  statusLabel(status: AppointmentStatus): string {
    return APPOINTMENT_STATUS_LABELS[status] ?? status;
  }

  statusSeverity(status: AppointmentStatus): 'success' | 'info' | 'warn' | 'danger' {
    return APPOINTMENT_STATUS_SEVERITIES[status] ?? 'info';
  }

  private toLocalDateTime(value: string): string {
    return value.length === 16 ? `${value}:00` : value;
  }

  private defaultSlot(): string {
    const slot = new Date();
    slot.setDate(slot.getDate() + 1);
    slot.setHours(9, 0, 0, 0);
    const pad = (part: number) => String(part).padStart(2, '0');
    return `${slot.getFullYear()}-${pad(slot.getMonth() + 1)}-${pad(slot.getDate())}T${pad(slot.getHours())}:${pad(slot.getMinutes())}`;
  }

  private emptyToNull(value: string): string | null {
    const trimmed = value?.trim() ?? '';
    return trimmed.length === 0 ? null : trimmed;
  }
}
