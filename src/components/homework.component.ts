import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AttendanceService, Homework, Subject } from '../services/attendance.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-homework',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="p-4 sm:p-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 class="text-xl sm:text-2xl font-bold text-slate-800">Homework Management</h2>
        <div class="flex gap-2 w-full sm:w-auto">
          <button (click)="showSubjectModal.set(true)" class="flex-1 sm:flex-none px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 text-sm font-bold">
            <i class="fa-solid fa-book text-xs"></i>
            Subjects
          </button>
          <button (click)="showAddModal.set(true)" class="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-indigo-200">
            <i class="fa-solid fa-plus text-xs"></i>
            Add Homework
          </button>
        </div>
      </div>
      
      <!-- Homework List -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (hw of attendanceService.allHomeworks(); track hw.id) {
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col">
            <div class="flex justify-between items-start mb-4">
              <div class="flex-1">
                <span class="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded-md mb-2 inline-block">
                  {{ getSubjectName(hw.subject_id) }}
                </span>
                <h3 class="text-lg font-bold text-slate-800 leading-tight">{{ hw.title }}</h3>
              </div>
              <div class="flex gap-1 ml-2">
                <button (click)="viewSubmissions(hw)" title="View Submissions" class="p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                  <i class="fa-solid fa-users text-sm"></i>
                </button>
                <button (click)="editHomework(hw)" class="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                  <i class="fa-solid fa-pen-to-square text-sm"></i>
                </button>
                <button (click)="deleteHomework(hw.id)" class="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                  <i class="fa-solid fa-trash text-sm"></i>
                </button>
              </div>
            </div>
            <p class="text-slate-600 text-sm mb-4 line-clamp-2 flex-1">{{ hw.description }}</p>
            <div class="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-50">
              <div class="flex items-center gap-1.5">
                <i class="fa-solid fa-calendar-day text-[10px]"></i>
                Due: {{ hw.dueDate | date }}
              </div>
              <span [class]="hw.status === 'active' ? 'text-emerald-600 font-bold' : 'text-slate-400 font-bold'">
                {{ hw.status | titlecase }}
              </span>
            </div>
          </div>
        } @empty {
          <div class="col-span-full py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto mb-4">
              <i class="fa-solid fa-file-signature text-slate-200 text-2xl"></i>
            </div>
            <p class="text-slate-500 font-medium">No homework assigned yet.</p>
          </div>
        }
      </div>

      <!-- View Submissions Modal -->
      @if (showSubmissionsModal()) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div class="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 class="text-xl font-bold text-slate-800">Submissions</h3>
                <p class="text-sm text-slate-500">{{ selectedHomework()?.title }}</p>
              </div>
              <button (click)="showSubmissionsModal.set(false)" class="text-slate-400 hover:text-slate-600">
                <i class="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <div class="p-6 overflow-y-auto flex-1">
              <div class="grid grid-cols-1 gap-4">
                @for (sub of getSubmissionsForSelectedHomework(); track sub.id) {
                  <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div class="flex justify-between items-start mb-2">
                      <div>
                        <h4 class="font-bold text-slate-800">{{ getStudentName(sub.student_id) }}</h4>
                        <p class="text-xs text-slate-400">Submitted: {{ sub.submitted_at | date:'medium' }}</p>
                      </div>
                      <div class="flex items-center gap-2">
                        @if (sub.marked) {
                          <span class="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded">Marked: {{ sub.score }}/100</span>
                        } @else {
                          <span class="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded">Pending</span>
                        }
                      </div>
                    </div>
                    <div class="bg-white p-3 rounded-xl border border-slate-100 text-sm text-slate-600 mb-3 whitespace-pre-wrap">
                      {{ sub.content }}
                    </div>

                    @if (sub.attachment_url) {
                      <div class="mb-3">
                        <a [href]="sub.attachment_url" target="_blank" class="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition-all">
                          <i class="fa-solid fa-paperclip text-xs"></i>
                          View Attachment
                        </a>
                      </div>
                    }
                    
                    <!-- Marking Form -->
                    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <input #scoreInput type="number" [value]="sub.score || ''" placeholder="Score (0-100)" class="w-full sm:w-32 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                      <input #remarksInput type="text" [value]="sub.teacher_remarks || ''" placeholder="Remarks" class="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                      <button (click)="markSubmission(sub.id, +scoreInput.value, remarksInput.value)" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors">
                        Save
                      </button>
                    </div>
                  </div>
                } @empty {
                  <div class="text-center py-12 text-slate-400">
                    <i class="fa-solid fa-box-open text-4xl mb-2 block"></i>
                    <p>No submissions yet.</p>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Add/Edit Homework Modal -->
      @if (showAddModal()) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div class="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 class="text-xl font-bold text-slate-800">{{ editingHomeworkId ? 'Edit' : 'Add' }} Homework</h3>
              <button (click)="closeModal()" class="text-slate-400 hover:text-slate-600">
                <i class="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <form [formGroup]="homeworkForm" (ngSubmit)="saveHomework()" class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <select formControlName="subject_id" class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">Select Subject</option>
                  @for (sub of attendanceService.allSubjects(); track sub.id) {
                    <option [value]="sub.id">{{ sub.name }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input formControlName="title" type="text" class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Enter title">
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea formControlName="description" rows="3" class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Enter details"></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                <input formControlName="dueDate" type="date" class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none">
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" formControlName="status" id="hw-status" class="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500">
                <label for="hw-status" class="text-sm text-slate-700">Active (Visible to students)</label>
              </div>
              <div class="flex gap-3 pt-4">
                <button type="button" (click)="closeModal()" class="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-bold">Cancel</button>
                <button type="submit" [disabled]="homeworkForm.invalid" class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 font-bold">
                  {{ editingHomeworkId ? 'Update' : 'Assign' }}
                </button>
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
                <i class="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <div class="p-6 space-y-4">
              <div class="flex gap-2">
                <input #newSubInput type="text" class="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="New subject name" [disabled]="isAddingSubject()">
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
export class HomeworkComponent {
  attendanceService = inject(AttendanceService);
  fb = inject(FormBuilder);

  showAddModal = signal(false);
  showSubjectModal = signal(false);
  showSubmissionsModal = signal(false);
  isAddingSubject = signal(false);
  editingHomeworkId: string | null = null;
  selectedHomework = signal<Homework | null>(null);

  homeworkForm = this.fb.group({
    subject_id: ['', Validators.required],
    title: ['', Validators.required],
    description: ['', Validators.required],
    dueDate: ['', Validators.required],
    status: [true]
  });

  getSubjectName(id: string) {
    return this.attendanceService.allSubjects().find(s => s.id === id)?.name || 'Unknown';
  }

  getStudentName(id: string) {
    return this.attendanceService.allSchoolStudents().find(s => s.id === id)?.name || 'Unknown Student';
  }

  viewSubmissions(hw: Homework) {
    this.selectedHomework.set(hw);
    this.showSubmissionsModal.set(true);
  }

  getSubmissionsForSelectedHomework() {
    const hw = this.selectedHomework();
    if (!hw) return [];
    return this.attendanceService.allHomeworkSubmissions().filter(s => s.homework_id === hw.id);
  }

  async markSubmission(submissionId: string, score: number, teacher_remarks: string) {
    try {
      await this.attendanceService.markHomework(submissionId, {
        score,
        teacher_remarks,
        marked: true
      });
    } catch (e) {
      console.error('Error marking homework:', e);
    }
  }

  editHomework(hw: Homework) {
    this.editingHomeworkId = hw.id;
    this.homeworkForm.patchValue({
      subject_id: hw.subject_id,
      title: hw.title,
      description: hw.description,
      dueDate: hw.dueDate,
      status: hw.status === 'active'
    });
    this.showAddModal.set(true);
  }

  async saveHomework() {
    if (this.homeworkForm.invalid) return;

    const val = this.homeworkForm.value;
    const homeworkData = {
      subject_id: val.subject_id!,
      title: val.title!,
      description: val.description!,
      dueDate: val.dueDate!,
      status: val.status ? 'active' : 'inactive' as 'active' | 'inactive'
    };

    try {
      if (this.editingHomeworkId) {
        await this.attendanceService.updateHomework(this.editingHomeworkId, homeworkData);
      } else {
        await this.attendanceService.addHomework(homeworkData);
      }
      this.closeModal();
    } catch (e) {
      console.error('Error saving homework:', e);
    }
  }

  async deleteHomework(id: string) {
    if (confirm('Are you sure you want to delete this homework?')) {
      await this.attendanceService.deleteHomework(id);
    }
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

  closeModal() {
    this.showAddModal.set(false);
    this.editingHomeworkId = null;
    this.homeworkForm.reset({ status: true });
  }
}
