import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, AuthChangeEvent, Session, AuthError } from '@supabase/supabase-js';
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
  
  private processError(error: AuthError | null): AuthError | null {
    if (!error) return null;

    const lowerCaseMessage = error.message.toLowerCase();

    // FIX: The original code attempted to return a new object literal, which is not compatible
    // with the AuthError class due to its protected properties. The fix is to modify the
    // message property on the *existing* error object and return it, preserving its type.
    if (lowerCaseMessage.includes('invalid api key') || error.status === 401) {
      error.message = "Authentication failed due to an invalid Supabase API Key. Please contact the administrator.";
    } else if (lowerCaseMessage.includes('failed to fetch')) {
      error.message = "Network error: Could not connect to the database. Please check your internet connection and Supabase URL.";
    } else if (lowerCaseMessage.includes('invalid login credentials')) {
      error.message = "Invalid email or password. Please check your credentials and try again.";
    }
    return error;
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
    return { data, error: this.processError(error) };
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error: this.processError(error) };
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
  
  async loadDataById(id: string): Promise<{ data: AppData } | null> {
    // Note: This function requires the 'profiles' table to be readable by an
    // anonymous user for a specific row identified by 'id'.
    // If Row Level Security (RLS) is enabled, a policy is needed to allow this.
    // e.g., CREATE POLICY "Enable public read access to profiles" ON public.profiles FOR SELECT USING (true);
    // Be aware of security implications. A more secure approach involves a Supabase Edge Function.
    
    if (!id || typeof id !== 'string') {
        console.error("Invalid ID provided to loadDataById");
        return null;
    }

    const { data, error } = await this.supabase
      .from('profiles')
      .select('app_data')
      .eq('id', id)
      .single();

    if (error) {
      // PGRST116: "object not found" is a valid outcome, not an error.
      if (error.code !== 'PGRST116') {
          console.error(`Error loading data from Supabase for ID ${id}:`, error);
      }
      return null;
    }
    
    return data ? { data: data.app_data as AppData } : null;
  }
}