import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { Drawer } from 'primeng/drawer';
import { TableModule, SortIcon } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { finalize } from 'rxjs';
import { Patient, PatientRequest } from '../../models/clinic.models';
import { PatientsService } from '../../services/clinic.service';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-patients',
  imports: [ConfirmDialog, Drawer, ReactiveFormsModule, RouterLink, SortIcon, TableModule, Tag],
  providers: [ConfirmationService],
  templateUrl: './patients.html',
})
export class Patients {
  private readonly patientsService = inject(PatientsService);
  private readonly usersService = inject(UsersService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);

  readonly patients = signal<Patient[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly pendingId = signal<number | null>(null);
  readonly editedPatient = signal<Patient | null>(null);
  readonly searchTerm = signal('');

  drawerVisible = false;

  readonly form = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    birthDate: [''],
    nationalNumber: [''],
    address: [''],
    city: [''],
    postalCode: [''],
    iban: [''],
    medicalNotes: [''],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.patientsService
      .getAll(this.searchTerm().trim() || undefined)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (patients) => {
          this.patients.set(patients);
          this.error.set(null);
        },
        error: (error) => this.error.set(this.usersService.errorMessage(error)),
      });
  }

  onSearch(value: string): void {
    this.searchTerm.set(value);
    this.load();
  }

  openCreate(): void {
    this.error.set(null);
    this.editedPatient.set(null);
    this.form.reset({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      birthDate: '',
      nationalNumber: '',
      address: '',
      city: '',
      postalCode: '',
      iban: '',
      medicalNotes: '',
    });
    this.drawerVisible = true;
  }

  openEdit(patient: Patient): void {
    this.error.set(null);
    this.editedPatient.set(patient);
    this.form.reset({
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      phoneNumber: patient.phoneNumber ?? '',
      birthDate: patient.birthDate ?? '',
      nationalNumber: patient.nationalNumber ?? '',
      address: patient.address ?? '',
      city: patient.city ?? '',
      postalCode: patient.postalCode ?? '',
      iban: patient.iban ?? '',
      medicalNotes: patient.medicalNotes ?? '',
    });
    this.drawerVisible = true;
  }

  closeDrawer(): void {
    this.drawerVisible = false;
    this.editedPatient.set(null);
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) {
      return;
    }

    const raw = this.form.getRawValue();
    const request: PatientRequest = {
      firstName: raw.firstName.trim(),
      lastName: raw.lastName.trim(),
      email: raw.email.trim(),
      phoneNumber: this.emptyToNull(raw.phoneNumber),
      birthDate: this.emptyToNull(raw.birthDate),
      nationalNumber: this.emptyToNull(raw.nationalNumber),
      address: this.emptyToNull(raw.address),
      city: this.emptyToNull(raw.city),
      postalCode: this.emptyToNull(raw.postalCode),
      iban: this.emptyToNull(raw.iban),
      medicalNotes: this.emptyToNull(raw.medicalNotes),
    };

    const existing = this.editedPatient();
    const call = existing
      ? this.patientsService.update(existing.id, request)
      : this.patientsService.create(request);

    this.saving.set(true);
    this.error.set(null);
    call.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (saved) => {
        this.patients.update((patients) =>
          existing
            ? patients.map((item) => (item.id === saved.id ? saved : item))
            : [...patients, saved],
        );
        this.closeDrawer();
      },
      error: (error) => this.error.set(this.usersService.errorMessage(error)),
    });
  }

  confirmArchive(patient: Patient, event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      header: 'Archiver le patient',
      message: `Archiver le dossier de ${patient.fullName} ? Son historique médical est conservé.`,
      acceptLabel: 'Archiver',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-sm',
      accept: () => this.archive(patient),
    });
  }

  archive(patient: Patient): void {
    this.pendingId.set(patient.id);
    this.patientsService
      .archive(patient.id)
      .pipe(finalize(() => this.pendingId.set(null)))
      .subscribe({
        next: (updated) => this.replace(updated),
        error: (error) => this.error.set(this.usersService.errorMessage(error)),
      });
  }

  restore(patient: Patient): void {
    this.pendingId.set(patient.id);
    this.patientsService
      .restore(patient.id)
      .pipe(finalize(() => this.pendingId.set(null)))
      .subscribe({
        next: (updated) => this.replace(updated),
        error: (error) => this.error.set(this.usersService.errorMessage(error)),
      });
  }

  private replace(patient: Patient): void {
    this.patients.update((patients) =>
      patients.map((item) => (item.id === patient.id ? patient : item)),
    );
  }

  private emptyToNull(value: string): string | null {
    const trimmed = value?.trim() ?? '';
    return trimmed.length === 0 ? null : trimmed;
  }
}
