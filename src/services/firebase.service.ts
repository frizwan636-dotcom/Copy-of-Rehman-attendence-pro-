import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  constructor() {
    console.warn("FirebaseService is disabled. Using local authentication only.");
  }

  // All Firebase-related methods have been removed.
  // The app no longer communicates with Firebase services.
}
