import { Component, inject, signal, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../services/attendance.service';
import { PdfService } from '../services/pdf.service';
import { CsvService } from '../services/csv.service';
import { DocService } from '../services/doc.service';

@Component({
  selector: 'app-reports',
  standalone: true,
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
      </div>

      <!-- Export Options -->
       <div class="flex flex-col sm:flex-row items-center justify-between p-2 bg-slate-100 rounded-2xl border border-slate-200 gap-2">
        <div class="flex-1 flex bg-white p-1 rounded-xl shadow-sm w-full">
            <button (click)="exportFormat.set('pdf')" [class]="exportFormat() === 'pdf' ? 'flex-1 py-2 bg-indigo-600 text-white rounded-lg shadow-md font-bold text-xs' : 'flex-1 py-2 text-slate-500 font-medium text-xs'">
              <i class="fa-solid fa-file-pdf mr-2"></i>PDF
            </button>
            <button (click)="exportFormat.set('csv')" [class]="exportFormat() === 'csv' ? 'flex-1 py-2 bg-emerald-600 text-white rounded-lg shadow-md font-bold text-xs' : 'flex-1 py-2 text-slate-500 font-medium text-xs'">
              <i class="fa-solid fa-file-csv mr-2"></i>CSV
            </button>
            <button (click)="exportFormat.set('doc')" [class]="exportFormat() === 'doc' ? 'flex-1 py-2 bg-blue-600 text-white rounded-lg shadow-md font-bold text-xs' : 'flex-1 py-2 text-slate-500 font-medium text-xs'">
              <i class="fa-solid fa-file-word mr-2"></i>Word
            </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Daily Report Card -->
        <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <i class="fa-solid fa-file-invoice"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-800">Daily Export</h3>
              <p class="text-xs text-slate-500">Attendance for specific date</p>
            </div>
          </div>
          
          <div class="flex gap-2">
            <input type="date" [ngModel]="dailyDate()" (ngModelChange)="dailyDate.set($event)" class="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none text-sm">
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
            <input type="month" [ngModel]="monthlyMonth()" (ngModelChange)="monthlyMonth.set($event)" class="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none text-sm">
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
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-400 uppercase ml-1">From</label>
              <input type="date" [ngModel]="rangeStart()" (ngModelChange)="rangeStart.set($event)" class="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none text-sm font-bold">
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-400 uppercase ml-1">To</label>
              <input type="date" [ngModel]="rangeEnd()" (ngModelChange)="rangeEnd.set($event)" class="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none text-sm font-bold">
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
             <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-400 uppercase ml-1">Class</label>
                <select [ngModel]="selectedClass()" (ngModelChange)="onClassChange($event)" class="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none text-sm font-bold">
                  <option value="all">All Classes</option>
                  @for(c of teacherClasses(); track c.className) {
                    <option [value]="c.className">{{ c.className }}</option>
                  }
                </select>
             </div>
             <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-400 uppercase ml-1">Section</label>
                <select [ngModel]="selectedSection()" (ngModelChange)="selectedSection.set($event)" [disabled]="selectedClass() === 'all'" class="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none text-sm font-bold disabled:opacity-50">
                  <option value="all">All Sections</option>
                   @for(s of availableSections(); track s) {
                    <option [value]="s">{{ s }}</option>
                  }
                </select>
             </div>
          </div>
          <div class="flex items-end pt-2">
            <button (click)="exportRange()" class="w-full h-[46px] bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 text-sm transition-all shadow-lg shadow-blue-100">
              Generate Range Report
            </button>
          </div>
        </div>
      </div>

      <!-- Info Footer -->
      <div class="p-6 bg-slate-800 rounded-3xl text-slate-300 space-y-3">
        <h4 class="font-bold text-white flex items-center gap-2">
          <i class="fa-solid fa-circle-info text-blue-400"></i> Reporting Engine
        </h4>
        <ul class="text-xs space-y-2 opacity-80">
          <li>&bull; <span class="font-semibold text-blue-200">Multiple Formats</span> - Choose between PDF, data-friendly CSV, or editable Word files.</li>
          <li>&bull; <span class="font-semibold text-blue-200">AI Analysis</span> - PDF & Word reports include an AI-powered summary for quick insights.</li>
          <li>&bull; <span class="font-semibold text-blue-200">Class Filters</span> - Generate custom range reports for specific classes or sections.</li>
        </ul>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsComponent {
  onBack = output<void>();
  attendanceService = inject(AttendanceService);
  pdfService = inject(PdfService);
  csvService = inject(CsvService);
  docService = inject(DocService);

  dailyDate = signal(new Date().toISOString().split('T')[0]);
  monthlyMonth = signal(new Date().toISOString().slice(0, 7));
  
  rangeStart = signal(new Date().toISOString().split('T')[0]);
  rangeEnd = signal(new Date().toISOString().split('T')[0]);
  
  exportFormat = signal<'pdf' | 'csv' | 'doc'>('pdf');

  // Multi-class filtering state
  teacherClasses = this.attendanceService.teacherClasses;
  selectedClass = signal('all');
  selectedSection = signal('all');

  availableSections = computed(() => {
    const sClass = this.selectedClass();
    if (sClass === 'all') return [];
    const classData = this.teacherClasses().find(c => c.className === sClass);
    return classData ? classData.sections : [];
  });

  onClassChange(className: string) {
    this.selectedClass.set(className);
    this.selectedSection.set('all'); // Reset section when class changes
  }

  exportDaily() {
    const teacher = this.attendanceService.activeTeacher()!;
    const data = this.attendanceService.getDailyReportData(this.dailyDate());
    switch(this.exportFormat()) {
      case 'pdf':
        this.pdfService.exportDaily(this.dailyDate(), teacher.className, teacher.section, data);
        break;
      case 'csv':
        this.csvService.exportDaily(this.dailyDate(), teacher.className, teacher.section, data);
        break;
      case 'doc':
        this.docService.exportDaily(this.dailyDate(), teacher.className, teacher.section, data);
        break;
    }
  }

  async exportMonthly() {
    const teacher = this.attendanceService.activeTeacher()!;
    const stats = this.attendanceService.getMonthlyReport(this.monthlyMonth());
    
    const [year, month] = this.monthlyMonth().split('-');
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    switch(this.exportFormat()) {
      case 'pdf':
        await this.pdfService.exportMonthly(monthName, teacher.className, teacher.section, stats, this.attendanceService);
        break;
      case 'csv':
        this.csvService.exportMonthly(monthName, teacher.className, teacher.section, stats);
        break;
      case 'doc':
        await this.docService.exportMonthly(monthName, teacher.className, teacher.section, stats, this.attendanceService);
        break;
    }
  }

  async exportRange() {
    if (this.rangeStart() > this.rangeEnd()) {
      alert("The 'From' date cannot be after the 'To' date.");
      return;
    }
    const teacher = this.attendanceService.activeTeacher()!;
    const filters: { className?: string, section?: string } = {};
    if (this.selectedClass() !== 'all') filters.className = this.selectedClass();
    if (this.selectedSection() !== 'all') filters.section = this.selectedSection();

    const monthlyBreakdown = this.attendanceService.getMonthlyBreakdownForRange(this.rangeStart(), this.rangeEnd(), Object.keys(filters).length > 0 ? filters : undefined);

    if (monthlyBreakdown.length === 0) {
      alert("No attendance data found for the selected criteria.");
      return;
    }
    
    const classNameForReport = filters.className || 'All Classes';
    const sectionNameForReport = filters.section || (filters.className ? 'All Sections' : '');


    switch(this.exportFormat()) {
      case 'pdf':
        await this.pdfService.exportRange(this.rangeStart(), this.rangeEnd(), classNameForReport, sectionNameForReport, monthlyBreakdown, this.attendanceService);
        break;
      case 'csv':
        this.csvService.exportRange(this.rangeStart(), this.rangeEnd(), classNameForReport, sectionNameForReport, monthlyBreakdown);
        break;
      case 'doc':
        await this.docService.exportRange(this.rangeStart(), this.rangeEnd(), classNameForReport, sectionNameForReport, monthlyBreakdown, this.attendanceService);
        break;
    }
  }
}