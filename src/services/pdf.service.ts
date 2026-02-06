import { Injectable } from '@angular/core';
import type { AttendanceService } from './attendance.service';

declare var jspdf: any;

@Injectable({ providedIn: 'root' })
export class PdfService {

  exportDaily(date: string, className: string, section: string, records: any[]) {
    const doc = new jspdf.jsPDF();
    
    doc.setFontSize(20);
    doc.text('Rehman Attendance - Daily Student Report', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Class: ${className} (${section})`, 14, 25);
    doc.text(`Date: ${date}`, 14, 32);

    const totalStudents = records.length;
    const presentStudents = records.filter(r => r.status === 'Present').length;
    const studentsWithStatus = records.filter(r => r.status !== 'N/A').length;
    const absentStudents = studentsWithStatus - presentStudents;
    const overallPercentage = studentsWithStatus > 0 ? ((presentStudents / studentsWithStatus) * 100).toFixed(1) : '0.0';

    const summaryText = `Total: ${totalStudents} | Present: ${presentStudents} | Absent: ${absentStudents}`;
    doc.text(summaryText, 196, 25, { align: 'right' });
    doc.text(`Today's Attendance: ${overallPercentage}%`, 196, 32, { align: 'right' });

    const head = [['Roll', 'Name', "Father's Name", 'Contact', 'Status', 'Attendance %']];
    const body = records.map(r => [r.roll, r.name, r.fatherName || 'N/A', r.mobile || 'N/A', r.status, r.percentage + '%']);
    const statusColumnIndex = 4;

    doc.autoTable({
      head: head,
      body: body,
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2, valign: 'middle' },
      headStyles: { fontSize: 10, fillColor: [79, 70, 229] },
      didParseCell: (data: any) => {
        if (data.cell.section === 'body' && data.column.index === statusColumnIndex) {
          const status = data.cell.raw;
          if (status === 'Present') {
            data.cell.styles.textColor = [39, 174, 96]; // Green
            data.cell.styles.fontStyle = 'bold';
          } else if (status === 'Absent') {
            data.cell.styles.textColor = [192, 57, 43]; // Red
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    doc.save(`Student_Attendance_${className}_${date}.pdf`);
  }

  async exportRange(
    startDate: string,
    endDate: string,
    className: string,
    section: string,
    monthlyBreakdown: { monthName: string, records: any[] }[],
    attendanceService: AttendanceService
  ) {
    const doc = new jspdf.jsPDF();
    let isFirstPage = true;

    for (const monthData of monthlyBreakdown) {
      if (!isFirstPage) {
        doc.addPage();
      }
      
      doc.setFontSize(20);
      doc.text('Rehman Attendance - Monthly Breakdown', 105, 15, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(`Report for: ${monthData.monthName}`, 14, 28);
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Class: ${className} (${section})`, 14, 35);
      
      const totalStudents = monthData.records.length;
      const totalPresent = monthData.records.reduce((sum: number, s: any) => sum + s.present, 0);
      const totalAbsent = monthData.records.reduce((sum: number, s: any) => sum + s.absent, 0);
      const totalRecords = totalPresent + totalAbsent;
      const overallPercentage = totalRecords > 0 ? ((totalPresent / totalRecords) * 100).toFixed(1) : '0.0';

      doc.text(`Total Students: ${totalStudents}`, 196, 28, { align: 'right' });
      doc.text(`Overall Attendance: ${overallPercentage}%`, 196, 35, { align: 'right' });
      
      let startY = 45;

      // Generate and draw AI analysis
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('AI-Powered Analysis:', 14, startY);
      startY += 6;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100);
      const analysis = await attendanceService.generateMonthlyAnalysis(monthData.monthName, monthData.records);
      const analysisLines = doc.splitTextToSize(analysis, 180);
      doc.text(analysisLines, 14, startY);
      startY += analysisLines.length * 5 + 5;
      doc.setTextColor(0);


      const head = [['Roll', 'Name', "Father's Name", 'Pres.', 'Abs.', 'Month %']];
      const body = monthData.records.map(d => [d.roll, d.name, d.fatherName || 'N/A', d.present, d.absent, d.percentage + '%']);

      doc.autoTable({
        head: head,
        body: body,
        startY: startY,
        theme: 'striped',
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fontSize: 10, fillColor: [59, 130, 246] },
      });

      isFirstPage = false;
    }

    doc.save(`RangeReport_${className}_${startDate}_to_${endDate}.pdf`);
  }

  async exportMonthly(
    monthLabel: string,
    className: string,
    section: string,
    data: any[],
    attendanceService: AttendanceService
  ) {
    const doc = new jspdf.jsPDF();
    
    doc.setFontSize(20);
    doc.text('Rehman Attendance - Monthly Report', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Class: ${className} (${section})`, 14, 25);
    doc.text(`Month: ${monthLabel}`, 14, 32);

    const totalStudents = data.length;
    const totalPresent = data.reduce((sum, s) => sum + s.present, 0);
    const totalAbsent = data.reduce((sum, s) => sum + s.absent, 0);
    const totalRecords = totalPresent + totalAbsent;
    const overallPercentage = totalRecords > 0 ? ((totalPresent / totalRecords) * 100).toFixed(1) : '0.0';

    doc.text(`Total Students: ${totalStudents}`, 196, 25, { align: 'right' });
    doc.text(`Overall Attendance: ${overallPercentage}%`, 196, 32, { align: 'right' });

    let startY = 42;

    // AI Analysis
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('AI-Powered Analysis:', 14, startY);
    startY += 6;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    const analysis = await attendanceService.generateMonthlyAnalysis(monthLabel, data);
    const analysisLines = doc.splitTextToSize(analysis, 180);
    doc.text(analysisLines, 14, startY);
    startY += analysisLines.length * 5 + 5;
    doc.setTextColor(0);

    const head = [['Roll', 'Name', "Father's Name", 'Present', 'Absent', 'Month %']];
    const body = data.map(d => [d.roll, d.name, d.fatherName || 'N/A', d.present, d.absent, d.percentage + '%']);

    doc.autoTable({
      head: head,
      body: body,
      startY: startY,
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fontSize: 10, fillColor: [5, 150, 105] },
    });

    doc.save(`Monthly_${className}_${monthLabel.replace(' ', '_')}.pdf`);
  }

  exportTeacherReport(date: string, coordinatorName: string, records: any[]) {
    const doc = new jspdf.jsPDF();
    
    doc.setFontSize(20);
    doc.text('Rehman Attendance - Daily Teacher Report', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Coordinator: ${coordinatorName}`, 14, 25);
    doc.text(`Date: ${date}`, 14, 32);

    const totalTeachers = records.length;
    const teachersWithStatus = records.filter(r => r.status !== 'N/A').length;
    const presentTeachers = records.filter(r => r.status === 'Present').length;
    const absentTeachers = teachersWithStatus - presentTeachers;
    const overallPercentage = teachersWithStatus > 0 ? ((presentTeachers / teachersWithStatus) * 100).toFixed(1) : '0.0';

    const summaryText = `Total Staff: ${totalTeachers} | Present: ${presentTeachers} | Absent: ${absentTeachers}`;
    doc.text(summaryText, 196, 25, { align: 'right' });
    doc.text(`Today's Attendance: ${overallPercentage}%`, 196, 32, { align: 'right' });

    const head = [['Name', 'Class', 'Contact', 'Status', 'Attendance %']];
    const body = records.map(r => [r.name, `${r.className}-${r.section}`, r.mobileNumber || 'N/A', r.status, r.percentage + '%']);
    const statusColumnIndex = 3;

    doc.autoTable({
      head: head,
      body: body,
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2, valign: 'middle' },
      headStyles: { fontSize: 10, fillColor: [79, 70, 229] },
      didParseCell: (data: any) => {
        if (data.cell.section === 'body' && data.column.index === statusColumnIndex) {
          const status = data.cell.raw;
          if (status === 'Present') {
            data.cell.styles.textColor = [39, 174, 96]; // Green
            data.cell.styles.fontStyle = 'bold';
          } else if (status === 'Absent') {
            data.cell.styles.textColor = [192, 57, 43]; // Red
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    doc.save(`Teacher_Attendance_${date}.pdf`);
  }

  async exportTeacherMonthlyReport(monthLabel: string, coordinatorName: string, data: any[], attendanceService: AttendanceService) {
    const doc = new jspdf.jsPDF();
    
    doc.setFontSize(20);
    doc.text('Rehman Attendance - Monthly Teacher Report', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Coordinator: ${coordinatorName}`, 14, 25);
    doc.text(`Month: ${monthLabel}`, 14, 32);

    const totalTeachers = data.filter(t => t.role === 'teacher').length;
    const totalPresent = data.reduce((sum: number, s: any) => sum + s.present, 0);
    const totalAbsent = data.reduce((sum: number, s: any) => sum + s.absent, 0);
    const totalRecords = totalPresent + totalAbsent;
    const overallPercentage = totalRecords > 0 ? ((totalPresent / totalRecords) * 100).toFixed(1) : '0.0';

    doc.text(`Total Staff: ${totalTeachers}`, 196, 25, { align: 'right' });
    doc.text(`Overall Attendance: ${overallPercentage}%`, 196, 32, { align: 'right' });

    let startY = 42;

    // AI Analysis
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('AI-Powered Analysis:', 14, startY);
    startY += 6;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    const analysis = await attendanceService.generateTeacherMonthlyAnalysis(monthLabel, data);
    const analysisLines = doc.splitTextToSize(analysis, 180);
    doc.text(analysisLines, 14, startY);
    startY += analysisLines.length * 5 + 5;
    doc.setTextColor(0);

    const head = [['Name', 'Class', 'Present', 'Absent', 'Month %']];
    const body = data.filter(t => t.role === 'teacher').map(d => [d.name, `${d.className}-${d.section}`, d.present, d.absent, d.percentage + '%']);

    doc.autoTable({
      head: head,
      body: body,
      startY: startY,
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fontSize: 10, fillColor: [5, 150, 105] },
    });

    doc.save(`Monthly_Teachers_${monthLabel.replace(' ', '_')}.pdf`);
  }
}