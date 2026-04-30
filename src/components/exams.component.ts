import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AttendanceService, Student, Subject, ExamProgress } from '../services/attendance.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-exams',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="p-4 sm:p-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 class="text-xl sm:text-2xl font-bold text-slate-800">Exams & Progress</h2>
        <div class="flex gap-2 w-full sm:w-auto">
          <button (click)="showSubjectModal.set(true)" class="flex-1 sm:flex-none px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 text-sm font-bold">
            <i class="fa-solid fa-book text-xs"></i>
            Subjects
          </button>
          <button (click)="showAddProgressModal.set(true)" class="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-indigo-200">
            <i class="fa-solid fa-plus text-xs"></i>
            Add Progress
          </button>
        </div>
      </div>
      
      <!-- Student Progress Overview -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Student List -->
        <div class="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div class="p-4 border-b border-slate-100 bg-slate-50">
            <h3 class="font-bold text-slate-700">Students</h3>
          </div>
          <div class="max-h-[400px] lg:max-h-[600px] overflow-y-auto">
            @for (student of attendanceService.activeStudents(); track student.id) {
              <button (click)="selectedStudent.set(student)" 
                      [class]="selectedStudent()?.id === student.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'hover:bg-slate-50 border-l-4 border-transparent'"
                      class="w-full text-left p-4 transition-all flex items-center justify-between">
                <div>
                  <p class="font-bold text-slate-800">{{ student.name }}</p>
                  <p class="text-xs text-slate-500">Roll #{{ student.rollNumber }}</p>
                </div>
                <i class="fa-solid fa-chevron-right text-slate-300 text-xs"></i>
              </button>
            }
          </div>
        </div>

        <!-- Progress Details -->
        <div class="lg:col-span-2 space-y-6">
          @if (selectedStudent()) {
            <div class="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
                <h3 class="text-lg sm:text-xl font-bold text-slate-800">Progress: {{ selectedStudent()?.name }}</h3>
                <div class="text-xs sm:text-sm text-slate-500 font-medium bg-slate-50 px-3 py-1 rounded-full">Class {{ selectedStudent()?.className }} - {{ selectedStudent()?.section }}</div>
              </div>

              @for (subject of attendanceService.allSubjects(); track subject.id) {
                <div class="mb-8 last:mb-0">
                  <h4 class="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <span class="w-2 h-2 bg-indigo-600 rounded-full"></span>
                    {{ subject.name }}
                  </h4>
                  
                  <div class="space-y-3">
                    @for (progress of getProgressForSubject(subject.id); track progress.id) {
                      <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div class="flex items-center gap-3 sm:gap-4">
                          <div class="text-[10px] sm:text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded shadow-sm">
                            {{ progress.date | date:'MMM d' }}
                          </div>
                          <div>
                            <div class="flex items-center gap-2">
                              <p class="text-sm font-bold text-slate-700">{{ progress.marks }} / {{ progress.total_marks }}</p>
                              @if (progress.grade) {
                                <span class="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-md uppercase">{{ progress.grade }}</span>
                              }
                            </div>
                            @if (progress.remarks) {
                              <p class="text-[10px] sm:text-xs text-slate-500 line-clamp-1">{{ progress.remarks }}</p>
                            }
                          </div>
                        </div>
                        <div class="flex items-center gap-3 sm:gap-4">
                          <div class="text-xs font-bold" [class]="getPercentageColor(progress.marks, progress.total_marks)">
                            {{ (progress.marks / progress.total_marks * 100) | number:'1.0-0' }}%
                          </div>
                          <button (click)="attendanceService.removeExamProgress(progress.id)" class="text-slate-300 hover:text-rose-500 transition-colors p-1">
                            <i class="fa-solid fa-trash text-xs"></i>
                          </button>
                        </div>
                      </div>
                    } @empty {
                      <p class="text-xs text-slate-400 italic ml-4">No test records for this subject.</p>
                    }
                  </div>
                </div>
              } @empty {
                <div class="py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <p class="text-slate-500 font-medium">Please add subjects first.</p>
                </div>
              }
            </div>
          } @else {
            <div class="h-full flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-8 sm:p-12 text-center">
              <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <i class="fa-solid fa-user-graduate text-slate-200 text-2xl"></i>
              </div>
              <h3 class="text-lg sm:text-xl font-bold text-slate-400">Select a student</h3>
              <p class="text-sm text-slate-400">Choose a student from the list to view their progress report.</p>
            </div>
          }
        </div>
      </div>

      <!-- Add Progress Modal -->
      @if (showAddProgressModal()) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div class="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 class="text-xl font-bold text-slate-800">Add Test Progress</h3>
              <button (click)="showAddProgressModal.set(false)" class="text-slate-400 hover:text-slate-600">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form [formGroup]="progressForm" (ngSubmit)="saveProgress()" class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Student</label>
                <select formControlName="student_id" class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">Select Student</option>
                  @for (student of attendanceService.activeStudents(); track student.id) {
                    <option [value]="student.id">{{ student.name }} ({{ student.rollNumber }})</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <select formControlName="subject_id" class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">Select Subject</option>
                  @for (sub of attendanceService.allSubjects(); track sub.id) {
                    <option [value]="sub.id">{{ sub.name }}</option>
                  }
                </select>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Marks Obtained</label>
                  <input formControlName="marks" type="number" class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Total Marks</label>
                  <input formControlName="total_marks" type="number" class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input formControlName="date" type="date" class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Grade (Optional)</label>
                  <select formControlName="grade" class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">Select Grade</option>
                    @for (grade of grades; track grade) {
                      <option [value]="grade">{{ grade }}</option>
                    }
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Remarks & Feedback</label>
                <textarea formControlName="remarks" rows="2" class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="e.g. Excellent performance, needs to focus on grammar..."></textarea>
              </div>
              <div class="flex gap-3 pt-4">
                <button type="button" (click)="showAddProgressModal.set(false)" class="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-bold">Cancel</button>
                <button type="submit" [disabled]="progressForm.invalid" class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 font-bold">Save Progress</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Subject Management Modal -->
      @if (showSubjectModal()) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div class="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 class="text-xl font-bold text-slate-800">Manage Subjects</h3>
              <button (click)="showSubjectModal.set(false)" class="text-slate-400 hover:text-slate-600">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div class="p-6 space-y-4">
              <div class="flex gap-2">
                <input #newSubInput (input)="null" type="text" class="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="New subject name" [disabled]="isAddingSubject()">
                <button (click)="addSubject(newSubInput.value); newSubInput.value = ''" [disabled]="!newSubInput.value.trim() || isAddingSubject()" class="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold transition-colors disabled:opacity-50 flex items-center gap-2">
                  @if (isAddingSubject()) {
                    <i class="fa-solid fa-circle-notch animate-spin"></i>
                  } @else {
                    Add
                  }
                </button>
              </div>
              <div class="max-h-64 overflow-y-auto space-y-2">
                @for (sub of attendanceService.allSubjects(); track sub.id) {
                  <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span class="text-slate-700 font-medium">{{ sub.name }}</span>
                    <button (click)="attendanceService.removeSubject(sub.id)" class="text-rose-500 hover:text-rose-700 p-1">
                      <i class="fa-solid fa-trash-can text-sm"></i>
                    </button>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ExamsComponent {
  attendanceService = inject(AttendanceService);
  fb = inject(FormBuilder);

  selectedStudent = signal<Student | null>(null);
  showAddProgressModal = signal(false);
  showSubjectModal = signal(false);
  isAddingSubject = signal(false);

  grades = ['A+', 'A', 'B', 'C', 'D', 'E', 'F'];

  progressForm = this.fb.group({
    student_id: ['', Validators.required],
    subject_id: ['', Validators.required],
    marks: [0, [Validators.required, Validators.min(0)]],
    total_marks: [100, [Validators.required, Validators.min(1)]],
    date: [new Date().toISOString().split('T')[0], Validators.required],
    remarks: [''],
    grade: ['']
  });

  getProgressForSubject(subjectId: string) {
    const student = this.selectedStudent();
    if (!student) return [];
    return this.attendanceService.allExamProgress()
      .filter(p => p.student_id === student.id && p.subject_id === subjectId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  getPercentageColor(marks: number, total: number) {
    const p = (marks / total) * 100;
    if (p >= 80) return 'text-emerald-600';
    if (p >= 60) return 'text-amber-600';
    return 'text-rose-600';
  }

  async saveProgress() {
    if (this.progressForm.invalid) return;
    const val = this.progressForm.value;
    await this.attendanceService.addExamProgress({
      student_id: val.student_id!,
      subject_id: val.subject_id!,
      marks: val.marks!,
      total_marks: val.total_marks!,
      date: val.date!,
      remarks: val.remarks || undefined,
      grade: val.grade || undefined
    });
    this.showAddProgressModal.set(false);
    this.progressForm.reset({
      student_id: this.selectedStudent()?.id || '',
      subject_id: '',
      marks: 0,
      total_marks: 100,
      date: new Date().toISOString().split('T')[0],
      remarks: '',
      grade: ''
    });
  }

  async addSubject(name: string) {
    if (!name.trim()) return;
    this.isAddingSubject.set(true);
    try {
      await this.attendanceService.addSubject(name);
    } catch (e) {
      // Error handled by service toast
    } finally {
      this.isAddingSubject.set(false);
    }
  }
}
