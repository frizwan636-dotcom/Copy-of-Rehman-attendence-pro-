import { Component, inject, signal, ChangeDetectionStrategy, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, Teacher } from '../services/attendance.service';

type ViewState = 'initial_choice' | 'coordinator_login' | 'coordinator_signup' | 'school_pin' | 'user_select' | 'pin' | 'student_login' | 'parent_login' | 'student_pin' | 'parent_pin' | 'child_select';

@Component({
  selector: 'app-portal-choice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <style>
      .gradient-text {
        background: linear-gradient(
          to right, 
          #00f2fe, #4facfe, #8a2be2, #ff0844, #00f2fe
        );
        background-size: 300% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: futuristic-gradient 4s linear infinite;
        text-shadow: 0px 4px 20px rgba(138, 43, 226, 0.4);
      }
      @keyframes futuristic-gradient {
        0% { background-position: 0% center; }
        50% { background-position: 100% center; }
        100% { background-position: 0% center; }
      }
      .welcome-badge {
        background: linear-gradient(90deg, rgba(79,70,229,0.1) 0%, rgba(236,72,153,0.1) 100%);
        border: 1px solid rgba(138, 43, 226, 0.2);
        box-shadow: 0 0 10px rgba(0, 242, 254, 0.2) inset;
      }
      .cyber-card {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.6);
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
        position: relative;
        overflow: hidden;
      }
      .cyber-card::before {
        content: "";
        position: absolute;
        top: 0; left: -100%; width: 100%; height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
        transition: 0.5s;
        z-index: 1;
      }
      .cyber-card:hover::before {
        left: 100%;
      }
      .icon-glow {
        box-shadow: 0 0 20px currentColor;
      }
      
      /* Specific text gradients for titles */
      .coord-gradient { background: linear-gradient(to right, #059669, #10b981); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      .teach-gradient { background: linear-gradient(to right, #4f46e5, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      .stud-gradient { background: linear-gradient(to right, #0284c7, #0ea5e9); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      .par-gradient { background: linear-gradient(to right, #e11d48, #f43f5e); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    </style>
    <div class="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50 relative overflow-hidden">
      
      <!-- Futuristic decorative elements -->
      <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div class="absolute -top-40 -right-40 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style="animation-delay: 2s"></div>
        <div class="absolute top-40 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style="animation-delay: 1.4s"></div>
      </div>

      <div class="z-10 w-full max-w-5xl">
        <div class="absolute top-4 right-4 flex gap-2 z-50">
           <button (click)="attendanceService.toggleDarkMode()" [title]="isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode'" class="p-2.5 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors cyber-card flex items-center justify-center">
             <i class="fa-solid" [class]="isDarkMode() ? 'fa-sun' : 'fa-moon'"></i>
          </button>
          <button (click)="attendanceService.toggleRtl()" [title]="isRtl() ? 'Switch to LTR' : 'Switch to RTL'" class="p-2.5 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors cyber-card flex items-center justify-center">
             <i class="fa-solid fa-language"></i>
          </button>
        </div>
        @if (view() === 'initial_choice') {
          <div class="w-full text-center animate-in fade-in zoom-in-95 duration-500">
            <div class="mb-14 px-2 flex flex-col items-center">
              <span class="welcome-badge px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] text-indigo-600 mb-6 inline-flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                Welcome To
              </span>
              <h1 class="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter gradient-text break-words px-4 py-2 leading-tight">MustEducate</h1>
              <p class="text-slate-500 mt-6 text-sm sm:text-xl font-medium max-w-2xl mx-auto">The Next-Generation Smart Attendance & Management Ecosystem</p>
            </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Coordinator -->
            <button (click)="view.set('coordinator_login')" class="cyber-card p-8 rounded-[2rem] flex flex-col items-center gap-5 hover:-translate-y-3 transition-all duration-300 group border-b-4 hover:border-emerald-400">
              <div class="w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-300 icon-glow relative z-10 border border-emerald-200">
                <i class="fa-solid fa-shield-halved group-hover:rotate-12 transition-transform"></i>
              </div>
              <h2 class="text-2xl font-black coord-gradient tracking-tight">Coordinator</h2>
              <p class="text-xs text-slate-500 leading-relaxed font-medium">Full admin control & analytics.</p>
            </button>

            <!-- Teacher -->
            <button (click)="handlePortalClick('teacher')" class="cyber-card p-8 rounded-[2rem] flex flex-col items-center gap-5 hover:-translate-y-3 transition-all duration-300 group border-b-4 hover:border-indigo-400">
              <div class="w-20 h-20 bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-300 icon-glow relative z-10 border border-indigo-200">
                <i class="fa-solid fa-user-tie group-hover:rotate-12 transition-transform"></i>
              </div>
              <h2 class="text-2xl font-black teach-gradient tracking-tight">Teacher</h2>
              <p class="text-xs text-slate-500 leading-relaxed font-medium">Classroom & student management.</p>
            </button>

            <!-- Student -->
            <button (click)="handlePortalClick('student')" class="cyber-card p-8 rounded-[2rem] flex flex-col items-center gap-5 hover:-translate-y-3 transition-all duration-300 group border-b-4 hover:border-sky-400">
              <div class="w-20 h-20 bg-gradient-to-br from-sky-100 to-sky-50 text-sky-500 rounded-3xl flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-300 icon-glow relative z-10 border border-sky-200">
                <i class="fa-solid fa-user-graduate group-hover:rotate-12 transition-transform"></i>
              </div>
              <h2 class="text-2xl font-black stud-gradient tracking-tight">Student</h2>
              <p class="text-xs text-slate-500 leading-relaxed font-medium">View attendance & fee status.</p>
            </button>

            <!-- Parent -->
            <button (click)="handlePortalClick('parent')" class="cyber-card p-8 rounded-[2rem] flex flex-col items-center gap-5 hover:-translate-y-3 transition-all duration-300 group border-b-4 hover:border-rose-400">
              <div class="w-20 h-20 bg-gradient-to-br from-rose-100 to-rose-50 text-rose-500 rounded-3xl flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-300 icon-glow relative z-10 border border-rose-200">
                <i class="fa-solid fa-users-rectangle group-hover:rotate-12 transition-transform"></i>
              </div>
              <h2 class="text-2xl font-black par-gradient tracking-tight">Parent</h2>
              <p class="text-xs text-slate-500 leading-relaxed font-medium">Monitor child's daily progress.</p>
            </button>
          </div>
        </div>
      }

      @if (view() === 'coordinator_login' || view() === 'coordinator_signup') {
        <div class="w-full max-w-md p-8 bg-white rounded-[2rem] shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 relative">
          <button (click)="view.set('initial_choice')" class="absolute top-6 left-6 flex items-center gap-2 text-slate-400 font-bold hover:text-indigo-600 text-sm transition-colors">
            <i class="fa-solid fa-arrow-left"></i> Back
          </button>
          <div class="text-center mb-8">
            <h1 class="text-3xl font-black text-slate-800 tracking-tight">
              {{ view() === 'coordinator_login' ? 'Coordinator Login' : 'Coordinator Setup' }}
            </h1>
            <p class="text-slate-500 text-sm mt-1">
              {{ view() === 'coordinator_login' ? 'Access your school dashboard' : 'Create your school administrator account' }}
            </p>
          </div>

          <div class="space-y-3">
             @if (view() === 'coordinator_signup') {
                <input type="text" [(ngModel)]="signupForm.schoolName" placeholder="School Name" class="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm">
                <input type="text" [(ngModel)]="signupForm.name" placeholder="Your Full Name" class="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm">
             }
            <input type="email" [(ngModel)]="authForm.email" placeholder="Email Address" class="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm">
            <input type="password" [(ngModel)]="authForm.password" placeholder="Password" class="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm">
             @if (view() === 'coordinator_signup') {
                <input type="tel" [(ngModel)]="signupForm.mobile" placeholder="Your Mobile Number" class="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm">
                 <div class="grid grid-cols-2 gap-3">
                    <input type="text" [(ngModel)]="signupForm.className" placeholder="Your Class" class="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm">
                    <input type="text" [(ngModel)]="signupForm.section" placeholder="Your Section" class="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm">
                 </div>
                <input type="password" [(ngModel)]="signupForm.pin" placeholder="Create 4-Digit Login PIN" maxlength="4" inputmode="numeric" class="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-center font-bold">
             }
          </div>

          @if(errorMessage()) {
            <p class="text-red-600 bg-red-50 text-center font-bold text-sm mt-4 p-3 rounded-lg">{{ errorMessage() }}</p>
          }

          <button (click)="handleCoordinatorAuthAction()" [disabled]="isLoading()" class="w-full py-4 mt-6 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center">
            @if(isLoading()) {
              <i class="fa-solid fa-spinner animate-spin mr-2"></i>
              <span>Processing...</span>
            } @else {
              <span>{{ view() === 'coordinator_login' ? 'Login Securely' : 'Create Account' }}</span>
            }
          </button>
          
          <div class="text-center mt-6">
            <button (click)="toggleCoordinatorView()" class="text-sm font-bold text-indigo-600 hover:underline">
               {{ view() === 'coordinator_login' ? 'Don\\'t have an account? Sign Up' : 'Already have an account? Login' }}
            </button>
          </div>
        </div>
      }

      @if(view() === 'school_pin') {
        <div class="w-full max-w-md p-8 bg-white rounded-[2rem] shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 relative text-center">
            <button (click)="view.set('initial_choice')" class="absolute top-6 left-6 flex items-center gap-2 text-slate-400 font-bold hover:text-indigo-600 text-sm transition-colors">
              <i class="fa-solid fa-arrow-left"></i> Back
            </button>
            <div class="w-24 h-24 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center text-5xl mx-auto mb-6">
              <i class="fa-solid fa-school"></i>
            </div>
            <h1 class="text-3xl font-black text-slate-800 tracking-tight">Connect to Your School</h1>
            <p class="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
              Please enter the School PIN provided by your coordinator.
            </p>
            <div class="mt-6">
              <input type="text" [ngModel]="schoolPinInput()" (ngModelChange)="schoolPinInput.set($event)" (keyup.enter)="connectToSchool()" placeholder="Enter School PIN" class="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-center font-bold tracking-wider">
               @if(errorMessage()) {
                <p class="text-red-600 bg-red-50 font-bold text-sm mt-3 p-3 rounded-lg">{{ errorMessage() }}</p>
              }
              <button (click)="connectToSchool()" [disabled]="isLoading()" class="w-full py-4 mt-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center">
                 @if(isLoading()) {
                    <i class="fa-solid fa-spinner animate-spin mr-2"></i>
                    <span>Connecting...</span>
                 } @else {
                    <span>Connect</span>
                 }
              </button>
            </div>
        </div>
      }

      @if (view() === 'user_select') {
         <div class="w-full max-w-3xl text-center animate-in fade-in zoom-in-95">
            <h2 class="text-3xl font-black text-slate-800 tracking-tight mb-2">Welcome to {{ schoolName() }}</h2>
            <p class="text-slate-500 mb-8">Please select your profile to continue.</p>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              @for(user of usersForSelection(); track user.id) {
                <button (click)="selectUser(user)" class="p-4 bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col items-center gap-3 hover:-translate-y-1 transition-transform">
                   <div class="w-20 h-20 rounded-full bg-slate-100 border-4 border-white overflow-hidden flex items-center justify-center"
                     [class]="user.role === 'coordinator' ? 'border-green-300' : 'border-indigo-300'">
                      @if(user.photo) {
                        <img [src]="user.photo" class="w-full h-full object-cover">
                      } @else {
                         @if(user.role === 'coordinator') {
                           <i class="fa-solid fa-sitemap text-4xl text-green-300"></i>
                         } @else {
                           <i class="fa-solid fa-user-tie text-4xl text-indigo-300"></i>
                         }
                      }
                   </div>
                   <span class="font-bold text-slate-700">{{ user.name }}</span>
                </button>
              }
            </div>
             <button (click)="handleFullLogout()" class="mt-8 text-slate-500 font-semibold hover:text-red-600 transition-colors">
              <i class="fa-solid fa-right-from-bracket mr-2"></i>Logout & Switch School
            </button>
         </div>
      }

      @if (view() === 'child_select') {
        <div class="w-full max-w-md p-8 bg-white rounded-[2rem] shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 relative">
          <button (click)="view.set('parent_login')" class="absolute top-6 left-6 flex items-center gap-2 text-slate-400 font-bold hover:text-indigo-600 text-sm transition-colors">
            <i class="fa-solid fa-arrow-left"></i> Back
          </button>
          <div class="text-center mb-8">
            <h1 class="text-3xl font-black text-slate-800 tracking-tight">Select Child</h1>
            <p class="text-slate-500 text-sm mt-1">Multiple children found for this mobile number</p>
          </div>
          <div class="space-y-3">
            @for (child of parentChildren(); track child.id) {
              <button (click)="selectChild(child)" class="w-full p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-xl flex items-center justify-between group transition-all">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold">
                    {{ child.rollNumber }}
                  </div>
                  <div class="text-left">
                    <p class="font-bold text-slate-800">{{ child.name }}</p>
                    <p class="text-xs text-slate-500">{{ child.className }} - {{ child.section }}</p>
                  </div>
                </div>
                <i class="fa-solid fa-chevron-right text-slate-300 group-hover:text-indigo-500 transition-colors"></i>
              </button>
            }
          </div>
        </div>
      }

      @if (view() === 'pin' || view() === 'student_pin' || view() === 'parent_pin') {
        <div class="w-full max-w-sm text-center animate-in fade-in zoom-in-95">
          <div class="w-24 h-24 bg-white rounded-full mx-auto mb-4 overflow-hidden border-4 shadow-md flex items-center justify-center"
            [class]="selectedUser()?.role === 'coordinator' ? 'border-green-300' : 'border-indigo-300'">
            @if(selectedUser()?.photo) {
              <img [src]="selectedUser()?.photo" class="w-full h-full object-cover">
            } @else {
              <i class="fa-solid text-5xl" 
                [class]="selectedUser()?.role === 'coordinator' ? 'fa-sitemap text-green-300' : 'fa-user-tie text-indigo-300'"></i>
            }
          </div>

          <h2 class="text-2xl font-bold text-slate-800">Welcome, {{ selectedUser()?.name || selectedStudent()?.name }}</h2>
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

          <button (click)="backToInitial()" class="mt-4 text-sm font-semibold text-slate-400 hover:text-indigo-600">
            Go Back
          </button>
        </div>
      }

      @if (view() === 'student_login' || view() === 'parent_login') {
        <div class="w-full max-w-md p-8 bg-white rounded-[2rem] shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 relative text-center">
            <button (click)="view.set('initial_choice')" class="absolute top-6 left-6 flex items-center gap-2 text-slate-400 font-bold hover:text-indigo-600 text-sm transition-colors">
              <i class="fa-solid fa-arrow-left"></i> Back
            </button>
            <div class="w-24 h-24 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center text-5xl mx-auto mb-6">
              <i class="fa-solid" [class]="view() === 'student_login' ? 'fa-user-graduate' : 'fa-users-rectangle'"></i>
            </div>
            <h1 class="text-3xl font-black text-slate-800 tracking-tight">
              {{ view() === 'student_login' ? 'Student Login' : 'Parent Login' }}
            </h1>
            <p class="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
              {{ view() === 'student_login' ? 'Enter your Roll Number to access your portal.' : 'Enter your registered Mobile Number.' }}
            </p>
            <div class="mt-6 space-y-3">
              @if (view() === 'student_login') {
                <select [(ngModel)]="selectedClass" class="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold tracking-wider">
                  <option value="">Select Class</option>
                  @for (c of attendanceService.allSchoolClasses(); track c.className + c.section) {
                    <option [value]="c.className">{{ c.className }}</option>
                  }
                </select>
                <select [(ngModel)]="selectedSection" class="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold tracking-wider">
                  <option value="">Select Section</option>
                  @for (s of getSectionsForClass(); track s) {
                    <option [value]="s">{{ s }}</option>
                  }
                </select>
              }
              <input type="text" [ngModel]="studentIdInput()" (ngModelChange)="studentIdInput.set($event)" (keyup.enter)="findStudent()" [placeholder]="view() === 'student_login' ? 'Enter Roll Number' : 'Enter Mobile Number'" class="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-center font-bold tracking-wider">
               @if(errorMessage()) {
                <p class="text-red-600 bg-red-50 font-bold text-sm mt-3 p-3 rounded-lg">{{ errorMessage() }}</p>
              }
              <button (click)="findStudent()" [disabled]="isLoading()" class="w-full py-4 mt-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center">
                 @if(isLoading()) {
                    <i class="fa-solid fa-spinner animate-spin mr-2"></i>
                    <span>Searching...</span>
                 } @else {
                    <span>Continue</span>
                 }
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
  
  view = signal<ViewState>('initial_choice');
  portalRole = signal<'teacher' | 'student' | 'parent' | null>(null);

  isDarkMode = this.attendanceService.isDarkMode;
  isRtl = this.attendanceService.isRtl;
  
  authForm = { email: '', password: '' };
  signupForm = { schoolName: '', name: '', mobile: '', pin: '', className: '', section: '' };
  
  schoolPinInput = signal('');
  studentIdInput = signal('');
  
  selectedClass = signal('');
  selectedSection = signal('');

  getSectionsForClass = computed(() => {
    const className = this.selectedClass();
    if (!className) return [];
    return Array.from(new Set(this.attendanceService.allSchoolClasses()
      .filter(c => c.className === className)
      .map(c => c.section)));
  });

  allUsers = this.attendanceService.getTeachers;
  usersForSelection = computed(() => this.allUsers());
  selectedUser = signal<Teacher | null>(null);
  selectedStudent = signal<any | null>(null);
  parentChildren = signal<any[]>([]);
  pin = signal('');
  errorMessage = signal('');
  isLoading = signal(false);

  schoolName = computed(() => {
    const coordinator = this.usersForSelection().find(u => u.role === 'coordinator');
    return coordinator?.schoolName || 'Your School';
  });

  async handlePortalClick(role: 'teacher' | 'student' | 'parent') {
    this.portalRole.set(role);
    this.schoolPinInput.set(''); // Clear previous PIN
    this.view.set('school_pin');
  }

  toggleCoordinatorView() {
    this.errorMessage.set('');
    this.view.set(this.view() === 'coordinator_login' ? 'coordinator_signup' : 'coordinator_login');
  }

  async handleCoordinatorAuthAction() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      if (this.view() === 'coordinator_login') {
        await this.attendanceService.login(this.authForm.email, this.authForm.password);
      } else {
        await this.attendanceService.signUpCoordinator({ ...this.authForm, ...this.signupForm });
      }
    } catch (e: any) { 
        this.errorMessage.set(e.message); 
    } finally { 
        this.isLoading.set(false); 
    }
  }

  async connectToSchool() {
    const pin = this.schoolPinInput().trim();
    if (!pin) {
        this.errorMessage.set('Please enter a School PIN.');
        return;
    }
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      await this.attendanceService.loadSchoolByPin(pin);
      localStorage.setItem('lastSchoolPin', pin);
      
      const role = this.portalRole();
      if (role === 'teacher') {
        this.view.set('user_select');
      } else if (role === 'student') {
        this.view.set('student_login');
      } else if (role === 'parent') {
        this.view.set('parent_login');
      }
    } catch (e: any) {
      this.errorMessage.set(e.message);
      this.view.set('school_pin');
      localStorage.removeItem('lastSchoolPin');
    } finally {
      this.isLoading.set(false);
    }
  }

  findStudent() {
    const input = this.studentIdInput().trim();
    if (!input) {
      this.errorMessage.set('Please enter your details.');
      return;
    }

    const students = this.attendanceService.allSchoolStudents();
    if (this.view() === 'student_login') {
      if (!this.selectedClass() || !this.selectedSection()) {
        this.errorMessage.set('Please select class and section.');
        return;
      }
      const student = students.find(s => 
        s.className === this.selectedClass() && 
        s.section === this.selectedSection() && 
        s.rollNumber.toLowerCase() === input.toLowerCase()
      );
      if (student) {
        this.selectedStudent.set(student);
        this.errorMessage.set('');
        // Directly login student without PIN as requested
        this.attendanceService.setActiveUser(student.id, 'student');
      } else {
        this.errorMessage.set('No student found with these details.');
      }
    } else {
      // Parent login via mobile number
      const matchingStudents = students.filter(s => s.mobileNumber === input);
      if (matchingStudents.length > 0) {
        this.parentChildren.set(matchingStudents);
        this.errorMessage.set('');
        if (matchingStudents.length === 1) {
          // Skip PIN for parents as requested
          this.attendanceService.setActiveUser(matchingStudents[0].id, 'parent');
        } else {
          this.view.set('child_select');
        }
      } else {
        this.errorMessage.set('No students found with this mobile number.');
      }
    }
  }

  selectChild(student: any) {
    // Skip PIN for parents as requested
    this.attendanceService.setActiveUser(student.id, 'parent');
  }
  
  selectUser(user: Teacher) {
    this.selectedUser.set(user);
    this.pin.set('');
    this.errorMessage.set('');
    this.view.set('pin');
  }

  backToInitial() {
    this.view.set('initial_choice');
    this.selectedUser.set(null);
    this.selectedStudent.set(null);
    this.pin.set('');
  }

  backToUserSelect() {
    localStorage.removeItem('lastSelectedTeacherId');
    this.view.set('user_select');
    this.selectedUser.set(null);
    this.pin.set('');
    this.errorMessage.set('');
  }
  
  async handleFullLogout() {
    localStorage.removeItem('lastSchoolPin');
    localStorage.removeItem('lastSelectedTeacherId');
    this.schoolPinInput.set('');
    await this.attendanceService.logout();
    this.view.set('initial_choice');
  }

  appendPin(num: string) {
    if (this.pin().length < 4) {
      this.pin.update(p => p + num);
      if (this.pin().length === 4) { this.submitPin(); }
    }
  }

  clearPin() { this.pin.set(''); }
  backspacePin() { this.pin.update(p => p.slice(0, -1)); }

  async submitPin() {
    this.isLoading.set(true);
    // Yield to the browser so the loading spinner can render before mounting heavy portals
    await new Promise(resolve => setTimeout(resolve, 50));
    
    let isValid = false;
    const role = this.portalRole();

    if (this.view() === 'pin') {
      const user = this.selectedUser();
      if (user) {
        isValid = this.attendanceService.verifyPin(user.id, this.pin());
        if (isValid) {
          if (user.role !== 'coordinator') {
            localStorage.setItem('lastSelectedTeacherId', user.id);
          }
          await this.attendanceService.setActiveUser(user.id);
        }
      }
    } else {
      const student = this.selectedStudent();
      if (student) {
        isValid = this.attendanceService.verifyStudentPin(student.id, this.pin());
        if (isValid) {
          await this.attendanceService.setActiveUser(student.id, this.view() === 'student_pin' ? 'student' : 'parent');
        }
      }
    }

    if (!isValid) {
      this.errorMessage.set('Incorrect PIN. Please try again.');
      if (navigator.vibrate) navigator.vibrate(200);
      setTimeout(() => this.pin.set(''), 1000);
    }
    this.isLoading.set(false);
  }
}