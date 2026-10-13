import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Dialog } from 'primeng/dialog';
import { Drawer } from 'primeng/drawer';
import { SortIcon, TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { DatePipe, DecimalPipe } from '@angular/common';
import { finalize, forkJoin } from 'rxjs';
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_SEVERITIES,
  Appointment,
  AppointmentRequest,
  AppointmentStats,
  AppointmentStatus,
  CalendarMonth,
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
    DatePipe,
    DecimalPipe,
    Dialog,
    FormsModule,
    Drawer,
    ReactiveFormsModule,
    SortIcon,
    TableModule,
    Tag,
    Toast,
  ],
  providers: [ConfirmationService, MessageService],
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
  private readonly messageService = inject(MessageService);

  readonly appointments = signal<Appointment[]>([]);
  readonly stats = signal<AppointmentStats>({ total: 0, upcoming: 0, completed: 0, cancelled: 0 });
  readonly patients = signal<Patient[]>([]);
  readonly dentists = signal<Dentist[]>([]);
  readonly treatments = signal<Treatment[]>([]);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly pendingId = signal<number | null>(null);
  readonly editedAppointment = signal<Appointment | null>(null);
  readonly statusFilter = signal<AppointmentStatus | ''>('');

  // --- Vue calendrier -------------------------------------------------------
  readonly view = signal<'list' | 'calendar'>('list');
  /** Grille du mois telle que renvoyee par le serveur : aucun calcul ici. */
  readonly calendar = signal<CalendarMonth | null>(null);
  readonly calendarLoading = signal(false);
  /** Mois affiche, au format « yyyy-MM ». */
  readonly currentMonth = signal(Appointments.monthOf(new Date()));

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
      error: (error) => this.notifyError(error),
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
              },
        error: (error) => this.notifyError(error),
      });
  }

  onStatusFilter(value: string): void {
    this.statusFilter.set((value as AppointmentStatus) || '');
    this.loadAppointments();
  }

  // --- Vue calendrier -------------------------------------------------------

  switchView(view: 'list' | 'calendar'): void {
    this.view.set(view);

    if (view === 'calendar' && !this.calendar()) {
      this.loadCalendar(this.currentMonth());
    }
  }

  goToMonth(month: string): void {
    this.loadCalendar(month);
  }

  goToCurrentMonth(): void {
    this.loadCalendar(Appointments.monthOf(new Date()));
  }

  private loadCalendar(month: string): void {
    this.calendarLoading.set(true);
    this.appointmentsService
      .getCalendar(month)
      .pipe(finalize(() => this.calendarLoading.set(false)))
      .subscribe({
        next: (calendar) => {
          this.calendar.set(calendar);
          this.currentMonth.set(calendar.month);
              },
        error: (error) => this.notifyError(error),
      });
  }

  /** Ouvre le formulaire de creation pre-rempli sur le jour clique. */
  createOnDay(isoDate: string): void {
    this.openCreate();
    this.form.controls.appointmentDate.setValue(`${isoDate}T09:00`);
  }

  /** Recharge la vue courante apres une creation, annulation ou cloture. */
  private refreshCurrentView(): void {
    this.loadAppointments();

    if (this.view() === 'calendar') {
      this.loadCalendar(this.currentMonth());
    }
  }

  private static monthOf(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  openCreate(): void {
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
    call.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.closeDrawer();
        this.refreshCurrentView();
      },
      error: (error) => this.notifyError(error),
    });
  }

  openCancelDialog(appointment: Appointment): void {
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
        error: (error) => this.notifyError(error),
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
        error: (error) => this.notifyError(error),
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

  /** Une seule surface d'affichage pour les erreurs : le toast. */
  private notifyError(error: unknown): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Erreur',
      detail: this.usersService.errorMessage(error),
      life: 6000,
    });
  }

  private emptyToNull(value: string): string | null {
    const trimmed = value?.trim() ?? '';
    return trimmed.length === 0 ? null : trimmed;
  }
}
