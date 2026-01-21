import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../services/attendance.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900">
      <div class="max-w-md w-full glass p-8 rounded-[2.5rem] shadow-2xl border border-white/10 relative overflow-hidden">
        
        <div class="absolute -top-20 -left-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>

        <div class="text-center mb-8 relative">
          <div class="flex p-1 bg-white/5 border border-white/10 rounded-full w-fit mx-auto mb-6">
            <button (click)="userType.set('teacher')" [class]="userType() === 'teacher' ? 'px-6 py-2 bg-indigo-600 text-white rounded-full font-bold text-sm shadow-lg' : 'px-6 py-2 text-indigo-200/60 font-medium text-sm'">
              Teacher Portal
            </button>
            <button (click)="userType.set('coordinator')" [class]="userType() === 'coordinator' ? 'px-6 py-2 bg-green-600 text-white rounded-full font-bold text-sm shadow-lg' : 'px-6 py-2 text-indigo-200/60 font-medium text-sm'">
              Coordinator Portal
            </button>
          </div>
          <h1 class="text-3xl font-black text-white tracking-tight">Rehman Attendance Pro</h1>
          <p [class]="userType() === 'teacher' ? 'text-indigo-200/60' : 'text-green-200/60'" class="mt-1 text-sm font-medium transition-colors">
            Secure {{ userType() === 'teacher' ? 'Teacher' : 'Coordinator' }} Access
          </p>
        </div>

        @if (mode() === 'login') {
          <!-- Login Section -->
          <div class="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div class="text-center">
              <h2 class="text-white font-bold text-xl">Login</h2>
              <p class="text-indigo-300/60 text-sm">Welcome back! Please sign in.</p>
            </div>
            <div class="space-y-4">
              <!-- Fix: Use [ngModel] and (ngModelChange) for signal-based two-way binding -->
              <input type="text" [ngModel]="userName()" (ngModelChange)="userName.set($event)" placeholder="Enter Your Full Name"
                class="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium">
              <!-- Fix: Use [ngModel] and (ngModelChange) for signal-based two-way binding -->
              <input type="password" [ngModel]="password()" (ngModelChange)="password.set($event)" placeholder="Password" (keyup.enter)="handleLogin()"
                class="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium">
            </div>
            @if (errorMessage()) {
              <p class="text-red-400 text-xs font-bold text-center animate-in fade-in">{{ errorMessage() }}</p>
            }
            <button (click)="handleLogin()" [disabled]="!userName() || !password()"
              class="w-full py-5 text-white rounded-2xl font-black shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              [class.bg-indigo-600]="userType() === 'teacher'"
              [class.hover:bg-indigo-500]="userType() === 'teacher'"
              [class.bg-green-600]="userType() === 'coordinator'"
              [class.hover:bg-green-500]="userType() === 'coordinator'">
              Login
            </button>
            <button (click)="switchMode('register')" class="w-full text-center text-indigo-400 text-xs font-black uppercase tracking-widest hover:text-white transition-colors">
              Don't have an account? Sign Up
            </button>
          </div>
        } @else {
          <!-- Registration Section -->
          <div class="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div class="text-center">
              <h2 class="text-white font-bold text-xl">Create Account</h2>
              <p class="text-indigo-300/60 text-sm">Get started with your new account.</p>
            </div>
            <div class="space-y-4">
              <!-- Fix: Use [ngModel] and (ngModelChange) for signal-based two-way binding -->
              <input type="text" [ngModel]="userName()" (ngModelChange)="userName.set($event)" placeholder="Enter Your Full Name"
                class="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium">
              <!-- Fix: Use [ngModel] and (ngModelChange) for signal-based two-way binding -->
              <input type="password" [ngModel]="password()" (ngModelChange)="password.set($event)" placeholder="Create Password"
                class="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium">
              <!-- Fix: Use [ngModel] and (ngModelChange) for signal-based two-way binding -->
              <input type="password" [ngModel]="confirmPassword()" (ngModelChange)="confirmPassword.set($event)" placeholder="Confirm Password" (keyup.enter)="handleRegister()"
                class="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium">
            </div>
            @if (errorMessage()) {
              <p class="text-red-400 text-xs font-bold text-center animate-in fade-in">{{ errorMessage() }}</p>
            }
            <button (click)="handleRegister()" [disabled]="!userName() || !password() || !confirmPassword()"
              class="w-full py-5 text-white rounded-2xl font-black shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              [class.bg-indigo-600]="userType() === 'teacher'"
              [class.hover:bg-indigo-500]="userType() === 'teacher'"
              [class.bg-green-600]="userType() === 'coordinator'"
              [class.hover:bg-green-500]="userType() === 'coordinator'">
              Register & Continue
            </button>
            <button (click)="switchMode('login')" class="w-full text-center text-indigo-400 text-xs font-black uppercase tracking-widest hover:text-white transition-colors">
              Already have an account? Login
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent {
  attendanceService = inject(AttendanceService);
  
  userType = signal<'teacher' | 'coordinator'>('teacher');
  mode = signal<'login' | 'register'>('login');

  userName = signal('');
  password = signal('');
  confirmPassword = signal('');
  errorMessage = signal('');

  switchMode(newMode: 'login' | 'register') {
    this.mode.set(newMode);
    this.userName.set('');
    this.password.set('');
    this.confirmPassword.set('');
    this.errorMessage.set('');
  }

  handleLogin() {
    this.errorMessage.set('');
    const isValid = this.attendanceService.verifyPassword(this.userName(), this.userType(), this.password());
    if (isValid) {
      this.attendanceService.login(this.userName(), this.userType());
    } else {
      this.errorMessage.set('Invalid credentials. Please check your name and password.');
    }
  }

  handleRegister() {
    this.errorMessage.set('');
    
    if (this.attendanceService.isUserRegistered(this.userName(), this.userType())) {
      this.errorMessage.set('This user name is already registered. Please login.');
      return;
    }
    
    if (this.password() !== this.confirmPassword()) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }
    if (this.password().length < 6) {
        this.errorMessage.set('Password must be at least 6 characters long.');
        return;
    }

    if (this.userType() === 'teacher') {
      this.attendanceService.registerTeacher(this.userName(), this.password());
    } else {
      this.attendanceService.registerCoordinator(this.userName(), this.password());
    }
  }
}
