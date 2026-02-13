import { Component, inject, signal, OnInit, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceService } from './services/attendance.service';
import { DashboardComponent } from './components/dashboard.component';
import { CoordinatorDashboardComponent } from './components/coordinator-dashboard.component';
import { PortalChoiceComponent } from './components/portal-choice.component';
import { SplashScreenComponent } from './components/splash-screen.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, DashboardComponent, CoordinatorDashboardComponent, PortalChoiceComponent, SplashScreenComponent],
  template: `
    <div class="min-h-screen">
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
                  <h1 class="text-4xl font-black text-white tracking-tight">Rehman Attendance Pro</h1>
                  <p class="text-indigo-200/60 mt-2">Connecting to your database...</p>
                </div>
              </div>
            } @else {
              @if (isPinLoggedIn()) {
                @if (attendanceService.activeUserRole() === 'coordinator') {
                  <app-coordinator-dashboard />
                } @else {
                  <app-dashboard />
                }
              } @else {
                <app-portal-choice />
              }
            }
          </main>
          @if (attendanceService.isInitialized()) {
             <footer class="text-center p-4 text-xs text-slate-400 bg-slate-50 border-t flex-shrink-0">
              This application is the result of the tireless hard work and dedication of Rizwan Hanif.
            </footer>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  attendanceService = inject(AttendanceService);

  showSplash = signal(true);
  hidingSplash = signal(false);

  isPinLoggedIn = computed(() => !!this.attendanceService.activeUserRole());

  ngOnInit() {
    // Start loading data in the background, the splash screen will wait for its animation.
    this.attendanceService.initialize();
  }

  onSplashAnimationFinished() {
    this.hidingSplash.set(true); // Start fade-out animation
    setTimeout(() => {
      this.showSplash.set(false); // Remove splash screen from DOM after animation
    }, 500); // This duration must match the fade-out animation duration
  }
}