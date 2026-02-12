import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { Teacher, Student, AttendanceRecord, TeacherAttendanceRecord, DailySubmission } from './attendance.service';

export interface AppData {
  teachers: Teacher[];
  students: Student[];
  attendance: AttendanceRecord[];
  teacherAttendance: TeacherAttendanceRecord[];
  dailySubmissions: DailySubmission[];
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  // IMPORTANT: Paste your ANON KEY from your Supabase project's API settings below.
  private readonly SUPABASE_URL = process.env.SUPABASE_URL || 'https://lucpmecyfkgdcwpditzs.supabase.co';
  private readonly SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1Y3BtZWN5ZmtnZGN3cGRpdHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4ODQxOTUsImV4cCI6MjA4NjQ2MDE5NX0.TuQYOT2sQoo5U6gLIJfHRx5IHz0oS69uGp6CdesMyv0';
  
  constructor() {
    if (this.SUPABASE_URL === 'YOUR_SUPABASE_URL' || this.SUPABASE_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        console.error("Supabase credentials not set! Please provide your Supabase URL and Anon Key in supabase.service.ts");
        // A minimal client to prevent crashes, but it won't work.
        this.supabase = createClient('http://localhost', 'dummykey');
    } else {
        this.supabase = createClient(this.SUPABASE_URL, this.SUPABASE_KEY);
    }
  }

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  async signUp(email: string, password: string, metadata: { name: string, schoolName: string }) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata // Use 'data' for user_metadata
      }
    });
    return { data, error };
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }

  async signOut() {
    return this.supabase.auth.signOut();
  }

  async getUser(): Promise<User | null> {
    const { data, error } = await this.supabase.auth.getUser();
    if (error) {
      console.error("Error getting user:", error);
      return null;
    }
    return data.user;
  }
  
  async getSession() {
    const { data, error } = await this.supabase.auth.getSession();
    return data.session;
  }

  async loadData(user?: User | null): Promise<AppData | null> {
    const currentUser = user === undefined ? await this.getUser() : user;
    if (!currentUser) return null;

    const { data, error } = await this.supabase
      .from('profiles')
      .select('app_data')
      .eq('id', currentUser.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: "object not found" - this is expected for new users.
      console.error("Error loading data from Supabase:", error);
      return null;
    }
    return data ? (data.app_data as AppData) : null;
  }

  async saveData(dataToSave: AppData, user?: User | null): Promise<void> {
    const currentUser = user === undefined ? await this.getUser() : user;
    if (!currentUser) {
      console.error("Cannot save data, no user logged in. This might be due to an unconfirmed email address if email confirmations are enabled in Supabase.");
      return;
    }

    const { error } = await this.supabase
      .from('profiles')
      .upsert({ id: currentUser.id, app_data: dataToSave });

    if (error) {
      console.error("Error saving data to Supabase:", error);
    }
  }
}
