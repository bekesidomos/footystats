import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SwUpdate } from '@angular/service-worker';
import { interval } from 'rxjs';
import { AsyncPipe, CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone:true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatSnackBarModule,
    CommonModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  private readonly swUpdate = inject(SwUpdate);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly title = signal('FootyStats');
  // public, h html elerje a $usert
  public authService = inject(AuthService);
  private router = inject(Router);
  private readonly onlineCallback = () => console.log('You are online');
  private readonly offlineCallback = () => console.log('You are offline');

  ngOnInit(): void {
    // 3 mp check
    interval(120000).subscribe(() => {
      this.swUpdate.checkForUpdate().then((update) => {
        if (update) {
          this.showUpdateNotification();
        }
      });
    });

    window.addEventListener('online', this.onlineCallback);
    window.addEventListener('offline', this.offlineCallback);
  }

  private showUpdateNotification(): void {
    const snack = this.snackBar.open(
      'New version available',
      'Refresh',
      {
        duration: 60000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      }
    );

    snack.onAction().subscribe(() => {
      window.location.reload();
    });
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/auth']);
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('online', this.onlineCallback);
    window.removeEventListener('offline', this.offlineCallback);
  }
}
