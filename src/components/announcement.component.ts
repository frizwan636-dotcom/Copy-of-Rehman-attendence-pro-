import { Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnnouncementService } from '../services/announcement.service';
import { AttendanceService } from '../services/attendance.service';

@Component({
  selector: 'app-announcement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-6 flex flex-col h-full max-w-4xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <i class="fa-solid fa-bullhorn text-indigo-600"></i>
          Announcements
        </h2>
        @if (canManage()) {
          <button (click)="showAddModal.set(true)" class="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2">
            <i class="fa-solid fa-plus"></i>
            New
          </button>
        }
      </div>

      <div class="flex-1 space-y-4 overflow-y-auto pb-4">
        @if (announcementService.allAnnouncements().length === 0) {
          <div class="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="fa-solid fa-message-slash text-2xl text-slate-200"></i>
            </div>
            <p class="text-slate-400 font-bold">No announcements yet</p>
          </div>
        }

        @for (ann of announcementService.allAnnouncements(); track ann.id) {
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 group hover:shadow-md transition-all">
            <div class="flex justify-between items-start mb-2">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">
                  <i class="fa-solid fa-user-tie"></i>
                </div>
                <span class="text-xs font-black text-slate-400 uppercase tracking-widest">School Admin</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-bold text-slate-300">{{ ann.timestamp | date:'short' }}</span>
                @if (canManage()) {
                  <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button (click)="editAnnouncement(ann)" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <i class="fa-solid fa-pen text-xs"></i>
                    </button>
                    <button (click)="deleteAnnouncement(ann.id)" class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <i class="fa-solid fa-trash text-xs"></i>
                    </button>
                  </div>
                }
              </div>
            </div>
            <p class="text-slate-700 whitespace-pre-wrap leading-relaxed">{{ ann.text }}</p>
          </div>
        }
      </div>

      <!-- Add/Edit Modal -->
      @if (showAddModal()) {
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div class="bg-white max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <h3 class="text-xl font-bold text-slate-800 mb-4">{{ editingId() ? 'Edit Announcement' : 'New Announcement' }}</h3>
            <textarea 
              [(ngModel)]="announcementText" 
              placeholder="Type your announcement here..." 
              rows="5"
              class="w-full p-4 rounded-2xl border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-sm bg-slate-50 mb-4 resize-none"
              [disabled]="isSaving()"
            ></textarea>
            <div class="flex gap-3">
              <button (click)="closeModal()" [disabled]="isSaving()" class="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
                Cancel
              </button>
              <button (click)="saveAnnouncement()" [disabled]="!announcementText.trim() || isSaving()" class="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                @if (isSaving()) {
                  <i class="fa-solid fa-circle-notch animate-spin"></i>
                  Processing...
                } @else {
                  {{ editingId() ? 'Update' : 'Post' }}
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AnnouncementComponent {
  announcementService = inject(AnnouncementService);
  attendanceService = inject(AttendanceService);
  
  canManage = computed(() => {
    const role = this.attendanceService.activeUserRole();
    return role === 'teacher' || role === 'coordinator';
  });
  
  showAddModal = signal(false);
  editingId = signal<string | null>(null);
  announcementText = '';
  isSaving = signal(false);

  constructor() {
    effect(() => {
      const teacher = this.attendanceService.activeTeacher();
      const coord = this.attendanceService.activeCoordinator();
      const student = this.attendanceService.activeStudent();
      const schoolId = teacher?.school_id || coord?.school_id || student?.school_id;
      if (schoolId) {
        this.announcementService.loadAnnouncements(schoolId);
      }
    }, { allowSignalWrites: true });
  }

  editAnnouncement(ann: any) {
    this.editingId.set(ann.id);
    this.announcementText = ann.text;
    this.showAddModal.set(true);
  }

  async deleteAnnouncement(id: string) {
    if (confirm('Are you sure you want to delete this announcement?')) {
      try {
        await this.announcementService.deleteAnnouncement(id);
      } catch (error) {
        console.error('Error deleting announcement:', error);
        alert('Failed to delete announcement. Please try again.');
      }
    }
  }

  async saveAnnouncement() {
    const user = this.attendanceService.activeUser();
    const teacher = this.attendanceService.activeTeacher();
    const coord = this.attendanceService.activeCoordinator();
    
    const schoolId = teacher?.school_id || coord?.school_id;
    const senderId = user?.id;

    if (!schoolId || !senderId || !this.announcementText.trim()) return;

    this.isSaving.set(true);
    try {
      if (this.editingId()) {
        await this.announcementService.updateAnnouncement(this.editingId()!, this.announcementText);
      } else {
        await this.announcementService.addAnnouncement(schoolId, senderId, this.announcementText);
      }
      this.closeModal();
    } catch (error) {
      console.error('Error saving announcement:', error);
      alert('Failed to post announcement. Please check your connection.');
    } finally {
      this.isSaving.set(false);
    }
  }

  closeModal() {
    this.showAddModal.set(false);
    this.editingId.set(null);
    this.announcementText = '';
    this.isSaving.set(false);
  }
}
