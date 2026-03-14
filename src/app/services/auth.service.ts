import { Injectable, inject } from '@angular/core';
import { Auth, authState, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User } from '@angular/fire/auth';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  user$: Observable<User | null> = authState(this.auth);
  
  get currentUser(): User | null {
    return this.auth.currentUser;
  }

  register(email: string, pass: string): Observable<void> {
    const promise = createUserWithEmailAndPassword(this.auth, email, pass).then(() => undefined);
    return from(promise);
  }

  login(email: string, pass: string): Observable<void> {
    const promise = signInWithEmailAndPassword(this.auth, email, pass).then(() => undefined);
    return from(promise);
  }

  logout(): Observable<void> {
    const promise = signOut(this.auth);
    return from(promise);
  }
}