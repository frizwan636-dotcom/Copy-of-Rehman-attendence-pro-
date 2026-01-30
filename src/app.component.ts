import { Component, inject, signal, OnInit, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceService } from './services/attendance.service';
import { DashboardComponent } from './components/dashboard.component';
import { CoordinatorDashboardComponent } from './components/coordinator-dashboard.component';
import { PortalChoiceComponent } from './components/portal-choice.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, DashboardComponent, CoordinatorDashboardComponent, PortalChoiceComponent],
  template: `
    <div class="min-h-screen">
      @if (!attendanceService.isInitialized()) {
        <div class="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 animate-in fade-in duration-500">
          <div class="text-center">
            <div class="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mb-6 mx-auto animate-pulse">
              <i class="fa-solid fa-clipboard-user text-5xl text-white"></i>
            </div>
            <h1 class="text-4xl font-black text-white tracking-tight">Rehman Attendance Pro</h1>
            <p class="text-indigo-200/60 mt-2">Loading your classroom data...</p>
          </div>
        </div>
      } @else {
        @if (attendanceService.activeUserRole()) {
          @if (attendanceService.activeUserRole() === 'coordinator') {
            <app-coordinator-dashboard />
          } @else {
            <app-dashboard />
          }
        } @else {
          <app-portal-choice />
        }
      }

      <!-- Footer Branding -->
      <footer class="fixed bottom-0 w-full p-4 text-center text-slate-400 text-xs pointer-events-none">
        This app is created by Rizwan Hanif
      </footer>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  attendanceService = inject(AttendanceService);

  ngOnInit() {
    this.attendanceService.initialize();
  }
}
