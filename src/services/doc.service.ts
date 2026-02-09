
import { Injectable } from '@angular/core';
import type { AttendanceService } from './attendance.service';

@Injectable({ providedIn: 'root' })
export class DocService {

  private getHtmlHeader(title: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #dddddd; text-align: left; padding: 8px; }
          th { background-color: #f2f2f2; }
          h1, h2, h3, p { font-family: Arial, sans-serif; }
          .summary { margin-bottom: 20px; }
          .ai-analysis { margin-top: 20px; margin-bottom: 20px; padding: 15px; background-color: #f8f8f8; border: 1px solid #ddd; border-radius: 5px; }
        </style>
      </head>
      <body>
    `;
  }

  private getHtmlFooter(): string {
    return '</body></html>';
  }

  private downloadDoc(htmlContent: string, filename: string) {
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
  
  exportDaily(date: string, className: string, section: string, records: any[]) {
    const title = `Daily Student Report - ${date}`;
    const totalStudents = records.length;
    const presentStudents = records.filter(r => r.status === 'Present').length;
    const studentsWithStatus = records.filter(r => r.status !== 'N/A').length;
    const overallPercentage = studentsWithStatus > 0 ? ((presentStudents / studentsWithStatus) * 100).toFixed(1) : '0.0';
    
    let html = this.getHtmlHeader(title);
    html += `<h1>${title}</h1>`;
    html += `<div class="summary">
      <p><strong>Class:</strong> ${className} (${section})</p>
      <p><strong>Total Students:</strong> ${totalStudents}</p>
      <p><strong>Today's Attendance:</strong> ${overallPercentage}%</p>
    </div>`;
    html += `<table><thead><tr><th>Roll</th><th>Name</th><th>Contact</th><th>Attendance %</th></tr></thead><tbody>`;
    records.forEach(r => {
      html += `<tr><td>${r.roll}</td><td>${r.name}</td><td>${r.mobile || 'N/A'}</td><td>${r.percentage}%</td></tr>`;
    });
    html += `</tbody></table>` + this.getHtmlFooter();

    this.downloadDoc(html, `Student_Attendance_${className}_${date}.doc`);
  }

  async exportMonthly(monthLabel: string, className: string, section: string, data: any[], attendanceService: AttendanceService) {
    const title = `Monthly Student Report - ${monthLabel}`;
    const totalStudents = data.length;
    const totalPresent = data.reduce((sum, s) => sum + s.present, 0);
    const totalAbsent = data.reduce((sum, s) => sum + s.absent, 0);
    const totalRecords = totalPresent + totalAbsent;
    const overallPercentage = totalRecords > 0 ? ((totalPresent / totalRecords) * 100).toFixed(1) : '0.0';

    let html = this.getHtmlHeader(title);
    html += `<h1>${title}</h1>`;
    html += `<div class="summary">
      <p><strong>Class:</strong> ${className} (${section})</p>
      <p><strong>Total Students:</strong> ${totalStudents}</p>
      <p><strong>Overall Attendance:</strong> ${overallPercentage}%</p>
    </div>`;

    const analysis = await attendanceService.generateMonthlyAnalysis(monthLabel, data);
    html += `
      <div class="ai-analysis">
        <h2 style="margin-top: 0;">AI-Powered Analysis</h2>
        <p>${analysis}</p>
      </div>
    `;

    html += `<table><thead><tr><th>Roll</th><th>Name</th><th>Present</th><th>Absent</th><th>Month %</th></tr></thead><tbody>`;
    data.forEach(d => {
      html += `<tr><td>${d.roll}</td><td>${d.name}</td><td>${d.present}</td><td>${d.absent}</td><td>${d.percentage}%</td></tr>`;
    });
    html += `</tbody></table>` + this.getHtmlFooter();
    
    this.downloadDoc(html, `Monthly_${className}_${monthLabel.replace(/\s/g, '_')}.doc`);
  }
  
  async exportRange(startDate: string, endDate: string, className: string, section: string, monthlyBreakdown: { monthName: string, records: any[] }[], attendanceService: AttendanceService) {
      const title = `Student Report: ${startDate} to ${endDate}`;
      let html = this.getHtmlHeader(title);
      html += `<h1>${title}</h1>`;
      html += `<p><strong>Class:</strong> ${className} (${section})</p>`;

      for (const monthData of monthlyBreakdown) {
          html += `<h2 style="margin-top: 30px;">${monthData.monthName}</h2>`;
          
          const analysis = await attendanceService.generateMonthlyAnalysis(monthData.monthName, monthData.records);
          html += `
            <div class="ai-analysis">
              <h3 style="margin-top: 0;">AI-Powered Analysis</h3>
              <p>${analysis}</p>
            </div>
          `;

          html += `<table><thead><tr><th>Roll</th><th>Name</th><th>Present</th><th>Absent</th><th>Month %</th></tr></thead><tbody>`;
          monthData.records.forEach(d => {
              html += `<tr><td>${d.roll}</td><td>${d.name}</td><td>${d.present}</td><td>${d.absent}</td><td>${d.percentage}%</td></tr>`;
          });
          html += `</tbody></table>`;
      }

      html += this.getHtmlFooter();
      this.downloadDoc(html, `RangeReport_${className}_${startDate}_to_${endDate}.doc`);
  }

  exportTeacherReport(date: string, coordinatorName: string, records: any[]) {
    const title = `Daily Teacher Report - ${date}`;
    const totalTeachers = records.length;
    const presentTeachers = records.filter(r => r.status === 'Present').length;
    const teachersWithStatus = records.filter(r => r.status !== 'N/A').length;
    const overallPercentage = teachersWithStatus > 0 ? ((presentTeachers / teachersWithStatus) * 100).toFixed(1) : '0.0';
    
    let html = this.getHtmlHeader(title);
    html += `<h1>${title}</h1>`;
    html += `<div class="summary">
      <p><strong>Coordinator:</strong> ${coordinatorName}</p>
      <p><strong>Total Staff:</strong> ${totalTeachers}</p>
      <p><strong>Today's Attendance:</strong> ${overallPercentage}%</p>
    </div>`;
    html += `<table><thead><tr><th>Name</th><th>Class</th><th>Contact</th><th>Attendance %</th></tr></thead><tbody>`;
    records.forEach(r => {
      html += `<tr><td>${r.name}</td><td>${r.className}-${r.section}</td><td>${r.mobileNumber || 'N/A'}</td><td>${r.percentage}%</td></tr>`;
    });
    html += `</tbody></table>` + this.getHtmlFooter();

    this.downloadDoc(html, `Teacher_Attendance_${date}.doc`);
  }

  async exportTeacherMonthlyReport(monthLabel: string, coordinatorName: string, data: any[], attendanceService: AttendanceService) {
    const title = `Monthly Teacher Report - ${monthLabel}`;
    const totalTeachers = data.filter(t => t.role === 'teacher').length;
    const totalPresent = data.reduce((sum: number, s: any) => sum + s.present, 0);
    const totalAbsent = data.reduce((sum: number, s: any) => sum + s.absent, 0);
    const totalRecords = totalPresent + totalAbsent;
    const overallPercentage = totalRecords > 0 ? ((totalPresent / totalRecords) * 100).toFixed(1) : '0.0';

    let html = this.getHtmlHeader(title);
    html += `<h1>${title}</h1>`;
    html += `<div class="summary">
      <p><strong>Coordinator:</strong> ${coordinatorName}</p>
      <p><strong>Total Staff:</strong> ${totalTeachers}</p>
      <p><strong>Overall Attendance:</strong> ${overallPercentage}%</p>
    </div>`;

    const analysis = await attendanceService.generateTeacherMonthlyAnalysis(monthLabel, data);
    html += `
      <div class="ai-analysis">
        <h2 style="margin-top: 0;">AI-Powered Analysis</h2>
        <p>${analysis}</p>
      </div>
    `;

    html += `<table><thead><tr><th>Name</th><th>Class</th><th>Present</th><th>Absent</th><th>Month %</th></tr></thead><tbody>`;
    data.filter(t => t.role === 'teacher').forEach(d => {
      html += `<tr><td>${d.name}</td><td>${d.className}-${d.section}</td><td>${d.present}</td><td>${d.absent}</td><td>${d.percentage}%</td></tr>`;
    });
    html += `</tbody></table>` + this.getHtmlFooter();
    
    this.downloadDoc(html, `Monthly_Teachers_${monthLabel.replace(/\s/g, '_')}.doc`);
  }

  // FIX: Add missing method to export school-wide daily summary.
  exportSchoolDailySummary(date: string, coordinatorName: string, records: any[], schoolStats: any) {
    const title = `School-Wide Daily Summary - ${date}`;
    
    let html = this.getHtmlHeader(title);
    html += `<h1>${title}</h1>`;
    html += `<div class="summary">
      <p><strong>Coordinator:</strong> ${coordinatorName}</p>
      <p><strong>Total Students:</strong> ${schoolStats.total}</p>
      <p><strong>Total Present:</strong> ${schoolStats.present}</p>
      <p><strong>Total Absent:</strong> ${schoolStats.absent}</p>
      <p><strong>Overall Attendance:</strong> ${schoolStats.percentage}%</p>
    </div>`;
    html += `<table><thead><tr><th>Class</th><th>Teacher</th><th>Total</th><th>Present</th><th>Absent</th><th>Attendance %</th><th>Status</th></tr></thead><tbody>`;
    records.forEach(r => {
      html += `<tr><td>${r.classNameAndSection}</td><td>${r.teacherName}</td><td>${r.total ?? 'N/A'}</td><td>${r.present ?? 'N/A'}</td><td>${r.absent ?? 'N/A'}</td><td>${r.percentage != null ? r.percentage + '%' : 'N/A'}</td><td>${r.status}</td></tr>`;
    });
    html += `</tbody></table>` + this.getHtmlFooter();

    this.downloadDoc(html, `School_Daily_Summary_${date}.doc`);
  }
}
