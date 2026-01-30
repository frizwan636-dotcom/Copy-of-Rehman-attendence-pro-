import { Component, inject, signal, effect, ViewChild, ElementRef, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, Teacher } from '../services/attendance.service';
import { PdfService } from '../services/pdf.service';
import { CsvService } from '../services/csv.service';
import { DocService } from '../services/doc.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-coordinator-dashboard',
  imports: [CommonModule, FormsModule],
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
          <div class="flex items-center gap-4">
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
              } @else {
                <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 border-amber-200 text-amber-700">
                  <i class="fa-solid fa-triangle-exclamation text-[10px]"></i>
                  <span class="text-[9px] font-black uppercase tracking-tighter">Offline Mode</span>
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
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
                        <div class="w-14 h-14 rounded-2xl bg-indigo-50 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center">
                          @if (teacher.photo) {
                            <img [src]="teacher.photo" class="w-full h-full object-cover">
                          } @else {
                            <i class="fa-solid fa-user-tie text-2xl text-indigo-200"></i>
                          }
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
                <div class="flex gap-4">
                  <div class="w-24 h-24 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:bg-slate-100 relative" (click)="triggerPhotoUpload()">
                    @if(newTeacherPhoto()) {
                      <img [src]="newTeacherPhoto()" class="w-full h-full object-cover">
                    } @else {
                      <i class="fa-solid fa-camera text-slate-300 text-xl"></i>
                    }
                  </div>
                  <div class="flex-1 grid grid-cols-2 gap-3">
                    <input type="text" [ngModel]="newTeacherName()" (ngModelChange)="newTeacherName.set($event)" placeholder="Full Name" class="col-span-2 p-3 bg-slate-50 rounded-xl border outline-none text-sm">
                    <input type="email" [ngModel]="newTeacherEmail()" (ngModelChange)="newTeacherEmail.set($event)" placeholder="Email Address (for login)" class="col-span-2 p-3 bg-slate-50 rounded-xl border outline-none text-sm">
                    <input type="tel" [ngModel]="newTeacherMobile()" (ngModelChange)="newTeacherMobile.set($event)" placeholder="Contact Mobile" class="col-span-2 p-3 bg-slate-50 rounded-xl border outline-none text-sm">
                    <input type="text" [ngModel]="newTeacherClass()" (ngModelChange)="newTeacherClass.set($event)" placeholder="Class" class="p-3 bg-slate-50 rounded-xl border outline-none text-sm">
                    <input type="text" [ngModel]="newTeacherSection()" (ngModelChange)="newTeacherSection.set($event)" placeholder="Section" class="p-3 bg-slate-50 rounded-xl border outline-none text-sm">
                  </div>
                </div>
                 <button (click)="addTeacher()" [disabled]="!newTeacherName() || !newTeacherEmail()" class="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50">
                  <i class="fa-solid fa-user-plus mr-2"></i>Add Teacher Profile
                </button>
                <input type="file" #teacherPhotoInput accept="image/*" (change)="onPhotoSelected($event)" class="hidden">
              </div>
              <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border space-y-3">
                <h2 class="text-2xl font-black tracking-tight text-slate-800">Registered Teachers ({{ teachers().length - 1 }})</h2>
                @for (teacher of teachers(); track teacher.id) {
                  @if(teacher.id !== coordinator()?.id) {
                    <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border">
                      <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-lg bg-white overflow-hidden border shadow-sm">
                          @if (teacher.photo) {
                            <img [src]="teacher.photo" class="w-full h-full object-cover">
                          } @else {
                            <div class="w-full h-full flex items-center justify-center text-slate-300"><i class="fa-solid fa-user-tie"></i></div>
                          }
                        </div>
                        <div>
                          <p class="font-bold text-slate-700">{{ teacher.name }}</p>
                          <p class="text-xs text-slate-500">{{ teacher.className }} - {{ teacher.section }}</p>
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
                
                <div class="flex flex-col sm:flex-row items-center justify-between p-2 bg-slate-100 rounded-2xl border border-slate-200 gap-2">
                  <div class="flex-1 flex bg-white p-1 rounded-xl shadow-sm w-full">
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
                  <div class="flex-1 flex justify-center items-center gap-2" [class.opacity-50]="reportExportFormat() !== 'pdf'">
                    <span class="text-[10px] font-black uppercase text-slate-400">Photos</span>
                    <button (click)="reportIncludePhotos.set(!reportIncludePhotos())" [disabled]="reportExportFormat() !== 'pdf'" [class]="reportIncludePhotos() ? 'bg-indigo-600' : 'bg-slate-200'" class="w-10 h-5 rounded-full relative transition-colors">
                      <div [class]="reportIncludePhotos() ? 'right-1' : 'left-1'" class="absolute top-1 w-3 h-3 bg-white rounded-full transition-all"></div>
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
            <div class="flex gap-4">
              <div class="w-24 h-24 bg-slate-50 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer relative" (click)="triggerEditPhotoUpload()">
                @if(editTeacherPhoto()) {
                  <img [src]="editTeacherPhoto()" class="w-full h-full object-cover">
                } @else {
                  <i class="fa-solid fa-camera text-slate-300 text-xl"></i>
                }
              </div>
              <div class="flex-1 grid grid-cols-2 gap-3">
                <input type="text" [ngModel]="editTeacherName()" (ngModelChange)="editTeacherName.set($event)" placeholder="Full Name" class="col-span-2 p-3 bg-slate-50 rounded-xl border outline-none text-sm">
                <input type="email" [ngModel]="editTeacherEmail()" (ngModelChange)="editTeacherEmail.set($event)" placeholder="Email Address" class="col-span-2 p-3 bg-slate-50 rounded-xl border outline-none text-sm">
                <input type="tel" [ngModel]="editTeacherMobile()" (ngModelChange)="editTeacherMobile.set($event)" placeholder="Contact Mobile" class="col-span-2 p-3 bg-slate-50 rounded-xl border outline-none text-sm">
                <input type="text" [ngModel]="editTeacherClass()" (ngModelChange)="editTeacherClass.set($event)" placeholder="Class" class="p-3 bg-slate-50 rounded-xl border outline-none text-sm">
                <input type="text" [ngModel]="editTeacherSection()" (ngModelChange)="editTeacherSection.set($event)" placeholder="Section" class="p-3 bg-slate-50 rounded-xl border outline-none text-sm">
              </div>
            </div>
            <div class="flex gap-3 mt-6">
              <button (click)="showEditModal.set(false)" class="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">Cancel</button>
              <button (click)="saveTeacherChanges()" class="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">Save Changes</button>
            </div>
          </div>
        </div>
        <input type="file" #editTeacherPhotoInput accept="image/*" (change)="onEditPhotoSelected($event)" class="hidden">
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

  view = signal<'attendance' | 'teachers' | 'reports' | 'meetings'>('attendance');
  coordinator = this.attendanceService.activeCoordinator;
  teachers = signal<Teacher[]>([]);
  
  // Add Teacher State
  newTeacherName = signal('');
  newTeacherEmail = signal('');
  newTeacherPhoto = signal<string | null>(null);
  newTeacherMobile = signal('');
  newTeacherClass = signal('');
  newTeacherSection = signal('');
  
  // Edit Teacher State
  showEditModal = signal(false);
  selectedTeacherForEdit = signal<Teacher | null>(null);
  editTeacherName = signal('');
  editTeacherEmail = signal('');
  editTeacherMobile = signal('');
  editTeacherClass = signal('');
  editTeacherSection = signal('');
  editTeacherPhoto = signal<string | null | undefined>(undefined);

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
  reportIncludePhotos = signal(true);
  reportExportFormat = signal<'pdf' | 'csv' | 'doc'>('pdf');

  // General UI State
  showToast = signal(false);
  toastMessage = signal('');
  
  @ViewChild('teacherPhotoInput') teacherPhotoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('editTeacherPhotoInput') editTeacherPhotoInput!: ElementRef<HTMLInputElement>;

  constructor() {
    this.teachers.set(this.attendanceService.getTeachers());
    effect(() => {
      this.teachers.set(this.attendanceService.getTeachers());
    }, { allowSignalWrites: true });

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
  }
  
  // --- Teacher Management ---
  triggerPhotoUpload() { this.teacherPhotoInput.nativeElement.click(); }
  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e: any) => this.newTeacherPhoto.set(e.target.result);
      reader.readAsDataURL(input.files[0]);
    }
  }

  async addTeacher() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.newTeacherEmail())) {
        alert('Please enter a valid email address for the new teacher.');
        return;
    }

    try {
      await this.attendanceService.addTeacher({
        name: this.newTeacherName(),
        email: this.newTeacherEmail(),
        photo: this.newTeacherPhoto() || undefined,
        mobile: this.newTeacherMobile(),
        className: this.newTeacherClass(),
        section: this.newTeacherSection()
      });
      
      this.teachers.set(this.attendanceService.getTeachers());
      
      // Reset form fields
      this.newTeacherName.set('');
      this.newTeacherEmail.set('');
      this.newTeacherPhoto.set(null);
      this.newTeacherMobile.set('');
      this.newTeacherClass.set('');
      this.newTeacherSection.set('');

      this.showToastMessage('Teacher account created successfully');
    } catch (e: any) {
      alert(`Error: ${e.message}`);
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
    this.selectedTeacherForEdit.set(teacher);
    this.editTeacherName.set(teacher.name);
    this.editTeacherEmail.set(teacher.email);
    this.editTeacherMobile.set(teacher.mobileNumber || '');
    this.editTeacherClass.set(teacher.className || '');
    this.editTeacherSection.set(teacher.section || '');
    this.editTeacherPhoto.set(teacher.photo);
    this.showEditModal.set(true);
  }

  triggerEditPhotoUpload() { this.editTeacherPhotoInput.nativeElement.click(); }
  onEditPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e: any) => this.editTeacherPhoto.set(e.target.result);
      reader.readAsDataURL(input.files[0]);
    }
  }
  
  saveTeacherChanges() {
    const teacher = this.selectedTeacherForEdit();
    if (!teacher) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.editTeacherEmail())) {
        alert('Please enter a valid email address.');
        return;
    }
    
    try {
      this.attendanceService.updateTeacherDetails(teacher.id, {
        name: this.editTeacherName(),
        email: this.editTeacherEmail(),
        mobileNumber: this.editTeacherMobile(),
        className: this.editTeacherClass(),
        section: this.editTeacherSection(),
        photo: this.editTeacherPhoto(),
        setupComplete: !!(this.editTeacherClass() && this.editTeacherSection())
      });
      this.teachers.set(this.attendanceService.getTeachers());
      this.showToastMessage('Teacher details updated');
      this.showEditModal.set(false);
    } catch (e: any) {
      alert(e.message);
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
    if (!teacher.mobileNumber) {
        alert(`Cannot send reminder: No mobile number found for ${teacher.name}.`);
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
    const records = this.attendanceService.getTeacherAttendanceForDate(this.selectedDate());
    const data = this.teachers().map(t => {
      const record = records.find(r => r.teacherId === t.id);
      return { ...t, status: record ? record.status : 'N/A' };
    });
    
    switch (this.reportExportFormat()) {
      case 'pdf':
        this.pdfService.exportTeacherReport(this.selectedDate(), this.coordinator()!.name, data, this.reportIncludePhotos());
        break;
      case 'csv':
        this.csvService.exportTeacherReport(this.selectedDate(), this.coordinator()!.name, data);
        break;
      case 'doc':
        this.docService.exportTeacherReport(this.selectedDate(), this.coordinator()!.name, data);
        break;
    }
  }

  exportMonthlyReport() {
    const data = this.attendanceService.getTeacherMonthlyReport(this.monthlyMonth());
    const [year, month] = this.monthlyMonth().split('-');
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    
    switch (this.reportExportFormat()) {
      case 'pdf':
        this.pdfService.exportTeacherMonthlyReport(monthName, this.coordinator()!.name, data, this.reportIncludePhotos());
        break;
      case 'csv':
        this.csvService.exportTeacherMonthlyReport(monthName, this.coordinator()!.name, data);
        break;
      case 'doc':
        this.docService.exportTeacherMonthlyReport(monthName, this.coordinator()!.name, data);
        break;
    }
  }

  private showToastMessage(message: string) {
    this.toastMessage.set(message);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3000);
  }
}
