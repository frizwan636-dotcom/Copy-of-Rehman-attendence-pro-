import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, AuthChangeEvent, Session, AuthError } from '@supabase/supabase-js';
import type { Teacher, Student, AttendanceRecord, TeacherAttendanceRecord, DailySubmission, FeePayment } from './attendance.service';

export interface School {
  id: string; // Corresponds to Supabase coordinator user ID for simplicity
  name: string;
  pin: string;
}

export interface SchoolData {
    school: School;
    teachers: Teacher[];
    students: Student[];
    studentAttendance: AttendanceRecord[];
    teacherAttendance: TeacherAttendanceRecord[];
    dailySubmissions: DailySubmission[];
}


@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  private readonly SUPABASE_URL = process.env.SUPABASE_URL || 'https://lucpmecyfkgdcwpditzs.supabase.co';
  private readonly SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1Y3BtZWN5ZmtnZGN3cGRpdHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4ODQxOTUsImV4cCI6MjA4NjQ2MDE5NX0.TuQYOT2sQoo5U6gLIJfHRx5IHz0oS69uGp6CdesMyv0';
  
  constructor() {
    this.supabase = createClient(this.SUPABASE_URL, this.SUPABASE_KEY);
  }
  
  private processError(error: AuthError | { message: string, status?: number } | null): { message: string, status?: number } | null {
    if (!error) return null;

    const lowerCaseMessage = error.message.toLowerCase();

    if (lowerCaseMessage.includes('invalid api key') || error.status === 401) {
      error.message = "Authentication failed due to an invalid Supabase API Key. Please contact the administrator.";
    } else if (lowerCaseMessage.includes('failed to fetch')) {
      error.message = "Network error: Could not connect to the database. Please check your internet connection and Supabase URL.";
    } else if (lowerCaseMessage.includes('invalid login credentials')) {
      error.message = "Invalid email or password. Please check your credentials and try again.";
    }
    return error as { message: string, status?: number };
  }

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  async signUpAndCreateSchool(details: { email: string, password: string, name: string, schoolName: string, mobile: string, className: string, section: string, pin: string }) {
    // 1. Sign up the user (coordinator)
    const { data: authData, error: signUpError } = await this.supabase.auth.signUp({
      email: details.email,
      password: details.password,
      options: { data: { name: details.name, schoolName: details.schoolName } }
    });
    if (signUpError) throw this.processError(signUpError);
    if (!authData.user) throw new Error("User registration failed.");
    const user = authData.user;

    // 2. Create the School profile, linked to the coordinator's user ID
    const { error: schoolError } = await this.supabase.from('schools').insert({
      id: user.id, // Use coordinator's user ID as the school's primary key
      coordinator_id: user.id,
      name: details.schoolName,
      pin: '12345'
    });
    if (schoolError) throw this.processError(schoolError);

    // 3. Create the coordinator's own profile in the teachers table
    const coordinatorProfile: Omit<Teacher, 'schoolName'> = {
      id: user.id, name: details.name, email: user.email!, pin: details.pin,
      role: 'coordinator', className: details.className, section: details.section,
      setupComplete: true, mobileNumber: details.mobile, school_id: user.id,
    };
    const { error: teacherError } = await this.supabase.from('teachers').insert(coordinatorProfile);
    if (teacherError) throw this.processError(teacherError);
    
    return authData;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw this.processError(error);
    return { data };
  }

  async signOut() {
    return this.supabase.auth.signOut();
  }

  async getSession() {
    const { data, error } = await this.supabase.auth.getSession();
    if(error) throw this.processError(error);
    return data.session;
  }

  // --- NEW DATA FETCHING METHODS ---

  async getSchoolByPin(pin: string): Promise<School | null> {
    const { data, error } = await this.supabase
      .from('schools')
      .select('*')
      .eq('pin', pin)
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw this.processError(error); // Don't throw for "not found"
    return data;
  }

  async getSchoolDataForCoordinator(userId: string): Promise<SchoolData | null> {
    const { data: school, error: schoolError } = await this.supabase
      .from('schools')
      .select('*')
      .eq('coordinator_id', userId)
      .single();
    if (schoolError && schoolError.code !== 'PGRST116') throw this.processError(schoolError);
    if (!school) return null;

    return this.getAllDataForSchool(school.id);
  }

  async getAllDataForSchool(schoolId: string): Promise<SchoolData> {
      const { data: school, error: schoolError } = await this.supabase.from('schools').select('*').eq('id', schoolId).single();
      if (schoolError) throw schoolError;

      const { data: teachers, error: teachersError } = await this.supabase.from('teachers').select('*').eq('school_id', schoolId);
      if (teachersError) throw teachersError;

      const { data: students, error: studentsError } = await this.supabase.from('students').select('*, fee_payments(*)').eq('school_id', schoolId);
      if (studentsError) throw studentsError;

      const { data: studentAttendance, error: saError } = await this.supabase.from('attendance_records').select('*').eq('school_id', schoolId);
      if (saError) throw saError;
      
      const { data: teacherAttendance, error: taError } = await this.supabase.from('teacher_attendance_records').select('*').eq('school_id', schoolId);
      if (taError) throw taError;

      const { data: dailySubmissions, error: dsError } = await this.supabase.from('daily_submissions').select('*').eq('school_id', schoolId);
      if (dsError) throw dsError;

      // Restructure students to match previous format
      const formattedStudents = students?.map(s => {
          const { fee_payments, ...studentData } = s;
          return { ...studentData, feeHistory: fee_payments || [] };
      }) || [];

      return {
          school,
          teachers: teachers || [],
          students: formattedStudents,
          studentAttendance: studentAttendance || [],
          teacherAttendance: teacherAttendance || [],
          dailySubmissions: dailySubmissions || [],
      };
  }

  // --- DATA MODIFICATION METHODS ---
  async addTeacher(teacher: Omit<Teacher, 'schoolName'>) {
    const { data, error } = await this.supabase.from('teachers').insert(teacher).select().single();
    if(error) throw this.processError(error);
    return data;
  }
  
  async updateTeacher(teacherId: string, updates: Partial<Teacher>) {
    const { data, error } = await this.supabase.from('teachers').update(updates).eq('id', teacherId).select().single();
    if (error) throw this.processError(error);
    return data;
  }

  async removeTeacher(teacherId: string) {
    const { error } = await this.supabase.from('teachers').delete().eq('id', teacherId);
    if (error) throw this.processError(error);
  }

  async addStudents(students: any[]) {
    const { data, error } = await this.supabase.rpc('add_students', { students });
    if (error) throw this.processError(error);
    return data?.map((s: any) => ({ ...s, feeHistory: [] })) || [];
  }

  async updateStudent(studentId: string, updates: Partial<Omit<Student, 'id' | 'teacherId' | 'feeHistory'>>) {
    const { data, error } = await this.supabase.rpc('update_student_details', {
      p_student_id: studentId,
      p_name: updates.name,
      p_father_name: updates.fatherName,
      p_roll_number: updates.rollNumber,
      p_mobile_number: updates.mobileNumber,
      p_total_fee: updates.totalFee,
      p_class_name: updates.className,
      p_section: updates.section
    });
    if (error) throw this.processError(error);
    return data?.[0] || null;
  }

  async recordFeePayment(studentId: string, amount: number, date: string) {
    const { data, error } = await this.supabase.rpc('record_fee_payment', {
        p_student_id: studentId,
        p_amount: amount,
        p_date: date
    });
    if (error) throw this.processError(error);
    return data?.[0] || null;
  }
  
  async saveStudentAttendance(records: AttendanceRecord[]) {
     const { error } = await this.supabase.rpc('save_student_attendance', { records });
    if(error) throw this.processError(error);
  }

  async saveTeacherAttendance(records: TeacherAttendanceRecord[]) {
    const { error } = await this.supabase.from('teacher_attendance_records').upsert(records, { onConflict: 'date,teacher_id' });
    if(error) throw this.processError(error);
  }

  async submitDailySummary(submission: DailySubmission) {
    const { error } = await this.supabase.rpc('submit_daily_summary', {
        p_school_id: submission.school_id,
        p_date: submission.date,
        p_teacher_id: submission.teacherId,
        p_class_name: submission.className,
        p_section: submission.section,
        p_total_students: submission.totalStudents,
        p_present_students: submission.presentStudents,
        p_absent_students: submission.absentStudents,
        p_submission_timestamp: submission.submissionTimestamp
    });
    if (error) throw this.processError(error);
  }

  async updateSchoolPin(schoolId: string, pin: string) {
    const { error } = await this.supabase.from('schools').update({ pin }).eq('id', schoolId);
    if(error) throw this.processError(error);
  }
}
