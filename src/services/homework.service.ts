import { Injectable, signal } from '@angular/core';

export interface Homework {
  id: string;
  school_id: string;
  className: string;
  section: string;
  subject: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'Pending' | 'Submitted' | 'Graded';
  fileUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class HomeworkService {
  private homework = signal<Homework[]>([]);
  allHomework = this.homework.asReadonly();

  // Methods to interact with Supabase will be added here
}
