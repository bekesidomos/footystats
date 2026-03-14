import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-auth',
  standalone : true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    CommonModule,
    MatSnackBarModule
  ],
  templateUrl: './auth.html',
  styleUrl: './auth.scss'
})

export class Auth {
  public readonly loginForm: FormGroup;
  public loginMode = true;

  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  constructor(private readonly formBuilder: FormBuilder){
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

//login vagy register switch basivally
 toggleMode() {
    this.loginMode = !this.loginMode;
  }

  async onSubmit() {
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.value;

    try {
      if (this.loginMode) {
        //log
        await firstValueFrom(this.authService.login(email, password));
        this.router.navigate(['/']);
      } else {
        //reg
        await firstValueFrom(this.authService.register(email, password));
        this.router.navigate(['/']);
        this.snackBar.open('Registration successful! Welcome!', 'Close', { duration: 3000 });
      }
    } catch (error: any) {
      this.snackBar.open('Error: ' + error.message, 'Close', { duration: 5000 });
    }
  }
}


