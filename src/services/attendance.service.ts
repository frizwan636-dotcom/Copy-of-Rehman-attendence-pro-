import { Injectable, signal, computed, inject } from '@angular/core';
import { GoogleGenAI, Type } from "@google/genai";
import { SupabaseService, AppData } from './supabase.service';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

export interface Teacher {
  id: string; // Will be Supabase Auth User ID for coordinator, or generated ID for teachers
  name: string;
  email: string;
  pin: string;
  role: 'teacher' | 'coordinator';
  schoolName?: string;
  className: string;
  section: string;
  setupComplete: boolean;
  photo?: string;
  mobileNumber?: string;
}

export interface FeePayment {
  amount: number;
  date: string;
}

export interface Student {
  id: string;
  teacherId: string;
  name: string;
  fatherName?: string;
  rollNumber: string;
  mobileNumber: string;
  totalFee: number;
  feeHistory: FeePayment[];
  className?: string;
  section?: string;
}

export interface AttendanceRecord {
  date: string;
  teacherId: string;
  studentId: string;
  status: 'Present' | 'Absent';
  lastUpdated: number;
}

export interface TeacherAttendanceRecord {
  date: string;
  teacherId: string;
  status: 'Present' | 'Absent';
  lastUpdated: number;
}

export interface DailySubmission {
  date: string;
  teacherId: string;
  className: string;
  section: string;
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  submissionTimestamp: number;
}

