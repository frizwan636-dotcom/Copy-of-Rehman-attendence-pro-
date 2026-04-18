import { Component, inject, signal, effect, computed, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, Student, Teacher, DailySubmission, AttendanceRecord, FeePayment } from '../services/attendance.service';
import { ReportsComponent } from './reports.component';
import { ExamsComponent } from './exams.component';
import { HomeworkComponent } from './homework.component';
import { StaffComponent } from './staff.component';
import { CalendarComponent } from './calendar.component';
import { LibraryComponent } from './library.component';
import { QuizComponent } from './quiz.component';
import { HealthComponent } from './health.component';
import { FeesComponent } from './fees.component';
import { AnnouncementComponent } from './announcement.component';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

export type StudentWithFeeStatus = Student & { feePaid: number; feeDue: number; status: 'Paid' | 'Partial' | 'Unpaid' | 'Overpaid' };

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReportsComponent, DatePipe, ExamsComponent, HomeworkComponent, StaffComponent, CalendarComponent, LibraryComponent, AnnouncementComponent, QuizComponent, HealthComponent, FeesComponent],
  template: `
    <div class="min-h-screen pb-24 bg-slate-50/50">
      <!-- Top Navigation -->
      <nav class="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 shadow-sm">
        <div class="max-w-5xl mx-auto flex justify-between items-center">
          <div class="flex items-center gap-3">
            <button class="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <i class="fa-solid fa-bars text-xl"></i>
            </button>
            <h1 class="text-xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
          </div>

          <div class="flex items-center gap-3">
             <button (click)="attendanceService.toggleDarkMode()" [title]="isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode'" class="p-2.5 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors">
               <i class="fa-solid" [class]="isDarkMode() ? 'fa-sun' : 'fa-moon'"></i>
             </button>
             <button (click)="attendanceService.toggleRtl()" [title]="isRtl() ? 'Switch to LTR' : 'Switch to RTL'" class="p-2.5 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors">
               <i class="fa-solid fa-language"></i>
             </button>
            <div class="w-10 h-10 rounded-full overflow-hidden border-2 border-indigo-100 cursor-pointer" (click)="view.set('profile')">
              @if (teacher()?.photo) {
                <img [src]="teacher()?.photo" class="w-full h-full object-cover">
              } @else {
                <div class="w-full h-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <i class="fa-solid fa-user"></i>
                </div>
              }
            </div>
            <button (click)="attendanceService.pinLogout()" title="Logout" class="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors">
               <i class="fa-solid fa-right-from-bracket text-xl"></i>
            </button>
          </div>
        </div>
      </nav>

      <main class="max-w-4xl mx-auto p-4 md:p-8">
        <!-- Welcome Card -->
        <div class="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg mb-8 relative overflow-hidden">
          <div class="relative z-10">
            <p class="text-blue-100 text-sm font-medium mb-1">Welcome Back,</p>
            <h2 class="text-2xl sm:text-3xl font-bold mb-2">{{ teacher()?.name }}</h2>
            <p class="text-blue-100 text-sm">Class Teacher: {{ teacher()?.className }} - {{ teacher()?.section }}</p>
          </div>
          <!-- Decorative circles -->
          <div class="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div class="absolute bottom-0 right-20 -mb-10 w-32 h-32 bg-white opacity-10 rounded-full blur-xl"></div>
        </div>

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
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
          <button (click)="view.set('attendance')" class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center gap-3 hover:shadow-md transition-all group" [class.ring-2]="view() === 'attendance'" [class.ring-indigo-500]="view() === 'attendance'">
            <div class="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-clipboard-user"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-sm">Attendance</h3>
              <p class="text-[10px] text-slate-500 mt-0.5">Mark & View</p>
            </div>
          </button>

          <button (click)="view.set('students')" class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center gap-3 hover:shadow-md transition-all group" [class.ring-2]="view() === 'students'" [class.ring-indigo-500]="view() === 'students'">
            <div class="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-users"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-sm">Students</h3>
              <p class="text-[10px] text-slate-500 mt-0.5">Directory</p>
            </div>
          </button>

          <button (click)="view.set('fees')" class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center gap-3 hover:shadow-md transition-all group" [class.ring-2]="view() === 'fees'" [class.ring-indigo-500]="view() === 'fees'">
            <div class="w-14 h-14 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-wallet"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-sm">Fees</h3>
              <p class="text-[10px] text-slate-500 mt-0.5">Payments</p>
            </div>
          </button>

          <button (click)="view.set('reports')" class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center gap-3 hover:shadow-md transition-all group" [class.ring-2]="view() === 'reports'" [class.ring-indigo-500]="view() === 'reports'">
            <div class="w-14 h-14 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-chart-pie"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-sm">Reports</h3>
              <p class="text-[10px] text-slate-500 mt-0.5">Analytics</p>
            </div>
          </button>

          <button (click)="view.set('exams')" class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center gap-3 hover:shadow-md transition-all group" [class.ring-2]="view() === 'exams'" [class.ring-indigo-500]="view() === 'exams'">
            <div class="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-file-pen"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-sm">Exams</h3>
              <p class="text-[10px] text-slate-500 mt-0.5">Results</p>
            </div>
          </button>

          <button (click)="view.set('homework')" class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center gap-3 hover:shadow-md transition-all group" [class.ring-2]="view() === 'homework'" [class.ring-indigo-500]="view() === 'homework'">
            <div class="w-14 h-14 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-book-open"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-sm">Homework</h3>
              <p class="text-[10px] text-slate-500 mt-0.5">Assignments</p>
            </div>
          </button>

          <button (click)="view.set('calendar')" class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center gap-3 hover:shadow-md transition-all group" [class.ring-2]="view() === 'calendar'" [class.ring-indigo-500]="view() === 'calendar'">
            <div class="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-calendar-days"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-sm">Calendar</h3>
              <p class="text-[10px] text-slate-500 mt-0.5">Events</p>
            </div>
          </button>

          <button (click)="view.set('announcements')" class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center gap-3 hover:shadow-md transition-all group" [class.ring-2]="view() === 'announcements'" [class.ring-indigo-500]="view() === 'announcements'">
            <div class="w-14 h-14 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-bullhorn"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-sm">Announcements</h3>
              <p class="text-[10px] text-slate-500 mt-0.5">School Updates</p>
            </div>
          </button>

          <button (click)="view.set('library')" class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center gap-3 hover:shadow-md transition-all group" [class.ring-2]="view() === 'library'" [class.ring-indigo-500]="view() === 'library'">
            <div class="w-14 h-14 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-book"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-sm">Library</h3>
              <p class="text-[10px] text-slate-500 mt-0.5">Books</p>
            </div>
          </button>

          <button (click)="view.set('quiz')" class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center gap-3 hover:shadow-md transition-all group" [class.ring-2]="view() === 'quiz'" [class.ring-indigo-500]="view() === 'quiz'">
            <div class="w-14 h-14 rounded-full bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-question"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-sm">Quiz</h3>
              <p class="text-[10px] text-slate-500 mt-0.5">Online Tests</p>
            </div>
          </button>

          <button (click)="view.set('health')" class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center gap-3 hover:shadow-md transition-all group" [class.ring-2]="view() === 'health'" [class.ring-indigo-500]="view() === 'health'">
            <div class="w-14 h-14 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-heart-pulse"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-sm">Health</h3>
              <p class="text-[10px] text-slate-500 mt-0.5">Records</p>
            </div>
          </button>
        </div>

        @switch (view()) {
          @case ('announcements') {
            <app-announcement></app-announcement>
          }
          @case ('calendar') {
            <app-calendar></app-calendar>
          }
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
                          <div class="flex gap-1">
                            <a [href]="getSmsSafeUrl(student)" target="_blank" class="w-10 h-10 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center hover:bg-sky-600 hover:text-white transition-all" title="Send SMS">
                              <i class="fa-solid fa-comment-sms text-lg"></i>
                            </a>
                            <a [href]="getWhatsAppSafeUrl(student)" target="_blank" class="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all" title="Send WhatsApp">
                              <i class="fa-brands fa-whatsapp text-lg"></i>
                            </a>
                          </div>
                        }
                        <div class="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                        <button (click)="toggleStatus(student.id, 'Present')" [class]="getStatus(student.id) === 'Present' ? 'px-3 py-2 bg-indigo-600 text-white rounded-[0.9rem] shadow-lg font-black text-[10px]' : 'px-3 py-2 text-slate-400 font-bold text-[10px]'">P</button>
                        <button (click)="toggleStatus(student.id, 'Late')" [class]="getStatus(student.id) === 'Late' ? 'px-3 py-2 bg-amber-500 text-white rounded-[0.9rem] shadow-lg font-black text-[10px]' : 'px-3 py-2 text-slate-400 font-bold text-[10px]'">L</button>
                        <button (click)="toggleStatus(student.id, 'Absent')" [class]="getStatus(student.id) === 'Absent' ? 'px-3 py-2 bg-red-500 text-white rounded-[0.9rem] shadow-lg font-black text-[10px]' : 'px-3 py-2 text-slate-400 font-bold text-[10px]'">A</button>
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
                          <div class="flex items-center gap-1 mt-2">
                            @if(student.feeDue > 0) {
                              <div class="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                Due: {{ student.feeDue }}
                              </div>
                            } @else {
                              <div class="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                Paid
                              </div>
                            }
                            <button (click)="openPaymentModal(student)" class="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Record Payment">
                              <i class="fa-solid fa-file-invoice-dollar text-xs"></i>
                            </button>
                            <a [href]="getFeeReminderSafeUrl(student)" class="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Send SMS Reminder">
                              <i class="fa-solid fa-comment-sms text-xs"></i>
                            </a>
                            <a [href]="getFeeReminderWhatsAppSafeUrl(student)" target="_blank" class="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Send WhatsApp Reminder">
                              <i class="fa-brands fa-whatsapp text-xs"></i>
                            </a>
                          </div>
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

          @case ('reports') {
            <div class="animate-in fade-in zoom-in-95">
              <app-reports (onBack)="view.set('attendance')" />
            </div>
          }
          
          @case ('exams') {
            <div class="animate-in fade-in zoom-in-95">
              <app-exams />
            </div>
          }

          @case ('homework') {
            <div class="animate-in fade-in zoom-in-95">
              <app-homework />
            </div>
          }

          @case ('staff') {
            <div class="animate-in fade-in zoom-in-95">
              <app-staff />
            </div>
          }

          @case ('library') {
            <div class="animate-in fade-in zoom-in-95">
              <app-library />
            </div>
          }

          @case ('quiz') {
            <div class="animate-in fade-in zoom-in-95">
              <app-quiz />
            </div>
          }

          @case ('health') {
            <div class="animate-in fade-in zoom-in-95">
              <app-health />
            </div>
          }

          @case ('fees') {
            <div class="animate-in fade-in zoom-in-95">
              <app-fees />
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

      <!-- Payment Modal -->
    @if (showPaymentModal()) {
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in" (click)="showPaymentModal.set(false)">
        <div class="bg-white max-w-sm w-full rounded-[2rem] p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95" (click)="$event.stopPropagation()">
          <div class="text-center mb-6">
            <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i class="fa-solid fa-file-invoice-dollar text-2xl"></i>
            </div>
            <h3 class="text-xl font-bold text-slate-800">Record Payment</h3>
            <p class="text-slate-500 text-sm font-medium">{{ selectedStudentForPayment()?.name }}</p>
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Roll: {{ selectedStudentForPayment()?.rollNumber }}</p>
          </div>

          <div class="space-y-4">
            <div>
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Amount to Pay</label>
              <input type="number" [ngModel]="paymentAmount()" (ngModelChange)="paymentAmount.set($event)" placeholder="Enter Amount" class="w-full p-4 rounded-xl border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-lg font-bold text-center bg-slate-50">
            </div>

            @if (paymentModalError()) {
              <div class="p-3 bg-red-50 text-red-700 text-center rounded-lg text-sm font-semibold border border-red-200">
                {{ paymentModalError() }}
              </div>
            }

            <button (click)="savePayment()" [disabled]="!paymentAmount() || paymentAmount()! <= 0" class="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              <i class="fa-solid fa-check-circle"></i> Confirm Payment
            </button>
            <button (click)="showPaymentModal.set(false)" class="w-full py-3 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors">
              Cancel
            </button>
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
  teacher = this.attendanceService.activeTeacher;
  sanitizer = inject(DomSanitizer);
  isDarkMode = this.attendanceService.isDarkMode;
  isRtl = this.attendanceService.isRtl;

  // --- State ---
  view = signal<'dashboard' | 'profile' | 'attendance' | 'homework' | 'quiz' | 'health' | 'fees' | 'announcements' | 'calendar' | 'library' | 'staff'>('dashboard');
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
  
  // Payment Modal State
  showPaymentModal = signal(false);
  selectedStudentForPayment = signal<StudentWithFeeStatus | null>(null);
  paymentAmount = signal<number | null>(null);
  paymentModalError = signal('');

  studentForm = signal({
    name: '', roll: '', mobile: '',
    fatherName: '',
    totalFee: null as number | null, 
    className: '', section: ''
  });

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
  dailyRecords = signal<Map<string, 'Present' | 'Absent' | 'Late'>>(new Map());
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
      const newMap = new Map<string, 'Present' | 'Absent' | 'Late'>();
      
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

  async submitPinForSwitch() {
    const targetTeacher = this.targetTeacherForSwitch();
    const targetClass = this.targetClassForSwitch();
    if (!targetTeacher || !targetClass) return;

    // Yield to let the closing of modal and any transitions start
    await new Promise(r => setTimeout(r, 50));

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

  toggleStatus(studentId: string, status: 'Present' | 'Absent' | 'Late') {
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
    const records: { studentId: string, status: 'Present' | 'Absent' | 'Late' }[] = [];
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

  private buildWhatsAppUrl(student: any): string {
    const dateStr = new Date(this.selectedDate()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const message = `*ABSENCE ALERT*\n\nDear Parent,\nThis is to inform you that your child *${student.name}* (Roll: ${student.rollNumber}) was *ABSENT* from class today (${dateStr}).\n\nRegards,\n${this.teacher()?.name}\n${this.teacher()?.schoolName}`;
    
    const cleanNumber = student.mobileNumber.replace(/\D/g, '');
    // Ensure number has international format if possible, or just use as is
    const phone = cleanNumber.startsWith('0') ? '92' + cleanNumber.substring(1) : cleanNumber;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  getSmsSafeUrl(student: any): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(this.buildSmsUrl(student));
  }

  getWhatsAppSafeUrl(student: any): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(this.buildWhatsAppUrl(student));
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
  private buildFeeReminderSmsUrl(student: StudentWithFeeStatus): string {
    const message = `FEE REMINDER\n\nDear Parent,\nThis is a friendly reminder regarding the pending school fees for your child ${student.name} (Roll: ${student.rollNumber}).\n\nOutstanding Balance: ${student.feeDue}\n\nPlease clear the dues at your earliest convenience.\n\nRegards,\n${this.teacher()?.schoolName}`;
    const cleanNumber = student.mobileNumber.replace(/\D/g, '');
    return `sms:${cleanNumber}?body=${encodeURIComponent(message)}`;
  }

  private buildFeeReminderWhatsAppUrl(student: StudentWithFeeStatus): string {
    const message = `*FEE REMINDER*\n\nDear Parent,\nThis is a friendly reminder regarding the pending school fees for your child *${student.name}* (Roll: ${student.rollNumber}).\n\n*Outstanding Balance: ${student.feeDue}*\n\nPlease clear the dues at your earliest convenience.\n\nRegards,\n${this.teacher()?.schoolName}`;
    const cleanNumber = student.mobileNumber.replace(/\D/g, '');
    const phone = cleanNumber.startsWith('0') ? '92' + cleanNumber.substring(1) : cleanNumber;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  private buildPaymentConfirmationSmsUrl(student: StudentWithFeeStatus, amount: number): string {
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const message = `PAYMENT RECEIVED\n\nDear Parent,\nWe have received a payment of ${amount} for your child ${student.name} (Roll: ${student.rollNumber}) on ${dateStr}.\n\nRemaining Balance: ${student.feeDue - amount}\n\nThank you for your cooperation.\n\nRegards,\n${this.teacher()?.schoolName}`;
    const cleanNumber = student.mobileNumber.replace(/\D/g, '');
    return `sms:${cleanNumber}?body=${encodeURIComponent(message)}`;
  }

  private buildPaymentConfirmationWhatsAppUrl(student: StudentWithFeeStatus, amount: number): string {
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const message = `*PAYMENT RECEIVED*\n\nDear Parent,\nWe have received a payment of *${amount}* for your child *${student.name}* (Roll: ${student.rollNumber}) on ${dateStr}.\n\n*Remaining Balance: ${student.feeDue - amount}*\n\nThank you for your cooperation.\n\nRegards,\n${this.teacher()?.schoolName}`;
    const cleanNumber = student.mobileNumber.replace(/\D/g, '');
    const phone = cleanNumber.startsWith('0') ? '92' + cleanNumber.substring(1) : cleanNumber;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  getFeeReminderSafeUrl(student: StudentWithFeeStatus): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(this.buildFeeReminderSmsUrl(student));
  }

  getFeeReminderWhatsAppSafeUrl(student: StudentWithFeeStatus): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(this.buildFeeReminderWhatsAppUrl(student));
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

  openPaymentModal(student: StudentWithFeeStatus) {
    this.selectedStudentForPayment.set(student);
    this.paymentAmount.set(student.feeDue > 0 ? student.feeDue : null);
    this.paymentModalError.set('');
    this.showPaymentModal.set(true);
  }

  async savePayment() {
    const student = this.selectedStudentForPayment();
    const amount = this.paymentAmount();
    if (!student || !amount || amount <= 0) {
      this.paymentModalError.set('Please enter a valid payment amount.');
      return;
    }
    try {
      await this.attendanceService.recordFeePayment(student.id, amount);
      this.showToastWithMessage(`Payment of ${amount} recorded for ${student.name}.`);
      
      // Optionally send confirmation SMS or WhatsApp
      if (confirm(`Payment recorded! Would you like to send a confirmation message to the parent?`)) {
        const choice = confirm(`Click OK for SMS, Cancel for WhatsApp`);
        if (choice) {
          window.open(this.buildPaymentConfirmationSmsUrl(student, amount), '_blank');
        } else {
          window.open(this.buildPaymentConfirmationWhatsAppUrl(student, amount), '_blank');
        }
      }
      
      this.showPaymentModal.set(false);
    } catch (e: any) {
      this.paymentModalError.set(e.message);
    }
  }
}
