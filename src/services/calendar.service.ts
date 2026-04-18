import { Injectable, signal } from '@angular/core';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class CalendarService {
  private events = signal<CalendarEvent[]>([]);
  allEvents = this.events.asReadonly();

  // Methods to interact with Supabase will be added here
}
