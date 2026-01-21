import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceService } from './services/attendance.service';
import { LoginComponent } from './components/login.component';
import { SetupWizardComponent } from './components/setup-wizard.component';
import { DashboardComponent } from './components/dashboard.component';
import { CoordinatorDashboardComponent } from './components/coordinator-dashboard.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, LoginComponent, SetupWizardComponent, DashboardComponent, CoordinatorDashboardComponent],
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
        @if (attendanceService.activeCoordinator(); as coordinator) {
          <app-coordinator-dashboard />
        } @else if (attendanceService.activeTeacher(); as teacher) {
          @if (!teacher.setupComplete || attendanceService.activeStudents().length === 0) {
            <app-setup-wizard />
          } @else {
            <app-dashboard />
          }
        } @else {
          <app-login />
        }
      }

      <!-- Footer Branding -->
      <footer class="fixed bottom-0 w-full p-4 text-center text-slate-400 text-xs pointer-events-none">
        This app is created by Rizwan Hanif
      </footer>
    </div>
  `
})
export class AppComponent implements OnInit {
  attendanceService = inject(AttendanceService);

  ngOnInit() {
    this.attendanceService.initialize();
  }
}
