import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Drawer } from 'primeng/drawer';
import { SortIcon, TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { finalize } from 'rxjs';
import { Dentist, DentistRequest } from '../../models/clinic.models';
import { DentistsService } from '../../services/clinic.service';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-dentists',
  imports: [ConfirmDialog, Drawer, ReactiveFormsModule, SortIcon, TableModule, Tag],
  providers: [ConfirmationService],
  templateUrl: './dentists.html',
})
export class Dentists {
  private readonly dentistsService = inject(DentistsService);
  private readonly usersService = inject(UsersService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);

  readonly dentists = signal<Dentist[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly pendingId = signal<number | null>(null);
  readonly editedDentist = signal<Dentist | null>(null);
  readonly searchTerm = signal('');
  readonly isAdmin = signal(this.usersService.getUserRole() === 'ADMIN');

  drawerVisible = false;

  readonly form = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    specialization: [''],
    inami: [''],
    address: [''],
    city: [''],
    postalCode: [''],
    iban: [''],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.dentistsService
      .getAll(this.searchTerm().trim() || undefined)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (dentists) => {
          this.dentists.set(dentists);
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
    this.editedDentist.set(null);
    this.form.reset({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      specialization: '',
      inami: '',
      address: '',
      city: '',
      postalCode: '',
      iban: '',
    });
    this.drawerVisible = true;
  }

  openEdit(dentist: Dentist): void {
    this.error.set(null);
    this.editedDentist.set(dentist);
    this.form.reset({
      firstName: dentist.firstName,
      lastName: dentist.lastName,
      email: dentist.email,
      phoneNumber: dentist.phoneNumber ?? '',
      specialization: dentist.specialization ?? '',
      inami: dentist.inami ?? '',
      address: dentist.address ?? '',
      city: dentist.city ?? '',
      postalCode: dentist.postalCode ?? '',
      iban: dentist.iban ?? '',
    });
    this.drawerVisible = true;
  }

  closeDrawer(): void {
    this.drawerVisible = false;
    this.editedDentist.set(null);
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) {
      return;
    }

    const raw = this.form.getRawValue();
    const request: DentistRequest = {
      firstName: raw.firstName.trim(),
      lastName: raw.lastName.trim(),
      email: raw.email.trim(),
      phoneNumber: this.emptyToNull(raw.phoneNumber),
      specialization: this.emptyToNull(raw.specialization),
      inami: this.emptyToNull(raw.inami),
      address: this.emptyToNull(raw.address),
      city: this.emptyToNull(raw.city),
      postalCode: this.emptyToNull(raw.postalCode),
      iban: this.emptyToNull(raw.iban),
    };

    const existing = this.editedDentist();
    const call = existing
      ? this.dentistsService.update(existing.id, request)
      : this.dentistsService.create(request);

    this.saving.set(true);
    this.error.set(null);
    call.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (saved) => {
        this.dentists.update((dentists) =>
          existing
            ? dentists.map((item) => (item.id === saved.id ? saved : item))
            : [...dentists, saved],
        );
        this.closeDrawer();
      },
      error: (error) => this.error.set(this.usersService.errorMessage(error)),
    });
  }

  confirmDeactivate(dentist: Dentist, event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      header: 'Désactiver le dentiste',
      message: `Désactiver ${dentist.fullName} ? Il ne pourra plus recevoir de nouveaux rendez-vous.`,
      acceptLabel: 'Désactiver',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-sm',
      accept: () => this.deactivate(dentist),
    });
  }

  deactivate(dentist: Dentist): void {
    this.pendingId.set(dentist.id);
    this.dentistsService
      .deactivate(dentist.id)
      .pipe(finalize(() => this.pendingId.set(null)))
      .subscribe({
        next: (updated) => this.replace(updated),
        error: (error) => this.error.set(this.usersService.errorMessage(error)),
      });
  }

  activate(dentist: Dentist): void {
    this.pendingId.set(dentist.id);
    this.dentistsService
      .activate(dentist.id)
      .pipe(finalize(() => this.pendingId.set(null)))
      .subscribe({
        next: (updated) => this.replace(updated),
        error: (error) => this.error.set(this.usersService.errorMessage(error)),
      });
  }

  private replace(dentist: Dentist): void {
    this.dentists.update((dentists) =>
      dentists.map((item) => (item.id === dentist.id ? dentist : item)),
    );
  }

  private emptyToNull(value: string): string | null {
    const trimmed = value?.trim() ?? '';
    return trimmed.length === 0 ? null : trimmed;
  }
}
