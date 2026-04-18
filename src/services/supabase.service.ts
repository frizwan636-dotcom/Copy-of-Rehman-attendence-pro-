import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, AuthChangeEvent, Session, AuthError } from '@supabase/supabase-js';
import type { Teacher, Student, AttendanceRecord, TeacherAttendanceRecord, DailySubmission, FeePayment, Subject, ExamProgress, Quiz, QuizSubmission, Homework, HomeworkSubmission } from './attendance.service';

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
    subjects: Subject[];
    examProgress: ExamProgress[];
    quizzes: Quiz[];
    quizSubmissions: QuizSubmission[];
    homeworks: Homework[];
    homeworkSubmissions: HomeworkSubmission[];
}


@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  private readonly SUPABASE_URL = (typeof process !== 'undefined' && process.env.SUPABASE_URL) || 'https://lucpmecyfkgdcwpditzs.supabase.co';
  private readonly SUPABASE_KEY = (typeof process !== 'undefined' && process.env.SUPABASE_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1Y3BtZWN5ZmtnZGN3cGRpdHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4ODQxOTUsImV4cCI6MjA4NjQ2MDE5NX0.TuQYOT2sQoo5U6gLIJfHRx5IHz0oS69uGp6CdesMyv0';
  
  constructor() {
    this.supabase = createClient(this.SUPABASE_URL, this.SUPABASE_KEY);
  }
  
  private processError(error: AuthError | { message: string, status?: number, details?: string, hint?: string, code?: string } | null): { message: string, status?: number } | null {
    if (!error) return null;

    console.error('Supabase Error Details:', error);
    const lowerCaseMessage = error.message.toLowerCase();

    if (lowerCaseMessage.includes('invalid api key') || error.status === 401) {
      error.message = "Authentication failed due to an invalid Supabase API Key. Please contact the administrator.";
    } else if (lowerCaseMessage.includes('failed to fetch')) {
      error.message = "Network error: Could not connect to the database. Please check your internet connection and Supabase URL.";
    } else if (lowerCaseMessage.includes('invalid login credentials')) {
      error.message = "Invalid email or password. Please check your credentials and try again.";
    } else if (lowerCaseMessage.includes('user already registered')) {
      error.message = "This email is already registered. Please try logging in instead.";
    } else if (lowerCaseMessage.includes('violates not-null constraint')) {
        error.message = "A required field was left empty. Please ensure all required fields are filled and try again.";
    }
    return error as { message: string, status?: number };
  }

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  async signUpAndCreateSchool(details: { email: string, password: string, name: string, schoolName: string, mobile: string, className: string, section: string, pin: string }) {
    // The new database trigger 'handle_new_user' will automatically create the school and teacher profiles.
    // We just need to sign up the user and pass the details in the metadata.
    const { data, error } = await this.supabase.auth.signUp({
      email: details.email,
      password: details.password,
      options: {
        data: {
          name: details.name,
          schoolName: details.schoolName,
          mobile: details.mobile,
          pin: details.pin,
          className: details.className,
          section: details.section
        }
      }
    });

    if (error) throw this.processError(error);
    if (!data.user) throw new Error("User registration failed.");

    return data;
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
      const [
        { data: school, error: schoolError },
        { data: teachers, error: teachersError },
        { data: students, error: studentsError },
        { data: studentAttendance, error: saError },
        { data: teacherAttendance, error: taError },
        { data: dailySubmissions, error: dsError },
        { data: subjects, error: subError },
        { data: examProgress, error: epError },
        { data: quizzes, error: qError },
        { data: quizSubmissions, error: qsError },
        { data: homeworks, error: hError },
        { data: homeworkSubmissions, error: hsError }
      ] = await Promise.all([
        this.supabase.from('schools').select('*').eq('id', schoolId).single(),
        this.supabase.from('teachers').select('*').eq('school_id', schoolId),
        this.supabase.from('students').select('*, fee_payments(*)').eq('school_id', schoolId),
        this.supabase.from('attendance_records').select('*').eq('school_id', schoolId),
        this.supabase.from('teacher_attendance_records').select('*').eq('school_id', schoolId),
        this.supabase.from('daily_submissions').select('*').eq('school_id', schoolId),
        this.supabase.from('subjects').select('*').eq('school_id', schoolId),
        this.supabase.from('exam_progress').select('*').eq('school_id', schoolId),
        this.supabase.from('quizzes').select('*').eq('school_id', schoolId),
        this.supabase.from('quiz_submissions').select('*').eq('school_id', schoolId),
        this.supabase.from('homeworks').select('*').eq('school_id', schoolId),
        this.supabase.from('homework_submissions').select('*').eq('school_id', schoolId)
      ]);

      if (schoolError) throw schoolError;
      if (teachersError) throw teachersError;
      if (studentsError) throw studentsError;
      if (saError) throw saError;
      if (taError) throw taError;
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
          subjects: subjects || [],
          examProgress: examProgress || [],
          quizzes: quizzes || [],
          quizSubmissions: quizSubmissions || [],
          homeworks: homeworks || [],
          homeworkSubmissions: homeworkSubmissions || [],
      };
  }

  // --- DATA MODIFICATION METHODS ---
  async addTeacher(teacher: Omit<Teacher, 'id' | 'schoolName'>) {
    // FIX: Explicitly construct the object to insert, ensuring no 'id' field is ever sent.
    // This is a defensive measure against runtime issues that might be causing the not-null constraint error.
    const {
      school_id,
      name,
      email,
      pin,
      role,
      className,
      section,
      setupComplete,
      photo,
      mobileNumber
    } = teacher;

    const insertData = {
      school_id,
      name,
      email,
      pin,
      role,
      className,
      section,
      setupComplete,
      photo,
      mobileNumber
    };

    const { data, error } = await this.supabase.from('teachers').insert(insertData).select();
    if(error) throw this.processError(error);
    return data && data.length > 0 ? data[0] : { ...insertData, id: Date.now().toString() };
  }
  
  async updateTeacher(teacherId: string, updates: Partial<Teacher>) {
    const { data, error } = await this.supabase.from('teachers').update(updates).eq('id', teacherId).select();
    if (error) throw this.processError(error);
    return data && data.length > 0 ? data[0] : { id: teacherId, ...updates };
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
    const { error } = await this.supabase.from('teacher_attendance_records').upsert(records, { onConflict: 'date,"teacherId"' });
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

  // --- NEW METHODS FOR SUBJECTS, EXAMS, QUIZZES, HOMEWORK ---

  async addSubject(subject: Omit<Subject, 'id'>) {
    const { data, error } = await this.supabase.from('subjects').insert(subject).select();
    if (error) throw this.processError(error);
    return data && data.length > 0 ? data[0] : { ...subject, id: Date.now().toString() };
  }

  async updateSubject(id: string, updates: Partial<Subject>) {
    const { data, error } = await this.supabase.from('subjects').update(updates).eq('id', id).select();
    if (error) throw this.processError(error);
    return data && data.length > 0 ? data[0] : { id, ...updates };
  }

  async removeSubject(id: string) {
    const { error } = await this.supabase.from('subjects').delete().eq('id', id);
    if (error) throw this.processError(error);
  }

  async addExamProgress(progress: Omit<ExamProgress, 'id'>) {
    const { data, error } = await this.supabase.from('exam_progress').insert(progress).select();
    if (error) throw this.processError(error);
    return data && data.length > 0 ? data[0] : { ...progress, id: Date.now().toString() };
  }

  async removeExamProgress(id: string) {
    const { error } = await this.supabase.from('exam_progress').delete().eq('id', id);
    if (error) throw this.processError(error);
  }

  async addQuiz(quiz: Omit<Quiz, 'id'>) {
    const { data, error } = await this.supabase.from('quizzes').insert(quiz).select();
    if (error) throw this.processError(error);
    return data && data.length > 0 ? data[0] : { ...quiz, id: Date.now().toString() };
  }

  async updateQuiz(id: string, updates: Partial<Quiz>) {
    const { data, error } = await this.supabase.from('quizzes').update(updates).eq('id', id).select();
    if (error) throw this.processError(error);
    return data && data.length > 0 ? data[0] : { id, ...updates };
  }

  async deleteQuiz(id: string) {
    const { error } = await this.supabase.from('quizzes').delete().eq('id', id);
    if (error) throw this.processError(error);
  }

  async submitQuiz(submission: Omit<QuizSubmission, 'id'>) {
    const { data, error } = await this.supabase.from('quiz_submissions').insert(submission).select();
    if (error) throw this.processError(error);
    return data && data.length > 0 ? data[0] : { ...submission, id: Date.now().toString() };
  }

  async markQuiz(id: string, updates: Partial<QuizSubmission>) {
    const { data, error } = await this.supabase.from('quiz_submissions').update(updates).eq('id', id).select();
    if (error) throw this.processError(error);
    return data && data.length > 0 ? data[0] : { id, ...updates };
  }

  async addHomework(homework: Omit<Homework, 'id'>) {
    const { data, error } = await this.supabase.from('homeworks').insert(homework).select();
    if (error) throw this.processError(error);
    return data && data.length > 0 ? data[0] : { ...homework, id: Date.now().toString() };
  }

  async updateHomework(id: string, updates: Partial<Homework>) {
    const { data, error } = await this.supabase.from('homeworks').update(updates).eq('id', id).select();
    if (error) throw this.processError(error);
    return data && data.length > 0 ? data[0] : { id, ...updates };
  }

  async deleteHomework(id: string) {
    const { error } = await this.supabase.from('homeworks').delete().eq('id', id);
    if (error) throw this.processError(error);
  }

  async submitHomework(submission: Omit<HomeworkSubmission, 'id'>) {
    const { data, error } = await this.supabase.from('homework_submissions').insert(submission).select();
    if (error) throw this.processError(error);
    return data && data.length > 0 ? data[0] : { ...submission, id: Date.now().toString() };
  }

  async markHomework(id: string, updates: Partial<HomeworkSubmission>) {
    const { data, error } = await this.supabase.from('homework_submissions').update(updates).eq('id', id).select();
    if (error) throw this.processError(error);
    return data && data.length > 0 ? data[0] : { id, ...updates };
  }

  async uploadFile(file: File, path: string) {
    const { data, error } = await this.supabase.storage.from('attachments').upload(path, file);
    if (error) throw this.processError(error);
    
    const { data: { publicUrl } } = this.supabase.storage.from('attachments').getPublicUrl(path);
    return publicUrl;
  }

  // --- CHAT METHODS ---
  async getMessages(schoolId: string) {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('school_id', schoolId)
      .order('timestamp', { ascending: true });
    if (error) throw this.processError(error);
    return data;
  }

  async sendMessage(message: { school_id: string, sender_id: string, text: string }) {
    const { data, error } = await this.supabase
      .from('messages')
      .insert(message)
      .select();
    if (error) throw this.processError(error);
    return data && data.length > 0 ? data[0] : { ...message, id: Date.now().toString(), timestamp: new Date().toISOString() };
  }

  async updateMessage(id: string, text: string) {
    const { data, error } = await this.supabase
      .from('messages')
      .update({ text })
      .eq('id', id)
      .select();
    if (error) throw this.processError(error);
    return data && data.length > 0 ? data[0] : { id, text, timestamp: new Date().toISOString() };
  }

  async deleteMessage(id: string) {
    const { error } = await this.supabase
      .from('messages')
      .delete()
      .eq('id', id);
    if (error) throw this.processError(error);
  }
}
