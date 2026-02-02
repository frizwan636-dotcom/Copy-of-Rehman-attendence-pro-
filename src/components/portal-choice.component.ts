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
          <h1 class="text-5xl font-black text-slate-800 tracking-tight">Rehman Attendance Pro</h1>
          <p class="text-indigo-500/80 mt-2 text-lg font-medium">
            Select your portal to continue
          </p>
        </div>

        <div class="max-w-4xl w-full grid md:grid-cols-2 gap-8 animate-in fade-in zoom-in-95">
          <!-- Coordinator Portal Card -->
          <button (click)="onCoordinatorClick()" 
                  class="group p-8 rounded-[3rem] bg-white shadow-2xl shadow-green-100 border border-green-200/50 hover:border-green-400 hover:shadow-green-200 transition-all duration-300 text-left flex flex-col justify-between h-80">
            <div>
              <div class="w-20 h-20 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-green-600 group-hover:text-white transition-all">
                <i class="fa-solid fa-sitemap text-4xl"></i>
              </div>
              <h2 class="text-4xl font-black text-slate-800">Coordinator Portal</h2>
              <p class="text-slate-500 mt-2">Manage staff, take attendance, and generate reports.</p>
            </div>
            <div class="flex items-center gap-3 text-green-600 font-bold">
              <span>
                @if(coordinator()) {
                  Enter as {{ coordinator()?.name }}
                } @else {
                  Setup Coordinator Account
                }
              </span>
              <i class="fa-solid fa-arrow-right-long group-hover:translate-x-2 transition-transform"></i>
            </div>
          </button>

          <!-- Teacher Portal Card -->
          <button (click)="onTeacherClick()" 
                  class="group p-8 rounded-[3rem] bg-white shadow-2xl shadow-indigo-100 border border-indigo-200/50 hover:border-indigo-400 hover:shadow-indigo-200 transition-all duration-300 text-left flex flex-col justify-between h-80">
            <div>
              <div class="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <i class="fa-solid fa-graduation-cap text-4xl"></i>
              </div>
              <h2 class="text-4xl font-black text-slate-800">Teacher Portal</h2>
              <p class="text-slate-500 mt-2">Manage students, daily attendance, and fee collection.</p>
            </div>
            <div class="flex items-center gap-3 text-indigo-600 font-bold">
              <span>Enter as Teacher</span>
              <i class="fa-solid fa-arrow-right-long group-hover:translate-x-2 transition-transform"></i>
            </div>
          </button>
        </div>
      } 
      
      @if (view() === 'teacher-selection') {
        <!-- Teacher Selection View -->
        <div class="max-w-md w-full bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200 border animate-in fade-in zoom-in-95">
           <div class="flex items-center gap-4 mb-6">
            <button (click)="view.set('choice')" class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 flex-shrink-0">
              <i class="fa-solid fa-arrow-left"></i>
            </button>
            <div>
              <h3 class="text-2xl font-bold text-slate-800 tracking-tight">Select Teacher Profile</h3>
              <p class="text-sm text-slate-500">Choose your profile to proceed.</p>
            </div>
          </div>
          <div class="space-y-3">
            @for(teacher of teachers(); track teacher.id) {
              <button (click)="selectTeacher(teacher)" class="w-full text-left flex items-center gap-4 p-4 rounded-2xl hover:bg-indigo-50 transition-colors">
                <div class="w-14 h-14 rounded-2xl bg-indigo-100 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center flex-shrink-0">
                  @if (teacher.photo) {
                    <img [src]="teacher.photo" class="w-full h-full object-cover">
                  } @else {
                    <i class="fa-solid fa-user-tie text-2xl text-indigo-200"></i>
                  }
                </div>
                <div>
                  <h4 class="font-bold text-slate-800">{{ teacher.name }}</h4>
                  <span class="text-xs text-slate-500">{{ teacher.className }} - {{ teacher.section }}</span>
                </div>
              </button>
            }
          </div>
        </div>
      }

      @if (view() === 'pin-entry') {
        <div class="max-w-sm w-full bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200 border animate-in fade-in zoom-in-95 text-center">
           <div class="flex items-center gap-4 mb-6 text-left">
            <button (click)="resetToChoice()" class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 flex-shrink-0">
              <i class="fa-solid fa-arrow-left"></i>
            </button>
            <div>
              <h3 class="text-2xl font-bold text-slate-800 tracking-tight">Enter PIN</h3>
              <p class="text-sm text-slate-500">to access {{ userForLogin()?.name }}'s portal</p>
            </div>
          </div>
          <div class="space-y-4">
             <input type="password" 
                   maxlength="4" 
                   inputmode="numeric" 
                   pattern="[0-9]*" 
                   [ngModel]="enteredPin()"
                   (ngModelChange)="onPinChange($event)"
                   placeholder="****"
                   class="w-full p-4 text-center text-4xl font-bold tracking-[1em] bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400">
            
            @if(pinError()) {
              <p class="text-red-500 text-sm font-semibold animate-in fade-in shake">{{ pinError() }}</p>
            }

            <button (click)="handleLogin()" 
                    [disabled]="enteredPin().length < 4"
                    class="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all">
              Login
            </button>

            <button (click)="view.set('forgot-pin-question')"
                    class="text-sm font-semibold text-indigo-600 hover:underline mt-2">
              Forgot PIN?
            </button>
          </div>
        </div>
      }
      
      @if (view() === 'forgot-pin-question') {
        <div class="max-w-sm w-full bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200 border animate-in fade-in zoom-in-95">
           <div class="flex items-center gap-4 mb-6 text-left">
            <button (click)="view.set('pin-entry')" class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 flex-shrink-0">
              <i class="fa-solid fa-arrow-left"></i>
            </button>
            <div>
              <h3 class="text-2xl font-bold text-slate-800 tracking-tight">PIN Reset</h3>
              <p class="text-sm text-slate-500">Answer your security question</p>
            </div>
          </div>
          <div class="space-y-4">
             <label class="block text-sm font-semibold text-slate-600 text-left">{{ userForLogin()?.securityQuestion }}</label>
             <input type="text" 
                   [ngModel]="securityAnswer()"
                   (ngModelChange)="onResetErrorClear($event, 'answer')"
                   placeholder="Your Answer"
                   class="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-400">
            
            @if(resetError()) {
              <p class="text-red-500 text-sm font-semibold animate-in fade-in shake">{{ resetError() }}</p>
            }

            <button (click)="verifySecurityAnswer()" 
                    [disabled]="!securityAnswer()"
                    class="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all">
              Verify Answer
            </button>
          </div>
        </div>
      }

      @if (view() === 'forgot-pin-reset') {
        <div class="max-w-sm w-full bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200 border animate-in fade-in zoom-in-95">
           <div class="flex items-center gap-4 mb-6 text-left">
            <button (click)="view.set('forgot-pin-question')" class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 flex-shrink-0">
              <i class="fa-solid fa-arrow-left"></i>
            </button>
            <div>
              <h3 class="text-2xl font-bold text-slate-800 tracking-tight">Set New PIN</h3>
              <p class="text-sm text-slate-500">for {{ userForLogin()?.name }}</p>
            </div>
          </div>
          <div class="space-y-4">
             <input type="password" maxlength="4" inputmode="numeric" pattern="[0-9]*"
                   [ngModel]="resetPin()"
                   (ngModelChange)="onResetErrorClear($event, 'pin')"
                   placeholder="New 4-Digit PIN"
                   class="w-full p-4 text-center text-xl font-bold tracking-[0.5em] bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-400">
             <input type="password" maxlength="4" inputmode="numeric" pattern="[0-9]*"
                   [ngModel]="confirmResetPin()"
                   (ngModelChange)="onResetErrorClear($event, 'confirm')"
                   placeholder="Confirm New PIN"
                   class="w-full p-4 text-center text-xl font-bold tracking-[0.5em] bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-400">
            
            @if(resetError()) {
              <p class="text-red-500 text-sm font-semibold animate-in fade-in shake">{{ resetError() }}</p>
            }

            <button (click)="saveNewPin()" 
                    [disabled]="resetPin().length < 4 || confirmResetPin().length < 4"
                    class="w-full py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 transition-all">
              Save New PIN
            </button>
          </div>
        </div>
      }

      @if (view() === 'setup') {
         <div class="max-w-lg w-full bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200 border animate-in fade-in zoom-in-95">
           <div class="flex items-center gap-4 mb-6">
            <button (click)="view.set('choice')" class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 flex-shrink-0">
              <i class="fa-solid fa-arrow-left"></i>
            </button>
            <div>
              <h3 class="text-2xl font-bold text-slate-800 tracking-tight">
                @if(setupRole() === 'coordinator') {
                  Coordinator Setup
                } @else {
                  First Teacher Setup
                }
              </h3>
              <p class="text-sm text-slate-500">
                @if(setupRole() === 'coordinator') {
                  Create the primary coordinator account.
                } @else {
                  Create the first teacher account for this school.
                }
              </p>
            </div>
          </div>
          
          <div class="space-y-4">
            <input type="text" [ngModel]="schoolName()" (ngModelChange)="schoolName.set($event)" placeholder="School / Institute Name" class="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none text-sm font-medium">
            <input type="text" [ngModel]="userName()" (ngModelChange)="userName.set($event)" placeholder="Your Full Name" class="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none text-sm font-medium">
            <input type="tel" [ngModel]="mobileNumber()" (ngModelChange)="mobileNumber.set($event)" placeholder="Mobile Number (for alerts)" class="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none text-sm font-medium">
            <div class="grid grid-cols-2 gap-4">
              <input type="text" [ngModel]="className()" (ngModelChange)="className.set($event)" placeholder="Primary Class (e.g., Grade 5)" class="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none text-sm font-medium">
              <input type="text" [ngModel]="sectionName()" (ngModelChange)="sectionName.set($event)" placeholder="Section (e.g., A)" class="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none text-sm font-medium">
            </div>
            <input type="password" maxlength="4" inputmode="numeric" pattern="[0-9]*" [ngModel]="pin()" (ngModelChange)="pin.set($event)" placeholder="Set 4-Digit PIN" class="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none text-sm font-medium">
            <input type="text" [ngModel]="securityQuestion()" (ngModelChange)="securityQuestion.set($event)" placeholder="Security Question (e.g., Favorite color?)" class="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none text-sm font-medium">
            <input type="text" [ngModel]="setupSecurityAnswer()" (ngModelChange)="setupSecurityAnswer.set($event)" placeholder="Answer to Security Question" class="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none text-sm font-medium">
            
            <button (click)="completeSetup()" [disabled]="!schoolName() || !userName() || !className() || !sectionName() || !mobileNumber() || pin().length !== 4 || !securityQuestion() || !setupSecurityAnswer()" class="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all">
              Complete Setup & Enter Portal
            </button>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PortalChoiceComponent {
  attendanceService = inject(AttendanceService);
  
  coordinator = this.attendanceService.coordinator;
  teachers = this.attendanceService.teachersOnly;

  view = signal<'choice' | 'teacher-selection' | 'setup' | 'pin-entry' | 'forgot-pin-question' | 'forgot-pin-reset'>('choice');
  setupRole = signal<'coordinator' | 'teacher' | null>(null);

  // Login State
  userForLogin = signal<Teacher | null>(null);
  enteredPin = signal('');
  pinError = signal('');

  // Forgot PIN State
  securityAnswer = signal('');
  resetPin = signal('');
  confirmResetPin = signal('');
  resetError = signal('');


  // Form state for setup
  schoolName = signal('');
  userName = signal('');
  mobileNumber = signal('');
  className = signal('');
  sectionName = signal('');
  pin = signal('');
  securityQuestion = signal('');
  setupSecurityAnswer = signal('');


  onCoordinatorClick() {
    const coord = this.coordinator();
    if (coord) {
      this.userForLogin.set(coord);
      this.view.set('pin-entry');
    } else {
      this.setupRole.set('coordinator');
      this.view.set('setup');
    }
  }

  onTeacherClick() {
    const teacherList = this.teachers();
    if (teacherList.length > 0) {
      if (teacherList.length === 1) {
        this.userForLogin.set(teacherList[0]);
        this.view.set('pin-entry');
      } else {
        this.view.set('teacher-selection');
      }
    } else {
       if (this.coordinator()) {
         alert('No teacher accounts found. Please ask your coordinator to create one for you.');
       } else {
         this.setupRole.set('teacher');
         this.view.set('setup');
       }
    }
  }

  selectTeacher(teacher: Teacher) {
    this.userForLogin.set(teacher);
    this.view.set('pin-entry');
  }

  handleLogin() {
    const user = this.userForLogin();
    if (!user) return;

    if (this.attendanceService.verifyPin(user.id, this.enteredPin())) {
      this.attendanceService.setActiveUser(user.id);
    } else {
      this.pinError.set('Incorrect PIN. Please try again.');
      this.enteredPin.set('');
    }
  }
  
  onPinChange(value: string) {
    this.pinError.set('');
    this.enteredPin.set(value);
  }

  onResetErrorClear(value: string, field: 'answer' | 'pin' | 'confirm') {
    this.resetError.set('');
    if (field === 'answer') this.securityAnswer.set(value);
    if (field === 'pin') this.resetPin.set(value);
    if (field === 'confirm') this.confirmResetPin.set(value);
  }

  verifySecurityAnswer() {
    const user = this.userForLogin();
    if (!user) return;

    // Case-insensitive and trim whitespace
    if (this.securityAnswer().trim().toLowerCase() === user.securityAnswer.trim().toLowerCase()) {
      this.view.set('forgot-pin-reset');
    } else {
      this.resetError.set('Incorrect answer. Please try again.');
    }
  }

  saveNewPin() {
    if (this.resetPin() !== this.confirmResetPin()) {
      this.resetError.set('PINs do not match.');
      return;
    }
    if (this.resetPin().length !== 4) {
      this.resetError.set('New PIN must be exactly 4 digits.');
      return;
    }

    const user = this.userForLogin();
    if (!user) return;

    this.attendanceService.updatePin(user.id, this.resetPin());
    alert('PIN has been successfully updated! Please log in with your new PIN.');
    
    // Reset state and go back to PIN entry
    this.resetPin.set('');
    this.confirmResetPin.set('');
    this.securityAnswer.set('');
    this.enteredPin.set('');
    this.view.set('pin-entry');
  }

  resetToChoice() {
    this.userForLogin.set(null);
    this.enteredPin.set('');
    this.pinError.set('');
    this.securityAnswer.set('');
    this.resetPin.set('');
    this.confirmResetPin.set('');
    this.resetError.set('');
    this.view.set('choice');
  }

  completeSetup() {
    const details = {
      schoolName: this.schoolName(),
      name: this.userName(),
      mobile: this.mobileNumber(),
      className: this.className(),
      section: this.sectionName(),
      pin: this.pin(),
      securityQuestion: this.securityQuestion(),
      securityAnswer: this.setupSecurityAnswer()
    };

    if (this.setupRole() === 'coordinator') {
      this.attendanceService.createInitialCoordinator(details);
    } else {
      this.attendanceService.createInitialTeacher(details);
    }
  }
}
