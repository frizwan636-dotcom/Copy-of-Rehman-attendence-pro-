import { Injectable, signal } from '@angular/core';

export interface Exam {
  id: string;
  school_id: string;
  className: string;
  section: string;
  subject: string;
  date: string;
  totalMarks: number;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  marksObtained: number;
  grade: string;
  remarks?: string;
}

@Injectable({ providedIn: 'root' })
export class ExamsService {
  private exams = signal<Exam[]>([]);
  private results = signal<ExamResult[]>([]);

  allExams = this.exams.asReadonly();
  allResults = this.results.asReadonly();

  getResultsForStudent(studentId: string): ExamResult[] {
    return this.results().filter(r => r.studentId === studentId);
  }
}
