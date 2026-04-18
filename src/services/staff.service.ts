import { Injectable, signal } from '@angular/core';

export interface Staff {
  id: string;
  name: string;
  email: string;
  mobile: string;
  designation: string;
  photo?: string;
}

@Injectable({ providedIn: 'root' })
export class StaffService {
  private staff = signal<Staff[]>([]);
  allStaff = this.staff.asReadonly();

  // Methods to interact with Supabase will be added here
}
