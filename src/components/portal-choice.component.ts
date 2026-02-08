import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, Teacher } from '../services/attendance.service';

@Component({
  selector: 'app-portal-choice',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-indigo-100">
      @if (view() === 'choice') {
        <div class="text-center mb-12 animate-in fade-in zoom-in-95">
          <div class="flex items-center justify-center gap-4 mb-4">
            <div class="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <i class="fa-solid fa-clipboard-user text-3xl"></i>
            </div>
            <div>
              <h1 class="text-5xl font-black text-slate-800 tracking-tight">
                <span class="font-medium text-slate-600">Rehman</span>
                <span class="text-indigo-600">Attendance</span>
              </h1>
              <p class="text-right font-bold text-sm text-slate-400 tracking-widest -mt-2">PRO</p>
            </div>
          </div>
          <p class="text-indigo-500/80 mt-2 text-lg font-medium">
            Select your portal to continue
          </p>
        </div>

        <div class="max-w-4xl w-full grid md:grid-cols-2 gap-8 animate-in fade-in zoom-in-95">
          <!-- Coordinator Portal Card -->
          <button (click)="onCoordinatorClick()" 
                  class="group p-8 rounded-[2rem] bg-white border border-slate-200/80 shadow-lg text-left hover:border-green-400 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
            <div class="flex items-center gap-6">
              <div class="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-sitemap"></i>
              </div>
              <div>
                <h2 class="text-2xl font-black text-slate-800 tracking-tight">Coordinator Portal</h2>
                <p class="text-slate-500 mt-1">Administrator access for staff management and school-wide reporting.</p>
              </div>
            </div>
          </button>

          <!-- Teacher Portal Card -->
          <button (click)="onTeacherClick()" 
                  class="group p-8 rounded-[2rem] bg-white border border-slate-200/80 shadow-lg text-left hover:border-indigo-400 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
            <div class="flex items-center gap-6">
              <div class="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-graduation-cap"></i>
              </div>
              <div>
                <h2 class="text-2xl font-black text-slate-800 tracking-tight">Teacher Portal</h2>
                <p class="text-slate-500 mt-1">Classroom access for daily student attendance and record management.</p>
              </div>
            </div>
          </button>
        </div>
      }

      @if (view() === 'pin') {
        <div class="w-full max-w-sm text-center animate-in fade-in zoom-in-95">
          <button (click)="backToChoice()" class="absolute top-6 left-6 flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600">
            <i class="fa-solid fa-arrow-left"></i> Back
          </button>
          
          <div class="w-24 h-24 bg-white rounded-full mx-auto mb-4 overflow-hidden border-4 shadow-md flex items-center justify-center"
            [class]="selectedRole() === 'coordinator' ? 'border-green-300' : 'border-indigo-300'">
            @if(selectedUser()?.photo) {
              <img [src]="selectedUser()?.photo" class="w-full h-full object-cover">
            } @else {
              <i class="fa-solid text-5xl" 
                [class]="selectedRole() === 'coordinator' ? 'fa-sitemap text-green-300' : 'fa-user-tie text-indigo-300'"></i>
            }
          </div>

          <h2 class="text-2xl font-bold text-slate-800">Welcome, {{ selectedUser()?.name }}</h2>
          <p class="text-slate-500 mb-6">Enter your 4-digit PIN to login</p>

          <div class="flex justify-center gap-3 mb-4">
            @for (i of [0, 1, 2, 3]; track i) {
              <div class="w-14 h-16 rounded-xl border-2 flex items-center justify-center text-3xl font-bold"
                [class]="pin().length > i ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : 'border-slate-300 bg-slate-100'">
                {{ pin().length > i ? '•' : '' }}
              </div>
            }
          </div>

          @if(errorMessage()) {
            <p class="text-red-600 bg-red-100 px-4 py-2 rounded-lg font-bold mb-4 animate-in fade-in">{{ errorMessage() }}</p>
          }
          
          <div class="grid grid-cols-3 gap-3">
            @for (num of [1, 2, 3, 4, 5, 6, 7, 8, 9]; track num) {
              <button (click)="appendPin(num.toString())" class="h-16 rounded-2xl bg-white shadow-md font-bold text-2xl text-slate-700 hover:bg-slate-50">{{ num }}</button>
            }
            <button (click)="clearPin()" class="h-16 rounded-2xl bg-white shadow-md font-bold text-slate-500 text-sm">CLEAR</button>
            <button (click)="appendPin('0')" class="h-16 rounded-2xl bg-white shadow-md font-bold text-2xl text-slate-700 hover:bg-slate-50">0</button>
            <button (click)="backspacePin()" class="h-16 rounded-2xl bg-white shadow-md font-bold text-slate-500"><i class="fa-solid fa-delete-left"></i></button>
          </div>
        </div>
      }

      @if (view() === 'teacher_select') {
         <div class="w-full max-w-2xl text-center animate-in fade-in zoom-in-95">
            <button (click)="backToChoice()" class="absolute top-6 left-6 flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600">
              <i class="fa-solid fa-arrow-left"></i> Back
            </button>
            <h2 class="text-3xl font-bold text-slate-800 mb-2">Select Teacher Profile</h2>
            <p class="text-slate-500 mb-8">Choose your profile to proceed with PIN entry.</p>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
              @for(teacher of teachers(); track teacher.id) {
                <button (click)="selectUser(teacher)" class="p-4 bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col items-center gap-3 hover:-translate-y-1 transition-transform">
                   <div class="w-20 h-20 rounded-full bg-slate-100 border-4 border-white overflow-hidden flex items-center justify-center">
                      @if(teacher.photo) {
                        <img [src]="teacher.photo" class="w-full h-full object-cover">
                      } @else {
                        <i class="fa-solid fa-user-tie text-4xl text-slate-300"></i>
                      }
                   </div>
                   <span class="font-bold text-slate-700">{{ teacher.name }}</span>
                </button>
              }
            </div>
         </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PortalChoiceComponent {
  attendanceService = inject(AttendanceService);
  
  view = signal<'choice' | 'pin' | 'teacher_select'>('choice');
  selectedRole = signal<'teacher' | 'coordinator' | null>(null);
  selectedUser = signal<Teacher | null>(null);

  pin = signal('');
  errorMessage = signal('');
  
  teachers = this.attendanceService.teachersOnly;

  onCoordinatorClick() {
    if (!this.attendanceService.isOnline()) {
      alert('Coordinator portal requires an internet connection to log in.');
      return;
    }
    const coordinator = this.attendanceService.coordinator();
    if (coordinator) {
      this.selectedRole.set('coordinator');
      this.selectedUser.set(coordinator);
      this.view.set('pin');
    } else {
      // In a real app, this might navigate to a setup screen.
      // For now, we assume a coordinator always exists if this button is shown.
      alert("Coordinator account not found. Please set up the application first.");
    }
  }

  onTeacherClick() {
    this.selectedRole.set('teacher');
    this.view.set('teacher_select');
  }
  
  selectUser(user: Teacher) {
    this.selectedUser.set(user);
    this.view.set('pin');
  }

  backToChoice() {
    this.view.set('choice');
    this.resetPinEntry();
  }
  
  resetPinEntry() {
      this.pin.set('');
      this.errorMessage.set('');
      this.selectedRole.set(null);
      this.selectedUser.set(null);
  }

  appendPin(num: string) {
    if (this.pin().length < 4) {
      this.pin.update(p => p + num);
      if (this.pin().length === 4) {
        this.submitPin();
      }
    }
  }

  clearPin() { this.pin.set(''); }
  backspacePin() { this.pin.update(p => p.slice(0, -1)); }

  async submitPin() {
    const user = this.selectedUser();
    if (!user) return;

    if (user.role === 'coordinator' && !this.attendanceService.isOnline()) {
        this.errorMessage.set('Connection lost. Coordinator requires internet.');
        setTimeout(() => this.pin.set(''), 1000);
        return;
    }

    const isValid = this.attendanceService.verifyPin(user.id, this.pin());
    if (isValid) {
      this.errorMessage.set('');
      await this.attendanceService.setActiveUser(user.id);
    } else {
      this.errorMessage.set('Incorrect PIN. Please try again.');
      if (navigator.vibrate) navigator.vibrate(200);
      setTimeout(() => this.pin.set(''), 1000);
    }
  }
}
