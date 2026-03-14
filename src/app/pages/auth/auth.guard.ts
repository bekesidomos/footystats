import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map, take } from 'rxjs/operators';


export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  // authstate observable, erre pipe
  return authState(auth).pipe(
    take(1), // legelso ertek h bevan e lepve
    map(user => {
      if (user) {
        return true;
      } else {
        snackBar.open('You must be logged in to view favourites!', 'OK', { duration: 10000 });
        return router.createUrlTree(['/auth']);
      }
    })
  );
};