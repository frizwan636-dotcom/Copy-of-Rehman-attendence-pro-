import { Injectable, signal, computed, inject } from '@angular/core';
import { GoogleGenAI, Type } from "@google/genai";
import { SupabaseService, School, SchoolData } from './supabase.service';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

// Add school_id to interfaces to enforce relational integrity
export interface Teacher {
  id: string; 
  school_id: string;
  name: string;
  email: string;
  pin: string;
  role: 'teacher' | 'coordinator';
  schoolName?: string; // This can be derived from the school now
  className: string;
  section: string;
  setupComplete: boolean;
  photo?: string;
  mobileNumber?: string;
}

export interface FeePayment {
  id?: number;
  student_id: string;
  amount: number;
  date: string;
}

export interface Student {
  id: string;
  school_id: string;
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
  school_id: string;
  date: string;
  teacherId: string;
  studentId: string;
  status: 'Present' | 'Absent';
  lastUpdated: number;
}

export interface TeacherAttendanceRecord {
  school_id: string;
  date: string;
  teacherId: string;
  status: 'Present' | 'Absent';
  lastUpdated: number;
}

export interface DailySubmission {
  school_id: string;
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
  private _ai: GoogleGenAI | null = null;
  private get ai(): GoogleGenAI | null {
    const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;
    if (!apiKey) return null;
    if (!this._ai) {
      try {
        this._ai = new GoogleGenAI({ apiKey });
      } catch (e) {
        console.error("Google GenAI SDK Initialization Error.", e);
        this._ai = null; 
      }
    }
    return this._ai;
  }
  private supabaseService = inject(SupabaseService);
  
  isOnline = signal(navigator.onLine);
  isSyncing = signal(false);
  isInitialized = signal(false);

  private initializationResolver: ((value: void | PromiseLike<void>) => void) | null = null;
  private initializationPromise = new Promise<void>(resolve => {
    this.initializationResolver = resolve;
  });

  supabaseUser = signal<User | null>(null);
  
  private school = signal<School | null>(null);
  private currentPinUser = signal<CurrentPinUser | null>(null);
  private teachers = signal<Teacher[]>([]);
  private students = signal<Student[]>([]);
  private attendance = signal<AttendanceRecord[]>([]);
  private teacherAttendance = signal<TeacherAttendanceRecord[]>([]);
  private dailySubmissions = signal<DailySubmission[]>([]);

