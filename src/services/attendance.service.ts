import { Injectable, signal, computed, inject } from '@angular/core';
import { GoogleGenAI, Type } from "@google/genai";
import { BackendService, AppData } from './backend.service';

export interface Teacher {
  id: string; // local id
  name: string;
  email: string;
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
  rollNumber: string;
  mobileNumber: string;
  photo?: string;
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

type CurrentUser = { id: string, role: 'teacher' | 'coordinator' };

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  private backendService = inject(BackendService);
  
  isOnline = signal(navigator.onLine);
  isSyncing = signal(false);
  isInitialized = signal(false);

  private currentUser = signal<CurrentUser | null>(null);
  private teachers = signal<Teacher[]>([]);
  private students = signal<Student[]>([]);
  private attendance = signal<AttendanceRecord[]>([]);
  private teacherAttendance = signal<TeacherAttendanceRecord[]>([]);

  activeUserRole = computed(() => this.currentUser()?.role);
  
  coordinator = computed(() => this.teachers().find(t => t.role === 'coordinator'));
  teachersOnly = computed(() => this.teachers().filter(t => t.role === 'teacher'));

  activeTeacher = computed(() => {
    const user = this.currentUser();
    if (user?.role !== 'teacher') return null;
    return this.teachers().find(t => t.id === user.id) || null;
  });

  activeCoordinator = computed(() => {
    const user = this.currentUser();
    if (user?.role !== 'coordinator') return null;
    return this.teachers().find(t => t.id === user.id) || null;
  });

  activeStudents = computed(() => {
    const teacherId = this.activeTeacher()?.id;
    if (!teacherId) return [];
    return this.students().filter(s => s.teacherId === teacherId);
  });

  teacherClasses = computed(() => {
    const teacher = this.activeTeacher();
    if (!teacher) return [];
    
    const classes = new Map<string, Set<string>>();
    
    this.activeStudents().forEach(s => {
        const className = s.className || teacher.className;
        const section = s.section || teacher.section;
        if (!classes.has(className)) {
            classes.set(className, new Set());
        }
        classes.get(className)!.add(section);
    });

    if (teacher.className) {
        if (!classes.has(teacher.className)) {
            classes.set(teacher.className, new Set());
        }
        classes.get(teacher.className)!.add(teacher.section);
    }

    return Array.from(classes.entries()).map(([className, sections]) => ({
        className,
        sections: Array.from(sections).sort()
    })).sort((a, b) => a.className.localeCompare(b.className));
  });

  constructor() {
    window.addEventListener('online', () => this.isOnline.set(true));
    window.addEventListener('offline', () => this.isOnline.set(false));
  }
  
  async initialize() {
    if (this.isInitialized()) return;

    const data = await this.backendService.loadData();
    if (data) {
      this.teachers.set(data.teachers || []);
      this.students.set(data.students || []);
      this.attendance.set(data.attendance || []);
      this.teacherAttendance.set(data.teacherAttendance || []);
    }
    
    // Restore session if available
    if (data && data.loggedInUserId) {
        const loggedInTeacher = this.teachers().find(t => t.id === data.loggedInUserId);
        if (loggedInTeacher) {
          this.currentUser.set({ id: loggedInTeacher.id, role: loggedInTeacher.role });
        }
    }
    
    this.isInitialized.set(true);
  }

  private async persistState(loggedInUserId: string | null) {
    if (!this.isInitialized()) return;

    this.isSyncing.set(true);
    const data: AppData = {
      version: 9,
      teachers: this.teachers(),
      students: this.students(),
      attendance: this.attendance(),
      teacherAttendance: this.teacherAttendance(),
      loggedInUserId: loggedInUserId,
    };
    await this.backendService.saveData(data);
    this.isSyncing.set(false);
  }

  async createInitialCoordinator(details: { schoolName: string; name: string; className: string; section: string; mobile: string; }) {
    if (this.teachers().some(t => t.role === 'coordinator')) {
        throw new Error("Coordinator already exists.");
    }
    const id = 'coord_' + Math.random().toString(36).substr(2, 5);
    const coordinator: Teacher = {
        id,
        name: details.name,
        email: `${id}@local.app`, // dummy email
        role: 'coordinator',
        schoolName: details.schoolName,
        className: details.className,
        section: details.section,
        setupComplete: true, // Setup is done in one step
        mobileNumber: details.mobile,
    };
    this.teachers.update(list => [...list, coordinator]);
    await this.setActiveUser(id);
  }

