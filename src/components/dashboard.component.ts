
import { Component, inject, signal, effect, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../services/attendance.service';
import { ReportsComponent } from './reports.component';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, ReportsComponent],
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
                {{ teacher()?.className }} • {{ teacher()?.section }} • {{ teacher()?.name }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <!-- Sync Status Indicator -->
            <div class="hidden sm:flex items-center gap-3">
              @if (attendanceService.isSyncing()) {
                <div class="flex items-center gap-2 text-indigo-600 animate-pulse px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100">
                  <i class="fa-solid fa-arrows-rotate animate-spin text-[10px]"></i>
                  <span class="text-[9px] font-black uppercase tracking-tighter">Syncing...</span>
                </div>
              } @else if (attendanceService.hasUnsyncedData()) {
                <!-- Fix: Replaced [class] binding with individual class bindings to prevent overriding static classes. -->
                <div class="flex items-center gap-2 px-3 py-1.5 rounded-full"
                    [class.bg-amber-100]="attendanceService.isOnline()"
                    [class.border-amber-200]="attendanceService.isOnline()"
                    [class.text-amber-700]="attendanceService.isOnline()"
                    [class.bg-slate-100]="!attendanceService.isOnline()"
                    [class.border-slate-200]="!attendanceService.isOnline()"
                    [class.text-slate-600]="!attendanceService.isOnline()">
                  <i class="fa-solid fa-cloud-arrow-up text-[10px]"></i>
                  <span class="text-[9px] font-black uppercase tracking-tighter">
                    {{ attendanceService.isOnline() ? 'Sync Pending' : 'Offline' }} • {{ attendanceService.unsyncedRecordCount() }} items
                  </span>
                </div>
              } @else {
                <div class="flex items-center gap-2 text-emerald-600 opacity-80 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
                  <i class="fa-solid fa-cloud-check text-[10px]"></i>
                  <span class="text-[9px] font-black uppercase tracking-tighter">Cloud Synced</span>
                </div>
              }
            </div>

            <button (click)="attendanceService.logout()" class="p-2.5 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors">
               <i class="fa-solid fa-power-off"></i>
            </button>
          </div>
        </div>
      </nav>

      <main class="max-w-4xl mx-auto p-4 md:p-8">
        
        <!-- Navigation Hub -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <!-- Fix: Replaced [class] binding with individual class bindings to prevent overriding static classes. -->
          <button (click)="view.set('attendance')" 
            class="p-6 rounded-[2rem] transition-all flex flex-col items-center gap-3 group"
            [class.bg-indigo-600]="view() === 'attendance'" [class.text-white]="view() === 'attendance'" [class.shadow-xl]="view() === 'attendance'" [class.shadow-indigo-200]="view() === 'attendance'"
            [class.bg-white]="view() !== 'attendance'" [class.text-slate-600]="view() !== 'attendance'" [class.hover:bg-indigo-50]="view() !== 'attendance'" [class.border]="view() !== 'attendance'" [class.border-slate-100]="view() !== 'attendance'" [class.shadow-sm]="view() !== 'attendance'">
            <i class="fa-solid fa-clipboard-user text-xl" [class]="view() === 'attendance' ? 'text-white' : 'text-indigo-500'"></i>
            <span class="text-xs font-black uppercase tracking-widest">Attendance</span>
          </button>

          <button (click)="view.set('students')" 
            class="p-6 rounded-[2rem] transition-all flex flex-col items-center gap-3 group"
            [class.bg-blue-600]="view() === 'students'" [class.text-white]="view() === 'students'" [class.shadow-xl]="view() === 'students'" [class.shadow-blue-200]="view() === 'students'"
            [class.bg-white]="view() !== 'students'" [class.text-slate-600]="view() !== 'students'" [class.hover:bg-blue-50]="view() !== 'students'" [class.border]="view() !== 'students'" [class.border-slate-100]="view() !== 'students'" [class.shadow-sm]="view() !== 'students'">
            <i class="fa-solid fa-users text-xl" [class]="view() === 'students' ? 'text-white' : 'text-blue-500'"></i>
            <span class="text-xs font-black uppercase tracking-widest">Students</span>
          </button>

          <button (click)="view.set('teacher')" 
            class="p-6 rounded-[2rem] transition-all flex flex-col items-center gap-3 group"
            [class.bg-emerald-600]="view() === 'teacher'" [class.text-white]="view() === 'teacher'" [class.shadow-xl]="view() === 'teacher'" [class.shadow-emerald-200]="view() === 'teacher'"
            [class.bg-white]="view() !== 'teacher'" [class.text-slate-600]="view() !== 'teacher'" [class.hover:bg-emerald-50]="view() !== 'teacher'" [class.border]="view() !== 'teacher'" [class.border-slate-100]="view() !== 'teacher'" [class.shadow-sm]="view() !== 'teacher'">
            <i class="fa-solid fa-user-tie text-xl" [class]="view() === 'teacher' ? 'text-white' : 'text-emerald-500'"></i>
            <span class="text-xs font-black uppercase tracking-widest">Profile</span>
          </button>

          <button (click)="view.set('reports')" 
            class="p-6 rounded-[2rem] transition-all flex flex-col items-center gap-3 group"
            [class.bg-slate-900]="view() === 'reports'" [class.text-white]="view() === 'reports'" [class.shadow-xl]="view() === 'reports'" [class.shadow-slate-200]="view() === 'reports'"
            [class.bg-white]="view() !== 'reports'" [class.text-slate-600]="view() !== 'reports'" [class.hover:bg-slate-50]="view() !== 'reports'" [class.border]="view() !== 'reports'" [class.border-slate-100]="view() !== 'reports'" [class.shadow-sm]="view() !== 'reports'">
            <i class="fa-solid fa-chart-pie text-xl" [class]="view() === 'reports' ? 'text-white' : 'text-slate-500'"></i>
            <span class="text-xs font-black uppercase tracking-widest">Reports</span>
          </button>
        </div>

        @switch (view()) {
          @case ('attendance') {
            <!-- Attendance View -->
            <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 class="text-2xl font-black text-slate-800 tracking-tight">Daily Roll Call</h2>
                  <p class="text-slate-500 text-sm font-medium">Marking presence for today's session</p>
                </div>
                <div class="flex items-center bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200">
                  <i class="fa-solid fa-calendar text-indigo-500 mr-3"></i>
                  <input type="date" [ngModel]="selectedDate()" (ngModelChange)="selectedDate.set($event)" class="bg-transparent font-bold text-slate-700 outline-none text-sm">
                </div>
              </div>

              <div class="space-y-3">
                @for (student of students(); track student.id) {
                  <div class="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div class="flex items-center gap-4">
                      <div class="w-14 h-14 rounded-2xl bg-indigo-50 overflow-hidden border-2 border-white shadow-sm">
                        @if (student.photo) {
                          <img [src]="student.photo" class="w-full h-full object-cover">
                        } @else {
                          <div class="w-full h-full flex items-center justify-center text-[8px] text-indigo-300 font-black text-center px-1">NO PHOTO</div>
                        }
                      </div>
                      <div>
                        <h4 class="font-bold text-slate-800 leading-none mb-1">{{ student.name }}</h4>
                        <span class="text-[10px] font-black text-slate-300 uppercase tracking-widest">Roll #{{ student.rollNumber }}</span>
                      </div>
                    </div>

                    <div class="flex items-center gap-2">
                      @if (getStatus(student.id) === 'Absent') {
                        <a [href]="getWhatsAppSafeUrl(student)" target="_blank" class="w-10 h-10 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center hover:bg-green-600 hover:text-white transition-all">
                          <i class="fa-brands fa-whatsapp text-lg"></i>
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
                <button (click)="saveAttendance()" class="flex-1 py-5 bg-slate-900 text-white rounded-[1.75rem] font-black shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                  <i class="fa-solid fa-check-double text-indigo-400"></i> Submit Records
                </button>
                <button (click)="sendBulkAbsenceAlerts()" [disabled]="absentCount() === 0" class="flex-1 py-5 bg-green-600 text-white rounded-[1.75rem] font-black shadow-xl hover:bg-green-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                  <i class="fa-brands fa-whatsapp"></i> Alert Absentees
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
                    <p class="text-slate-500 text-sm font-medium">Total: {{ students().length }} enrolled</p>
                  </div>
                  <button (click)="showNewAdmissionForm.set(true)" class="flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
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
                    <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 hover:border-blue-200 transition-all group">
                      <div class="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0">
                        @if (student.photo) {
                          <img [src]="student.photo" class="w-full h-full object-cover">
                        } @else {
                          <div class="w-full h-full flex items-center justify-center text-slate-200">
                            <i class="fa-solid fa-user text-xl"></i>
                          </div>
                        }
                      </div>
                      <div class="flex-1">
                        <h4 class="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{{ student.name }}</h4>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Roll Number: {{ student.rollNumber }}</p>
                        <div class="flex items-center gap-2 text-blue-600 font-black text-[9px] uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-full w-fit">
                          <i class="fa-solid fa-phone text-[8px]"></i>
                          {{ student.mobileNumber }}
                        </div>
                      </div>
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

          @case ('teacher') {
            <!-- Teacher Profile -->
            <div class="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-top-4">
              <div class="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 text-center space-y-6">
                <div class="relative mx-auto w-40 h-40">
                  <div class="absolute inset-0 border-4 border-emerald-500/20 rounded-full animate-pulse"></div>
                  <div class="absolute inset-2 rounded-full overflow-hidden border-4 border-white shadow-xl bg-emerald-50">
                    <div class="w-full h-full flex items-center justify-center text-emerald-300">
                      <i class="fa-solid fa-user-tie text-5xl"></i>
                    </div>
                  </div>
                  <div class="absolute bottom-1 right-1 w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                    <i class="fa-solid fa-shield-check"></i>
                  </div>
                </div>

                <div>
                  <h2 class="text-3xl font-black text-slate-800 tracking-tight">{{ teacher()?.name }}</h2>
                  <p class="text-emerald-600 font-bold uppercase tracking-[0.2em] text-xs mt-1">Authorized Educator</p>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    <p class="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Classroom</p>
                    <p class="font-bold text-slate-800">{{ teacher()?.className }}</p>
                  </div>
                  <div class="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    <p class="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Section</p>
                    <p class="font-bold text-slate-800">{{ teacher()?.section }}</p>
                  </div>
                </div>

                <div class="pt-6 border-t border-slate-100 text-left">
                  <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Security Credentials</h4>
                  <div class="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <i class="fa-solid fa-key text-emerald-600 text-xl"></i>
                    <div>
                      <p class="text-[10px] font-black text-emerald-800 uppercase leading-none">Password Protection</p>
                      <p class="text-[10px] text-emerald-600 font-medium">Account secured with a password</p>
                    </div>
                    <span class="ml-auto text-[8px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-black">ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
          }

          @case ('reports') {
            <div class="animate-in fade-in zoom-in-95">
              <app-reports (onBack)="view.set('attendance')" />
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

      <!-- New Admission Modal -->
      @if (showNewAdmissionForm()) {
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-in fade-in" (click)="showNewAdmissionForm.set(false)">
          <div class="bg-white max-w-lg w-full rounded-[2rem] p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-bold text-slate-800">New Student Admission</h3>
              <button (click)="showNewAdmissionForm.set(false)" class="text-slate-400 hover:text-slate-600">&times;</button>
            </div>

            <div class="flex gap-4 mb-4">
              <div class="w-24 h-24 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:bg-slate-100 transition-colors relative" (click)="triggerStudentPhoto()">
                @if (newStudentPhoto()) {
                  <img [src]="newStudentPhoto()" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                    <i class="fa-solid fa-camera text-white text-lg"></i>
                  </div>
                } @else {
                  <i class="fa-solid fa-camera text-slate-300 text-2xl"></i>
                }
              </div>
              <div class="flex-1 grid grid-cols-1 gap-3">
                <input type="text" [(ngModel)]="newStudentName" placeholder="Full Name" class="w-full p-4 rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-sm bg-slate-50">
                <div class="grid grid-cols-2 gap-3">
                  <input type="text" [(ngModel)]="newStudentRoll" placeholder="Roll #" class="p-4 rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-sm bg-slate-50">
                  <input type="tel" [(ngModel)]="newStudentMobile" placeholder="Contact Mobile" class="p-4 rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-sm bg-slate-50">
                </div>
              </div>
            </div>
            <button (click)="saveNewStudent()" [disabled]="!newStudentName() || !newStudentRoll() || !newStudentMobile()" class="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              <i class="fa-solid fa-check-circle"></i> Enroll Student
            </button>
          </div>
        </div>
        <video #studentVideo autoplay playsinline class="hidden"></video>
        <canvas #studentCanvas class="hidden"></canvas>
      }
    </div>
  `
})
export class DashboardComponent {
  attendanceService = inject(AttendanceService);
  // Fix: Explicitly typed `sanitizer` with `DomSanitizer` to resolve a TypeScript error where its type was being inferred as 'unknown'.
  sanitizer: DomSanitizer = inject(DomSanitizer);
  
  view = signal<'attendance' | 'students' | 'teacher' | 'reports'>('attendance');
  teacher = this.attendanceService.activeTeacher;
  students = this.attendanceService.activeStudents;
  
  // Search & Filter State
  searchQuery = signal('');
  sortKey = signal<'name' | 'roll'>('name');
  
  // New Admission State
  showNewAdmissionForm = signal(false);
  newStudentName = signal('');
  newStudentRoll = signal('');
  newStudentMobile = signal('');
  newStudentPhoto = signal<string | null>(null);

  @ViewChild('studentVideo') studentVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('studentCanvas') studentCanvas!: ElementRef<HTMLCanvasElement>;

  filteredStudents = computed(() => {
    let list = [...this.students()];
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
  toastMessage = signal('Attendance Updated Successfully');

  absentCount = computed(() => {
    let count = 0;
    this.dailyRecords().forEach(val => { if (val === 'Absent') count++; });
    return count;
  });

  constructor() {
    effect(() => {
      const date = this.selectedDate();
      const existing = this.attendanceService.getAttendanceForDate(date);
      const newMap = new Map<string, 'Present' | 'Absent'>();
      
      this.students().forEach(s => {
        const record = existing.find(r => r.studentId === s.id);
        newMap.set(s.id, record ? record.status : 'Present');
      });
      this.dailyRecords.set(newMap);
    });
  }

  toggleStatus(studentId: string, status: 'Present' | 'Absent') {
    this.dailyRecords.update(map => {
      const newMap = new Map(map);
      newMap.set(studentId, status);
      return newMap;
    });
  }

  getStatus(studentId: string) {
    return this.dailyRecords().get(studentId);
  }

  saveAttendance() {
    const records: { studentId: string, status: 'Present' | 'Absent' }[] = [];
    this.dailyRecords().forEach((status, studentId) => {
      records.push({ studentId, status });
    });

    this.attendanceService.saveAttendance(this.selectedDate(), records);
    
    this.toastMessage.set('Attendance Saved Successfully');
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3000);
  }

  private buildWhatsAppUrl(student: any): string {
    const dateStr = new Date(this.selectedDate()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const message = `*ABSENCE ALERT* 📢\n\nDear Parent,\nThis is to inform you that your child *${student.name}* (Roll: ${student.rollNumber}) was *ABSENT* from class today (${dateStr}).\n\n_Regards,_\n*${this.teacher()?.name}*\n${this.teacher()?.className} Section ${this.teacher()?.section}`;
    
    const cleanNumber = student.mobileNumber.replace(/\D/g, '');
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
  }

  getWhatsAppSafeUrl(student: any): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(this.buildWhatsAppUrl(student));
  }

  sendDirectAlert(student: any) {
    const url = this.buildWhatsAppUrl(student);
    window.open(url, '_blank');
  }

  sendBulkAbsenceAlerts() {
    const absentees: any[] = [];
    this.dailyRecords().forEach((status, studentId) => {
      if (status === 'Absent') {
        const student = this.students().find(s => s.id === studentId);
        if (student) absentees.push(student);
      }
    });

    if (absentees.length === 0) return;

    if (confirm(`Send alerts to all ${absentees.length} absentees?`)) {
      absentees.forEach((s, index) => {
        setTimeout(() => this.sendDirectAlert(s), index * 1000);
      });
      this.toastMessage.set(`Dispatching Alerts...`);
      this.showToast.set(true);
      setTimeout(() => this.showToast.set(false), 4000);
    }
  }

  async triggerStudentPhoto() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      const video = this.studentVideo.nativeElement;
      video.srcObject = stream;
      
      setTimeout(() => {
        const canvas = this.studentCanvas.nativeElement;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);
        this.newStudentPhoto.set(canvas.toDataURL('image/jpeg', 0.5));
        stream.getTracks().forEach(t => t.stop());
      }, 500);
    } catch (err) {
      alert("Student photo capture failed: " + err);
    }
  }

  saveNewStudent() {
    const name = this.newStudentName().trim();
    const roll = this.newStudentRoll().trim();
    const mobile = this.newStudentMobile().trim();
    
    if (!name || !roll || !mobile) {
      alert('Please fill in all student details.');
      return;
    }

    if (this.attendanceService.isRollNumberTaken(roll)) {
      alert(`Error: Roll number "${roll}" is already assigned to another student.`);
      return;
    }

    this.attendanceService.addStudents([{
      name,
      roll,
      mobile,
      photo: this.newStudentPhoto() || undefined
    }]);

    this.toastMessage.set(`Student ${name} admitted successfully!`);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3000);

    // Reset form
    this.showNewAdmissionForm.set(false);
    this.newStudentName.set('');
    this.newStudentRoll.set('');
    this.newStudentMobile.set('');
    this.newStudentPhoto.set(null);
  }
}
