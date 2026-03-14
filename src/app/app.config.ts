import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClient } from '@angular/common/http';

// firebase
import { provideFirebaseApp, initializeApp, getApp } from '@angular/fire/app'; 
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // mat
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' }
    },

    provideFirebaseApp(() =>
      initializeApp({
        apiKey: "AIzaSyBF8wTaUkn3CkJpzOvnJOZR14l8kWcxOI4",
        authDomain: "footystats-pwa.firebaseapp.com",
        projectId: "footystats-pwa",
        storageBucket: "footystats-pwa.firebasestorage.app",
        messagingSenderId: "148929953078",
        appId: "1:148929953078:web:515fca1c49c5895dbb8797"
      })
    ),

    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore(getApp())),
    provideHttpClient(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
};
