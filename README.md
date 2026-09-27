# DentFlowFront

Frontend Angular 22 minimal pour tester l'authentification du backend DentFlow.

## Ecrans

- `/register` : inscription
- `/login` : connexion
- `/home` : accueil protege et deconnexion

Le service Angular appelle `http://localhost:8080/api`. Le JWT est conserve dans `sessionStorage`, ajoute automatiquement aux requetes par un intercepteur, puis supprime a la deconnexion ou a l'expiration.

## Demarrage

Demarrer d'abord `DentFlowBack`, puis executer :

```powershell
npm install
npm start
```

Ouvrir ensuite `http://localhost:4200`.

## Verification

```powershell
npm run build
```
