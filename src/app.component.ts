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
          <app-splash-screen />
        </div>
      } @else {
        <div class="animate-in fade-in duration-500">
          @if (!attendanceService.isInitialized()) {
            <div class="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900">
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
  private readonly MIN_SPLASH_DURATION = 8000; // Increased to allow animation to complete

  isPinLoggedIn = computed(() => !!this.attendanceService.activeUserRole());

  ngOnInit() {
    const startTime = Date.now();
    
    this.attendanceService.initialize().then(() => {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = this.MIN_SPLASH_DURATION - elapsedTime;
      
      setTimeout(() => {
        this.hidingSplash.set(true); // Start fade-out
        setTimeout(() => {
          this.showSplash.set(false); // Remove from DOM after animation
        }, 500); // Must match fade-out duration
      }, Math.max(0, remainingTime));
    });
  }
}
