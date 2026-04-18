import { Component, inject, signal, OnInit, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceService } from './services/attendance.service';
import { DashboardComponent } from './components/dashboard.component';
import { CoordinatorDashboardComponent } from './components/coordinator-dashboard.component';
import { StudentPortalComponent } from './components/student-portal.component';
import { PortalChoiceComponent } from './components/portal-choice.component';
import { SplashScreenComponent } from './components/splash-screen.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DashboardComponent, CoordinatorDashboardComponent, StudentPortalComponent, PortalChoiceComponent, SplashScreenComponent],
  template: `
    <div [class]="isDarkMode() ? 'dark' : ''" [dir]="isRtl() ? 'rtl' : 'ltr'" class="min-h-screen">
      <div class="dark:bg-slate-900 dark:text-white min-h-screen">
        <!-- Removed Theme and Language Toggle as per user request -->

      @if (showSplash()) {
        <div [class]="hidingSplash() ? 'transition-opacity duration-500 opacity-0' : 'transition-opacity duration-500 opacity-100'">
          <app-splash-screen (animationFinished)="onSplashAnimationFinished()" />
        </div>
      } @else {
        <div class="min-h-screen flex flex-col animate-in fade-in duration-500">
          <main class="flex-grow">
            @if (!attendanceService.isInitialized()) {
              <div class="h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900">
                <div class="text-center">
                  <div class="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mb-6 mx-auto animate-pulse">
                    <i class="fa-solid fa-clipboard-user text-5xl text-white"></i>
                  </div>
                  <h1 class="text-4xl font-black text-white tracking-tight">MustEducate</h1>
                  <p class="text-indigo-200/60 mt-2 font-medium tracking-wide uppercase text-xs">Smart Management System</p>
                </div>
              </div>
            } @else {
              @if (isPinLoggedIn()) {
                @defer {
                  @if (attendanceService.activeUserRole() === 'coordinator') {
                    <app-coordinator-dashboard />
                  } @else if (attendanceService.activeUserRole() === 'teacher') {
                    <app-dashboard />
                  } @else {
                    <app-student-portal />
                  }
                } @placeholder {
                  <div class="h-full flex flex-col items-center justify-center p-12">
                    <i class="fa-solid fa-circle-notch fa-spin text-5xl text-indigo-500 mb-6 drop-shadow-md"></i>
                    <h2 class="text-2xl font-black text-slate-800 tracking-tight">Accessing Portal...</h2>
                    <p class="text-slate-500 font-medium mt-2">Please wait while your data is securely loaded.</p>
                  </div>
                }
              } @else {
                <app-portal-choice />
              }
            }
          </main>
          @if (attendanceService.isInitialized()) {
             <footer class="text-center p-4 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 border-t flex-shrink-0">
              This application is the result of the tireless hard work and dedication of Rizwan Hanif.
            </footer>
          }
        </div>
      }
      </div>
    </div>

    <!-- Global Toast Notification -->
    @if (attendanceService.toast(); as toast) {
      <div class="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-4">
        <div [class]="toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-rose-600' : 'bg-slate-800'"
             class="px-6 py-3 rounded-2xl text-white font-bold shadow-2xl flex items-center gap-3 whitespace-nowrap">
          <i [class]="toast.type === 'success' ? 'fa-solid fa-circle-check' : toast.type === 'error' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-info'"></i>
          {{ toast.message }}
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  attendanceService = inject(AttendanceService);

  showSplash = signal(true);
  hidingSplash = signal(false);

  isDarkMode = this.attendanceService.isDarkMode;
  isRtl = this.attendanceService.isRtl;

  isPinLoggedIn = computed(() => !!this.attendanceService.activeUserRole());

  ngOnInit() {
    // Start loading data in the background, the splash screen will wait for its animation.
    this.attendanceService.initialize();
    
    // Safety timeout: if splash animation doesn't finish for some reason, hide it after 10s
    setTimeout(() => {
      if (this.showSplash()) {
        this.onSplashAnimationFinished();
      }
    }, 10000);
  }

  onSplashAnimationFinished() {
    if (this.hidingSplash()) return;
    this.hidingSplash.set(true); // Start fade-out animation
    setTimeout(() => {
      this.showSplash.set(false); // Remove splash screen from DOM after animation
    }, 500);
  }
}