  async createInitialTeacher(details: { schoolName: string; name: string; className: string; section: string; mobile: string; }) {
    const id = 'teacher_' + Math.random().toString(36).substr(2, 5);
    const teacher: Teacher = {
        id,
        name: details.name,
        email: `${id}@local.app`, // dummy email
        role: 'teacher',
        schoolName: details.schoolName,
        className: details.className,
        section: details.section,
        setupComplete: true,
        mobileNumber: details.mobile,
    };
    this.teachers.update(list => [...list, teacher]);
    await this.setActiveUser(id);
  }


  async setActiveUser(userId: string): Promise<void> {
    const user = this.teachers().find(t => t.id === userId);
    if (user) {
        this.currentUser.set({ id: user.id, role: user.role });
        await this.persistState(user.id);
    } else {
        throw new Error('User not found');
    }
  }
  
  isRollNumberTaken(rollNumber: string, studentIdToExclude?: string): boolean {
    return this.activeStudents().some(s => 
      s.rollNumber.toLowerCase() === rollNumber.toLowerCase() && s.id !== studentIdToExclude
    );
  }

  async logout() { 
    this.currentUser.set(null);
    await this.persistState(null);
  }

  async parseStudentListFromImage(base64Image: string): Promise<{ name: string, roll: string, mobile: string }[]> {
    try {
      const data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash', contents: [{ parts: [
              { text: "Extract student information from this image of a list or roster. Return an array of objects with keys: name, roll, mobile. If a field is missing, use an empty string. Ensure 'roll' and 'mobile' are strings. Focus on accuracy." },
              { inlineData: { mimeType: 'image/jpeg', data } } ] }],
        config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: {
                type: Type.OBJECT, properties: {
                  name: { type: Type.STRING }, roll: { type: Type.STRING }, mobile: { type: Type.STRING }
                }, required: ["name", "roll", "mobile"] } } }
      });
      return JSON.parse(response.text.trim());
    } catch (e) {
      console.error("AI OCR Failure:", e);
      throw new Error("Could not parse image. Please try better lighting or manual entry.");
    }
  }

  addStudents(newStudents: { name: string, roll: string, mobile: string, photo?: string, totalFee?: number, className?: string, section?: string }[]) {
    const teacherId = this.activeTeacher()!.id;
    const studentsToAdd: Student[] = newStudents.map(s => ({
      id: Math.random().toString(36).substr(2, 9), teacherId, name: s.name,
      rollNumber: s.roll, mobileNumber: s.mobile, photo: s.photo,
      totalFee: s.totalFee || 0,
      feeHistory: [],
      className: s.className,
      section: s.section
    }));
    this.students.update(list => [...list, ...studentsToAdd]);
    this.persistState(this.currentUser()?.id || null);
  }
  
  updateStudentDetails(studentId: string, details: Partial<Omit<Student, 'id' | 'teacherId' | 'feeHistory'>>) {
    this.students.update(list => list.map(s => {
      if (s.id === studentId) {
        return { ...s, ...details };
      }
      return s;
    }));
    this.persistState(this.currentUser()?.id || null);
  }

  recordFeePayment(studentId: string, amount: number) {
    const payment: FeePayment = {
        amount: amount,
        date: new Date().toISOString().split('T')[0]
    };
    this.students.update(list => list.map(s => {
        if (s.id === studentId) {
            return {
                ...s,
                feeHistory: [...s.feeHistory, payment]
            };
        }
        return s;
    }));
    this.persistState(this.currentUser()?.id || null);
  }

  saveAttendance(date: string, records: { studentId: string, status: 'Present' | 'Absent' }[]) {
    const teacherId = this.activeTeacher()!.id;
    this.attendance.update(list => list.filter(r => !(r.date === date && r.teacherId === teacherId)));
    
    const newRecords: AttendanceRecord[] = records.map(r => ({
      date, teacherId, studentId: r.studentId, status: r.status, lastUpdated: Date.now()
    }));
    this.attendance.update(list => [...list, ...newRecords]);
    this.persistState(this.currentUser()?.id || null);
  }

  getAttendanceForDate(date: string) {
    const teacherId = this.activeTeacher()?.id;
    return this.attendance().filter(r => r.date === date && r.teacherId === teacherId);
  }

  getAttendanceForRange(startDate: string, endDate: string, filters?: { className?: string, section?: string }) {
    const teacher = this.activeTeacher();
    if (!teacher) return [];

    const studentIdsToInclude = new Set(
      this.activeStudents()
        .filter(s => {
          if (!filters || (!filters.className && !filters.section)) return true;
          const sClass = s.className || teacher.className;
          const sSection = s.section || teacher.section;
          const classMatch = !filters.className || sClass === filters.className;
          const sectionMatch = !filters.section || sSection === filters.section;
          return classMatch && sectionMatch;
        })
        .map(s => s.id)
    );
    
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);

    return this.attendance().filter(r => {
      if (r.teacherId !== teacher.id) return false;
      if (!studentIdsToInclude.has(r.studentId)) return false;
      const recordDate = new Date(r.date);
      return recordDate >= start && recordDate <= end;
    });
  }

  async generateMonthlyAnalysis(monthName: string, reportData: any[]): Promise<string> {
    if (!reportData || reportData.length === 0) {
      return "No attendance data available for this month to analyze.";
    }

    const simplifiedData = reportData.map(d => ({ name: d.name, present: d.present, absent: d.absent, percentage: d.percentage }));
    const overallPresent = simplifiedData.reduce((acc, d) => acc + d.present, 0);
    const overallAbsent = simplifiedData.reduce((acc, d) => acc + d.absent, 0);
    const totalRecords = overallPresent + overallAbsent;
    const classPercentage = totalRecords > 0 ? ((overallPresent / totalRecords) * 100).toFixed(1) : "0.0";

    const prompt = `
      Analyze the student attendance for ${monthName}. The class has an overall attendance of ${classPercentage}%.
      Provide a concise, professional analysis (2-3 sentences) for a teacher's report.
      Highlight the student with the highest attendance and the student with the lowest attendance.
      Do not use markdown formatting (like * or #).
      Example: Overall attendance was strong this month. John Doe achieved perfect attendance, while Jane Smith's attendance was lowest and needs attention.
      
      Student Data:
      ${JSON.stringify(simplifiedData)}
    `;

    try {
        const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (e) {
        console.error("AI Analysis generation failed:", e);
        return "Could not generate an AI-powered analysis for this period.";
    }
  }
  
  getMonthlyBreakdownForRange(startDate: string, endDate: string, filters?: { className?: string, section?: string }) {
    const teacher = this.activeTeacher();
    if (!teacher) return [];
    
    const allRecordsInRange = this.getAttendanceForRange(startDate, endDate, filters);
    
    let students = this.activeStudents();
    if (filters && (filters.className || filters.section)) {
        students = students.filter(s => {
            const sClass = s.className || teacher.className;
            const sSection = s.section || teacher.section;
            const classMatch = !filters.className || sClass === filters.className;
            const sectionMatch = !filters.section || sSection === filters.section;
            return classMatch && sectionMatch;
        });
    }

    const monthlyBreakdown: { month: string, monthName: string, records: any[] }[] = [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);
    
    let current = new Date(start.getUTCFullYear(), start.getUTCMonth(), 1);
    
    while (current <= end) {
        const year = current.getUTCFullYear();
        const month = current.getUTCMonth();
        
        const yearMonth = `${year}-${(month + 1).toString().padStart(2, '0')}`;
        const monthName = current.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        const monthStart = new Date(Date.UTC(year, month, 1));
        const monthEnd = new Date(Date.UTC(year, month + 1, 0));
        monthEnd.setUTCHours(23, 59, 59, 999);

        const monthRecords = allRecordsInRange.filter(r => {
            const recordDate = new Date(r.date);
            return recordDate >= monthStart && recordDate <= monthEnd;
        });

        if (monthRecords.length > 0 || students.length > 0) {
            const studentStats = students.map(s => {
                const studentRecords = monthRecords.filter(r => r.studentId === s.id);
                const present = studentRecords.filter(r => r.status === 'Present').length;
                const absent = studentRecords.filter(r => r.status === 'Absent').length;
                const total = present + absent;
                const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';
                return { name: s.name, roll: s.rollNumber, mobile: s.mobileNumber, photo: s.photo, present, absent, percentage };
            });
            monthlyBreakdown.push({ month: yearMonth, monthName, records: studentStats });
        }
        
        current.setUTCMonth(current.getUTCMonth() + 1);
    }
    
    return monthlyBreakdown;
  }

  getMonthlyReport(yearMonth: string) {
    const [year, month] = yearMonth.split('-').map(Number);
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));
    end.setUTCHours(23, 59, 59, 999);
    
    const records = this.attendance().filter(r => {
        if (r.teacherId !== this.activeTeacher()?.id) return false;
        const recordDate = new Date(r.date);
        return recordDate >= start && recordDate <= end;
    });

    const students = this.activeStudents();
    return students.map(s => {
      const studentRecords = records.filter(r => r.studentId === s.id);
      const present = studentRecords.filter(r => r.status === 'Present').length;
      const absent = studentRecords.filter(r => r.status === 'Absent').length;
      const total = present + absent;
      const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';
      return { name: s.name, roll: s.rollNumber, mobile: s.mobileNumber, photo: s.photo, present, absent, percentage };
    });
  }

  getDailyReportData(date: string) {
    const students = this.activeStudents();
    const recordsForDate = this.getAttendanceForDate(date);
    
    const [year, monthStr] = date.split('-');
    const monthStart = new Date(Date.UTC(parseInt(year), parseInt(monthStr) - 1, 1));
    const reportDate = new Date(date);
    reportDate.setUTCHours(23, 59, 59, 999);

    const allRecordsThisMonth = this.attendance().filter(r => {
        if (r.teacherId !== this.activeTeacher()?.id) return false;
        const recordDate = new Date(r.date);
        return recordDate >= monthStart && recordDate <= reportDate;
    });

    return students.map(s => {
        const statusRecord = recordsForDate.find(r => r.studentId === s.id);
        const status = statusRecord ? statusRecord.status : 'N/A';
        
        const studentTotalRecords = allRecordsThisMonth.filter(r => r.studentId === s.id);
        const present = studentTotalRecords.filter(r => r.status === 'Present').length;
        const total = studentTotalRecords.length;
        const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';

        return {
            roll: s.rollNumber,
            name: s.name,
            photo: s.photo,
            mobile: s.mobileNumber,
            status: status,
            percentage: percentage
        };
    });
  }

  // --- Coordinator Methods ---

  getTeachers(): Teacher[] {
    return this.teachers();
  }

  getTeacherAttendanceForDate(date: string): TeacherAttendanceRecord[] {
    return this.teacherAttendance().filter(r => r.date === date);
  }

  async addTeacher(teacherData: { name: string, email: string, photo?: string, mobile?: string, className?: string, section?: string }): Promise<void> {
    if (this.teachers().some(t => t.email.toLowerCase() === teacherData.email.toLowerCase())) {
        throw new Error('Email already exists');
    }
    const id = teacherData.name.toLowerCase().replace(/\s/g, '_') + '_' + Math.random().toString(36).substr(2, 5);
    const newTeacher: Teacher = {
        id,
        name: teacherData.name,
        email: teacherData.email,
        role: 'teacher',
        schoolName: this.activeCoordinator()?.schoolName || '',
        className: teacherData.className || '',
        section: teacherData.section || '',
        setupComplete: !!(teacherData.className && teacherData.section),
        photo: teacherData.photo,
        mobileNumber: teacherData.mobile
    };
    this.teachers.update(t => [...t, newTeacher]);
    await this.persistState(this.currentUser()?.id || null);
  }

  removeTeacher(teacherId: string): void {
    this.teachers.update(teachers => teachers.filter(t => t.id !== teacherId));
    this.persistState(this.currentUser()?.id || null);
  }

  updateTeacherDetails(teacherId: string, details: Partial<Omit<Teacher, 'id' | 'role'>>) {
    this.teachers.update(list => list.map(t => {
        if (t.id === teacherId) {
            return { ...t, ...details };
        }
        return t;
    }));
    this.persistState(this.currentUser()?.id || null);
  }

  saveTeacherAttendance(date: string, records: { teacherId: string, status: 'Present' | 'Absent' }[]) {
    this.teacherAttendance.update(list => list.filter(r => r.date !== date));

    const newRecords: TeacherAttendanceRecord[] = records.map(r => ({
        date,
        teacherId: r.teacherId,
        status: r.status,
        lastUpdated: Date.now()
    }));

    this.teacherAttendance.update(list => [...list, ...newRecords]);
    this.persistState(this.currentUser()?.id || null);
  }

  getTeacherMonthlyReport(yearMonth: string) {
    const [year, month] = yearMonth.split('-').map(Number);
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));
    end.setUTCHours(23, 59, 59, 999);

    const records = this.teacherAttendance().filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= start && recordDate <= end;
    });

    const teachers = this.getTeachers();
    return teachers.map(t => {
        const teacherRecords = records.filter(r => r.teacherId === t.id);
        const present = teacherRecords.filter(r => r.status === 'Present').length;
        const absent = teacherRecords.filter(r => r.status === 'Absent').length;
        const total = present + absent;
        const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';
        return { ...t, present, absent, percentage };
    });
  }
}
