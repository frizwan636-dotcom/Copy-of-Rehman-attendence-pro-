import { Component, inject, signal, effect, computed, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, Student, Teacher, DailySubmission, AttendanceRecord, FeePayment } from '../services/attendance.service';
import { ReportsComponent } from './reports.component';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

export type StudentWithFeeStatus = Student & { feePaid: number; feeDue: number; status: 'Paid' | 'Partial' | 'Unpaid' | 'Overpaid' };

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, ReportsComponent, DatePipe],
  template: `
    <div class="min-h-screen pb-24 bg-slate-50/50">
      <!-- Top Navigation -->
      <nav class="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-4 shadow-sm">
        <div class="max-w-5xl mx-auto flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <i class="fa-solid fa-graduation-cap"></i>
            </div>
            <div>
              <h1 class="text-lg font-black text-slate-800 tracking-tight leading-none">{{ teacher()?.schoolName }}</h1>
              <p class="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mt-1">
                {{ teacher()?.name }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <!-- Sync Status Indicator -->
            <div class="hidden sm:flex items-center gap-3">
              @if (attendanceService.isSyncing()) {
                <div class="flex items-center gap-2 text-indigo-600 animate-pulse px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100">
                  <i class="fa-solid fa-arrows-rotate animate-spin text-[10px]"></i>
                  <span class="text-[9px] font-black uppercase tracking-tighter">Saving...</span>
                </div>
              } @else if (attendanceService.isOnline()) {
                <div class="flex items-center gap-2 text-emerald-600 opacity-80 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
                  <i class="fa-solid fa-cloud-check text-[10px]"></i>
                  <span class="text-[9px] font-black uppercase tracking-tighter">Data Saved</span>
                </div>
              }
            </div>
            
            <button (click)="view.set('profile')" title="My Profile" class="p-2.5 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors">
               <i class="fa-solid fa-user-circle"></i>
            </button>
            <button (click)="attendanceService.pinLogout()" title="Switch User" class="p-2.5 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors">
               <i class="fa-solid fa-users"></i>
            </button>
          </div>
        </div>
      </nav>

      <main class="max-w-4xl mx-auto p-4 md:p-8">
        <!-- Offline Mode Banner -->
        @if (!attendanceService.isOnline()) {
          <div class="bg-amber-100 border-l-4 border-amber-500 text-amber-800 p-4 rounded-md mb-6 flex items-center gap-4 shadow-sm" role="alert">
            <i class="fa-solid fa-wifi-slash text-xl"></i>
            <div>
              <p class="font-bold">You are in Offline Mode</p>
              <p class="text-sm">Changes will be saved locally and synced when you reconnect.</p>
            </div>
          </div>
        }
        
        <!-- Navigation Hub -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <button (click)="view.set('attendance')" 
            class="p-6 rounded-[2rem] transition-all flex flex-col items-center gap-3 group"
            [class]="view() === 'attendance'
              ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200'
              : 'bg-white text-slate-600 hover:bg-indigo-50 border border-slate-100 shadow-sm'">
            <i class="fa-solid fa-clipboard-user text-xl" [class]="view() === 'attendance' ? 'text-white' : 'text-indigo-500'"></i>
            <span class="text-xs font-black uppercase tracking-widest">Attendance</span>
          </button>

          <button (click)="view.set('students')" 
            class="p-6 rounded-[2rem] transition-all flex flex-col items-center gap-3 group"
            [class]="view() === 'students'
              ? 'bg-blue-600 text-white shadow-xl shadow-blue-200'
              : 'bg-white text-slate-600 hover:bg-blue-50 border border-slate-100 shadow-sm'">
            <i class="fa-solid fa-users text-xl" [class]="view() === 'students' ? 'text-white' : 'text-blue-500'"></i>
            <span class="text-xs font-black uppercase tracking-widest">Students</span>
          </button>

          <button (click)="view.set('fees')" 
            class="p-6 rounded-[2rem] transition-all flex flex-col items-center gap-3 group"
            [class]="view() === 'fees'
              ? 'bg-green-600 text-white shadow-xl shadow-green-200'
              : 'bg-white text-slate-600 hover:bg-green-50 border border-slate-100 shadow-sm'">
            <i class="fa-solid fa-wallet text-xl" [class]="view() === 'fees' ? 'text-white' : 'text-green-500'"></i>
            <span class="text-xs font-black uppercase tracking-widest">Fees</span>
          </button>

          <button (click)="view.set('reports')" 
            class="p-6 rounded-[2rem] transition-all flex flex-col items-center gap-3 group"
            [class]="view() === 'reports'
              ? 'bg-purple-600 text-white shadow-xl shadow-purple-200'
              : 'bg-white text-slate-600 hover:bg-purple-50 border border-slate-100 shadow-sm'">
            <i class="fa-solid fa-chart-pie text-xl" [class]="view() === 'reports' ? 'text-white' : 'text-purple-500'"></i>
            <span class="text-xs font-black uppercase tracking-widest">Reports</span>
          </button>
        </div>

        @switch (view()) {
          @case ('attendance') {
            <!-- Attendance View -->
            <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 class="text-2xl font-black text-slate-800 tracking-tight">Daily Roll Call</h2>
                     <button (click)="showClassSwitcher.set(true)" class="mt-2 text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors inline-flex items-center gap-2">
                      <i class="fa-solid fa-people-roof"></i>
                      Class: {{ activeClass()?.className }} - {{ activeClass()?.section }}
                      <i class="fa-solid fa-chevron-down text-xs ml-1 opacity-60"></i>
                    </button>
                  </div>
                  <div class="flex items-center bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200">
                    <i class="fa-solid fa-calendar text-indigo-500 mr-3"></i>
                    <input type="date" [ngModel]="selectedDate()" (ngModelChange)="selectedDate.set($event)" class="bg-transparent font-bold text-slate-700 outline-none text-sm">
                  </div>
                </div>

                @if (submissionStatus()) {
                   <div class="p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-center text-sm font-semibold border border-emerald-200">
                    <i class="fa-solid fa-check-circle mr-2"></i>
                    Attendance for this date was submitted to the coordinator at {{ submissionStatus()?.submissionTimestamp | date: 'shortTime' }}.
                   </div>
                }
              </div>

              <div class="space-y-3">
                @for (student of displayedStudents(); track student.id) {
                  <div class="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div class="flex items-center gap-4">
                      <div class="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center border-2 border-white shadow-sm text-indigo-400 overflow-hidden">
                          <i class="fa-solid fa-user text-2xl"></i>
                      </div>
                      <div>
                        <h4 class="font-bold text-slate-800 leading-none mb-1">{{ student.name }}</h4>
                        <span class="text-[10px] font-black text-slate-300 uppercase tracking-widest">Roll #{{ student.rollNumber }}</span>
                      </div>
                    </div>

                    <div class="flex items-center gap-2">
                      @if (getStatus(student.id) === 'Absent') {
                        <a [href]="getSmsSafeUrl(student)" target="_blank" class="w-10 h-10 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center hover:bg-sky-600 hover:text-white transition-all">
                          <i class="fa-solid fa-comment-sms text-lg"></i>
                        </a>
                      }
                      <div class="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                        <button (click)="toggleStatus(student.id, 'Present')" [class]="getStatus(student.id) === 'Present' ? 'px-4 py-2 bg-indigo-600 text-white rounded-[0.9rem] shadow-lg font-black text-[10px]' : 'px-4 py-2 text-slate-400 font-bold text-[10px]'">P</button>
                        <button (click)="toggleStatus(student.id, 'Absent')" [class]="getStatus(student.id) === 'Absent' ? 'px-4 py-2 bg-red-500 text-white rounded-[0.9rem] shadow-lg font-black text-[10px]' : 'px-4 py-2 text-slate-400 font-bold text-[10px]'">A</button>
                      </div>
                    </div>
                  </div>
                }
              </div>

              <div class="bg-white/80 backdrop-blur-md p-4 rounded-[2.5rem] border border-white/20 shadow-2xl flex gap-3 sticky bottom-6 z-40">
                @if (submissionStatus()) {
                   <div class="flex-1 py-5 bg-emerald-600 text-white rounded-[1.75rem] font-black shadow-xl flex items-center justify-center gap-3">
                    <i class="fa-solid fa-check-circle"></i> Submitted
                  </div>
                } @else {
                   <button (click)="saveAndSubmit()" class="flex-1 py-5 bg-slate-900 text-white rounded-[1.75rem] font-black shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                    <i class="fa-solid fa-paper-plane text-indigo-400"></i> Save & Submit to Coordinator
                  </button>
                }
                <button (click)="sendSmsAlertsToAbsentees()" [disabled]="absentCount() === 0" class="flex-1 py-5 bg-sky-600 text-white rounded-[1.75rem] font-black shadow-xl hover:bg-sky-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                  <i class="fa-solid fa-comment-sms"></i> SMS Absentees
                </button>
              </div>
            </div>
          }

          @case ('students') {
            <!-- Students Directory -->
            <div class="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div class="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 class="text-2xl font-black text-slate-800 tracking-tight">Student Directory</h2>
                    <p class="text-slate-500 text-sm font-medium">
                      Class {{ activeClass()?.className }} - {{ activeClass()?.section }} | Total: {{ displayedStudents().length }} enrolled
                    </p>
                  </div>
                  <button (click)="openNewAdmissionModal()" class="flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                    <i class="fa-solid fa-user-plus"></i>
                    <span>New Admission</span>
                  </button>
                </div>

                <!-- Search & Sort Controls -->
                <div class="flex flex-col sm:flex-row gap-4">
                  <div class="relative flex-1">
                    <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                    <input 
                      type="text" 
                      [ngModel]="searchQuery()"
                      (ngModelChange)="searchQuery.set($event)"
                      placeholder="Search name or roll number..."
                      class="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all text-sm font-medium"
                    >
                  </div>
                  <div class="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start sm:self-center">
                    <button (click)="sortKey.set('name')" 
                      [class]="sortKey() === 'name' ? 'px-6 py-3 bg-white shadow-sm text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest' : 'px-6 py-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest'">
                      Name
                    </button>
                    <button (click)="sortKey.set('roll')" 
                      [class]="sortKey() === 'roll' ? 'px-6 py-3 bg-white shadow-sm text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest' : 'px-6 py-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest'">
                      Roll #
                    </button>
                  </div>
                </div>
              </div>

              @if (filteredStudents().length > 0) {
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  @for (student of filteredStudents(); track student.id) {
                    <div class="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                      <div class="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center text-slate-400 overflow-hidden">
                        <i class="fa-solid fa-user-graduate text-2xl"></i>
                      </div>
                      <div class="flex-1">
                        <h4 class="font-bold text-slate-800">{{ student.name }}</h4>
                        <p class="text-xs text-slate-500">S/O: {{ student.fatherName || 'N/A' }}</p>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Roll: {{ student.rollNumber }}</p>
                        @if(student.feeDue > 0) {
                          <div class="mt-2 text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-full w-fit">
                            <i class="fa-solid fa-hourglass-half mr-1.5"></i> Due: {{ student.feeDue }}
                          </div>
                        } @else {
                          <div class="mt-2 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full w-fit">
                            <i class="fa-solid fa-check-circle mr-1.5"></i> Fees Cleared
                          </div>
                        }
                      </div>
                      <button (click)="openEditStudentModal(student)" title="Edit Student" class="self-start w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-full transition-colors">
                        <i class="fa-solid fa-pen-to-square"></i>
                      </button>
                    </div>
                  }
                </div>
              } @else {
                <div class="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
                  <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fa-solid fa-user-slash text-2xl text-slate-200"></i>
                  </div>
                  <h3 class="text-lg font-bold text-slate-400">No students found</h3>
                  <p class="text-sm text-slate-300">Try adjusting your search criteria</p>
                </div>
              }
            </div>
          }

          @case ('fees') {
            <div class="space-y-6 animate-in fade-in">
              <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h2 class="text-2xl font-black text-slate-800 tracking-tight">Fee Management</h2>
                  <p class="text-slate-500 text-sm font-medium">
                    Class {{ activeClass()?.className }} - {{ activeClass()?.section }} | Tracking payments and dues
                  </p>
                </div>
                 <button (click)="sendBulkFeeReminders()" [disabled]="studentsWithDuesCount() === 0" class="flex items-center gap-2 px-6 py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 disabled:opacity-50">
                    <i class="fa-solid fa-comment-dollar"></i>
                    <span>Remind All Dues</span>
                </button>
              </div>
              
              <div class="space-y-3">
                @for (student of filteredStudents(); track student.id) {
                  <div class="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-3 items-center gap-4">
                    <div class="flex items-center gap-4 col-span-1">
                       <div class="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0 text-green-500 overflow-hidden">
                          <i class="fa-solid fa-user text-2xl"></i>
                      </div>
                      <div>
                        <h4 class="font-bold text-slate-800 leading-none mb-1">{{ student.name }}</h4>
                        <span class="text-[10px] font-black text-slate-300 uppercase tracking-widest">#{{ student.rollNumber }}</span>
                      </div>
                    </div>

                    <div class="text-xs font-semibold text-slate-600 text-center col-span-1">
                       <p>Total: <span class="font-black">{{ student.totalFee }}</span></p>
                       <p>Paid: <span class="font-black text-green-600">{{ student.feePaid }}</span></p>
                       <p>Due: <span class="font-black text-red-600">{{ student.feeDue }}</span></p>
                    </div>

                    <div class="flex items-center justify-end gap-2 col-span-1">
                      @if (student.feeDue > 0) {
                        <a [href]="getFeeReminderSafeUrl(student)" target="_blank" class="w-10 h-10 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center hover:bg-green-600 hover:text-white transition-all">
                          <i class="fa-solid fa-file-invoice-dollar text-lg"></i>
                        </a>
                      }
                      <button (click)="openPaymentModal(student)" class="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-700 transition-all">
                        Record Payment
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          @case ('reports') {
            <div class="animate-in fade-in zoom-in-95">
              <app-reports (onBack)="view.set('attendance')" />
            </div>
          }
          
          @case ('profile') {
            <div class="space-y-6 animate-in fade-in">
              <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h2 class="text-2xl font-black text-slate-800 tracking-tight">My Profile</h2>
                <p class="text-slate-500 text-sm font-medium">Your personal and class information</p>
              </div>
              <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center">
                <div class="w-32 h-32 rounded-full bg-indigo-50 overflow-hidden border-4 border-white shadow-lg mb-6">
                  @if (teacher()?.photo) {
                    <img [src]="teacher()?.photo" class="w-full h-full object-cover">
                  } @else {
                    <div class="w-full h-full flex items-center justify-center text-indigo-200">
                      <i class="fa-solid fa-user-tie text-5xl"></i>
                    </div>
                  }
                </div>
                <h3 class="text-3xl font-black text-slate-800">{{ teacher()?.name }}</h3>
                <p class="text-indigo-600 font-bold">{{ teacher()?.schoolName }}</p>
                
                <div class="mt-6 pt-6 border-t w-full max-w-sm space-y-2">
                   <p class="text-sm font-bold uppercase text-slate-400 tracking-widest">Assigned Class</p>
                   <p class="text-xl font-bold text-slate-700">{{ teacher()?.className }} - {{ teacher()?.section }}</p>
                </div>
              </div>
            </div>
          }
        }
      </main>

      <!-- Feedback Toast -->
      @if (showToast()) {
        <div class="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
            <i class="fa-solid fa-check"></i>
          </div>
          <span class="font-bold text-sm">{{ toastMessage() }}</span>
        </div>
      }

      <!-- New Admission / Edit Student Modal -->
      @if (showStudentModal()) {
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-in fade-in" (click)="showStudentModal.set(false)">
          <div class="bg-white max-w-lg w-full rounded-[2rem] p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-bold text-slate-800">{{ isEditMode() ? 'Edit Student Profile' : 'New Student Admission' }}</h3>
              <button (click)="showStudentModal.set(false)" class="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            
            <div class="space-y-3">
              <input type="text" [ngModel]="studentForm().name" (ngModelChange)="updateStudentFormField('name', $event)" placeholder="Full Name" class="w-full p-4 rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-sm bg-slate-50">
              <input type="text" [ngModel]="studentForm().fatherName" (ngModelChange)="updateStudentFormField('fatherName', $event)" placeholder="Father's Name" class="w-full p-4 rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-sm bg-slate-50">
            </div>

            <div class="grid grid-cols-2 gap-3 mt-3">
              <input type="text" [ngModel]="studentForm().roll" (ngModelChange)="updateStudentFormField('roll', $event)" placeholder="Roll #" class="p-4 rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-sm bg-slate-50">
              <input type="tel" [ngModel]="studentForm().mobile" (ngModelChange)="updateStudentFormField('mobile', $event)" placeholder="Contact Mobile" class="p-4 rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-sm bg-slate-50">
            </div>
            <input type="number" [ngModel]="studentForm().totalFee" (ngModelChange)="updateStudentFormField('totalFee', $event)" placeholder="Total Fee" class="w-full p-4 mt-3 rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-sm bg-slate-50">
            <div class="grid grid-cols-2 gap-3 mt-3">
              <input type="text" [ngModel]="studentForm().className" (ngModelChange)="updateStudentFormField('className', $event)" placeholder="Class" class="w-full p-4 rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-sm bg-slate-50">
              <input type="text" [ngModel]="studentForm().section" (ngModelChange)="updateStudentFormField('section', $event)" placeholder="Section" class="w-full p-4 rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-sm bg-slate-50">
            </div>

            @if (studentModalError()) {
              <div class="mt-4 p-3 bg-red-50 text-red-700 text-center rounded-lg text-sm font-semibold border border-red-200">
                {{ studentModalError() }}
              </div>
            }

            <button (click)="saveStudent()" [disabled]="!studentForm().name || !studentForm().roll || !studentForm().mobile" class="w-full mt-6 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              <i class="fa-solid fa-check-circle"></i> {{ isEditMode() ? 'Save Changes' : 'Enroll Student' }}
            </button>
          </div>
        </div>
      }

       <!-- Record Payment Modal -->
      @if (showPaymentModal()) {
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-in fade-in" (click)="showPaymentModal.set(false)">
          <div class="bg-white max-w-md w-full rounded-[2rem] p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95" (click)="$event.stopPropagation()">
            <div class="text-center mb-6">
              <h3 class="text-xl font-bold text-slate-800">Record Fee Payment</h3>
              <p class="text-sm text-slate-500 font-medium">For {{ selectedStudentForPayment()?.name }}</p>
            </div>
            
            <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4 text-center">
              <p class="text-xs font-black uppercase text-slate-400">Amount Due</p>
              <p class="text-3xl font-black text-red-500">{{ selectedStudentForPayment()?.feeDue }}</p>
            </div>

            <div class="space-y-2">
               <label class="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Payment Amount Received</label>
               <input type="number" [ngModel]="paymentAmount()" (ngModelChange)="paymentAmount.set($event)" placeholder="Enter amount" class="w-full p-5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all bg-white font-bold text-lg text-center">
            </div>

            <div class="flex gap-3 mt-6">
              <button (click)="showPaymentModal.set(false)" class="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold">Cancel</button>
              <button (click)="savePayment()" [disabled]="!paymentAmount() || paymentAmount() <= 0" class="flex-[2] py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50">
                Save Payment
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Class Switcher Modal -->
      @if (showClassSwitcher()) {
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4" (click)="showClassSwitcher.set(false)">
          <div class="bg-white max-w-md w-full rounded-[2rem] p-6 shadow-2xl border animate-in zoom-in-95" (click)="$event.stopPropagation()">
            <h3 class="text-xl font-bold text-slate-800 mb-4 text-center">Switch Class</h3>
            <div class="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
              <!-- Teacher's primary class -->
              <button (click)="handleClassSelection(teacher()!.className, teacher()!.section)"
                class="w-full text-left p-4 rounded-xl flex items-center justify-between transition-colors"
                [class]="activeClass()?.className === teacher()?.className && activeClass()?.section === teacher()?.section ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 hover:bg-indigo-100'">
                <div>
                  <p class="font-bold">Class {{ teacher()?.className }} - {{ teacher()?.section }}</p>
                  <p class="text-xs font-medium" [class]="activeClass()?.className === teacher()?.className && activeClass()?.section === teacher()?.section ? 'text-indigo-200' : 'text-slate-400'">Your primary class</p>
                </div>
                @if (activeClass()?.className === teacher()?.className && activeClass()?.section === teacher()?.section) {
                  <i class="fa-solid fa-check-circle text-white"></i>
                } @else {
                  <i class="fa-solid fa-arrow-right text-slate-400"></i>
                }
              </button>
              
              <hr class="my-3"/>
              
              <p class="text-sm font-bold text-slate-500 px-2">Other Classes</p>
              @for(cls of allSchoolClasses(); track cls.className + cls.section) {
                @if(cls.className !== teacher()?.className || cls.section !== teacher()?.section) {
                  <button (click)="handleClassSelection(cls.className, cls.section)"
                    class="w-full text-left p-4 rounded-xl flex items-center justify-between transition-colors"
                    [class]="activeClass()?.className === cls.className && activeClass()?.section === cls.section ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 hover:bg-indigo-100'">
                    <div>
                      <p class="font-bold">Class {{ cls.className }} - {{ cls.section }}</p>
                    </div>
                     @if (activeClass()?.className === cls.className && activeClass()?.section === cls.section) {
                      <i class="fa-solid fa-check-circle text-white"></i>
                    } @else {
                      <i class="fa-solid fa-arrow-right text-slate-400"></i>
                    }
                  </button>
                }
              }
            </div>
          </div>
        </div>
      }

      <!-- PIN Prompt for Class Switch -->
      @if (showPinPrompt()) {
        <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="showPinPrompt.set(false)">
          <div class="bg-white max-w-sm w-full rounded-[2rem] p-6 shadow-2xl border animate-in zoom-in-95" (click)="$event.stopPropagation()">
            <div class="text-center">
                <h2 class="text-xl font-bold text-slate-800">Enter PIN for Class</h2>
                <p class="text-slate-500 mb-4 font-semibold">{{ targetClassForSwitch()?.className }} - {{ targetClassForSwitch()?.section }}</p>

                <div class="flex justify-center gap-3 mb-4">
                  @for (i of [0, 1, 2, 3]; track i) {
                    <div class="w-12 h-14 rounded-lg border-2 flex items-center justify-center text-3xl font-bold"
                      [class]="pinForSwitch().length > i ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : 'border-slate-300 bg-slate-100'">
                      {{ pinForSwitch().length > i ? '•' : '' }}
                    </div>
                  }
                </div>

                @if(pinErrorMessage()) {
                  <p class="text-red-600 bg-red-100 px-4 py-2 rounded-lg font-bold mb-4 animate-in fade-in">{{ pinErrorMessage() }}</p>
                }
                
                <div class="grid grid-cols-3 gap-3">
                  @for (num of [1, 2, 3, 4, 5, 6, 7, 8, 9]; track num) {
                    <button (click)="appendPinForSwitch(num.toString())" class="h-14 rounded-xl bg-slate-100 font-bold text-xl text-slate-700 hover:bg-slate-200">{{ num }}</button>
                  }
                  <button (click)="clearPinForSwitch()" class="h-14 rounded-xl bg-slate-100 font-bold text-slate-500 text-sm">C</button>
                  <button (click)="appendPinForSwitch('0')" class="h-14 rounded-xl bg-slate-100 font-bold text-xl text-slate-700 hover:bg-slate-200">0</button>
                  <button (click)="backspacePinForSwitch()" class="h-14 rounded-xl bg-slate-100 font-bold text-slate-500"><i class="fa-solid fa-delete-left"></i></button>
                </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  attendanceService = inject(AttendanceService);
  sanitizer: DomSanitizer = inject(DomSanitizer);
  
  view = signal<'attendance' | 'students' | 'fees' | 'reports' | 'profile'>('attendance');
  teacher = this.attendanceService.activeTeacher;
  
  // Class Switching State
  showClassSwitcher = signal(false);
  activeClass = signal<{ className: string; section: string } | null>(null);
  allSchoolClasses = this.attendanceService.allSchoolClasses;
  
  // PIN Prompt State for Class Switch
  showPinPrompt = signal(false);
  targetClassForSwitch = signal<{ className: string, section: string } | null>(null);
  targetTeacherForSwitch = signal<Teacher | null>(null);
  pinForSwitch = signal('');
  pinErrorMessage = signal('');

  // Search & Filter State
  searchQuery = signal('');
  sortKey = signal<'name' | 'roll'>('name');
  
  // Student Modal State (for New and Edit)
  showStudentModal = signal(false);
  isEditMode = signal(false);
  editingStudentId = signal<string | null>(null);
  studentModalError = signal('');
  studentForm = signal({
    name: '', roll: '', mobile: '',
    fatherName: '',
    totalFee: null as number | null, 
    className: '', section: ''
  });

  // Fee Management State
  showPaymentModal = signal(false);
  selectedStudentForPayment = signal<StudentWithFeeStatus | null>(null);
  paymentAmount = signal<number | null>(null);
  
  displayedStudents = computed(() => {
    const ac = this.activeClass();
    if (!ac) return [];
    
    return this.attendanceService.allSchoolStudents().filter(s => 
      s.className === ac.className && s.section === ac.section
    );
  });

  studentsWithFeeStatus = computed(() => {
    return this.displayedStudents().map(s => {
        const feePaid = s.feeHistory.reduce((acc, p) => acc + p.amount, 0);
        const feeDue = s.totalFee - feePaid;
        let status: 'Paid' | 'Partial' | 'Unpaid' | 'Overpaid' = 'Unpaid';
        if (s.totalFee > 0 && feePaid === 0) status = 'Unpaid';
        else if (feePaid > 0 && feePaid < s.totalFee) status = 'Partial';
        else if (feePaid >= s.totalFee) status = 'Paid';
        if (feePaid > s.totalFee) status = 'Overpaid';

        return { ...s, feePaid, feeDue, status };
    });
  });

  studentsWithDuesCount = computed(() => {
    return this.studentsWithFeeStatus().filter(s => s.feeDue > 0).length;
  });

  filteredStudents = computed(() => {
    let list = [...this.studentsWithFeeStatus()];
    const query = this.searchQuery().toLowerCase().trim();
    
    if (query) {
      list = list.filter(s => 
        s.name.toLowerCase().includes(query) || 
        s.rollNumber.toLowerCase().includes(query)
      );
    }
    
    list.sort((a, b) => {
      if (this.sortKey() === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        return a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true });
      }
    });
    
    return list;
  });
  
  selectedDate = signal(new Date().toISOString().split('T')[0]);
  dailyRecords = signal<Map<string, 'Present' | 'Absent'>>(new Map());
  showToast = signal(false);
  toastMessage = signal('');

  submissionStatus = computed<DailySubmission | null>(() => {
    const teacher = this.teacher();
    const ac = this.activeClass();
    if (!teacher || !ac) return null;
    return this.attendanceService.getSubmissionForTeacher(teacher.id, ac.className, ac.section, this.selectedDate()) || null;
  });

  absentCount = computed(() => {
    let count = 0;
    this.dailyRecords().forEach(val => { if (val === 'Absent') count++; });
    return count;
  });

  constructor() {
    effect(() => {
      const teacher = this.teacher();
      if (teacher && !this.activeClass()) {
        this.activeClass.set({ className: teacher.className, section: teacher.section });
      }
    });
    
    effect(() => {
      const date = this.selectedDate();
      const studentsForDate = this.displayedStudents();
      const existingRecordsForDate = this.attendanceService.getAttendanceForDate(date);
      const newMap = new Map<string, 'Present' | 'Absent'>();
      
      studentsForDate.forEach(s => {
        const record = existingRecordsForDate.find(r => r.studentId === s.id);
        newMap.set(s.id, record ? record.status : 'Present');
      });
      this.dailyRecords.set(newMap);
    });
  }

  // --- Class Switching Logic ---
  handleClassSelection(className: string, section: string) {
    const loggedInTeacher = this.teacher();
    if (loggedInTeacher?.className === className && loggedInTeacher?.section === section) {
      this.performClassSwitch(className, section);
      return;
    }

    const targetTeacher = this.attendanceService.getTeacherForClass(className, section);
    if (targetTeacher) {
      this.targetClassForSwitch.set({ className, section });
      this.targetTeacherForSwitch.set(targetTeacher);
      this.pinForSwitch.set('');
      this.pinErrorMessage.set('');
      this.showPinPrompt.set(true);
    } else {
      // If no teacher is assigned, allow switching without PIN
      this.performClassSwitch(className, section);
    }
  }
  
  performClassSwitch(className: string, section: string) {
    this.activeClass.set({ className, section });
    this.showClassSwitcher.set(false);
    this.showPinPrompt.set(false);
    this.showToastWithMessage(`Switched to Class ${className} - ${section}`);
  }

  // --- PIN Prompt for Class Switch Methods ---
  appendPinForSwitch(num: string) {
    if (this.pinForSwitch().length < 4) {
      this.pinForSwitch.update(p => p + num);
      if (this.pinForSwitch().length === 4) {
        this.submitPinForSwitch();
      }
    }
  }

  clearPinForSwitch() { this.pinForSwitch.set(''); }
  backspacePinForSwitch() { this.pinForSwitch.update(p => p.slice(0, -1)); }

  submitPinForSwitch() {
    const targetTeacher = this.targetTeacherForSwitch();
    const targetClass = this.targetClassForSwitch();
    if (!targetTeacher || !targetClass) return;

    const isValid = this.attendanceService.verifyPin(targetTeacher.id, this.pinForSwitch());

    if (isValid) {
      this.performClassSwitch(targetClass.className, targetClass.section);
    } else {
      this.pinErrorMessage.set('Incorrect PIN. Please try again.');
      if (navigator.vibrate) navigator.vibrate(200);
      setTimeout(() => {
        this.pinForSwitch.set('');
        this.pinErrorMessage.set('');
      }, 1500);
    }
  }


  showToastWithMessage(message: string) {
    this.toastMessage.set(message);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3000);
  }

  toggleStatus(studentId: string, status: 'Present' | 'Absent') {
    if (this.submissionStatus()) return; // Don't allow changes after submission
    this.dailyRecords.update(map => {
      const newMap = new Map(map);
      newMap.set(studentId, status);
      return newMap;
    });
  }

  getStatus(studentId: string) {
    return this.dailyRecords().get(studentId);
  }

  async saveAndSubmit() {
    const records: { studentId: string, status: 'Present' | 'Absent' }[] = [];
    this.dailyRecords().forEach((status, studentId) => {
      records.push({ studentId, status });
    });

    try {
      // 1. Save attendance records
      await this.attendanceService.saveAttendance(this.selectedDate(), records);

      // 2. Submit summary to coordinator
      await this.attendanceService.submitAttendanceToCoordinator(
        this.selectedDate(),
        this.activeClass()!,
        this.displayedStudents(),
        this.dailyRecords()
      );

      this.showToastWithMessage('Attendance Saved & Submitted');
    } catch (e: any) {
      alert(`Submission Error: ${e.message}`);
    }
  }

  // SMS Alert Logic for Absentees
  private buildSmsUrl(student: any): string {
    const dateStr = new Date(this.selectedDate()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const message = `ABSENCE ALERT\n\nDear Parent,\nThis is to inform you that your child ${student.name} (Roll: ${student.rollNumber}) was ABSENT from class today (${dateStr}).\n\nRegards,\n${this.teacher()?.name}\n${this.teacher()?.schoolName}`;
    
    const cleanNumber = student.mobileNumber.replace(/\D/g, '');
    return `sms:${cleanNumber}?body=${encodeURIComponent(message)}`;
  }

  getSmsSafeUrl(student: any): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(this.buildSmsUrl(student));
  }

  sendDirectSmsAlert(student: any) {
    const url = this.buildSmsUrl(student);
    window.open(url, '_blank');
  }

  sendSmsAlertsToAbsentees() {
    const absentees: any[] = [];
    this.dailyRecords().forEach((status, studentId) => {
      if (status === 'Absent') {
        const student = this.displayedStudents().find(s => s.id === studentId);
        if (student) absentees.push(student);
      }
    });

    if (absentees.length === 0) return;

    if (confirm(`This will open your SMS app to send alerts to all ${absentees.length} absentees. Continue?`)) {
      absentees.forEach((s, index) => {
        setTimeout(() => this.sendDirectSmsAlert(s), index * 500);
      });
      this.showToastWithMessage(`Opening SMS app for alerts...`);
    }
  }

  // Fee Reminder Logic
  buildFeeReminderSmsUrl(student: StudentWithFeeStatus): string {
    const message = `FEE REMINDER\n\nDear Parent,\nThis is a reminder regarding the outstanding school fee for your child ${student.name} (Roll: ${student.rollNumber}).\n\n- Total Fee: ${student.totalFee}\n- Amount Paid: ${student.feePaid}\n- Outstanding Due: ${student.feeDue}\n\nPlease clear the dues at your earliest convenience.\n\nRegards,\n${this.teacher()?.name}\n${this.teacher()?.schoolName}`;
    const cleanNumber = student.mobileNumber.replace(/\D/g, '');
    return `sms:${cleanNumber}?body=${encodeURIComponent(message)}`;
  }

  getFeeReminderSafeUrl(student: StudentWithFeeStatus): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(this.buildFeeReminderSmsUrl(student));
  }
  
  sendBulkFeeReminders() {
    const studentsWithDues = this.studentsWithFeeStatus().filter(s => s.feeDue > 0);
    if (studentsWithDues.length === 0) {
      this.showToastWithMessage('No students with pending fees.');
      return;
    }
    if (confirm(`This will open your SMS app for all ${studentsWithDues.length} students with outstanding fees. Continue?`)) {
      studentsWithDues.forEach((s, index) => {
        setTimeout(() => window.open(this.buildFeeReminderSmsUrl(s), '_blank'), index * 1000);
      });
      this.showToastWithMessage(`Opening SMS app for ${studentsWithDues.length} fee reminders...`);
    }
  }

  // Student Modal Logic (New and Edit)
  resetStudentForm() {
    this.studentForm.set({
      name: '', roll: '', mobile: '',
      fatherName: '',
      totalFee: null, 
      className: this.activeClass()?.className || this.teacher()?.className || '',
      section: this.activeClass()?.section || this.teacher()?.section || ''
    });
  }

  openNewAdmissionModal() {
    this.isEditMode.set(false);
    this.editingStudentId.set(null);
    this.resetStudentForm();
    this.studentModalError.set('');
    this.showStudentModal.set(true);
  }
  
  openEditStudentModal(student: Student | StudentWithFeeStatus) {
    this.isEditMode.set(true);
    this.editingStudentId.set(student.id);
    this.studentForm.set({
        name: student.name,
        roll: student.rollNumber,
        mobile: student.mobileNumber,
        fatherName: student.fatherName || '',
        totalFee: student.totalFee,
        className: student.className || this.teacher()?.className || '',
        section: student.section || this.teacher()?.section || ''
    });
    this.studentModalError.set('');
    this.showStudentModal.set(true);
  }

  updateStudentFormField(field: keyof ReturnType<typeof this.studentForm>, value: any) {
    this.studentForm.update(form => ({...form, [field]: value }));
  }

  async saveStudent() {
    this.studentModalError.set('');
    const form = this.studentForm();
    const { name, fatherName, roll, mobile, totalFee, className, section } = form;

    if (!name.trim() || !roll.trim() || !mobile.trim()) {
      this.studentModalError.set('Please fill in student name, roll number, and contact mobile.');
      return;
    }

    if (this.attendanceService.isRollNumberTaken(roll, this.editingStudentId() || undefined)) {
      this.studentModalError.set(`Error: Roll number "${roll}" is already assigned to another student.`);
      return;
    }

    try {
      if (this.isEditMode()) {
        // Update existing student
        await this.attendanceService.updateStudentDetails(this.editingStudentId()!, {
          name: name.trim(),
          fatherName: fatherName?.trim(),
          rollNumber: roll.trim(),
          mobileNumber: mobile.trim(),
          totalFee: totalFee || 0,
          className: className?.trim(),
          section: section?.trim()
        });
        this.showToastWithMessage(`Updated profile for ${name}.`);
      } else {
        // Add new student
        await this.attendanceService.addStudents([{
          name: name.trim(),
          fatherName: fatherName?.trim(),
          roll: roll.trim(),
          mobile: mobile.trim(),
          totalFee: totalFee || 0,
          className: className?.trim(),
          section: section?.trim()
        }]);
        this.showToastWithMessage(`Student ${name} admitted successfully!`);
      }

      this.showStudentModal.set(false);
    } catch (e: any) {
      this.studentModalError.set(e.message);
    }
  }

  // Payment Modal Logic
  openPaymentModal(student: StudentWithFeeStatus) {
    this.selectedStudentForPayment.set(student);
    this.paymentAmount.set(null);
    this.showPaymentModal.set(true);
  }
  
  async savePayment() {
    const student = this.selectedStudentForPayment();
    const amount = this.paymentAmount();
    if (!student || !amount || amount <= 0) {
        alert("Please enter a valid payment amount.");
        return;
    }
    
    try {
      await this.attendanceService.recordFeePayment(student.id, amount);
      this.showToastWithMessage(`Payment of ${amount} recorded for ${student.name}.`);
      this.showPaymentModal.set(false);
    } catch(e: any) {
      alert("Error saving payment: " + e.message);
    }
  }
}