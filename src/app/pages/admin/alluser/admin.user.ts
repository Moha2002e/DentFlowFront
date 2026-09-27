import { Component, inject, signal } from '@angular/core';
import { Drawer } from 'primeng/drawer';
import { InputText } from 'primeng/inputtext';
import { SortIcon, TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { UsersService } from '../../../services/users.service';
import { User } from '../../../models/auth.models';

@Component({
  selector: 'app-admin-user',
  imports: [Drawer, InputText, TableModule, SortIcon, Tag],
  templateUrl: './admin.user.html',
  styleUrls: ['./admin.user.css'],
})
export class AdminUser {
  private readonly usersService = inject(UsersService);
  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly selectedUser = signal<User | null>(null);
  readonly pendingId = signal<number | null>(null);
  readonly creatingUser = signal(false);
  readonly saving = signal(false);
  drawerVisible = false;

  constructor() {
    this.usersService.getAllUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(this.usersService.errorMessage(error));
        this.loading.set(false);
      },
    });
  }

  editUser(user: User): void {
    this.error.set(null);
    this.creatingUser.set(false);
    this.selectedUser.set(user);
    this.drawerVisible = true;
  }

  openCreateDrawer(): void {
    this.error.set(null);
    this.selectedUser.set(null);
    this.creatingUser.set(true);
    this.drawerVisible = true;
  }

  closeDrawer(): void {
    this.drawerVisible = false;
    this.selectedUser.set(null);
    this.creatingUser.set(false);
  }

  saveUser(form: HTMLFormElement): void {
    const user = this.selectedUser();
    if (!user || !form.reportValidity()) {
      return;
    }

    const data = new FormData(form);
    this.pendingId.set(user.id);
    this.error.set(null);
    this.usersService
      .updateUser(user.id, {
        username: String(data.get('username') ?? user.username),
        firstName: String(data.get('firstName') ?? user.firstName),
        lastName: String(data.get('lastName') ?? user.lastName),
        email: String(data.get('email') ?? user.email),
        role: String(data.get('role') ?? user.role),
      })
      .subscribe({
        next: (updated) => {
          this.users.update((users) =>
            users.map((item) => (item.id === updated.id ? updated : item)),
          );
          this.pendingId.set(null);
          this.closeDrawer();
        },
        error: (error) => {
          this.error.set(this.usersService.errorMessage(error));
          this.pendingId.set(null);
        },
      });
  }

  createUser(form: HTMLFormElement): void {
    if (!form.reportValidity()) {
      return;
    }

    const data = new FormData(form);
    const password = String(data.get('password') ?? '');
    if (password !== String(data.get('confirmPassword') ?? '')) {
      this.error.set('Les mots de passe ne correspondent pas.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.usersService.createUser({
      username: String(data.get('username') ?? ''),
      firstName: String(data.get('firstName') ?? ''),
      lastName: String(data.get('lastName') ?? ''),
      email: String(data.get('email') ?? ''),
      password,
      role: String(data.get('role') ?? 'USER'),
    }).subscribe({
      next: (created) => {
        this.users.update((users) => [...users, created]);
        this.saving.set(false);
        this.closeDrawer();
      },
      error: (error) => {
        this.error.set(this.usersService.errorMessage(error));
        this.saving.set(false);
      },
    });
  }

  disableUser(user: User): void {
    if (
      !user.enabled ||
      !window.confirm(`Désactiver le compte de ${user.firstName} ${user.lastName} ?`)
    ) {
      return;
    }

    this.pendingId.set(user.id);
    this.usersService.disableUser(user.id).subscribe({
      next: (disabled) => {
        this.users.update((users) =>
          users.map((item) => (item.id === disabled.id ? disabled : item)),
        );
        this.pendingId.set(null);
      },
      error: (error) => {
        this.error.set(this.usersService.errorMessage(error));
        this.pendingId.set(null);
      },
    });
  }

  deleteUser(user: User): void {
    this.disableUser(user);
  }

  userStatusSeverity(user: User): 'success' | 'danger' {
    return user.enabled ? 'success' : 'danger';
  }
}
