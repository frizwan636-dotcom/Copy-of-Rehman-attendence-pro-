import { Component, inject, signal, effect, ViewChild, ElementRef, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, Teacher, DailySubmission } from '../services/attendance.service';
import { PdfService } from '../services/pdf.service';
import { CsvService } from '../services/csv.service';
import { DocService } from '../services/doc.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-coordinator-dashboard',
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="min-h-screen pb-24 bg-slate-50/50">
      <nav class="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-4 shadow-sm">
        <div class="max-w-5xl mx-auto flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-200">
              <i class="fa-solid fa-sitemap"></i>
            </div>
            <div>
              <h1 class="text-lg font-black text-slate-800 tracking-tight leading-none">Coordinator Panel</h1>
              <p class="text-[10px] text-green-600 font-bold uppercase tracking-widest mt-1">
                {{ coordinator()?.name }}
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

            <button (click)="attendanceService.pinLogout()" title="Switch User" class="p-2.5 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors">
              <i class="fa-solid fa-users"></i>
            </button>
            <button (click)="attendanceService.logout()" title="Logout" class="p-2.5 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors">
              <i class="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        </div>
      </nav>

      <main class="max-w-4xl mx-auto p-4 md:p-8">
        @if (attendanceService.isOnline()) {
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <button (click)="view.set('attendance')" 
              class="p-6 rounded-[2rem] transition-all flex flex-col items-center gap-3"
              [class]="view() === 'attendance' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'bg-white text-slate-600 hover:bg-indigo-50 border'">
              <i class="fa-solid fa-user-check text-xl" [class]="view() === 'attendance' ? 'text-white' : 'text-indigo-500'"></i>
              <span class="text-xs font-black uppercase tracking-widest">Staff Attendance</span>
            </button>
            <button (click)="view.set('teachers')" 
              class="p-6 rounded-[2rem] transition-all flex flex-col items-center gap-3"
              [class]="view() === 'teachers' ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'bg-white text-slate-600 hover:bg-blue-50 border'">
              <i class="fa-solid fa-users-gear text-xl" [class]="view() === 'teachers' ? 'text-white' : 'text-blue-500'"></i>
              <span class="text-xs font-black uppercase tracking-widest">Manage Teachers</span>
            </button>
            <button (click)="view.set('security')" 
              class="p-6 rounded-[2rem] transition-all flex flex-col items-center gap-3"
              [class]="view() === 'security' ? 'bg-orange-600 text-white shadow-xl shadow-orange-200' : 'bg-white text-slate-600 hover:bg-orange-50 border'">
              <i class="fa-solid fa-shield-halved text-xl" [class]="view() === 'security' ? 'text-white' : 'text-orange-500'"></i>
              <span class="text-xs font-black uppercase tracking-widest">Security</span>
            </button>
             <button (click)="view.set('summary')" 
              class="p-6 rounded-[2rem] transition-all flex flex-col items-center gap-3"
              [class]="view() === 'summary' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200' : 'bg-white text-slate-600 hover:bg-emerald-50 border'">
              <i class="fa-solid fa-chart-line text-xl" [class]="view() === 'summary' ? 'text-white' : 'text-emerald-500'"></i>
              <span class="text-xs font-black uppercase tracking-widest">Daily Summary</span>
            </button>
            <button (click)="view.set('meetings')" 
              class="p-6 rounded-[2rem] transition-all flex flex-col items-center gap-3"
              [class]="view() === 'meetings' ? 'bg-purple-600 text-white shadow-xl shadow-purple-200' : 'bg-white text-slate-600 hover:bg-purple-50 border'">
              <i class="fa-solid fa-calendar-check text-xl" [class]="view() === 'meetings' ? 'text-white' : 'text-purple-500'"></i>
              <span class="text-xs font-black uppercase tracking-widest">Meetings</span>
            </button>
            <button (click)="view.set('reports')" 
              class="p-6 rounded-[2rem] transition-all flex flex-col items-center gap-3"
              [class]="view() === 'reports' ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'bg-white text-slate-600 hover:bg-slate-50 border'">
              <i class="fa-solid fa-file-export text-xl" [class]="view() === 'reports' ? 'text-white' : 'text-slate-500'"></i>
              <span class="text-xs font-black uppercase tracking-widest">Staff Reports</span>
            </button>
          </div>

          @if (errorMessage()) {
            <div class="mb-6 p-4 bg-red-50 text-red-700 text-center rounded-lg text-sm font-semibold border border-red-200">
              {{ errorMessage() }}
            </div>
          }

          @switch (view()) {
            @case ('attendance') {
              <div class="space-y-6 animate-in fade-in">
                <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h2 class="text-2xl font-black text-slate-800 tracking-tight">Staff Roll Call</h2>
                    <p class="text-slate-500 text-sm font-medium">Marking teacher attendance for today</p>
                  </div>
                  <input type="date" [ngModel]="selectedDate()" (ngModelChange)="selectedDate.set($event)" class="bg-slate-50 px-4 py-3 rounded-2xl border font-bold text-slate-700 outline-none text-sm">
                </div>
                <div class="space-y-3">
                  @for (teacher of teachers(); track teacher.id) {
                    @if (teacher.id !== coordinator()?.id) {
                      <div class="bg-white p-4 rounded-3xl border shadow-sm flex items-center justify-between">
                        <div class="flex items-center gap-4">
                           <div class="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center border-2 border-white shadow-sm text-indigo-200">
                              <i class="fa-solid fa-user-tie text-2xl"></i>
                          </div>
                          <div>
                            <h4 class="font-bold text-slate-800">{{ teacher.name }}</h4>
                            <span class="text-xs text-slate-400">{{ teacher.className || 'N/A' }} - {{ teacher.section || 'N/A' }}</span>
                          </div>
                        </div>
                        <div class="flex items-center gap-2">
                          <div class="flex bg-slate-100 p-1 rounded-2xl border">
                            <button (click)="toggleStatus(teacher.id, 'Present')" [class]="getStatus(teacher.id) === 'Present' ? 'px-4 py-2 bg-indigo-600 text-white rounded-xl shadow font-black text-[10px]' : 'px-4 py-2 text-slate-400 font-bold text-[10px]'">P</button>
                            <button (click)="toggleStatus(teacher.id, 'Absent')" [class]="getStatus(teacher.id) === 'Absent' ? 'px-4 py-2 bg-red-500 text-white rounded-xl shadow font-black text-[10px]' : 'px-4 py-2 text-slate-400 font-bold text-[10px]'">A</button>
                          </div>
                        </div>
                      </div>
                    }
                  }
                </div>
                <div class="bg-white/80 backdrop-blur-md p-4 rounded-[2.5rem] border shadow-2xl flex sticky bottom-6 z-40">
                  <button (click)="saveAttendance()" class="flex-1 py-5 bg-slate-900 text-white rounded-[1.75rem] font-black shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                    <i class="fa-solid fa-check-double text-indigo-400"></i> Save Staff Attendance
                  </button>
                </div>
              </div>
            }
            @case ('teachers') {
              <div class="space-y-6 animate-in fade-in">
                <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border space-y-4">
                  <h2 class="text-2xl font-black tracking-tight text-slate-800">Create Teacher Account</h2>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="text" [ngModel]="newTeacherName()" (ngModelChange)="newTeacherName.set($event)" placeholder="Full Name *" class="sm:col-span-2 p-3 bg-slate-50 rounded-xl border outline-none text-sm">
                    <input type="email" [ngModel]="newTeacherEmail()" (ngModelChange)="newTeacherEmail.set($event)" placeholder="Email Address (Optional)" class="sm:col-span-2 p-3 bg-slate-50 rounded-xl border outline-none text-sm">
                    <input type="tel" [ngModel]="newTeacherMobile()" (ngModelChange)="newTeacherMobile.set($event)" placeholder="Contact Mobile *" class="sm:col-span-2 p-3 bg-slate-50 rounded-xl border outline-none text-sm">
                    <input type="text" [ngModel]="newTeacherClass()" (ngModelChange)="newTeacherClass.set($event)" placeholder="Class *" class="p-3 bg-slate-50 rounded-xl border outline-none text-sm">
                    <input type="text" [ngModel]="newTeacherSection()" (ngModelChange)="newTeacherSection.set($event)" placeholder="Section *" class="p-3 bg-slate-50 rounded-xl border outline-none text-sm">
                    <input type="password" maxlength="4" inputmode="numeric" pattern="[0-9]*" [ngModel]="newTeacherPin()" (ngModelChange)="newTeacherPin.set($event)" placeholder="4-Digit PIN *" class="sm:col-span-2 p-3 bg-slate-50 rounded-xl border outline-none text-sm">
                  </div>
                  <button (click)="addTeacher()" [disabled]="!newTeacherName().trim() || !newTeacherMobile().trim() || newTeacherPin().length < 4 || !newTeacherClass().trim() || !newTeacherSection().trim()" class="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50">
                    <i class="fa-solid fa-user-plus mr-2"></i>Add Teacher Profile
                  </button>
                </div>
                <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border space-y-3">
                  <h2 class="text-2xl font-black tracking-tight text-slate-800">Registered Teachers ({{ teachers().length - 1 }})</h2>
                  @for (teacher of teachers(); track teacher.id) {
                    @if(teacher.id !== coordinator()?.id) {
                      <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border">
                        <div class="flex items-center gap-3">
                          <div class="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-slate-300 border shadow-sm">
                            <i class="fa-solid fa-user-tie"></i>
                          </div>
                          <div>
                            <p class="font-bold text-slate-700">{{ teacher.name }}</p>
                            <div class="flex items-center gap-4">
                              <p class="text-xs text-slate-500">{{ teacher.className }} - {{ teacher.section }}</p>
                              <p class="text-xs font-mono font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">PIN: {{ teacher.pin }}</p>
                            </div>
                          </div>
                        </div>
                        <div class="flex items-center gap-2">
                          <button (click)="sendMeetingReminder(teacher)"
                                  [disabled]="!isMeetingScheduled()"
                                  title="Send Meeting Reminder"
                                  class="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                            <i class="fa-solid fa-paper-plane"></i>
                          </button>
                          <button (click)="openEditModal(teacher)" class="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                            <i class="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button (click)="removeTeacher(teacher.id)" class="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                            <i class="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </div>
                    }
                  }
                </div>
              </div>
            }
            @case('security') {
              <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border space-y-6 animate-in fade-in">
                  <div>
                      <h2 class="text-2xl font-black text-slate-800 tracking-tight">Teacher Portal Security</h2>
                      <p class="text-slate-500 text-sm font-medium">Set the PIN teachers will use to connect to your school.</p>
                  </div>

                   <div class="space-y-2">
                      <label class="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">School PIN (Share with Teachers)</label>
                      <input type="text" [ngModel]="schoolPinForm()" (ngModelChange)="schoolPinForm.set($event)" placeholder="e.g., 12345" class="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none text-sm font-medium">
                      <p class="text-xs text-slate-400 ml-2 mt-1">Teachers will enter this PIN to connect to your school portal.</p>
                  </div>
                  
                  <button (click)="saveSecuritySettings()" [disabled]="!schoolPinForm().trim()" class="w-full py-4 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 disabled:opacity-50 transition-all">
                      <i class="fa-solid fa-save mr-2"></i> Save School PIN
                  </button>
              </div>
            }
            @case('summary') {
              <div class="space-y-6 animate-in fade-in">
                <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border space-y-4">
                  <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h2 class="text-2xl font-black text-slate-800 tracking-tight">School-Wide Daily Summary</h2>
                      <p class="text-slate-500 text-sm font-medium">Live attendance status from all classes</p>
                    </div>
                    <input type="date" [ngModel]="summaryDate()" (ngModelChange)="summaryDate.set($event)" class="bg-slate-50 px-4 py-3 rounded-2xl border font-bold text-slate-700 outline-none text-sm">
                  </div>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                      <div class="p-4 bg-blue-50 rounded-2xl text-center">
                        <p class="text-xs font-black uppercase text-blue-400">Total Students</p>
                        <p class="text-3xl font-black text-blue-800">{{ dailySummary().schoolTotalStudents }}</p>
                      </div>
                      <div class="p-4 bg-green-50 rounded-2xl text-center">
                        <p class="text-xs font-black uppercase text-green-400">Total Present</p>
                        <p class="text-3xl font-black text-green-800">{{ dailySummary().schoolTotalPresent }}</p>
                      </div>
                      <div class="p-4 bg-red-50 rounded-2xl text-center">
                        <p class="text-xs font-black uppercase text-red-400">Total Absent</p>
                        <p class="text-3xl font-black text-red-800">{{ dailySummary().schoolTotalAbsent }}</p>
                      </div>
                      <div class="p-4 bg-indigo-50 rounded-2xl text-center">
                        <p class="text-xs font-black uppercase text-indigo-400">Present %</p>
                        <p class="text-3xl font-black text-indigo-800">{{ dailySummary().schoolPresentPercentage }}%</p>
                      </div>
                  </div>
                   <button (click)="exportDailySummary()" [disabled]="dailySummary().submissions.length === 0" class="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                      <i class="fa-solid fa-download"></i> Export Daily School Report
                   </button>
                </div>

                <div class="space-y-3">
                  @for(summary of dailySummary().summaryList; track summary.teacherId) {
                    <div class="p-4 rounded-3xl border" [class]="summary.status === 'Submitted' ? 'bg-green-50 border-green-200' : 'bg-slate-100 border-slate-200'">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="font-black text-lg" [class]="summary.status === 'Submitted' ? 'text-green-900' : 'text-slate-800'">
                            Class {{ summary.className }} - {{ summary.section }}
                          </p>
                          <p class="text-xs font-bold" [class]="summary.status === 'Submitted' ? 'text-green-600' : 'text-slate-500'">
                            Teacher: {{ summary.teacherName }}
                          </p>
                        </div>
                        @if(summary.status === 'Submitted') {
                          <div class="grid grid-cols-4 gap-2 text-center text-xs w-1/2">
                              <div>
                                <p class="font-bold text-slate-500">Total</p>
                                <p class="font-black text-lg text-slate-800">{{ summary.total }}</p>
                              </div>
                              <div>
                                <p class="font-bold text-green-500">Present</p>
                                <p class="font-black text-lg text-green-800">{{ summary.present }}</p>
                              </div>
                              <div>
                                <p class="font-bold text-red-500">Absent</p>
                                <p class="font-black text-lg text-red-800">{{ summary.absent }}</p>
                              </div>
                              <div>
                                <p class="font-bold text-indigo-500">Percent</p>
                                <p class="font-black text-lg text-indigo-800">{{ summary.percentage }}%</p>
                              </div>
                          </div>
                        } @else {
                           <div class="px-4 py-2 bg-slate-200 text-slate-600 rounded-full text-xs font-bold">
                             <i class="fa-solid fa-clock mr-2"></i>Pending Submission
                           </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
            @case ('meetings') {
              <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border space-y-6 animate-in fade-in">
                <div>
                    <h2 class="text-2xl font-black text-slate-800 tracking-tight">Schedule Staff Meeting</h2>
                    <p class="text-slate-500 text-sm font-medium">Set a time and agenda, then send individual SMS reminders.</p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="text-xs font-black uppercase text-slate-400 tracking-widest ml-1 mb-1 block">Meeting Date</label>
                    <input type="date" [ngModel]="meetingDate()" (ngModelChange)="meetingDate.set($event)" class="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none text-sm font-medium">
                  </div>
                  <div>
                    <label class="text-xs font-black uppercase text-slate-400 tracking-widest ml-1 mb-1 block">Meeting Time</label>
                    <input type="time" [ngModel]="meetingTime()" (ngModelChange)="meetingTime.set($event)" class="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none text-sm font-medium">
                  </div>
                </div>

                <div>
                  <label class="text-xs font-black uppercase text-slate-400 tracking-widest ml-1 mb-1 block">Meeting Agenda / Message</label>
                  <textarea [ngModel]="meetingAgenda()" (ngModelChange)="meetingAgenda.set($event)" placeholder="e.g., Discussion on upcoming annual day..." class="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none text-sm font-medium h-24 resize-none"></textarea>
                </div>

                <div class="text-center p-6 bg-purple-50 rounded-2xl border border-purple-200 space-y-2">
                  <div class="w-12 h-12 bg-purple-200 text-purple-600 rounded-full flex items-center justify-center mx-auto">
                    <i class="fa-solid fa-arrow-right"></i>
                  </div>
                  <h3 class="font-bold text-purple-800">Next Step: Send Reminders</h3>
                  <p class="text-sm text-purple-600 mt-1">
                    After setting the details, go to the 
                    <button (click)="view.set('teachers')" class="font-bold underline hover:text-purple-800">Manage Teachers</button> 
                    tab to send SMS alerts.
                  </p>
                </div>
              </div>
            }
            @case ('reports') {
              <div class="space-y-6 animate-in fade-in">
                <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border space-y-4">
                  <h2 class="text-2xl font-black tracking-tight text-slate-800">Export Staff Reports</h2>
                  
                  <div class="p-2 bg-slate-100 rounded-2xl border border-slate-200">
                    <div class="flex bg-white p-1 rounded-xl shadow-sm w-full">
                      <button (click)="reportExportFormat.set('pdf')" [class]="reportExportFormat() === 'pdf' ? 'flex-1 py-2 bg-indigo-600 text-white rounded-lg shadow-md font-bold text-xs' : 'flex-1 py-2 text-slate-500 font-medium text-xs'">
                        <i class="fa-solid fa-file-pdf mr-2"></i>PDF
                      </button>
                      <button (click)="reportExportFormat.set('csv')" [class]="reportExportFormat() === 'csv' ? 'flex-1 py-2 bg-emerald-600 text-white rounded-lg shadow-md font-bold text-xs' : 'flex-1 py-2 text-slate-500 font-medium text-xs'">
                        <i class="fa-solid fa-file-csv mr-2"></i>CSV
                      </button>
                      <button (click)="reportExportFormat.set('doc')" [class]="reportExportFormat() === 'doc' ? 'flex-1 py-2 bg-blue-600 text-white rounded-lg shadow-md font-bold text-xs' : 'flex-1 py-2 text-slate-500 font-medium text-xs'">
                        <i class="fa-solid fa-file-word mr-2"></i>Word
                      </button>
                    </div>
                  </div>

                  <div class="border-t pt-4">
                    <h3 class="font-bold text-slate-700 text-sm mb-2">Daily Report</h3>
                    <div class="flex gap-2">
                      <input type="date" [ngModel]="selectedDate()" (ngModelChange)="selectedDate.set($event)" class="flex-1 p-3 bg-slate-50 rounded-xl border outline-none text-sm">
                      <button (click)="exportDailyReport()" class="px-6 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 text-sm">Export</button>
                    </div>
                  </div>

                  <div class="border-t pt-4 mt-4">
                    <h3 class="font-bold text-slate-700 text-sm mb-2">Monthly Report</h3>
                    <div class="flex gap-2">
                      <input type="month" [ngModel]="monthlyMonth()" (ngModelChange)="monthlyMonth.set($event)" class="flex-1 p-3 bg-slate-50 rounded-xl border outline-none text-sm">
                      <button (click)="exportMonthlyReport()" class="px-6 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 text-sm">Export</button>
                    </div>
                  </div>
                </div>
              </div>
            }
          }
        } @else {
          <div class="text-center py-20 bg-white rounded-[3rem] border border-dashed border-red-200 animate-in fade-in">
            <div class="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <i class="fa-solid fa-wifi-slash text-4xl text-red-300"></i>
            </div>
            <h2 class="text-3xl font-black text-red-800 tracking-tight">Connection Required</h2>
            <p class="text-red-500 mt-2 max-w-md mx-auto">
              The Coordinator Portal requires an active internet connection to manage staff and school data. Please connect to the internet and try again.
            </p>
          </div>
        }
        @if (showToast()) {
        <div class="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 z-50 animate-in fade-in slide-in-from-bottom-4">
          <i class="fa-solid fa-check-circle text-green-500"></i>
          <span class="font-bold text-sm">{{ toastMessage() }}</span>
        </div>
      }
      </main>

       <!-- Edit Teacher Modal -->
      @if (showEditModal()) {
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4" (click)="showEditModal.set(false)">
          <div class="bg-white max-w-lg w-full rounded-[2rem] p-8 shadow-2xl border animate-in zoom-in-95" (click)="$event.stopPropagation()">
            <h3 class="text-xl font-bold text-slate-800 mb-6">Edit Teacher Profile</h3>
             <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" [ngModel]="editTeacherName()" (ngModelChange)="editTeacherName.set($event)" placeholder="Full Name *" class="sm:col-span-2 p-3 bg-slate-50 rounded-xl border outline-none text-sm">
                <input type="email" [ngModel]="editTeacherEmail()" (ngModelChange)="editTeacherEmail.set($event)" placeholder="Email Address" class="sm:col-span-2 p-3 bg-slate-50 rounded-xl border outline-none text-sm">
                <input type="tel" [ngModel]="editTeacherMobile()" (ngModelChange)="editTeacherMobile.set($event)" placeholder="Contact Mobile *" class="sm:col-span-2 p-3 bg-slate-50 rounded-xl border outline-none text-sm">
                <input type="text" [ngModel]="editTeacherClass()" (ngModelChange)="editTeacherClass.set($event)" placeholder="Class *" class="p-3 bg-slate-50 rounded-xl border outline-none text-sm">
                <input type="text" [ngModel]="editTeacherSection()" (ngModelChange)="editTeacherSection.set($event)" placeholder="Section *" class="p-3 bg-slate-50 rounded-xl border outline-none text-sm">
                <input type="password" maxlength="4" inputmode="numeric" pattern="[0-9]*" [ngModel]="editTeacherPin()" (ngModelChange)="editTeacherPin.set($event)" placeholder="4-Digit PIN *" class="sm:col-span-2 p-3 bg-slate-50 rounded-xl border outline-none text-sm">
            </div>
            <div class="flex gap-3 mt-6">
              <button (click)="showEditModal.set(false)" class="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">Cancel</button>
              <button (click)="saveTeacherChanges()" [disabled]="!editTeacherName().trim() || !editTeacherMobile().trim() || editTeacherPin().length < 4 || !editTeacherClass().trim() || !editTeacherSection().trim()" class="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50">Save Changes</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CoordinatorDashboardComponent {
  attendanceService = inject(AttendanceService);
  pdfService = inject(PdfService);
  csvService = inject(CsvService);
  docService = inject(DocService);
  sanitizer: DomSanitizer = inject(DomSanitizer);

  view = signal<'attendance' | 'teachers' | 'reports' | 'meetings' | 'summary' | 'security'>('attendance');
  coordinator = this.attendanceService.activeCoordinator;
  teachers = signal<Teacher[]>([]);
  
  // Add Teacher State
  newTeacherName = signal('');
  newTeacherEmail = signal('');
  newTeacherMobile = signal('');
  newTeacherClass = signal('');
  newTeacherSection = signal('');
  newTeacherPin = signal('');
  
  // Edit Teacher State
  showEditModal = signal(false);
  selectedTeacherForEdit = signal<Teacher | null>(null);
  editTeacherName = signal('');
  editTeacherEmail = signal('');
  editTeacherMobile = signal('');
  editTeacherClass = signal('');
  editTeacherSection = signal('');
  editTeacherPin = signal('');

  // Attendance State
  selectedDate = signal(new Date().toISOString().split('T')[0]);
  dailyRecords = signal<Map<string, 'Present' | 'Absent'>>(new Map());

  // Meeting State
  meetingDate = signal(new Date().toISOString().split('T')[0]);
  meetingTime = signal('10:00');
  meetingAgenda = signal('');

  isMeetingScheduled = computed(() => !!this.meetingDate() && !!this.meetingTime() && !!this.meetingAgenda().trim());

  // Reports State
  monthlyMonth = signal(new Date().toISOString().slice(0, 7));
  reportExportFormat = signal<'pdf' | 'csv' | 'doc'>('pdf');

  // Summary State
  summaryDate = signal(new Date().toISOString().split('T')[0]);
  dailySummary = computed(() => {
    const date = this.summaryDate();
    const submissions = this.attendanceService.getDailySubmissionsForDate(date);
    const teachersAndClasses = this.attendanceService.teachersWithClasses();
    const submissionMap = new Map(submissions.map(s => [`${s.className}|${s.section}`, s]));

    const summaryList = teachersAndClasses.map(tc => {
      const key = `${tc.className}|${tc.section}`;
      const submission = submissionMap.get(key);
      if (submission) {
        const sub = submission as DailySubmission;
        return {
          ...tc,
          status: 'Submitted' as const,
          total: sub.totalStudents,
          present: sub.presentStudents,
          absent: sub.absentStudents,
          percentage: sub.totalStudents > 0 ? ((sub.presentStudents / sub.totalStudents) * 100).toFixed(0) : '0',
          timestamp: sub.submissionTimestamp
        };
      } else {
        return {
          ...tc,
          status: 'Pending' as const,
        };
      }
    });

    const schoolTotalStudents = submissions.reduce((sum, s) => sum + s.totalStudents, 0);
    const schoolTotalPresent = submissions.reduce((sum, s) => sum + s.presentStudents, 0);
    const schoolTotalAbsent = submissions.reduce((sum, s) => sum + s.absentStudents, 0);
    const schoolPresentPercentage = schoolTotalStudents > 0 ? ((schoolTotalPresent / schoolTotalStudents) * 100).toFixed(0) : '0';
    
    return { summaryList, submissions, schoolTotalStudents, schoolTotalPresent, schoolTotalAbsent, schoolPresentPercentage };
  });

  // Security State
  schoolPinForm = signal('');

  // General UI State
  showToast = signal(false);
  toastMessage = signal('');
  errorMessage = signal('');

  constructor() {
    this.teachers.set(this.attendanceService.getTeachers());
    effect(() => {
      this.teachers.set(this.attendanceService.getTeachers());
    });

    effect(() => {
      const date = this.selectedDate();
      const existing = this.attendanceService.getTeacherAttendanceForDate(date);
      const newMap = new Map<string, 'Present' | 'Absent'>();
      
      this.teachers().forEach(t => {
        if (t.id !== this.coordinator()?.id) {
          const record = existing.find(r => r.teacherId === t.id);
          newMap.set(t.id, record ? record.status : 'Present');
        }
      });
      this.dailyRecords.set(newMap);
    });

    effect(() => {
        const schoolPin = this.attendanceService.activeSchoolPin();
        if (schoolPin) {
          this.schoolPinForm.set(schoolPin);
        }
    });
    
    effect(() => {
      // When view changes, clear the error message
      this.view();
      this.errorMessage.set('');
    });
  }

  // --- Teacher Management ---
  async addTeacher() {
    this.errorMessage.set('');
    const email = this.newTeacherEmail().trim();
    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.errorMessage.set('The provided email is not valid. Please correct it or leave it empty.');
            return;
        }
    }

    if (this.newTeacherPin().length !== 4) {
      this.errorMessage.set('PIN must be exactly 4 digits.');
      return;
    }

    try {
      await this.attendanceService.addTeacher({
        name: this.newTeacherName(),
        email: email,
        pin: this.newTeacherPin(),
        mobile: this.newTeacherMobile(),
        className: this.newTeacherClass(),
        section: this.newTeacherSection()
      });
      
      this.teachers.set(this.attendanceService.getTeachers());
      
      // Reset form fields
      this.newTeacherName.set('');
      this.newTeacherEmail.set('');
      this.newTeacherMobile.set('');
      this.newTeacherClass.set('');
      this.newTeacherSection.set('');
      this.newTeacherPin.set('');

      this.showToastMessage('Teacher account created successfully');
    } catch (e: any) {
      this.errorMessage.set(`Error: ${e.message}`);
    }
  }

  removeTeacher(id: string) {
    if (confirm('Are you sure you want to remove this teacher?')) {
      this.attendanceService.removeTeacher(id);
      this.teachers.set(this.attendanceService.getTeachers());
      this.showToastMessage('Teacher removed');
    }
  }

  // --- Edit Teacher Modal ---
  openEditModal(teacher: Teacher) {
    this.errorMessage.set('');
    this.selectedTeacherForEdit.set(teacher);
    this.editTeacherName.set(teacher.name);
    this.editTeacherEmail.set(teacher.email);
    this.editTeacherMobile.set(teacher.mobileNumber || '');
    this.editTeacherClass.set(teacher.className || '');
    this.editTeacherSection.set(teacher.section || '');
    this.editTeacherPin.set(teacher.pin);
    this.showEditModal.set(true);
  }
  
  saveTeacherChanges() {
    this.errorMessage.set('');
    const teacher = this.selectedTeacherForEdit();
    if (!teacher) return;
    
    if (!this.editTeacherName().trim() || !this.editTeacherMobile().trim()) {
        this.errorMessage.set('Teacher name and mobile number are required.');
        return;
    }

    const email = this.editTeacherEmail().trim();
    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.errorMessage.set('The provided email is not valid. Please correct it or leave it empty.');
            return;
        }
    }

    if (this.editTeacherPin().length !== 4) {
      this.errorMessage.set('PIN must be exactly 4 digits.');
      return;
    }
    
    try {
      this.attendanceService.updateTeacherDetails(teacher.id, {
        name: this.editTeacherName(),
        email: email,
        pin: this.editTeacherPin(),
        mobileNumber: this.editTeacherMobile(),
        className: this.editTeacherClass(),
        section: this.editTeacherSection(),
        setupComplete: !!(this.editTeacherClass() && this.editTeacherSection())
      });
      this.teachers.set(this.attendanceService.getTeachers());
      this.showToastMessage('Teacher details updated');
      this.showEditModal.set(false);
    } catch (e: any) {
      this.errorMessage.set(e.message);
    }
  }

  // --- Attendance ---
  toggleStatus(teacherId: string, status: 'Present' | 'Absent') {
    this.dailyRecords.update(map => new Map(map).set(teacherId, status));
  }
  getStatus(teacherId: string) { return this.dailyRecords().get(teacherId); }
  saveAttendance() {
    const records: { teacherId: string, status: 'Present' | 'Absent' }[] = [];
    this.dailyRecords().forEach((status, teacherId) => records.push({ teacherId, status }));
    this.attendanceService.saveTeacherAttendance(this.selectedDate(), records);
    this.showToastMessage('Staff attendance saved');
  }
  
  // --- Meetings ---
  sendMeetingReminder(teacher: Teacher) {
    this.errorMessage.set('');
    if (!teacher.mobileNumber) {
        this.errorMessage.set(`Cannot send reminder: No mobile number found for ${teacher.name}.`);
        return;
    }

    const date = new Date(this.meetingDate()).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    const timeParts = this.meetingTime().split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12; // Handle midnight
    const formattedTime = `${formattedHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;

    const message = `MEETING REMINDER\n\nHi ${teacher.name.split(' ')[0]},\nA staff meeting has been scheduled.\n\nDate: ${date}\nTime: ${formattedTime}\nAgenda: ${this.meetingAgenda()}\n\nRegards,\n${this.coordinator()?.name}`;

    const cleanNumber = teacher.mobileNumber.replace(/\D/g, '');
    const smsUrl = `sms:${cleanNumber}?body=${encodeURIComponent(message)}`;
    
    window.open(smsUrl, '_blank');
    this.showToastMessage(`Opening SMS for ${teacher.name}...`);
  }

  // --- Reports ---
  exportDailyReport() {
    const data = this.attendanceService.getTeacherDailyReportData(this.selectedDate());
    
    switch (this.reportExportFormat()) {
      case 'pdf':
        this.pdfService.exportTeacherReport(this.selectedDate(), this.coordinator()!.name, data);
        break;
      case 'csv':
        this.csvService.exportTeacherReport(this.selectedDate(), this.coordinator()!.name, data);
        break;
      case 'doc':
        this.docService.exportTeacherReport(this.selectedDate(), this.coordinator()!.name, data);
        break;
    }
  }

  async exportMonthlyReport() {
    const data = this.attendanceService.getTeacherMonthlyReport(this.monthlyMonth());
    const [year, month] = this.monthlyMonth().split('-');
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    
    switch (this.reportExportFormat()) {
      case 'pdf':
        await this.pdfService.exportTeacherMonthlyReport(monthName, this.coordinator()!.name, data, this.attendanceService);
        break;
      case 'csv':
        this.csvService.exportTeacherMonthlyReport(monthName, this.coordinator()!.name, data);
        break;
      case 'doc':
        await this.docService.exportTeacherMonthlyReport(monthName, this.coordinator()!.name, data, this.attendanceService);
        break;
    }
  }

  exportDailySummary() {
    const summary = this.dailySummary();
    const dataForExport = summary.summaryList.map(s => ({
      ...s,
      classNameAndSection: `Class ${s.className} - ${s.section}`
    }));
    const schoolStats = {
      total: summary.schoolTotalStudents,
      present: summary.schoolTotalPresent,
      absent: summary.schoolTotalAbsent,
      percentage: summary.schoolPresentPercentage
    };

    switch (this.reportExportFormat()) {
      case 'pdf':
        this.pdfService.exportSchoolDailySummary(this.summaryDate(), this.coordinator()!.name, dataForExport, schoolStats);
        break;
      case 'csv':
         this.csvService.exportSchoolDailySummary(this.summaryDate(), this.coordinator()!.name, dataForExport, schoolStats);
        break;
      case 'doc':
        this.docService.exportSchoolDailySummary(this.summaryDate(), this.coordinator()!.name, dataForExport, schoolStats);
        break;
    }
  }

  // --- Security ---
  async saveSecuritySettings() {
    this.errorMessage.set('');
    if (!this.schoolPinForm().trim()) {
      this.errorMessage.set('Please enter a School PIN.');
      return;
    }
    try {
      await this.attendanceService.setSchoolPin(this.schoolPinForm());
      this.showToastMessage('School PIN updated successfully!');
    } catch (e) {
      this.errorMessage.set('Failed to save School PIN.');
      console.error(e);
    }
  }

  private showToastMessage(message: string) {
    this.toastMessage.set(message);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3000);
  }
}