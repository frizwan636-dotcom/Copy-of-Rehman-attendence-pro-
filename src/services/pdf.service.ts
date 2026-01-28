import { Injectable } from '@angular/core';

declare var jspdf: any;

@Injectable({ providedIn: 'root' })
export class PdfService {

  private drawPhoto(doc: any, data: any) {
    if (data.cell.section === 'body' && data.column.index === 0 && data.cell.raw) {
      const base64 = data.cell.raw;
      if (base64 && base64.startsWith('data:image')) {
        doc.addImage(base64, 'JPEG', data.cell.x + 2, data.cell.y + 2, 10, 10);
      }
    }
  }

  exportDaily(date: string, className: string, section: string, records: any[], includePhotos: boolean) {
    const doc = new jspdf.jsPDF();
    
    doc.setFontSize(20);
    doc.text('Rehman Attendance - Daily Student Report', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Class: ${className} (${section})`, 14, 25);
    doc.text(`Date: ${date}`, 14, 32);

    const head = includePhotos 
      ? [['Photo', 'Roll', 'Name', 'Contact', 'Status', 'Total %']] 
      : [['Roll', 'Name', 'Contact', 'Status', 'Total %']];
    
    const body = records.map(r => includePhotos 
      ? [r.photo || '', r.roll, r.name, r.mobile || 'N/A', r.status, r.percentage + '%'] 
      : [r.roll, r.name, r.mobile || 'N/A', r.status, r.percentage + '%']
    );

    doc.autoTable({
      head: head,
      body: body,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      didDrawCell: includePhotos ? (data: any) => this.drawPhoto(doc, data) : null,
      columnStyles: includePhotos ? { 0: { cellWidth: 15, minCellHeight: 15 } } : {}
    });

    doc.save(`Student_Attendance_${className}_${date}.pdf`);
  }
  
  exportTeacherReport(date: string, coordinatorName: string, records: any[], includePhotos: boolean) {
    const doc = new jspdf.jsPDF();
    
    doc.setFontSize(20);
    doc.text('Rehman Attendance - Daily Teacher Report', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Coordinator: ${coordinatorName}`, 14, 25);
    doc.text(`Date: ${date}`, 14, 32);

    const head = includePhotos
      ? [['Photo', 'Name', 'Class', 'Mobile', 'Status']]
      : [['Name', 'Class', 'Mobile', 'Status']];
    
    const body = records.map(r => includePhotos
      ? [r.photo || '', r.name, r.className ? `${r.className} - ${r.section}` : 'N/A', r.mobileNumber || 'N/A', r.status]
      : [r.name, r.className ? `${r.className} - ${r.section}` : 'N/A', r.mobileNumber || 'N/A', r.status]
    );

    doc.autoTable({
      head: head,
      body: body,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74] }, // Green color for header
      didDrawCell: includePhotos ? (data: any) => this.drawPhoto(doc, data) : null,
      columnStyles: includePhotos ? { 0: { cellWidth: 15, minCellHeight: 15 } } : {}
    });

    doc.save(`Teacher_Attendance_${date}.pdf`);
  }

  exportTeacherMonthlyReport(monthLabel: string, coordinatorName: string, data: any[], includePhotos: boolean) {
    const doc = new jspdf.jsPDF();
    
    doc.setFontSize(20);
    doc.text('Rehman Attendance - Monthly Teacher Report', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Coordinator: ${coordinatorName}`, 14, 25);
    doc.text(`Month: ${monthLabel}`, 14, 32);

    const head = includePhotos 
      ? [['Photo', 'Teacher Name', 'Present', 'Absent', '%']] 
      : [['Teacher Name', 'Present', 'Absent', '%']];

    const body = data.map(d => includePhotos 
      ? [d.photo || '', d.name, d.present, d.absent, d.percentage + '%']
      : [d.name, d.present, d.absent, d.percentage + '%']
    );

    doc.autoTable({
      head: head,
      body: body,
      startY: 40,
      theme: 'striped',
      headStyles: { fillColor: [22, 163, 74] }, // Green
      didDrawCell: includePhotos ? (data: any) => this.drawPhoto(doc, data) : null,
      columnStyles: includePhotos ? { 0: { cellWidth: 15, minCellHeight: 15 } } : {}
    });

    doc.save(`Monthly_Teacher_Report_${monthLabel.replace(' ', '_')}.pdf`);
  }

  exportRange(startDate: string, endDate: string, className: string, section: string, data: any[], includePhotos: boolean) {
    const doc = new jspdf.jsPDF();
    
    doc.setFontSize(20);
    doc.text('Rehman Attendance - Range Report', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Class: ${className} (${section})`, 14, 25);
    doc.text(`Period: ${startDate} to ${endDate}`, 14, 32);

    const head = includePhotos 
      ? [['Photo', 'Roll', 'Name', 'Contact', 'Pres.', 'Abs.', '%']] 
      : [['Roll', 'Name', 'Contact', 'Pres.', 'Abs.', '%']];

    const body = data.map(d => includePhotos 
      ? [d.photo || '', d.roll, d.name, d.mobile || 'N/A', d.present, d.absent, d.percentage + '%']
      : [d.roll, d.name, d.mobile || 'N/A', d.present, d.absent, d.percentage + '%']
    );

    doc.autoTable({
      head: head,
      body: body,
      startY: 40,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      didDrawCell: includePhotos ? (data: any) => this.drawPhoto(doc, data) : null,
      columnStyles: includePhotos ? { 0: { cellWidth: 15, minCellHeight: 15 } } : {}
    });

    doc.save(`RangeReport_${className}_${startDate}_to_${endDate}.pdf`);
  }

  exportMonthly(monthLabel: string, className: string, section: string, data: any[], includePhotos: boolean) {
    const doc = new jspdf.jsPDF();
    
    doc.setFontSize(20);
    doc.text('Rehman Attendance - Monthly Report', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Class: ${className} (${section})`, 14, 25);
    doc.text(`Month: ${monthLabel}`, 14, 32);

    const head = includePhotos 
      ? [['Photo', 'Roll', 'Name', 'Present', 'Absent', '%']] 
      : [['Roll', 'Name', 'Present', 'Absent', '%']];

    const body = data.map(d => includePhotos 
      ? [d.photo || '', d.roll, d.name, d.present, d.absent, d.percentage + '%']
      : [d.roll, d.name, d.present, d.absent, d.percentage + '%']
    );

    doc.autoTable({
      head: head,
      body: body,
      startY: 40,
      theme: 'striped',
      headStyles: { fillColor: [5, 150, 105] },
      didDrawCell: includePhotos ? (data: any) => this.drawPhoto(doc, data) : null,
      columnStyles: includePhotos ? { 0: { cellWidth: 15, minCellHeight: 15 } } : {}
    });

    doc.save(`Monthly_${className}_${monthLabel.replace(' ', '_')}.pdf`);
  }
}