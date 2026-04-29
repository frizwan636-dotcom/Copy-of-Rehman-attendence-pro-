import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, Student } from '../services/attendance.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

interface StudentWithFeeStatus extends Student {
  feePaid: number;
  feeDue: number;
  status: 'Paid' | 'Partial' | 'Unpaid' | 'Overpaid';
}

@Component({
  selector: 'app-fees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-in fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-black text-slate-800 tracking-tight">Fees Management</h2>
          <p class="text-slate-500 text-sm">Track and record student fee payments</p>
        </div>
        <button (click)="sendBulkFeeReminders()" 
          class="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
          <i class="fa-solid fa-paper-plane"></i>
          Send Bulk Reminders
        </button>
      </div>

      <!-- Search & Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="md:col-span-2 relative">
          <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input type="text" [(ngModel)]="searchQuery" placeholder="Search by name or roll number..." 
            class="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm">
        </div>
        <div class="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-4">
          <div class="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-xl">
            <i class="fa-solid fa-hand-holding-dollar"></i>
          </div>
          <div>
            <p class="text-[10px] font-black uppercase tracking-widest text-emerald-600">Pending Dues</p>
            <p class="text-xl font-black text-emerald-900">{{ studentsWithDuesCount() }} Students</p>
          </div>
        </div>
      </div>

      <!-- Students Fee Table -->
      <div class="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/50">
                <th class="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Student</th>
                <th class="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Total Fee</th>
                <th class="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Paid</th>
                <th class="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Due</th>
                <th class="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Status</th>
                <th class="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              @for (student of filteredStudents(); track student.id) {
                <tr class="hover:bg-slate-50/50 transition-colors group">
                  <td class="p-6">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                        {{ student.rollNumber }}
                      </div>
                      <div>
                        <p class="font-bold text-slate-800">{{ student.name }}</p>
                        <p class="text-xs text-slate-400">{{ student.fatherName }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="p-6 font-medium text-slate-600">{{ student.totalFee }}</td>
                  <td class="p-6 font-medium text-emerald-600">{{ student.feePaid }}</td>
                  <td class="p-6 font-medium" [class.text-red-500]="student.feeDue > 0">{{ student.feeDue }}</td>
                  <td class="p-6">
                    <span class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider"
                      [ngClass]="{
                        'bg-emerald-100 text-emerald-700': student.status === 'Paid',
                        'bg-amber-100 text-amber-700': student.status === 'Partial',
                        'bg-red-100 text-red-700': student.status === 'Unpaid',
                        'bg-blue-100 text-blue-700': student.status === 'Overpaid'
                      }">
                      {{ student.status }}
                    </span>
                  </td>
                  <td class="p-6 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button (click)="openPaymentModal(student)" 
                        class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors" title="Record Payment">
                        <i class="fa-solid fa-file-invoice-dollar"></i>
                      </button>
                      <a [href]="getFeeReminderSafeUrl(student)" 
                        class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors" title="Send SMS Reminder">
                        <i class="fa-solid fa-comment-sms"></i>
                      </a>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="p-12 text-center">
                    <div class="flex flex-col items-center gap-3 text-slate-400">
                      <i class="fa-solid fa-folder-open text-4xl opacity-20"></i>
                      <p class="font-medium">No students found matching your search.</p>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Account Details Settings -->
      <div class="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-6 md:p-8">
        <h3 class="text-xl font-bold text-slate-800 mb-6">School Bank Account Details</h3>
        <p class="text-sm text-slate-500 mb-6">These details will be shown to parents for fee payment.</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input type="text" [(ngModel)]="accountName" placeholder="Account Name" 
            class="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
          <input type="text" [(ngModel)]="accountNumber" placeholder="Account Number" 
            class="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
          <input type="text" [(ngModel)]="bankName" placeholder="Bank Name" 
            class="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
        </div>
        <div class="mt-4 flex justify-end">
          <button (click)="saveAccountDetails()" 
            class="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
            Save Details
          </button>
        </div>
      </div>

      <!-- Pending Fee Requests -->
      @if (pendingFeeRequests().length > 0) {
        <div class="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-6 md:p-8">
          <h3 class="text-xl font-bold text-slate-800 mb-6">Pending Fee Requests</h3>
          <div class="space-y-4">
            @for (req of pendingFeeRequests(); track req.id) {
              <div class="p-4 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50">
                <div>
                  <p class="font-bold text-slate-800">Student: {{ getStudentName(req.student_id) }}</p>
                  <p class="text-sm text-slate-600">Parent A/C Name: {{ req.parentAccountName }}</p>
                  <p class="text-sm text-slate-600">Parent A/C No: {{ req.parentAccountNumber }}</p>
                  <p class="text-sm text-slate-600">Txn ID: {{ req.transactionId }}</p>
                  <p class="text-sm text-slate-500 mt-1">Date: {{ req.date | date }}</p>
                </div>
                <div class="flex gap-2">
                  <button (click)="approveFeeRequest(req.id)" class="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700">Approve</button>
                  <button (click)="rejectFeeRequest(req.id)" class="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700">Reject</button>
                  <button (click)="sendTeacherMsg(req.student_id)" class="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">Message</button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Payment Modal -->
      @if (showPaymentModal()) {
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div class="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div class="flex items-center justify-between mb-8">
              <h3 class="text-2xl font-black text-slate-800 tracking-tight">Record Payment</h3>
              <button (click)="showPaymentModal.set(false)" class="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <i class="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <div class="space-y-6">
              <div class="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <p class="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">Student</p>
                <p class="font-bold text-slate-800">{{ selectedStudent()?.name }}</p>
                <p class="text-xs text-slate-500">Roll: {{ selectedStudent()?.rollNumber }} | Due: {{ selectedStudent()?.feeDue }}</p>
              </div>

              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Payment Amount</label>
                <input type="number" [(ngModel)]="paymentAmount" placeholder="Enter amount..." 
                  class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-lg">
              </div>

              <button (click)="savePayment()" 
                class="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3">
                <i class="fa-solid fa-check-circle"></i>
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class FeesComponent {
  attendanceService = inject(AttendanceService);
  sanitizer = inject(DomSanitizer);

  searchQuery = '';
  showPaymentModal = signal(false);
  selectedStudent = signal<StudentWithFeeStatus | null>(null);
  paymentAmount = signal<number | null>(null);

  accountName = signal<string>('');
  accountNumber = signal<string>('');
  bankName = signal<string>('');

  constructor() {
    const details = this.attendanceService.schoolAccountDetails();
    if (details) {
      this.accountName.set(details.accountName);
      this.accountNumber.set(details.accountNumber);
      this.bankName.set(details.bankName);
    }
  }

  saveAccountDetails() {
    this.attendanceService.updateSchoolAccountDetails({
      accountName: this.accountName(),
      accountNumber: this.accountNumber(),
      bankName: this.bankName()
    });
    this.attendanceService.showToast('Account details saved!', 'success');
  }

  pendingFeeRequests = computed(() => {
    return this.attendanceService.allFeeRequests().filter(r => r.status === 'pending');
  });

  getStudentName(id: string) {
    const student = this.attendanceService.activeStudents().find(s => s.id === id);
    return student ? student.name : 'Unknown';
  }

  approveFeeRequest(id: string) {
    this.attendanceService.processFeeRequest(id, 'approved');
    this.attendanceService.showToast('Fee request approved', 'success');
  }

  rejectFeeRequest(id: string) {
    this.attendanceService.processFeeRequest(id, 'rejected');
    this.attendanceService.showToast('Fee request rejected', 'success');
  }

  sendTeacherMsg(studentId: string) {
    const student = this.attendanceService.activeStudents().find(s => s.id === studentId);
    if (!student || !student.mobileNumber) {
      this.attendanceService.showToast('No valid mobile number', 'error');
      return;
    }
    const isApproved = confirm('Send Confirmation message? Cancel to send Reminder message.');
    let msg = isApproved ? 'Your fee payment has been confirmed and approved.' : 'Please pay your pending fees as soon as possible.';
    const num = student.mobileNumber.replace(/\D/g, '');
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  studentsWithFeeStatus = computed(() => {
    const teacher = this.attendanceService.activeTeacher();
    if (!teacher) return [];
    
    return this.attendanceService.activeStudents().map(s => {
      const feePaid = s.feeHistory.reduce((acc, p) => acc + p.amount, 0);
      const feeDue = s.totalFee - feePaid;
      let status: 'Paid' | 'Partial' | 'Unpaid' | 'Overpaid' = 'Unpaid';
      if (s.totalFee > 0 && feePaid === 0) status = 'Unpaid';
      else if (feePaid > 0 && feePaid < s.totalFee) status = 'Partial';
      else if (feePaid >= s.totalFee) status = 'Paid';
      if (feePaid > s.totalFee) status = 'Overpaid';

      return { ...s, feePaid, feeDue, status } as StudentWithFeeStatus;
    });
  });

  studentsWithDuesCount = computed(() => {
    return this.studentsWithFeeStatus().filter(s => s.feeDue > 0).length;
  });

  filteredStudents = computed(() => {
    let list = [...this.studentsWithFeeStatus()];
    const query = this.searchQuery.toLowerCase().trim();
    
    if (query) {
      list = list.filter(s => 
        s.name.toLowerCase().includes(query) || 
        s.rollNumber.toLowerCase().includes(query)
      );
    }
    
    return list.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true }));
  });

  openPaymentModal(student: StudentWithFeeStatus) {
    this.selectedStudent.set(student);
    this.paymentAmount.set(null);
    this.showPaymentModal.set(true);
  }

  async savePayment() {
    const student = this.selectedStudent();
    const amount = this.paymentAmount();
    if (!student || !amount || amount <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }
    
    try {
      await this.attendanceService.recordFeePayment(student.id, amount);
      this.showPaymentModal.set(false);
      alert(`Payment of ${amount} recorded for ${student.name}.`);
    } catch(e: any) {
      alert("Error saving payment: " + e.message);
    }
  }

  buildFeeReminderSmsUrl(student: StudentWithFeeStatus): string {
    const teacher = this.attendanceService.activeTeacher();
    const message = `FEE REMINDER\n\nDear Parent,\nThis is a reminder regarding the outstanding school fee for your child ${student.name} (Roll: ${student.rollNumber}).\n\n- Total Fee: ${student.totalFee}\n- Amount Paid: ${student.feePaid}\n- Outstanding Due: ${student.feeDue}\n\nPlease clear the dues at your earliest convenience.\n\nRegards,\n${teacher?.name}\n${teacher?.schoolName}`;
    const cleanNumber = student.mobileNumber.replace(/\D/g, '');
    return `sms:${cleanNumber}?body=${encodeURIComponent(message)}`;
  }

  getFeeReminderSafeUrl(student: StudentWithFeeStatus): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(this.buildFeeReminderSmsUrl(student));
  }

  sendBulkFeeReminders() {
    const studentsWithDues = this.studentsWithFeeStatus().filter(s => s.feeDue > 0);
    if (studentsWithDues.length === 0) {
      alert('No students with pending fees.');
      return;
    }
    if (confirm(`This will open your SMS app for all ${studentsWithDues.length} students with outstanding fees. Continue?`)) {
      studentsWithDues.forEach((s, index) => {
        setTimeout(() => window.open(this.buildFeeReminderSmsUrl(s), '_blank'), index * 1000);
      });
    }
  }
}
