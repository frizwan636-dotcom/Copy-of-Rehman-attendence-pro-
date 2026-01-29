import { Injectable } from '@angular/core';

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
          h1, h2, p { font-family: Arial, sans-serif; }
          .summary { margin-bottom: 20px; }
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
    html += `<table><thead><tr><th>Roll</th><th>Name</th><th>Contact</th><th>Status</th><th>Month %</th></tr></thead><tbody>`;
    records.forEach(r => {
      html += `<tr><td>${r.roll}</td><td>${r.name}</td><td>${r.mobile || 'N/A'}</td><td>${r.status}</td><td>${r.percentage}%</td></tr>`;
    });
    html += `</tbody></table>` + this.getHtmlFooter();

    this.downloadDoc(html, `Student_Attendance_${className}_${date}.doc`);
  }

  exportMonthly(monthLabel: string, className: string, section: string, data: any[]) {
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
    html += `<table><thead><tr><th>Roll</th><th>Name</th><th>Present</th><th>Absent</th><th>Month %</th></tr></thead><tbody>`;
    data.forEach(d => {
      html += `<tr><td>${d.roll}</td><td>${d.name}</td><td>${d.present}</td><td>${d.absent}</td><td>${d.percentage}%</td></tr>`;
    });
    html += `</tbody></table>` + this.getHtmlFooter();
    
    this.downloadDoc(html, `Monthly_${className}_${monthLabel.replace(/\s/g, '_')}.doc`);
  }
  
  exportRange(startDate: string, endDate: string, className: string, section: string, monthlyBreakdown: { monthName: string, records: any[] }[]) {
      const title = `Student Report: ${startDate} to ${endDate}`;
      let html = this.getHtmlHeader(title);
      html += `<h1>${title}</h1>`;
      html += `<p><strong>Class:</strong> ${className} (${section})</p>`;

      monthlyBreakdown.forEach(monthData => {
          html += `<h2 style="margin-top: 30px;">${monthData.monthName}</h2>`;
          html += `<table><thead><tr><th>Roll</th><th>Name</th><th>Present</th><th>Absent</th><th>Month %</th></tr></thead><tbody>`;
          monthData.records.forEach(d => {
              html += `<tr><td>${d.roll}</td><td>${d.name}</td><td>${d.present}</td><td>${d.absent}</td><td>${d.percentage}%</td></tr>`;
          });
          html += `</tbody></table>`;
      });

      html += this.getHtmlFooter();
      this.downloadDoc(html, `RangeReport_${className}_${startDate}_to_${endDate}.doc`);
  }
  
  exportTeacherReport(date: string, coordinatorName: string, records: any[]) {
    const title = `Daily Teacher Report - ${date}`;
    let html = this.getHtmlHeader(title);
    html += `<h1>${title}</h1><p><strong>Coordinator:</strong> ${coordinatorName}</p>`;
    html += `<table><thead><tr><th>Name</th><th>Class</th><th>Mobile</th><th>Status</th></tr></thead><tbody>`;
    records.forEach(r => {
      html += `<tr><td>${r.name}</td><td>${r.className ? `${r.className} - ${r.section}` : 'N/A'}</td><td>${r.mobileNumber || 'N/A'}</td><td>${r.status}</td></tr>`;
    });
    html += `</tbody></table>` + this.getHtmlFooter();
    this.downloadDoc(html, `Teacher_Attendance_${date}.doc`);
  }
  
  exportTeacherMonthlyReport(monthLabel: string, coordinatorName: string, data: any[]) {
    const title = `Monthly Teacher Report - ${monthLabel}`;
    let html = this.getHtmlHeader(title);
    html += `<h1>${title}</h1><p><strong>Coordinator:</strong> ${coordinatorName}</p>`;
    html += `<table><thead><tr><th>Teacher Name</th><th>Present</th><th>Absent</th><th>%</th></tr></thead><tbody>`;
    data.forEach(d => {
      html += `<tr><td>${d.name}</td><td>${d.present}</td><td>${d.absent}</td><td>${d.percentage}%</td></tr>`;
    });
    html += `</tbody></table>` + this.getHtmlFooter();
    this.downloadDoc(html, `Monthly_Teacher_Report_${monthLabel.replace(/\s/g, '_')}.doc`);
  }
}
