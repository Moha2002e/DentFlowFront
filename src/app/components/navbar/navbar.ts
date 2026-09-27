import { Component, inject, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class Navbar {
  protected readonly usersService = inject(UsersService);
  readonly collapsedChange = output<boolean>();
  readonly collapsed = signal(false);

  toggleSidebar(): void {
    const nextValue = !this.collapsed();
    this.collapsed.set(nextValue);
    this.collapsedChange.emit(nextValue);
  }
}
