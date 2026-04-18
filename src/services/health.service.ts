import { Injectable, signal } from '@angular/core';

export interface HealthRecord {
  id: string;
  date: string;
  record: string;
  suggestion: string;
}

@Injectable({ providedIn: 'root' })
export class HealthService {
  healthRecords = signal<HealthRecord[]>([
    { id: '1', date: '2026-03-25', record: 'Height: 150cm, Weight: 40kg', suggestion: 'Maintain a balanced diet.' },
    { id: '2', date: '2026-03-28', record: 'Vision: 20/20', suggestion: 'Continue regular eye checkups.' },
  ]);
}
