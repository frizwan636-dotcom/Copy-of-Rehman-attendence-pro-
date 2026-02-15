import { Component, inject, signal, ChangeDetectionStrategy, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, Teacher } from '../services/attendance.service';

type ViewState = 'initial_choice' | 'coordinator_login' | 'coordinator_signup' | 'teacher_school_pin' | 'user_select' | 'pin';

@Component({
  selector: 'app-portal-choice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-indigo-100">
      
      @if (view() === 'initial_choice') {
        <div class="w-full max-w-2xl text-center animate-in fade-in zoom-in-95">
          <div class="mb-10">
            <h1 class="text-5xl font-black text-slate-800 tracking-tighter">Rehman Attendance Pro</h1>
            <p class="text-slate-500 mt-2 text-lg">Please select your role to continue</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button (click)="view.set('coordinator_login')" class="p-8 bg-white rounded-[2rem] shadow-xl border border-slate-200 flex flex-col items-center gap-4 hover:-translate-y-2 transition-transform duration-300">
              <div class="w-20 h-20 bg-green-100 text-green-500 rounded-3xl flex items-center justify-center text-4xl">
                <i class="fa-solid fa-sitemap"></i>
              </div>
              <h2 class="text-2xl font-bold text-slate-800">Coordinator Portal</h2>
              <p class="text-sm text-slate-500">Manage teachers, view school-wide summaries, and handle administrative tasks.</p>
            </button>
            <button (click)="handleTeacherPortalClick()" class="p-8 bg-white rounded-[2rem] shadow-xl border border-slate-200 flex flex-col items-center gap-4 hover:-translate-y-2 transition-transform duration-300">
              <div class="w-20 h-20 bg-indigo-100 text-indigo-500 rounded-3xl flex items-center justify-center text-4xl">
                <i class="fa-solid fa-user-tie"></i>
              </div>
              <h2 class="text-2xl font-bold text-slate-800">Teacher Portal</h2>
              <p class="text-sm text-slate-500">Mark student attendance, manage your class, and generate reports.</p>
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
                <input type="password" [(ngModel)]="signupForm.pin" placeholder="Create 4-Digit Login PIN" maxlength="4" inputmode="numeric" class="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm">
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

      @if(view() === 'teacher_school_pin') {
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
              <input type="text" [(ngModel)]="schoolPinInput" (keyup.enter)="connectToSchool()" placeholder="Enter School PIN" class="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-center font-bold tracking-wider">
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

      @if (view() === 'pin') {
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

          <button (click)="backToUserSelect()" class="mt-4 text-sm font-semibold text-slate-400 hover:text-indigo-600">
            Not {{ selectedUser()?.name }}? Switch User
          </button>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PortalChoiceComponent {
  attendanceService = inject(AttendanceService);
  
  view = signal<ViewState>('initial_choice');
  
  authForm = { email: '', password: '' };
  signupForm = { schoolName: '', name: '', mobile: '', pin: '', className: '', section: '' };
  
  schoolPinInput = signal('');

  allUsers = this.attendanceService.getTeachers;
  usersForSelection = computed(() => this.allUsers());
  selectedUser = signal<Teacher | null>(null);
  pin = signal('');
  
  isLoading = signal(false);
  errorMessage = signal('');

  schoolName = computed(() => {
    const coordinator = this.usersForSelection().find(u => u.role === 'coordinator');
    return coordinator?.schoolName || 'Your School';
  });

  async handleTeacherPortalClick() {
    const lastPin = localStorage.getItem('lastSchoolPin');
    if (lastPin) {
      this.schoolPinInput.set(lastPin);
      await this.connectToSchool();
    } else {
      this.view.set('teacher_school_pin');
    }
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
      const savedTeacherId = localStorage.getItem('lastSelectedTeacherId');
      const user = this.usersForSelection().find(u => u.id === savedTeacherId);
      if(user) {
        this.selectUser(user);
      } else {
        this.view.set('user_select');
      }
    } catch (e: any) {
      this.errorMessage.set(e.message);
      this.view.set('teacher_school_pin'); // Stay on this view on error
      localStorage.removeItem('lastSchoolPin');
    } finally {
      this.isLoading.set(false);
    }
  }
  
  selectUser(user: Teacher) {
    this.selectedUser.set(user);
    this.pin.set('');
    this.errorMessage.set('');
    this.view.set('pin');
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
    const user = this.selectedUser();
    if (!user) return;
    
    this.isLoading.set(true);
    const isValid = this.attendanceService.verifyPin(user.id, this.pin());
    
    if (isValid) {
      this.errorMessage.set('');
      if (user.role !== 'coordinator') {
        localStorage.setItem('lastSelectedTeacherId', user.id);
      }
      await this.attendanceService.setActiveUser(user.id);
    } else {
      this.errorMessage.set('Incorrect PIN. Please try again.');
      if (navigator.vibrate) navigator.vibrate(200);
      setTimeout(() => this.pin.set(''), 1000);
    }
    this.isLoading.set(false);
  }
}