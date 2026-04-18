import { Injectable, signal } from '@angular/core';

export interface Quiz {
  id: string;
  title: string;
  subject: string;
  questions: number;
  duration: number; // in minutes
}

@Injectable({ providedIn: 'root' })
export class QuizService {
  allQuizzes = signal<Quiz[]>([
    { id: '1', title: 'Mathematics Basics', subject: 'Math', questions: 10, duration: 20 },
    { id: '2', title: 'English Grammar', subject: 'English', questions: 15, duration: 30 },
  ]);
}
