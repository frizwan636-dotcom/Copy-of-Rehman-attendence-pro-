import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AttendanceService } from './attendance.service';

export interface Announcement {
  id: string;
  sender_id: string;
  text: string;
  timestamp: string;
  school_id: string;
}

@Injectable({ providedIn: 'root' })
export class AnnouncementService {
  private supabase = inject(SupabaseService);
  private attendanceService = inject(AttendanceService);
  private announcements = signal<Announcement[]>([]);
  allAnnouncements = this.announcements.asReadonly();

  async loadAnnouncements(schoolId: string) {
    try {
      const messages = await this.supabase.getMessages(schoolId);
      this.announcements.set(messages || []);
    } catch (e) {
      console.error('Error loading announcements:', e);
    }
  }

  async addAnnouncement(schoolId: string, senderId: string, text: string) {
    try {
      const announcement = await this.supabase.sendMessage({ school_id: schoolId, sender_id: senderId, text });
      if (announcement) {
        this.announcements.update(msgs => [...msgs, announcement]);
        this.attendanceService.showToast('Announcement posted', 'success');
      }
    } catch (e: any) {
      this.attendanceService.showToast(e.message || 'Failed to post announcement', 'error');
      throw e;
    }
  }

  async updateAnnouncement(id: string, text: string) {
    try {
      const updated = await this.supabase.updateMessage(id, text);
      if (updated) {
        this.announcements.update(msgs => msgs.map(m => m.id === id ? updated : m));
        this.attendanceService.showToast('Announcement updated', 'success');
      }
    } catch (e: any) {
      this.attendanceService.showToast(e.message || 'Failed to update announcement', 'error');
      throw e;
    }
  }

  async deleteAnnouncement(id: string) {
    try {
      await this.supabase.deleteMessage(id);
      this.announcements.update(msgs => msgs.filter(m => m.id !== id));
      this.attendanceService.showToast('Announcement deleted', 'success');
    } catch (e: any) {
      this.attendanceService.showToast(e.message || 'Failed to delete announcement', 'error');
    }
  }
}