  isSupabaseAuthenticated = computed(() => !!this.supabaseUser() && !!this.supabaseUser()?.email);
  activeUserRole = computed(() => this.currentPinUser()?.role);
  activeSchoolPin = computed(() => this.school()?.pin);
  
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
    // For coordinator, add school name from school signal
    const coord = this.teachers().find(t => t.id === user.id);
    if(coord) return {...coord, schoolName: this.school()?.name};
    return null;
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
      section: t.section,
      schoolName: this.school()?.name
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

    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
      if (user) {
        const data = await this.supabaseService.getSchoolDataForCoordinator(user.id);
        if (data) this.loadStateFromData(data);
      }
    }
    
    if (event === 'INITIAL_SESSION') {
      this.isInitialized.set(true);
      if (this.initializationResolver) this.initializationResolver();
    } else if (event === 'SIGNED_OUT') {
      this.clearLocalState();
    }
  }
  
  async initialize() {
    return this.initializationPromise;
  }
  
  private clearLocalState() {
    this.school.set(null);
    this.currentPinUser.set(null);
    this.teachers.set([]);
    this.students.set([]);
    this.attendance.set([]);
    this.teacherAttendance.set([]);
    this.dailySubmissions.set([]);
  }

  private loadStateFromData(data: SchoolData) {
    this.school.set(data.school);
    const schoolName = data.school.name;
    this.teachers.set(data.teachers.map(t => ({...t, schoolName})));
    this.students.set(data.students);
    this.attendance.set(data.studentAttendance);
    this.teacherAttendance.set(data.teacherAttendance);
    this.dailySubmissions.set(data.dailySubmissions);
  }

  async signUpCoordinator(details: { email: string; password: string; schoolName: string; name: string; className: string; section: string; mobile: string; pin: string; }) {
    await this.supabaseService.signUpAndCreateSchool(details);
  }

  async login(email: string, password: string) {
    const { data } = await this.supabaseService.signIn(email, password);
    if (!data.user) throw new Error("Login failed.");
    const schoolData = await this.supabaseService.getSchoolDataForCoordinator(data.user.id);
    if (schoolData) {
        this.loadStateFromData(schoolData);
        // Set the logged-in coordinator as the active user to trigger dashboard view
        await this.setActiveUser(data.user.id);
    } else {
        // If school data is not found, something is wrong. Log out and inform user.
        await this.logout();
        throw new Error("Coordinator account is valid, but no school data was found. Please sign up again or contact support.");
    }
  }
  
  async loadSchoolByPin(pin: string): Promise<string> {
    const school = await this.supabaseService.getSchoolByPin(pin);
    if (!school) {
      throw new Error("School not found. Please check the School PIN and try again.");
    }
    const schoolData = await this.supabaseService.getAllDataForSchool(school.id);
    this.loadStateFromData(schoolData);
    // Set a non-authed user so the app knows we are in teacher mode
    this.supabaseUser.set({ id: school.id } as User);
    return school.id;
  }

  pinLogout() {
    const schoolId = this.school()?.id;
    this.clearLocalState();
    // For teachers, logging out of PIN should not log out of school
    if (schoolId) {
      this.loadSchoolByPin(localStorage.getItem('lastSchoolPin')!);
    }
  }

  async logout() { 
    await this.supabaseService.signOut();
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

  // --- Data Modification Methods ---

  async addTeacher(details: { name: string; email: string; pin: string; photo?: string; mobile: string; className: string; section: string; }) {
    const schoolId = this.school()!.id;
    const trimmedEmail = (details.email || '').trim();
    if (trimmedEmail && this.teachers().some(t => t.email?.toLowerCase() === trimmedEmail.toLowerCase())) {
      throw new Error("A teacher with this email already exists.");
    }
    
    const teacherData: Omit<Teacher, 'id' | 'schoolName'> = { 
      school_id: schoolId, name: details.name, email: trimmedEmail, pin: details.pin, 
      role: 'teacher', photo: details.photo, className: details.className, section: details.section, 
      setupComplete: !!(details.className && details.section), mobileNumber: details.mobile 
    };

    const newTeacher = await this.supabaseService.addTeacher(teacherData);
    this.teachers.update(list => [...list, {...newTeacher, schoolName: this.school()?.name}]);
  }

  async removeTeacher(teacherId: string) {
    await this.supabaseService.removeTeacher(teacherId);
    this.teachers.update(list => list.filter(t => t.id !== teacherId));
  }

  async updateTeacherDetails(teacherId: string, details: Partial<Omit<Teacher, 'id' | 'role'>>) {
    const email = details.email?.toLowerCase();
    if(email && this.teachers().some(t => t.email?.toLowerCase() === email && t.id !== teacherId)) {
        throw new Error("This email is already used by another teacher.");
    }
    const updatedTeacher = await this.supabaseService.updateTeacher(teacherId, details);
    this.teachers.update(list => list.map(t => t.id === teacherId ? { ...updatedTeacher, schoolName: this.school()?.name } : t));
  }

  async addStudents(newStudents: { name: string, fatherName?: string, roll: string, mobile: string, totalFee?: number, className?: string, section?: string }[]) {
    const teacherId = this.activeTeacher()!.id;
    const schoolId = this.school()!.id;
    
    const studentsToAdd = newStudents.map(s => ({
      school_id: schoolId, teacherId, name: s.name, fatherName: s.fatherName,
      rollNumber: s.roll, mobileNumber: s.mobile, totalFee: s.totalFee || 0,
      className: s.className || this.activeTeacher()?.className,
      section: s.section || this.activeTeacher()?.section
    }));
    
    const addedStudents = await this.supabaseService.addStudents(studentsToAdd as any);
    this.students.update(list => [...list, ...addedStudents]);
  }

  async updateStudentDetails(studentId: string, details: Partial<Omit<Student, 'id' | 'teacherId' | 'feeHistory'>>) {
    const updatedStudent = await this.supabaseService.updateStudent(studentId, details);
    this.students.update(list => list.map(s => {
      if (s.id === studentId) return { ...s, ...updatedStudent, feeHistory: s.feeHistory }; // Preserve fee history
      return s;
    }));
  }

  async recordFeePayment(studentId: string, amount: number) {
    const date = new Date().toISOString().split('T')[0];
    const newPayment = await this.supabaseService.recordFeePayment(studentId, amount, date);
    this.students.update(list => list.map(s => {
      if (s.id === studentId) {
        return { ...s, feeHistory: [...s.feeHistory, newPayment] };
      }
      return s;
    }));
  }

  async saveAttendance(date: string, records: { studentId: string, status: 'Present' | 'Absent' }[]) {
    const schoolId = this.school()!.id;
    const teacherId = this.activeTeacher()!.id;
    const lastUpdated = Date.now();
    const updatedRecords: AttendanceRecord[] = records.map(r => ({ ...r, school_id: schoolId, date, teacherId, lastUpdated }));

    await this.supabaseService.saveStudentAttendance(updatedRecords);

    this.attendance.update(existing => {
      const studentIdsToUpdate = new Set(records.map(r => r.studentId));
      const filtered = existing.filter(r => !(r.date === date && studentIdsToUpdate.has(r.studentId)));
      return [...filtered, ...updatedRecords];
    });
  }

  async submitAttendanceToCoordinator( date: string, activeClass: { className: string; section: string }, studentsInClass: Student[], attendanceMap: Map<string, 'Present' | 'Absent'>) {
    const schoolId = this.school()!.id;
    const teacherId = this.activeTeacher()!.id;
    
    const totalStudents = studentsInClass.length;
    let presentStudents = 0;
    studentsInClass.forEach(s => {
      if (attendanceMap.get(s.id) === 'Present') presentStudents++;
    });

    const newSubmission: DailySubmission = {
      school_id: schoolId, date, teacherId, className: activeClass.className, section: activeClass.section,
      totalStudents, presentStudents, absentStudents: totalStudents - presentStudents, submissionTimestamp: Date.now(),
    };

    await this.supabaseService.submitDailySummary(newSubmission);

    this.dailySubmissions.update(list => {
      const filtered = list.filter(s => 
        !(s.date === date && s.className === activeClass.className && s.section === activeClass.section)
      );
      return [...filtered, newSubmission];
    });
  }

  async saveTeacherAttendance(date: string, records: { teacherId: string, status: 'Present' | 'Absent' }[]) {
    const schoolId = this.school()!.id;
    const lastUpdated = Date.now();
    const updatedRecords: TeacherAttendanceRecord[] = records.map(r => ({ ...r, school_id: schoolId, date, lastUpdated }));

    await this.supabaseService.saveTeacherAttendance(updatedRecords);

    this.teacherAttendance.update(existing => {
      const teacherIdsToUpdate = new Set(records.map(r => r.teacherId));
      const filtered = existing.filter(r => !(r.date === date && teacherIdsToUpdate.has(r.teacherId)));
      return [...filtered, ...updatedRecords];
    });
  }

  async setSchoolPin(pin: string) {
    const schoolId = this.school()!.id;
    await this.supabaseService.updateSchoolPin(schoolId, pin);
    this.school.update(s => s ? { ...s, pin } : null);
  }

  // --- Data Getter Methods (mostly unchanged) ---
  isRollNumberTaken(rollNumber: string, studentIdToExclude?: string): boolean {
    return this.activeStudents().some(s => 
      s.rollNumber.toLowerCase() === rollNumber.toLowerCase() && s.id !== studentIdToExclude
    );
  }

  getAttendanceForDate(date: string): AttendanceRecord[] {
    return this.attendance().filter(r => r.date === date);
  }
  
  getAttendanceForStudent(studentId: string): AttendanceRecord[] {
    return this.attendance().filter(r => r.studentId === studentId);
  }

  getSubmissionForTeacher(teacherId: string, className: string, section: string, date: string): DailySubmission | undefined {
    return this.dailySubmissions().find(s => 
      s.date === date && s.teacherId === teacherId && s.className === className && s.section === section
    );
  }

  getDailySubmissionsForDate(date: string): DailySubmission[] {
    return this.dailySubmissions().filter(s => s.date === date);
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

  getTeachers = () => this.teachers();
  
  getTeacherForClass(className: string, section: string): Teacher | undefined {
    return this.teachers().find(t => t.role === 'teacher' && t.className === className && t.section === section);
  }

  getTeacherAttendanceForDate(date: string): TeacherAttendanceRecord[] {
    return this.teacherAttendance().filter(r => r.date === date);
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

  // --- AI Methods (unchanged) ---
  async parseStudentListFromImage(base64Image: string): Promise<{ name: string, fatherName: string, roll: string, mobile: string }[]> {
    const ai = this.ai;
    if (!ai) {
      throw new Error("Cannot parse image: Gemini API key is not configured.");
    }
    try {
      const data = base64Image.split(',')[1];
      const response = await ai.models.generateContent({
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

  async generateMonthlyAnalysis(month: string, data: any[]): Promise<string> {
    const ai = this.ai;
    if (!ai) return "AI analysis is unavailable because the Gemini API key has not been configured.";
    const prompt = `Analyze this monthly student attendance data for ${month}. Provide a 2-3 sentence summary highlighting overall attendance percentage, identifying top performers (over 95%), and students needing attention (under 75%). The data is: ${JSON.stringify(data)}. Be encouraging and professional.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
  }
  
  async generateTeacherMonthlyAnalysis(month: string, data: any[]): Promise<string> {
    const ai = this.ai;
    if (!ai) return "AI analysis is unavailable because the Gemini API key has not been configured.";
    const prompt = `Analyze this monthly teacher attendance data for ${month}. Provide a 2-3 sentence summary highlighting overall staff attendance, identifying any teachers with perfect attendance, and those with notable absences (e.g., more than 3 absences). Data: ${JSON.stringify(data)}. Keep the tone professional and data-focused.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
  }
}
