import { Component, inject, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AttendanceService, Quiz, Homework } from '../services/attendance.service';
import { SupabaseService } from '../services/supabase.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AnnouncementComponent } from './announcement.component';

@Component({
  selector: 'app-student-portal',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule, AnnouncementComponent],
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
            @if (isParent() && attendanceService.parentChildren().length > 1) {
              <div class="relative group">
                <button class="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                  <i class="fa-solid fa-children text-xl"></i>
                </button>
                <div class="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 hidden group-hover:block animate-in fade-in slide-in-from-top-2">
                  @for (child of attendanceService.parentChildren(); track child.id) {
                    <button (click)="switchChild(child.id)" 
                      [class]="student()?.id === child.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'"
                      class="w-full px-4 py-2 text-left text-sm font-bold transition-colors">
                      {{ child.name }}
                    </button>
                  }
                </div>
              </div>
            }
             <button (click)="attendanceService.toggleDarkMode()" [title]="isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode'" class="p-2.5 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors hidden sm:block">
               <i class="fa-solid" [class]="isDarkMode() ? 'fa-sun' : 'fa-moon'"></i>
             </button>
             <button (click)="attendanceService.toggleRtl()" [title]="isRtl() ? 'Switch to LTR' : 'Switch to RTL'" class="p-2.5 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors hidden sm:block">
               <i class="fa-solid fa-language"></i>
             </button>
            <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center border-2 border-blue-200">
              <i class="fa-solid fa-user"></i>
            </div>
            <button (click)="logout()" title="Logout" class="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors">
               <i class="fa-solid fa-right-from-bracket text-xl"></i>
            </button>
          </div>
        </div>
      </nav>

      <main class="max-w-4xl mx-auto p-4 md:p-8">
        <!-- Welcome Card -->
        <div class="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-6 text-white shadow-lg mb-8 relative overflow-hidden">
          <div class="relative z-10">
            <p class="text-purple-100 text-sm font-medium mb-1">Welcome Back,</p>
            <h2 class="text-2xl sm:text-3xl font-bold mb-2">{{ student()?.name }}</h2>
            <p class="text-purple-100 text-sm">Class: {{ student()?.className }} - {{ student()?.section }} | Roll No: {{ student()?.rollNumber }}</p>
          </div>
          <!-- Decorative circles -->
          <div class="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div class="absolute bottom-0 right-20 -mb-10 w-32 h-32 bg-white opacity-10 rounded-full blur-xl"></div>
        </div>

        <!-- Navigation Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
          <button (click)="activeTab.set('attendance')" class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center gap-3 hover:shadow-md transition-all group" [class.ring-2]="activeTab() === 'attendance'" [class.ring-indigo-500]="activeTab() === 'attendance'">
            <div class="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-clipboard-user"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-sm">Attendance</h3>
              <p class="text-[10px] text-slate-500 mt-0.5">{{ attendancePercentage() }}%</p>
            </div>
          </button>

          <button (click)="activeTab.set('fees')" class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center gap-3 hover:shadow-md transition-all group" [class.ring-2]="activeTab() === 'fees'" [class.ring-indigo-500]="activeTab() === 'fees'">
            <div class="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-wallet"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-sm">Fees</h3>
              <p class="text-[10px] text-slate-500 mt-0.5">Due: {{ student()?.feeDue }}</p>
            </div>
          </button>

          <button (click)="activeTab.set('homework')" class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center gap-3 hover:shadow-md transition-all group" [class.ring-2]="activeTab() === 'homework'" [class.ring-indigo-500]="activeTab() === 'homework'">
            <div class="w-14 h-14 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-book"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-sm">Homework</h3>
              <p class="text-[10px] text-slate-500 mt-0.5">Assignments</p>
            </div>
          </button>

          <button (click)="activeTab.set('quizzes')" class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center gap-3 hover:shadow-md transition-all group" [class.ring-2]="activeTab() === 'quizzes'" [class.ring-indigo-500]="activeTab() === 'quizzes'">
            <div class="w-14 h-14 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-brain"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-sm">Quizzes</h3>
              <p class="text-[10px] text-slate-500 mt-0.5">Online Tests</p>
            </div>
          </button>

          <button (click)="activeTab.set('progress')" class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center gap-3 hover:shadow-md transition-all group" [class.ring-2]="activeTab() === 'progress'" [class.ring-indigo-500]="activeTab() === 'progress'">
            <div class="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-chart-line"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-sm">Progress</h3>
              <p class="text-[10px] text-slate-500 mt-0.5">Results</p>
            </div>
          </button>

          <button (click)="activeTab.set('announcements')" class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center gap-3 hover:shadow-md transition-all group" [class.ring-2]="activeTab() === 'announcements'" [class.ring-indigo-500]="activeTab() === 'announcements'">
            <div class="w-14 h-14 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-bullhorn"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-sm">Announcements</h3>
              <p class="text-[10px] text-slate-500 mt-0.5">Updates</p>
            </div>
          </button>
        </div>

        @if (activeTab() === 'announcements') {
          <div class="animate-in fade-in slide-in-from-bottom-4">
            <app-announcement></app-announcement>
          </div>
        }

        @if (activeTab() === 'attendance') {
          <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Present</p>
                <p class="text-3xl font-black text-emerald-600">{{ attendanceStats().present }}</p>
              </div>
              <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Late</p>
                <p class="text-3xl font-black text-amber-500">{{ attendanceStats().late }}</p>
              </div>
              <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Absent</p>
                <p class="text-3xl font-black text-red-500">{{ attendanceStats().absent }}</p>
              </div>
            </div>

            <div class="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div class="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 class="font-black text-slate-800 uppercase tracking-widest text-sm">Recent History</h3>
                <span class="text-xs text-slate-400 font-bold">Last 30 Days</span>
              </div>
              <div class="divide-y divide-slate-50">
                @for (record of recentAttendance(); track record.id) {
                  <div class="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                        [class]="record.status === 'Present' ? 'bg-emerald-50 text-emerald-600' : record.status === 'Late' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'">
                        {{ record.status[0] }}
                      </div>
                      <div>
                        <p class="font-bold text-slate-700">{{ record.date | date: 'fullDate' }}</p>
                        <p class="text-[10px] font-black text-slate-300 uppercase tracking-widest">{{ record.status }}</p>
                      </div>
                    </div>
                    <i class="fa-solid fa-chevron-right text-slate-200 text-xs"></i>
                  </div>
                } @empty {
                  <div class="p-12 text-center text-slate-400 font-medium">
                    No attendance records found for this period.
                  </div>
                }
              </div>
            </div>
          </div>
        }

        @if (activeTab() === 'quizzes') {
          <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            @if (!isParent()) {
              <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h3 class="font-black text-slate-800 uppercase tracking-widest text-sm mb-4">Active Quizzes</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  @for (quiz of activeQuizzes(); track quiz.id) {
                    <div class="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex justify-between items-center">
                      <div>
                        <p class="font-bold text-slate-800">{{ quiz.title }}</p>
                        <p class="text-xs text-indigo-600">{{ getSubjectName(quiz.subject_id) }} • {{ quiz.duration_minutes }} mins</p>
                      </div>
                      <button (click)="startQuiz(quiz)" class="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm">
                        Start Quiz
                      </button>
                    </div>
                  } @empty {
                    <div class="col-span-full py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                      <i class="fa-solid fa-hourglass-empty text-slate-300 text-3xl mb-2"></i>
                      <p class="text-sm text-slate-400 italic">No active quizzes at the moment.</p>
                    </div>
                  }
                </div>
              </div>
            }

            <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 class="font-black text-slate-800 uppercase tracking-widest text-sm mb-4">Quiz Reports</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                @for (sub of quizSubmissions(); track sub.id) {
                  <button (click)="viewQuizReport(sub)" class="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-left hover:shadow-md hover:-translate-y-1 transition-all group">
                    <div class="flex justify-between items-start mb-4">
                      <div>
                        <span class="px-2 py-1 bg-indigo-100 text-indigo-600 text-[10px] font-black uppercase rounded-lg mb-2 inline-block">
                          {{ getSubjectName(getQuiz(sub.quiz_id)?.subject_id!) }}
                        </span>
                        <h4 class="font-black text-slate-800">{{ getQuiz(sub.quiz_id)?.title }}</h4>
                      </div>
                      <div class="text-right">
                        <p class="text-2xl font-black text-indigo-600">{{ sub.score }}/{{ sub.total_marks }}</p>
                        <p class="text-[10px] font-black text-slate-300 uppercase tracking-widest">Score</p>
                      </div>
                    </div>
                    <div class="flex justify-between items-center pt-4 border-t border-slate-100">
                      <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {{ sub.submitted_at | date:'mediumDate' }}
                      </span>
                      <span class="text-indigo-600 text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details <i class="fa-solid fa-arrow-right"></i>
                      </span>
                    </div>
                  </button>
                } @empty {
                  <div class="col-span-full p-8 text-center text-slate-400 font-medium">
                    No quiz reports available.
                  </div>
                }
              </div>
            </div>
          </div>
        }

        @if (activeTab() === 'homework') {
          <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            @if (!isParent()) {
              <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h3 class="font-black text-slate-800 uppercase tracking-widest text-sm mb-4">Pending Homework</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  @for (hw of pendingHomework(); track hw.id) {
                    <div class="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex justify-between items-center">
                      <div>
                        <p class="font-bold text-slate-800">{{ hw.title }}</p>
                        <p class="text-xs text-amber-600">{{ getSubjectName(hw.subject_id) }} • Due: {{ hw.dueDate | date }}</p>
                      </div>
                      <button (click)="openHomeworkModal(hw)" class="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-all">
                        Submit
                      </button>
                    </div>
                  } @empty {
                    <p class="text-sm text-slate-400 italic">No pending homework.</p>
                  }
                </div>
              </div>
            }

            <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 class="font-black text-slate-800 uppercase tracking-widest text-sm mb-4">Homework Reports</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                @for (sub of homeworkSubmissions(); track sub.id) {
                  <div class="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <div class="flex justify-between items-start mb-4">
                      <div>
                        <span class="px-2 py-1 bg-amber-100 text-amber-600 text-[10px] font-black uppercase rounded-lg mb-2 inline-block">
                          {{ getSubjectName(getHomework(sub.homework_id)?.subject_id!) }}
                        </span>
                        <h4 class="font-black text-slate-800">{{ getHomework(sub.homework_id)?.title }}</h4>
                      </div>
                      <div class="text-right">
                        <p class="text-2xl font-black text-amber-600">{{ sub.score || 0 }}/{{ sub.total_marks || 10 }}</p>
                        <p class="text-[10px] font-black text-slate-300 uppercase tracking-widest">Score</p>
                      </div>
                    </div>
                    <p class="text-xs text-slate-500 mb-4 line-clamp-2">{{ sub.content }}</p>
                    @if (sub.attachment_url) {
                      <div class="mb-4">
                        <a [href]="sub.attachment_url" target="_blank" class="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 transition-all">
                          <i class="fa-solid fa-paperclip"></i>
                          View Attachment
                        </a>
                      </div>
                    }
                    @if (sub.teacher_remarks) {
                      <div class="mb-4 p-2 bg-white rounded-lg border border-slate-100 text-[10px] italic text-slate-500">
                        Teacher's Remarks: {{ sub.teacher_remarks }}
                      </div>
                    }
                    <div class="flex justify-between items-center pt-4 border-t border-slate-100">
                      <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {{ sub.submitted_at | date:'mediumDate' }}
                      </span>
                      <span [class]="sub.marked ? 'text-emerald-600' : 'text-amber-500'" class="text-[10px] font-black uppercase tracking-widest">
                        {{ sub.marked ? 'Marked' : 'Pending' }}
                      </span>
                    </div>
                  </div>
                } @empty {
                  <div class="col-span-full p-8 text-center text-slate-400 font-medium">
                    No homework reports available.
                  </div>
                }
              </div>
            </div>
          </div>
        }

        @if (activeTab() === 'progress') {
          <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 class="font-black text-slate-800 uppercase tracking-widest text-sm mb-6">Daily Test Progress</h3>
              
              @for (subject of attendanceService.allSubjects(); track subject.id) {
                <div class="mb-8 last:mb-0">
                  <div class="flex justify-between items-center mb-4">
                    <h4 class="font-bold text-slate-700 flex items-center gap-2">
                      <span class="w-2 h-2 bg-blue-600 rounded-full"></span>
                      {{ subject.name }}
                    </h4>
                    <span class="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                      {{ getProgressForSubject(subject.id).length }} Tests
                    </span>
                  </div>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    @for (p of getProgressForSubject(subject.id); track p.id) {
                      <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                          <p class="text-sm font-bold text-slate-700">{{ p.marks }} / {{ p.total_marks }}</p>
                          <p class="text-[10px] text-slate-400">{{ p.date | date }}</p>
                        </div>
                        <div class="text-right">
                          <p class="text-xs font-black" [class]="getPercentageColor(p.marks, p.total_marks)">
                            {{ (p.marks / p.total_marks * 100) | number:'1.0-0' }}%
                          </p>
                          @if (p.remarks) {
                            <p class="text-[9px] text-slate-400 italic mt-1">{{ p.remarks }}</p>
                          }
                        </div>
                      </div>
                    } @empty {
                      <p class="text-xs text-slate-400 italic col-span-full">No test records for this subject.</p>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }

        @if (activeTab() === 'fees') {
          <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div class="text-center md:text-left">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Outstanding Balance</p>
                <p class="text-4xl font-black" [class]="student()?.feeDue > 0 ? 'text-red-500' : 'text-emerald-500'">
                  Rs. {{ student()?.feeDue }}
                </p>
                @if (student()?.feeDue > 0 && isParent()) {
                  <button (click)="openPayFeeModal()" class="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition">
                    Pay Fee
                  </button>
                }
              </div>
              <div class="flex flex-col gap-2 w-full md:w-auto">
                <div class="flex justify-between gap-8 text-sm font-bold">
                  <span class="text-slate-400">Total Fee:</span>
                  <span class="text-slate-700">Rs. {{ student()?.totalFee }}</span>
                </div>
                <div class="flex justify-between gap-8 text-sm font-bold">
                  <span class="text-slate-400">Total Paid:</span>
                  <span class="text-emerald-600">Rs. {{ student()?.feePaid }}</span>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div class="p-6 border-b border-slate-100">
                <h3 class="font-black text-slate-800 uppercase tracking-widest text-sm">Payment History</h3>
              </div>
              <div class="divide-y divide-slate-50">
                @for (payment of student()?.feeHistory; track payment.id || payment.date) {
                  <div class="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <i class="fa-solid fa-receipt"></i>
                      </div>
                      <div>
                        <p class="font-bold text-slate-700">Rs. {{ payment.amount }}</p>
                        <p class="text-[10px] font-black text-slate-300 uppercase tracking-widest">{{ payment.date | date: 'mediumDate' }}</p>
                      </div>
                    </div>
                    <span class="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-full">Success</span>
                  </div>
                } @empty {
                  <div class="p-12 text-center text-slate-400 font-medium">
                    No payment history found.
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </main>

      <!-- Homework Submission Modal -->
      @if (showHomeworkModal()) {
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div class="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div class="p-8 border-b border-slate-50 flex justify-between items-center bg-amber-50/50">
              <div>
                <h3 class="text-xl font-black text-slate-800 uppercase tracking-tight">Submit Homework</h3>
                <p class="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-1">
                  {{ selectedHomework()?.title }}
                </p>
              </div>
              <button (click)="showHomeworkModal.set(false)" class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form [formGroup]="homeworkForm" (ngSubmit)="submitHomework()" class="p-8 space-y-6">
              <div class="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 mb-6">
                <h4 class="text-xs font-black text-amber-800 uppercase tracking-widest mb-1">Teacher's Instructions:</h4>
                <p class="text-sm font-medium text-slate-700 whitespace-pre-wrap">{{ selectedHomework()?.description }}</p>
                <div class="mt-3 flex items-center gap-2">
                   <span class="px-2 py-1 bg-white text-amber-600 border border-amber-200 text-[10px] font-black uppercase rounded-lg">
                    {{ getSubjectName(selectedHomework()?.subject_id || '') }}
                  </span>
                  <span class="text-xs text-slate-500 font-medium">Due: {{ selectedHomework()?.dueDate | date }}</span>
                </div>
              </div>

              <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Homework Content / Answer</label>
                <textarea formControlName="content" rows="6" 
                  class="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-3xl focus:border-amber-500 focus:bg-white outline-none transition-all text-sm font-bold text-slate-700 placeholder:text-slate-300"
                  placeholder="Type your homework here..."></textarea>
              </div>

              <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Attachments (Pictures/PDF)</label>
                <div class="relative">
                  <input type="file" (change)="onFileSelected($event)" accept="image/*,.pdf" class="hidden" #fileInput>
                  <button type="button" (click)="fileInput.click()" 
                    class="w-full px-6 py-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl hover:border-amber-500 hover:bg-amber-50 transition-all flex items-center justify-center gap-3 text-slate-500">
                    <i class="fa-solid fa-cloud-arrow-up text-xl"></i>
                    <span class="text-sm font-bold">{{ selectedFile() ? selectedFile()?.name : 'Choose file or drag & drop' }}</span>
                  </button>
                </div>
                <p class="text-[9px] text-slate-400 mt-2 ml-1 italic">Supported: JPG, PNG, PDF (Max 5MB)</p>
              </div>

              <button type="submit" [disabled]="homeworkForm.invalid || isUploading()"
                class="w-full py-4 bg-amber-500 text-white rounded-[1.75rem] font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2">
                @if (isUploading()) {
                  <i class="fa-solid fa-circle-notch animate-spin"></i>
                  Uploading...
                } @else {
                  Submit Homework
                }
              </button>
            </form>
          </div>
        </div>
      }

      <!-- Quiz Taking Modal -->
      @if (showQuizModal()) {
        <div class="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[110] flex items-center justify-center p-4 sm:p-6">
          <div class="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <!-- Quiz Header -->
            <div class="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 shrink-0">
              <div>
                <div class="flex items-center gap-3 mb-2">
                  <div class="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <i class="fa-solid fa-stopwatch"></i>
                  </div>
                  <h3 class="text-xl font-black text-slate-800 tracking-tight">{{ selectedQuiz()?.title }}</h3>
                </div>
                <p class="text-xs font-bold text-slate-500 flex items-center gap-2">
                  <span class="bg-slate-200 px-2 py-1 rounded-md">{{ getSubjectName(selectedQuiz()?.subject_id!) }}</span>
                  <span>Question {{ currentQuestionIndex() + 1 }} of {{ selectedQuiz()?.questions?.length }}</span>
                </p>
              </div>
              <div class="flex items-center gap-3 self-stretch">
                <div class="flex-1 sm:flex-none px-5 py-3 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-4 shadow-sm">
                  <div class="p-2 bg-red-100 rounded-xl text-red-600 animate-pulse">
                    <i class="fa-solid fa-clock"></i>
                  </div>
                  <div>
                    <p class="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">Time Remaining</p>
                    <p class="text-xl font-black text-red-600 tabular-nums leading-none">{{ formatTime(timeLeft()) }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quiz Progress Bar -->
            <div class="h-1.5 w-full bg-slate-100 shrink-0">
              <div class="h-full bg-indigo-600 transition-all duration-300"
                   [style.width]="((currentQuestionIndex() + 1) / (selectedQuiz()?.questions?.length || 1) * 100) + '%'">
              </div>
            </div>

            <!-- Quiz Content -->
            <div class="p-6 sm:p-8 overflow-y-auto flex-1">
              @if (selectedQuiz()?.questions && selectedQuiz()?.questions![currentQuestionIndex()]) {
                @let q = selectedQuiz()?.questions![currentQuestionIndex()];
                <div class="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div class="flex items-start gap-4">
                    <span class="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg shrink-0 border border-indigo-100">
                      {{ currentQuestionIndex() + 1 }}
                    </span>
                    <h4 class="text-xl font-bold text-slate-800 pt-1 leading-relaxed">{{ q.question }}</h4>
                  </div>

                  <div class="grid grid-cols-1 gap-3 pl-0 sm:pl-14">
                    @for (opt of q.options; track $index; let i = $index) {
                      <button (click)="selectOption(opt)"
                        [class]="selectedAnswers()[currentQuestionIndex()] === opt ? 'bg-indigo-50 text-indigo-700 border-indigo-600 shadow-md transform scale-[1.01] ring-1 ring-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-slate-50'"
                        class="w-full p-4 rounded-2xl border-2 text-left font-bold transition-all duration-200 flex items-center justify-between gap-4 group">
                        
                        <div class="flex items-center gap-4">
                          <span [class]="selectedAnswers()[currentQuestionIndex()] === opt ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 group-hover:border-indigo-400 text-slate-500'"
                                class="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm transition-colors">
                            {{ ['A', 'B', 'C', 'D'][i] }}
                          </span>
                          <span class="text-lg">{{ opt }}</span>
                        </div>

                        @if (selectedAnswers()[currentQuestionIndex()] === opt) {
                          <div class="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-check text-xs"></i>
                          </div>
                        }
                      </button>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Quiz Footer -->
            <div class="p-6 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
              <button (click)="prevQuestion()" [disabled]="currentQuestionIndex() === 0"
                class="px-6 py-3 rounded-2xl font-bold flex items-center gap-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all">
                <i class="fa-solid fa-arrow-left"></i>
                Previous
              </button>
              
              <div class="hidden sm:flex gap-1.5 items-center">
                @for (q of selectedQuiz()?.questions; track $index) {
                  <div [class]="currentQuestionIndex() === $index ? 'bg-indigo-600 w-6' : (selectedAnswers()[$index] ? 'bg-indigo-200 w-2' : 'bg-slate-200 w-2')"
                    class="h-2 rounded-full transition-all duration-300"></div>
                }
              </div>

              @if (currentQuestionIndex() === (selectedQuiz()?.questions?.length || 0) - 1) {
                <button (click)="submitQuiz()" [disabled]="isSubmittingQuiz()"
                  class="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center gap-2 group disabled:opacity-50">
                  @if (isSubmittingQuiz()) {
                    <i class="fa-solid fa-circle-notch fa-spin"></i>
                    Submitting...
                  } @else {
                    Finish & Submit
                    <i class="fa-solid fa-check-circle group-hover:scale-110 transition-transform"></i>
                  }
                </button>
              } @else {
                <button (click)="nextQuestion()"
                  class="px-8 py-3 bg-slate-800 text-white rounded-2xl font-black shadow-lg shadow-slate-200 hover:bg-slate-900 transition-all flex items-center gap-2 group">
                  Next
                  <i class="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                </button>
              }
            </div>
          </div>
        </div>
      }

      <!-- Quiz Report Details Modal -->
      @if (showQuizReportModal() && selectedQuizReport()) {
        <div class="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[110] flex items-center justify-center p-4 sm:p-6">
          <div class="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-lg">
                  <i class="fa-solid fa-clipboard-check"></i>
                </div>
                <div>
                  <h3 class="text-xl font-black text-slate-800 tracking-tight">{{ getQuiz(selectedQuizReport()?.quiz_id!)?.title }} Results</h3>
                  <p class="text-xs font-bold text-slate-500">Score: <span class="text-indigo-600">{{ selectedQuizReport()?.score }} / {{ selectedQuizReport()?.total_marks }}</span></p>
                </div>
              </div>
              <button (click)="closeQuizReportModal()" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition-colors">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <div class="p-6 overflow-y-auto flex-1 space-y-6">
              @for (q of getQuiz(selectedQuizReport()?.quiz_id!)?.questions; track $index) {
                <div class="p-5 rounded-2xl border" 
                     [class]="selectedQuizReport()?.answers[$index] === q.correct_answer ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'">
                  <div class="flex gap-4 items-start mb-4">
                    <div class="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-black text-white mt-0.5"
                         [class]="selectedQuizReport()?.answers[$index] === q.correct_answer ? 'bg-emerald-500' : 'bg-red-500'">
                      @if (selectedQuizReport()?.answers[$index] === q.correct_answer) {
                        <i class="fa-solid fa-check"></i>
                      } @else {
                        <i class="fa-solid fa-xmark"></i>
                      }
                    </div>
                    <h4 class="font-bold text-slate-800 leading-relaxed">{{ $index + 1 }}. {{ q.question }}</h4>
                  </div>
                  
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-10">
                    @for (opt of q.options; track opt) {
                      <div class="px-4 py-3 rounded-xl border text-sm font-medium flex items-center justify-between"
                           [class]="opt === q.correct_answer ? 'bg-emerald-100 border-emerald-200 text-emerald-800 ring-2 ring-emerald-500' : 
                                   (opt === selectedQuizReport()?.answers[$index] && opt !== q.correct_answer ? 'bg-red-100 border-red-200 text-red-800' : 'bg-white border-slate-200 text-slate-600')">
                        <span>{{ opt }}</span>
                        @if (opt === q.correct_answer) {
                          <i class="fa-solid fa-check-circle text-emerald-600"></i>
                        } @else if (opt === selectedQuizReport()?.answers[$index]) {
                          <i class="fa-solid fa-times-circle text-red-600"></i>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Pay Fee Modal -->
      @if (showPayFeeModal()) {
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl">
            <h3 class="text-xl font-bold mb-4">Pay School Fee</h3>
            
            <div class="bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-200">
              <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">School Bank Account</p>
              @if (attendanceService.schoolAccountDetails()) {
                <p class="text-sm"><strong>Account Name:</strong> {{ attendanceService.schoolAccountDetails()?.accountName }}</p>
                <p class="text-sm"><strong>Account No:</strong> {{ attendanceService.schoolAccountDetails()?.accountNumber }}</p>
                <p class="text-sm"><strong>Bank Name:</strong> {{ attendanceService.schoolAccountDetails()?.bankName }}</p>
              } @else {
                <p class="text-sm text-slate-500">School account details not provided yet. Please contact the teacher.</p>
              }
            </div>

            <div class="space-y-4">
              <input type="text" [(ngModel)]="parentAccountName" placeholder="Your Account Name" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
              <input type="text" [(ngModel)]="parentAccountNumber" placeholder="Your Account Number" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
              <input type="text" [(ngModel)]="transactionId" placeholder="Transaction ID (Proof)" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
            </div>

            <div class="mt-6 flex gap-3">
              <button (click)="showPayFeeModal.set(false)" class="flex-1 px-4 py-2 border border-slate-200 rounded-xl font-bold hover:bg-slate-50">Cancel</button>
              <button (click)="submitFeePayment()" [disabled]="!parentAccountName || !parentAccountNumber || !transactionId || !attendanceService.schoolAccountDetails()" class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50 hover:bg-indigo-700">Submit Details</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentPortalComponent {
  attendanceService = inject(AttendanceService);
  supabaseService = inject(SupabaseService);
  fb = inject(FormBuilder);

  isDarkMode = this.attendanceService.isDarkMode;
  isRtl = this.attendanceService.isRtl;

  activeTab = signal('attendance');
  student = computed(() => {
    const s = this.attendanceService.activeStudent();
    if (!s) return null;
    const feePaid = s.feeHistory.reduce((acc, p) => acc + p.amount, 0);
    const feeDue = s.totalFee - feePaid;
    return { ...s, feePaid, feeDue };
  });
  isParent = computed(() => this.attendanceService.activeUserRole() === 'parent');

  // Homework Submission
  showHomeworkModal = signal(false);
  selectedHomework = signal<Homework | null>(null);
  selectedFile = signal<File | null>(null);
  isUploading = signal(false);
  homeworkForm: FormGroup;

  // Quiz Taking
  showQuizModal = signal(false);
  selectedQuiz = signal<Quiz | null>(null);
  currentQuestionIndex = signal(0);
  selectedAnswers = signal<string[]>([]);
  timeLeft = signal(0);
  timerInterval: any;
  isSubmittingQuiz = signal(false);

  // Quiz Reports
  showQuizReportModal = signal(false);
  selectedQuizReport = signal<any | null>(null);

  constructor() {
    this.homeworkForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(10)]]
    });

    effect(() => {
      if (this.timeLeft() === 0 && this.showQuizModal()) {
        this.submitQuiz();
      }
    });
  }

  attendanceRecords = computed(() => {
    const s = this.student();
    if (!s) return [];
    return this.attendanceService.allSchoolAttendance().filter(r => r.studentId === s.id);
  });

  recentAttendance = computed(() => {
    return [...this.attendanceRecords()].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ).slice(0, 30);
  });

  attendanceStats = computed(() => {
    const records = this.attendanceRecords();
    return {
      present: records.filter(r => r.status === 'Present').length,
      late: records.filter(r => r.status === 'Late').length,
      absent: records.filter(r => r.status === 'Absent').length,
      total: records.length
    };
  });

  attendancePercentage = computed(() => {
    const stats = this.attendanceStats();
    if (stats.total === 0) return 100;
    return Math.round(((stats.present + (stats.late * 0.5)) / stats.total) * 100);
  });

  quizSubmissions = computed(() => {
    const s = this.student();
    if (!s) return [];
    return this.attendanceService.allQuizSubmissions()
      .filter(sub => sub.student_id === s.id)
      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
  });

  homeworkSubmissions = computed(() => {
    const s = this.student();
    if (!s) return [];
    return this.attendanceService.allHomeworkSubmissions()
      .filter(sub => sub.student_id === s.id)
      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
  });

  showPayFeeModal = signal(false);
  parentAccountName = '';
  parentAccountNumber = '';
  transactionId = '';

  openPayFeeModal() {
    this.parentAccountName = '';
    this.parentAccountNumber = '';
    this.transactionId = '';
    this.showPayFeeModal.set(true);
  }

  submitFeePayment() {
    const s = this.student();
    if (!s) return;
    this.attendanceService.submitFeeRequest({
      id: Date.now().toString(),
      school_id: s.school_id,
      student_id: s.id,
      parentAccountName: this.parentAccountName,
      parentAccountNumber: this.parentAccountNumber,
      transactionId: this.transactionId,
      status: 'pending',
      amount: s.feeDue,
      date: new Date().toISOString()
    });
    this.attendanceService.showToast('Fee payment details submitted for review.', 'success');
    this.showPayFeeModal.set(false);
  }

  activeQuizzes = computed(() => {
    const submissions = this.quizSubmissions();
    const submittedQuizIds = new Set(submissions.map(s => s.quiz_id));
    return this.attendanceService.allQuizzes().filter(q => !submittedQuizIds.has(q.id));
  });

  pendingHomework = computed(() => {
    const submissions = this.homeworkSubmissions();
    const submittedHwIds = new Set(submissions.map(s => s.homework_id));
    return this.attendanceService.allHomeworks().filter(h => !submittedHwIds.has(h.id));
  });

  getSubjectName(id: string) {
    return this.attendanceService.allSubjects().find(s => s.id === id)?.name || 'Unknown';
  }

  getQuiz(id: string) {
    return this.attendanceService.allQuizzes().find(q => q.id === id);
  }

  getHomework(id: string) {
    return this.attendanceService.allHomeworks().find(h => h.id === id);
  }

  getProgressForSubject(subjectId: string) {
    const s = this.student();
    if (!s) return [];
    return this.attendanceService.allExamProgress()
      .filter(p => p.student_id === s.id && p.subject_id === subjectId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getPercentageColor(marks: number, total: number) {
    const p = (marks / total) * 100;
    if (p >= 80) return 'text-emerald-600';
    if (p >= 50) return 'text-blue-600';
    return 'text-rose-600';
  }

  startQuiz(quiz: Quiz) {
    this.selectedQuiz.set(quiz);
    this.currentQuestionIndex.set(0);
    this.selectedAnswers.set(new Array(quiz.questions.length).fill(''));
    this.timeLeft.set(quiz.duration_minutes * 60);
    this.showQuizModal.set(true);
    
    this.timerInterval = setInterval(() => {
      this.timeLeft.update(t => t > 0 ? t - 1 : 0);
    }, 1000);
  }

  formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  selectOption(opt: string) {
    const answers = [...this.selectedAnswers()];
    answers[this.currentQuestionIndex()] = opt;
    this.selectedAnswers.set(answers);
  }

  nextQuestion() {
    if (this.currentQuestionIndex() < (this.selectedQuiz()?.questions.length || 0) - 1) {
      this.currentQuestionIndex.update(i => i + 1);
    }
  }

  prevQuestion() {
    if (this.currentQuestionIndex() > 0) {
      this.currentQuestionIndex.update(i => i - 1);
    }
  }

  async submitQuiz() {
    clearInterval(this.timerInterval);
    const quiz = this.selectedQuiz();
    const student = this.student();
    if (!quiz || !student || this.isSubmittingQuiz()) return;

    this.isSubmittingQuiz.set(true);

    try {
      let score = 0;
      quiz.questions.forEach((q, i) => {
        if (this.selectedAnswers()[i] === q.correct_answer) {
          score++;
        }
      });

      await this.attendanceService.submitQuiz({
        quiz_id: quiz.id,
        student_id: student.id,
        answers: this.selectedAnswers(),
        score: score,
        total_marks: quiz.questions.length,
        submitted_at: new Date().toISOString(),
        marked: true
      });

      this.showQuizModal.set(false);
      this.selectedQuiz.set(null);
      this.attendanceService.showToast('Quiz submitted successfully!', 'success');
    } catch (e) {
      console.error('Quiz submission error', e);
      // Even if it failed, they finished the quiz time. 
      // This protects against them repeatedly trying to submit the same finished quiz and racking up 500s.
      this.showQuizModal.set(false);
      this.selectedQuiz.set(null); 
    } finally {
      this.isSubmittingQuiz.set(false);
    }
  }

  openHomeworkModal(hw: Homework) {
    this.selectedHomework.set(hw);
    this.selectedFile.set(null);
    this.homeworkForm.reset();
    this.showHomeworkModal.set(true);
  }

  viewQuizReport(sub: any) {
    this.selectedQuizReport.set(sub);
    this.showQuizReportModal.set(true);
  }

  closeQuizReportModal() {
    this.showQuizReportModal.set(false);
    this.selectedQuizReport.set(null);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit.');
        return;
      }
      this.selectedFile.set(file);
    }
  }

  async submitHomework() {
    const hw = this.selectedHomework();
    const student = this.student();
    if (!hw || !student || (this.homeworkForm.invalid && !this.selectedFile())) return;

    this.isUploading.set(true);
    try {
      let attachmentUrl = '';
      if (this.selectedFile()) {
        attachmentUrl = await this.attendanceService.uploadAttachment(this.selectedFile()!);
      }

      await this.attendanceService.submitHomework({
        homework_id: hw.id,
        student_id: student.id,
        content: this.homeworkForm.value.content || '',
        attachment_url: attachmentUrl,
        submitted_at: new Date().toISOString(),
        marked: false
      });

      this.showHomeworkModal.set(false);
      this.selectedHomework.set(null);
      this.selectedFile.set(null);
    } catch (error) {
      console.error('Error submitting homework:', error);
      alert('Failed to submit homework. Please try again.');
    } finally {
      this.isUploading.set(false);
    }
  }

  logout() {
    this.attendanceService.pinLogout();
  }

  switchChild(childId: string) {
    this.attendanceService.setActiveUser(childId, 'parent');
  }
}
