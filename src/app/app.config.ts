import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { authInterceptor } from './core/auth.interceptor';
import { routes } from './app.routes';

// Dates et nombres en francais dans tous les pipes (| date, | number).
registerLocaleData(localeFr);

/** Libelles francais du calendrier et des composants PrimeNG. */
const traductionFr = {
  dayNames: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
  dayNamesShort: ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'],
  dayNamesMin: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
  monthNames: [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ],
  monthNamesShort: [
    'janv', 'févr', 'mars', 'avr', 'mai', 'juin',
    'juil', 'août', 'sept', 'oct', 'nov', 'déc',
  ],
  today: "Aujourd'hui",
  clear: 'Effacer',
  weekHeader: 'Sem',
  firstDayOfWeek: 1,
  dateFormat: 'dd/mm/yy',
  weak: 'Faible',
  medium: 'Moyen',
  strong: 'Fort',
  passwordPrompt: 'Saisissez un mot de passe',
  emptyMessage: 'Aucun résultat',
  emptyFilterMessage: 'Aucun résultat',
  accept: 'Oui',
  reject: 'Non',
  choose: 'Choisir',
  upload: 'Envoyer',
  cancel: 'Annuler',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes),
    { provide: LOCALE_ID, useValue: 'fr' },
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          // DentFlow est une interface claire : sans ce reglage, PrimeNG suit la
          // preference systeme et rend les composants en sombre sur fond clair.
          darkModeSelector: false,
        },
      },
      translation: traductionFr,
    }),
  ],
};
