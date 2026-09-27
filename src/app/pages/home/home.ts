import { Component, computed, inject } from '@angular/core';
import { Avatar } from 'primeng/avatar';
import { Card } from 'primeng/card';
import { Tag } from 'primeng/tag';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-home',
  imports: [Avatar, Card, Tag],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private readonly usersService = inject(UsersService);
  readonly user = this.usersService.user;

  readonly greeting = computed(() => {
    const user = this.user();
    if (!user) {
      return 'Bonjour';
    }

    return user.role === 'DENTIST'
      ? `Bonjour Dr ${user.firstName}`
      : `Bonjour ${user.firstName}`;
  });

  readonly roleLabel = computed(() => {
    switch (this.user()?.role) {
      case 'DENTIST': return 'Espace praticien';
      case 'ADMIN': return 'Espace administrateur';
      case 'PATIENT': return 'Espace patient';
      default: return 'Espace personnel';
    }
  });

  readonly initials = computed(() => {
    const user = this.user();
    return user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : 'DF';
  });
}
