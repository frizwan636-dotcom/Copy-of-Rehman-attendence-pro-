
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CsvService {

  private downloadCsv(data: any[][], filename: string) {
    const separator = ';'; // Use semicolon for better Excel compatibility in some regions
    const csvContent = data.map(row => 
      row.map(cell => {
        const cellStr = String(cell === null || cell === undefined ? '' : cell);
        // If the cell contains the separator, double quotes, or a newline, wrap it in double quotes.
        // Also, escape any existing double quotes by doubling them up.
        if (cellStr.includes(separator) || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(separator)
    ).join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel compatibility
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
    const filename = `Student_Attendance_${className}_${date}.csv`;
    const headers = ['Roll', 'Name', 'Contact', 'Attendance %'];
    const data = records.map(r => [
      r.roll,
      r.name,
      r.mobile || 'N/A',
      r.percentage
    ]);
    this.downloadCsv([headers, ...data], filename);
  }

  exportRange(
    startDate: string,
    endDate: string,
    className: string,
    section: string,
    monthlyBreakdown: { monthName: string, records: any[] }[]
  ) {
    const filename = `RangeReport_${className}_${startDate}_to_${endDate}.csv`;
    const allRows: any[][] = [];
    const headers = ['Month', 'Roll', 'Name', 'Present', 'Absent', 'Month %'];
    allRows.push(headers);
    
    monthlyBreakdown.forEach(monthData => {
        monthData.records.forEach(d => {
            allRows.push([
                monthData.monthName,
                d.roll,
                d.name,
                d.present,
                d.absent,
                d.percentage
            ]);
        });
    });

    this.downloadCsv(allRows, filename);
  }
  
  exportMonthly(monthLabel: string, className: string, section: string, data: any[]) {
    const filename = `Monthly_${className}_${monthLabel.replace(/\s/g, '_')}.csv`;
    const headers = ['Roll', 'Name', 'Present', 'Absent', 'Month %'];
    const dataRows = data.map(d => [
      d.roll,
      d.name,
      d.present,
      d.absent,
      d.percentage
    ]);
    this.downloadCsv([headers, ...dataRows], filename);
  }

  exportTeacherReport(date: string, coordinatorName: string, records: any[]) {
    const filename = `Teacher_Attendance_${date}.csv`;
    const headers = ['Name', 'Class', 'Section', 'Contact', 'Attendance %'];
    const data = records.map(r => [
      r.name,
      r.className,
      r.section,
      r.mobileNumber || 'N/A',
      r.percentage,
    ]);
    this.downloadCsv([headers, ...data], filename);
  }

  exportTeacherMonthlyReport(monthLabel: string, coordinatorName: string, data: any[]) {
    const filename = `Monthly_Teachers_${monthLabel.replace(/\s/g, '_')}.csv`;
    const headers = ['Name', 'Class', 'Section', 'Present', 'Absent', 'Month %'];
    const dataRows = data.map(d => [
      d.name,
      d.className,
      d.section,
      d.present,
      d.absent,
      d.percentage
    ]);
    this.downloadCsv([headers, ...dataRows], filename);
  }

  // FIX: Add missing method to export school-wide daily summary.
  exportSchoolDailySummary(date: string, coordinatorName: string, records: any[], schoolStats: any) {
    const filename = `School_Daily_Summary_${date}.csv`;
    const headers = ['Class', 'Teacher', 'Total', 'Present', 'Absent', 'Attendance %', 'Status'];
    const data = records.map(r => [
      r.classNameAndSection,
      r.teacherName,
      r.total ?? 'N/A',
      r.present ?? 'N/A',
      r.absent ?? 'N/A',
      r.percentage ?? 'N/A',
      r.status
    ]);
    this.downloadCsv([headers, ...data], filename);
  }
}
