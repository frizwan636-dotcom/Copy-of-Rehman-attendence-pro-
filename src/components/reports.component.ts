
import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../services/attendance.service';
import { PdfService } from '../services/pdf.service';

@Component({
  selector: 'app-reports',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button (click)="onBack.emit()" class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <h2 class="text-2xl font-bold text-slate-800 tracking-tight">Report Generator</h2>
        </div>

        <!-- Global Export Options -->
        <div class="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
          <span class="text-[10px] font-black uppercase text-slate-400">Include Photos</span>
          <button 
            (click)="includePhotos.set(!includePhotos())"
            [class]="includePhotos() ? 'w-10 h-5 bg-indigo-600 rounded-full relative transition-colors' : 'w-10 h-5 bg-slate-200 rounded-full relative transition-colors'"
          >
            <div [class]="includePhotos() ? 'absolute right-1 top-1 w-3 h-3 bg-white rounded-full transition-all' : 'absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-all'"></div>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Daily Report Card -->
        <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <i class="fa-solid fa-file-pdf"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-800">Daily Export</h3>
              <p class="text-xs text-slate-500">Attendance for specific date</p>
            </div>
          </div>
          
          <div class="flex gap-2">
            <input type="date" [(ngModel)]="dailyDate" class="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none text-sm">
            <button (click)="exportDaily()" class="px-6 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 text-sm">
              Export
            </button>
          </div>
        </div>

        <!-- Monthly Report Card -->
        <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
              <i class="fa-solid fa-calendar-check"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-800">Monthly Stats</h3>
              <p class="text-xs text-slate-500">Aggregated summary of month</p>
            </div>
          </div>
          
          <div class="flex gap-2">
            <input type="month" [(ngModel)]="monthlyMonth" class="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none text-sm">
            <button (click)="exportMonthly()" class="px-6 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 text-sm">
              Generate
            </button>
          </div>
        </div>

        <!-- Custom Range Card -->
        <div class="md:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <i class="fa-solid fa-sliders"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-800">Custom Date Range</h3>
              <p class="text-xs text-slate-500">Export statistics for any historical period</p>
            </div>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-400 uppercase ml-1">From</label>
              <input type="date" [(ngModel)]="rangeStart" class="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none text-sm font-bold">
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-400 uppercase ml-1">To</label>
              <input type="date" [(ngModel)]="rangeEnd" class="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none text-sm font-bold">
            </div>
            <div class="flex items-end">
              <button (click)="exportRange()" class="w-full h-[46px] bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 text-sm transition-all shadow-lg shadow-blue-100">
                Generate Range Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Info Footer -->
      <div class="p-6 bg-slate-800 rounded-3xl text-slate-300 space-y-3">
        <h4 class="font-bold text-white flex items-center gap-2">
          <i class="fa-solid fa-circle-info text-blue-400"></i> Reporting Engine
        </h4>
        <ul class="text-xs space-y-2 opacity-80">
          <li>&bull; <span class="font-semibold text-blue-200">Personal Information</span> - Reports now include student mobile numbers and profile photos.</li>
          <li>&bull; <span class="font-semibold text-blue-200">Visual Audits</span> - Photos are embedded at 300dpi for high-quality identification.</li>
          <li>&bull; <span class="font-semibold text-blue-200">Real-time Calculation</span> - Percentages are computed from the master attendance log.</li>
        </ul>
      </div>
    </div>
  `
})
export class ReportsComponent {
  onBack = output<void>();
  attendanceService = inject(AttendanceService);
  pdfService = inject(PdfService);

  dailyDate = signal(new Date().toISOString().split('T')[0]);
  monthlyMonth = signal(new Date().toISOString().slice(0, 7));
  
  rangeStart = signal(new Date().toISOString().split('T')[0]);
  rangeEnd = signal(new Date().toISOString().split('T')[0]);
  
  includePhotos = signal(true);

  exportDaily() {
    const teacher = this.attendanceService.activeTeacher()!;
    const data = this.attendanceService.getDailyReportData(this.dailyDate());
    this.pdfService.exportDaily(this.dailyDate(), teacher.className, teacher.section, data, this.includePhotos());
  }

  exportMonthly() {
    const teacher = this.attendanceService.activeTeacher()!;
    const stats = this.attendanceService.getMonthlyReport(this.monthlyMonth());
    
    const [year, month] = this.monthlyMonth().split('-');
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    this.pdfService.exportMonthly(monthName, teacher.className, teacher.section, stats, this.includePhotos());
  }

  exportRange() {
    const teacher = this.attendanceService.activeTeacher()!;
    const stats = this.attendanceService.getRangeReport(this.rangeStart(), this.rangeEnd());
    this.pdfService.exportRange(this.rangeStart(), this.rangeEnd(), teacher.className, teacher.section, stats, this.includePhotos());
  }
}
