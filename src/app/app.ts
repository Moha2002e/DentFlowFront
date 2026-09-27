import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Navbar } from './components/navbar/navbar';

@Component({
  imports: [Navbar, RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  readonly sidebarCollapsed = signal(false);
  readonly isAuthPage = signal(this.isAuthenticationRoute(this.router.url));

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.isAuthPage.set(this.isAuthenticationRoute(event.urlAfterRedirects)));
  }

  private isAuthenticationRoute(url: string): boolean {
    return url.startsWith('/login') || url.startsWith('/register');
  }
}