type CurrentPinUser = { id: string, role: 'teacher' | 'coordinator' };

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  private supabaseService = inject(SupabaseService);
  
  isOnline = signal(navigator.onLine);
  isSyncing = signal(false);
  isInitialized = signal(false);

  private initializationResolver: ((value: void | PromiseLike<void>) => void) | null = null;
  private initializationPromise = new Promise<void>(resolve => {
    this.initializationResolver = resolve;
  });

  // Supabase auth state
  supabaseUser = signal<User | null>(null);
  
  // App-level state
  private currentPinUser = signal<CurrentPinUser | null>(null);
  private teachers = signal<Teacher[]>([]);
  private students = signal<Student[]>([]);
  private attendance = signal<AttendanceRecord[]>([]);
  private teacherAttendance = signal<TeacherAttendanceRecord[]>([]);
  private dailySubmissions = signal<DailySubmission[]>([]);

  // Computed signals for UI
  isSupabaseAuthenticated = computed(() => !!this.supabaseUser());
  activeUserRole = computed(() => this.currentPinUser()?.role);
  
  coordinator = computed(() => this.teachers().find(t => t.role === 'coordinator'));
  teachersOnly = computed(() => this.teachers().filter(t => t.role === 'teacher'));

  activeTeacher = computed(() => {
    const user = this.currentPinUser();
    if (user?.role !== 'teacher') return null;
    return this.teachers().find(t => t.id === user.id) || null;
  });

  activeCoordinator = computed(() => {
    const user = this.currentPinUser();
    if (user?.role !== 'coordinator') return null;
    return this.teachers().find(t => t.id === user.id) || null;
  });

  activeStudents = computed(() => {
    const teacherId = this.activeTeacher()?.id;
    if (!teacherId) return [];
    return this.students().filter(s => s.teacherId === teacherId);
  });

  allSchoolStudents = computed(() => this.students());

  allSchoolClasses = computed(() => {
    const classSet = new Set<string>();
    const classes: { className: string, section: string }[] = [];
    const addClass = (className: string | undefined, section: string | undefined) => {
        if (className && section) {
            const key = `${className}|${section}`;
            if (!classSet.has(key)) {
                classSet.add(key);
                classes.push({ className, section });
            }
        }
    };
    this.teachers().forEach(t => addClass(t.className, t.section));
    this.students().forEach(s => addClass(s.className, s.section));
    return classes.sort((a, b) => a.className.localeCompare(b.className) || a.section.localeCompare(b.section));
  });

  teacherClasses = computed(() => {
    const teacher = this.activeTeacher();
    if (!teacher) return [];
    const classes = new Map<string, Set<string>>();
    this.activeStudents().forEach(s => {
        const className = s.className || teacher.className;
        const section = s.section || teacher.section;
        if (!classes.has(className)) classes.set(className, new Set());
        classes.get(className)!.add(section);
    });
    if (teacher.className) {
        if (!classes.has(teacher.className)) classes.set(teacher.className, new Set());
        classes.get(teacher.className)!.add(teacher.section);
    }
    return Array.from(classes.entries()).map(([className, sections]) => ({
        className, sections: Array.from(sections).sort()
    })).sort((a, b) => a.className.localeCompare(b.className));
  });
  
  teachersWithClasses = computed(() => {
    return this.teachersOnly().map(t => ({
      teacherId: t.id,
      teacherName: t.name,
      className: t.className,
      section: t.section
    }));
  });

  constructor() {
    window.addEventListener('online', () => this.isOnline.set(true));
    window.addEventListener('offline', () => this.isOnline.set(false));
    this.supabaseService.onAuthStateChange((event, session) => {
      this.handleAuthStateChange(event, session);
    });
  }

  private async handleAuthStateChange(event: AuthChangeEvent, session: Session | null) {
    const user = session?.user || null;
    this.supabaseUser.set(user);

    if (event === 'INITIAL_SESSION') {
      if (user) {
        const data = await this.supabaseService.loadData(user);
        if (data) this.loadStateFromData(data);
      }
      this.isInitialized.set(true);
      if (this.initializationResolver) {
        this.initializationResolver();
        this.initializationResolver = null;
      }
    } else if (event === 'SIGNED_OUT') {
      this.clearLocalState();
    }
  }
  
  async initialize() {
    return this.initializationPromise;
  }
  
  private clearLocalState() {
    this.currentPinUser.set(null);
    this.teachers.set([]);
    this.students.set([]);
    this.attendance.set([]);
    this.teacherAttendance.set([]);
    this.dailySubmissions.set([]);
  }

  private loadStateFromData(data: AppData) {
    this.teachers.set(data.teachers || []);
    this.students.set(data.students || []);
    this.attendance.set(data.attendance || []);
    this.teacherAttendance.set(data.teacherAttendance || []);
    this.dailySubmissions.set(data.dailySubmissions || []);
  }

  private async syncToSupabase() {
    if (!this.isInitialized() || !this.isSupabaseAuthenticated()) return;
    this.isSyncing.set(true);
    const data: AppData = {
      teachers: this.teachers(),
      students: this.students(),
      attendance: this.attendance(),
      teacherAttendance: this.teacherAttendance(),
      dailySubmissions: this.dailySubmissions(),
    };
    await this.supabaseService.saveData(data, this.supabaseUser());
    this.isSyncing.set(false);
  }

  async signUpCoordinator(details: { email: string; password: string; schoolName: string; name: string; className: string; section: string; mobile: string; pin: string; }) {
    const { data: authData, error } = await this.supabaseService.signUp(details.email, details.password, {
      name: details.name, schoolName: details.schoolName
    });
    if (error) throw new Error(error.message);
    if (!authData?.user) throw new Error("Signup failed, user not created.");
    
    const user = authData.user;
    this.supabaseUser.set(user);

    const coordinator: Teacher = {
        id: user.id, name: details.name, email: user.email!, pin: details.pin,
        role: 'coordinator', schoolName: details.schoolName,
        className: details.className, section: details.section,
        setupComplete: true, mobileNumber: details.mobile,
    };
    this.teachers.set([coordinator]);
    this.students.set([]);
    this.attendance.set([]);
    this.teacherAttendance.set([]);
    this.dailySubmissions.set([]);
    
    await this.syncToSupabase();
  }

  async login(email: string, password: string) {
    const { data: authData, error } = await this.supabaseService.signIn(email, password);
    if (error) throw new Error(error.message);
    if (!authData?.user) throw new Error("Login failed.");

    const user = authData.user;
    this.supabaseUser.set(user);
    
    // After login, fetch their data
    const data = await this.supabaseService.loadData(user);
    if (data) {
        this.loadStateFromData(data);
    } else {
        // This case might happen for a user who signed up but data wasn't saved.
        // We should create a default state for them based on their metadata.
        const coordinator: Teacher = {
            id: user.id, name: user.user_metadata.name, email: user.email!, pin: '1234', // default pin
            role: 'coordinator', schoolName: user.user_metadata.schoolName,
            className: 'N/A', section: 'A',
            setupComplete: true, mobileNumber: 'N/A',
        };
        this.teachers.set([coordinator]);
        this.students.set([]);
        this.attendance.set([]);
        this.teacherAttendance.set([]);
        this.dailySubmissions.set([]);
        await this.syncToSupabase();
    }
  }

  pinLogout() {
    this.currentPinUser.set(null);
  }

  async logout() { 
    await this.supabaseService.signOut();
    // The onAuthStateChange listener will clear the state, but we do it here
    // for a faster UI response.
    this.supabaseUser.set(null);
    this.clearLocalState();
  }

  verifyPin(userId: string, pin: string): boolean {
    const user = this.teachers().find(t => t.id === userId);
    return user ? user.pin === pin : false;
  }

  async setActiveUser(userId: string): Promise<void> {
    const user = this.teachers().find(t => t.id === userId);
    if (user) {
        this.currentPinUser.set({ id: user.id, role: user.role });
    } else {
        throw new Error('User not found');
    }
  }
  
  isRollNumberTaken(rollNumber: string, studentIdToExclude?: string): boolean {
    return this.activeStudents().some(s => 
      s.rollNumber.toLowerCase() === rollNumber.toLowerCase() && s.id !== studentIdToExclude
    );
  }

  async parseStudentListFromImage(base64Image: string): Promise<{ name: string, fatherName: string, roll: string, mobile: string }[]> {
    try {
      const data = base64Image.split(',')[1];
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash', contents: [{ parts: [
              { text: "Extract student information from this image of a list or roster. Return an array of objects with keys: name, fatherName, roll, mobile. If a field is missing, use an empty string. Ensure 'roll' and 'mobile' are strings. Focus on accuracy." },
              { inlineData: { mimeType: 'image/jpeg', data } } ] }],
        config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: {
                type: Type.OBJECT, properties: {
                  name: { type: Type.STRING }, fatherName: { type: Type.STRING }, roll: { type: Type.STRING }, mobile: { type: Type.STRING }
                }, required: ["name", "fatherName", "roll", "mobile"] } } }
      });
      return JSON.parse(response.text);
    } catch (e) {
      console.error("AI OCR Failure:", e);
      throw new Error("Could not parse image. Please try better lighting or manual entry.");
    }
  }

  addStudents(newStudents: { name: string, fatherName?: string, roll: string, mobile: string, totalFee?: number, className?: string, section?: string }[]) {
    const teacherId = this.activeTeacher()!.id;
    const studentsToAdd: Student[] = newStudents.map(s => ({
      id: Math.random().toString(36).substr(2, 9), teacherId, name: s.name, fatherName: s.fatherName,
      rollNumber: s.roll, mobileNumber: s.mobile,
      totalFee: s.totalFee || 0,
      feeHistory: [],
      className: s.className || this.activeTeacher()?.className,
      section: s.section || this.activeTeacher()?.section
    }));
    this.students.update(list => [...list, ...studentsToAdd]);
    this.syncToSupabase();
  }

  updateStudentDetails(studentId: string, details: Partial<Omit<Student, 'id' | 'teacherId' | 'feeHistory'>>) {
    this.students.update(list => list.map(s => 
      s.id === studentId ? { ...s, ...details } : s
    ));
    this.syncToSupabase();
  }

  getAttendanceForDate(date: string): AttendanceRecord[] {
    return this.attendance().filter(r => r.date === date);
  }

  saveAttendance(date: string, records: { studentId: string, status: 'Present' | 'Absent' }[]) {
    const teacherId = this.activeTeacher()?.id;
    if (!teacherId) return;
    const lastUpdated = Date.now();
    const updatedRecords = records.map(r => ({ ...r, date, teacherId, lastUpdated }));
    this.attendance.update(existing => {
      const studentIdsToUpdate = new Set(records.map(r => r.studentId));
      const filtered = existing.filter(r => !(r.date === date && studentIdsToUpdate.has(r.studentId)));
      return [...filtered, ...updatedRecords];
    });
  }

  submitAttendanceToCoordinator( date: string, activeClass: { className: string; section: string }, studentsInClass: Student[], attendanceMap: Map<string, 'Present' | 'Absent'>) {
    const teacher = this.activeTeacher();
    if (!teacher) return;

    const totalStudents = studentsInClass.length;
    let presentStudents = 0;
    studentsInClass.forEach(s => {
      if (attendanceMap.get(s.id) === 'Present') presentStudents++;
    });
    const absentStudents = totalStudents - presentStudents;

    const newSubmission: DailySubmission = {
      date, teacherId: teacher.id, className: activeClass.className, section: activeClass.section,
      totalStudents, presentStudents, absentStudents, submissionTimestamp: Date.now(),
    };

    this.dailySubmissions.update(list => {
      const filtered = list.filter(s => 
        !(s.date === date && s.className === activeClass.className && s.section === activeClass.section)
      );
      return [...filtered, newSubmission];
    });
    this.syncToSupabase();
  }

  getSubmissionForTeacher(teacherId: string, className: string, section: string, date: string): DailySubmission | undefined {
    return this.dailySubmissions().find(s => 
      s.date === date && s.teacherId === teacherId && s.className === className && s.section === section
    );
  }

  getDailySubmissionsForDate(date: string): DailySubmission[] {
    return this.dailySubmissions().filter(s => s.date === date);
  }

  recordFeePayment(studentId: string, amount: number) {
    this.students.update(list => list.map(s => {
      if (s.id === studentId) {
        const newHistory: FeePayment = { amount, date: new Date().toISOString().split('T')[0] };
        return { ...s, feeHistory: [...s.feeHistory, newHistory] };
      }
      return s;
    }));
    this.syncToSupabase();
  }
  
  getDailyReportData(date: string) {
    const students = this.activeStudents();
    const records = this.getAttendanceForDate(date);
    return students.map(s => {
      const record = records.find(r => r.studentId === s.id);
      const studentRecords = this.attendance().filter(r => r.studentId === s.id);
      const presentCount = studentRecords.filter(r => r.status === 'Present').length;
      const totalCount = studentRecords.length;
      const percentage = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(0) : '0';
      return { roll: s.rollNumber, name: s.name, fatherName: s.fatherName, mobile: s.mobileNumber, status: record?.status || 'N/A', percentage };
    }).sort((a,b) => a.roll.localeCompare(b.roll, undefined, { numeric: true }));
  }

  getMonthlyReport(month: string) {
    const students = this.activeStudents();
    const records = this.attendance().filter(r => r.date.startsWith(month));
    return students.map(s => {
      const studentRecords = records.filter(r => r.studentId === s.id);
      const present = studentRecords.filter(r => r.status === 'Present').length;
      const absent = studentRecords.filter(r => r.status === 'Absent').length;
      const total = present + absent;
      const percentage = total > 0 ? ((present / total) * 100).toFixed(0) : '0';
      return { roll: s.rollNumber, name: s.name, fatherName: s.fatherName, present, absent, percentage };
    }).sort((a,b) => a.roll.localeCompare(b.roll, undefined, { numeric: true }));
  }

  getMonthlyBreakdownForRange(startDate: string, endDate: string, filters?: { className?: string, section?: string }) {
    let studentsInRange = this.students();
    if(filters?.className) studentsInRange = studentsInRange.filter(s => s.className === filters.className);
    if(filters?.section) studentsInRange = studentsInRange.filter(s => s.section === filters.section);
    
    const records = this.attendance().filter(r => r.date >= startDate && r.date <= endDate);
    const monthlyData = new Map<string, any[]>();
    records.forEach(r => {
      const monthKey = r.date.slice(0, 7);
      if(!monthlyData.has(monthKey)) monthlyData.set(monthKey, []);
    });
    const breakdown: { monthName: string, records: any[] }[] = [];
    monthlyData.forEach((_, monthKey) => {
      const [year, month] = monthKey.split('-');
      const monthName = new Date(+year, +month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
      const monthRecords = records.filter(r => r.date.startsWith(monthKey));
      const studentStats = studentsInRange.map(s => {
        const studentMonthRecords = monthRecords.filter(rec => rec.studentId === s.id);
        const present = studentMonthRecords.filter(r => r.status === 'Present').length;
        const absent = studentMonthRecords.filter(r => r.status === 'Absent').length;
        const total = present + absent;
        const percentage = total > 0 ? ((present / total) * 100).toFixed(0) : '0';
        return { roll: s.rollNumber, name: s.name, fatherName: s.fatherName, present, absent, percentage };
      });
      breakdown.push({ monthName, records: studentStats });
    });
    return breakdown.sort((a,b) => a.monthName.localeCompare(b.monthName));
  }

  async generateMonthlyAnalysis(month: string, data: any[]): Promise<string> {
    const prompt = `Analyze this monthly student attendance data for ${month}. Provide a 2-3 sentence summary highlighting overall attendance percentage, identifying top performers (over 95%), and students needing attention (under 75%). The data is: ${JSON.stringify(data)}. Be encouraging and professional.`;
    const response = await this.ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
  }

  getTeachers = () => this.teachers();
  
  getTeacherForClass(className: string, section: string): Teacher | undefined {
    return this.teachers().find(t => t.role === 'teacher' && t.className === className && t.section === section);
  }

  async addTeacher(details: { name: string; email: string; pin: string; photo?: string; mobile: string; className: string; section: string; }) {
    if (this.teachers().some(t => t.email.toLowerCase() === details.email.toLowerCase())) {
      throw new Error("A teacher with this email already exists.");
    }
    const id = 'teacher_' + Math.random().toString(36).substr(2, 5);
    const teacher: Teacher = { id, name: details.name, email: details.email, pin: details.pin, role: 'teacher', photo: details.photo,
      className: details.className, section: details.section, setupComplete: !!(details.className && details.section), mobileNumber: details.mobile };
    this.teachers.update(list => [...list, teacher]);
    await this.syncToSupabase();
  }

  removeTeacher(teacherId: string) {
    this.teachers.update(list => list.filter(t => t.id !== teacherId));
    this.syncToSupabase();
  }

  updateTeacherDetails(teacherId: string, details: Partial<Omit<Teacher, 'id' | 'role'>>) {
    const email = details.email?.trim().toLowerCase();
    if(email && this.teachers().some(t => t.email.toLowerCase() === email && t.id !== teacherId)) {
        throw new Error("This email is already used by another teacher.");
    }
    this.teachers.update(list => list.map(t => t.id === teacherId ? { ...t, ...details } : t));
    this.syncToSupabase();
  }

  getTeacherAttendanceForDate(date: string): TeacherAttendanceRecord[] {
    return this.teacherAttendance().filter(r => r.date === date);
  }

  saveTeacherAttendance(date: string, records: { teacherId: string, status: 'Present' | 'Absent' }[]) {
    const lastUpdated = Date.now();
    const updatedRecords = records.map(r => ({ ...r, date, lastUpdated }));
    this.teacherAttendance.update(existing => {
      const teacherIdsToUpdate = new Set(records.map(r => r.teacherId));
      const filtered = existing.filter(r => !(r.date === date && teacherIdsToUpdate.has(r.teacherId)));
      return [...filtered, ...updatedRecords];
    });
    this.syncToSupabase();
  }

  getTeacherDailyReportData(date: string) {
    const teachers = this.teachersOnly();
    const records = this.getTeacherAttendanceForDate(date);
    return teachers.map(t => {
      const record = records.find(r => r.teacherId === t.id);
      const teacherRecords = this.teacherAttendance().filter(r => r.teacherId === t.id);
      const presentCount = teacherRecords.filter(r => r.status === 'Present').length;
      const totalCount = teacherRecords.length;
      const percentage = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(0) : '0';
      return { ...t, status: record?.status || 'N/A', percentage };
    }).sort((a,b) => a.name.localeCompare(b.name));
  }

  getTeacherMonthlyReport(month: string) {
    const teachers = this.teachersOnly();
    const records = this.teacherAttendance().filter(r => r.date.startsWith(month));
    return teachers.map(t => {
      const teacherRecords = records.filter(r => r.teacherId === t.id);
      const present = teacherRecords.filter(r => r.status === 'Present').length;
      const absent = teacherRecords.filter(r => r.status === 'Absent').length;
      const total = present + absent;
      const percentage = total > 0 ? ((present / total) * 100).toFixed(0) : '0';
      return { ...t, present, absent, percentage };
    }).sort((a,b) => a.name.localeCompare(b.name));
  }
  
  async generateTeacherMonthlyAnalysis(month: string, data: any[]): Promise<string> {
    const prompt = `Analyze this monthly teacher attendance data for ${month}. Provide a 2-3 sentence summary highlighting overall staff attendance, identifying any teachers with perfect attendance, and those with notable absences (e.g., more than 3 absences). Data: ${JSON.stringify(data)}. Keep the tone professional and data-focused.`;
    const response = await this.ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
  }
}