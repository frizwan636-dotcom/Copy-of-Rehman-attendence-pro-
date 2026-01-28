import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { GoogleGenAI, Type } from "@google/genai";
import { BackendService, AppData } from './backend.service';

export interface Teacher {
  id: string;
  name: string;
  schoolName?: string;
  className: string;
  section: string;
  setupComplete: boolean;
  password?: string;
  photo?: string;
  mobileNumber?: string;
}

export interface Coordinator {
  id: string;
  name: string;
  password?: string;
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
  coordinatorId: string;
  teacherId: string;
  status: 'Present' | 'Absent';
}

type CurrentUser = { id: string, role: 'teacher' | 'coordinator' };

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  private backendService = inject(BackendService);
  
  isOnline = signal(navigator.onLine);
  isSyncing = signal(false); // Used now to indicate "Saving..."
  isInitialized = signal(false);

  // Private state signals
  private currentUser = signal<CurrentUser | null>(null);
  private teachers = signal<Teacher[]>([]);
  private coordinators = signal<Coordinator[]>([]);
  private students = signal<Student[]>([]);
  private attendance = signal<AttendanceRecord[]>([]);
  private teacherAttendance = signal<TeacherAttendanceRecord[]>([]);

  // Computed views
  activeTeacher = computed(() => {
    const user = this.currentUser();
    if (user?.role !== 'teacher') return null;
    return this.teachers().find(t => t.id === user.id) || null;
  });

  activeCoordinator = computed(() => {
    const user = this.currentUser();
    if (user?.role !== 'coordinator') return null;
    return this.coordinators().find(c => c.id === user.id) || null;
  });

  activeStudents = computed(() => {
    const teacherId = this.activeTeacher()?.id;
    if (!teacherId) return [];
    return this.students().filter(s => s.teacherId === teacherId);
  });

  constructor() {
    window.addEventListener('online', () => this.isOnline.set(true));
    window.addEventListener('offline', () => this.isOnline.set(false));

    // This effect must run in an injection context (like the constructor).
    effect(() => {
      const user = this.currentUser();
      if (user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
      } else {
        sessionStorage.removeItem('currentUser');
      }
    });
  }
  
  async initialize() {
    if (this.isInitialized()) return;

    // Load persistent data from backend
    const data = await this.backendService.loadData();
    if (data) {
      this.teachers.set(data.teachers || []);
      this.coordinators.set(data.coordinators || []);
      this.students.set(data.students || []);
      this.attendance.set(data.attendance || []);
      this.teacherAttendance.set(data.teacherAttendance || []);
    }

    // Current user is session state, not part of the main data blob
    this.currentUser.set(JSON.parse(sessionStorage.getItem('currentUser') || 'null'));

    this.isInitialized.set(true);
  }

  private async persistState() {
    if (!this.isInitialized()) return; // Don't save before data is loaded

    this.isSyncing.set(true);
    const data: AppData = {
      version: 3,
      teachers: this.teachers(),
      coordinators: this.coordinators(),
      students: this.students(),
      attendance: this.attendance(),
      teacherAttendance: this.teacherAttendance(),
    };
    await this.backendService.saveData(data);
    this.isSyncing.set(false);
  }

  isUserRegistered(name: string, role: 'teacher' | 'coordinator'): boolean {
    const id = name.toLowerCase().replace(/\s/g, '_');
    if (role === 'teacher') {
      return this.teachers().some(t => t.id === id && t.password);
    } else {
      return this.coordinators().some(c => c.id === id && c.password);
    }
  }
  
  isRollNumberTaken(rollNumber: string): boolean {
    return this.activeStudents().some(s => s.rollNumber.toLowerCase() === rollNumber.toLowerCase());
  }

  verifyPassword(name: string, role: 'teacher' | 'coordinator', passwordAttempt: string): boolean {
    const id = name.toLowerCase().replace(/\s/g, '_');
    const user = role === 'teacher' 
      ? this.teachers().find(t => t.id === id) 
      : this.coordinators().find(c => c.id === id);

    return !!user && !!user.password && user.password === passwordAttempt;
  }
  
  login(name: string, role: 'teacher' | 'coordinator') {
    const id = name.toLowerCase().replace(/\s/g, '_');
    this.currentUser.set({ id, role });
  }

  logout() { this.currentUser.set(null); }

  // Teacher specific actions
  registerTeacher(name: string, password: string) {
    const id = name.toLowerCase().replace(/\s/g, '_');
    if (this.teachers().some(t => t.id === id)) return;
    const newTeacher: Teacher = { id, name, schoolName: '', className: '', section: '', setupComplete: false, password: password };
    this.teachers.update(t => [...t, newTeacher]);
    this.persistState(); // Save changes
    this.login(name, 'teacher');
  }
  
  updateTeacherSetup(schoolName: string, className: string, section: string) {
    this.teachers.update(list => list.map(t => 
      t.id === this.activeTeacher()?.id ? { ...t, schoolName, className, section, setupComplete: true } : t
    ));
    this.persistState();
  }

  // Coordinator specific actions
  registerCoordinator(name: string, password: string) {
    const id = name.toLowerCase().replace(/\s/g, '_');
    if (this.coordinators().some(c => c.id === id)) return;
    const newCoordinator: Coordinator = { id, name, password: password };
    this.coordinators.update(c => [...c, newCoordinator]);
    this.persistState();
    this.login(name, 'coordinator');
  }

  getTeachers(): Teacher[] {
    return this.teachers();
  }

  addTeacher(details: { name: string; photo?: string; mobile?: string; className?: string; section?: string; }) {
    const id = details.name.toLowerCase().replace(/\s/g, '_');
    if (this.teachers().some(t => t.id === id)) {
      throw new Error("A teacher with this name already exists.");
    }
    const newTeacher: Teacher = {
      id,
      name: details.name,
      schoolName: '',
      className: details.className || '',
      section: details.section || '',
      setupComplete: false,
      photo: details.photo,
      mobileNumber: details.mobile
    };
    this.teachers.update(t => [...t, newTeacher]);
    this.persistState();
  }

  updateTeacherDetails(teacherId: string, details: Partial<Pick<Teacher, 'name' | 'photo' | 'mobileNumber' | 'className' | 'section'>>) {
    this.teachers.update(list => list.map(t => {
        if (t.id === teacherId) {
            return { ...t, ...details };
        }
        return t;
    }));
    this.persistState();
  }

  removeTeacher(teacherId: string) {
    this.teachers.update(t => t.filter(teacher => teacher.id !== teacherId));
    this.students.update(s => s.filter(student => student.teacherId !== teacherId));
    this.attendance.update(a => a.filter(att => att.teacherId !== teacherId));
    this.persistState();
  }

  saveTeacherAttendance(date: string, records: { teacherId: string, status: 'Present' | 'Absent' }[]) {
    const coordinatorId = this.activeCoordinator()!.id;
    this.teacherAttendance.update(list => list.filter(r => !(r.date === date && r.coordinatorId === coordinatorId)));
    
    const newRecords: TeacherAttendanceRecord[] = records.map(r => ({
      date, coordinatorId, teacherId: r.teacherId, status: r.status
    }));
    this.teacherAttendance.update(list => [...list, ...newRecords]);
    this.persistState();
  }

  getTeacherAttendanceForDate(date: string): TeacherAttendanceRecord[] {
    const coordinatorId = this.activeCoordinator()!.id;
    return this.teacherAttendance().filter(r => r.date === date && r.coordinatorId === coordinatorId);
  }

  getTeacherMonthlyReport(yearMonth: string) {
    const coordinatorId = this.activeCoordinator()!.id;
    const startDate = `${yearMonth}-01`;
    const endDate = `${yearMonth}-31`;
    
    const records = this.teacherAttendance().filter(r => 
      r.coordinatorId === coordinatorId && 
      r.date >= startDate && 
      r.date <= endDate
    );
    
    const allTeachers = this.teachers();
    
    return allTeachers.map(teacher => {
      const teacherRecords = records.filter(r => r.teacherId === teacher.id);
      const present = teacherRecords.filter(r => r.status === 'Present').length;
      const absent = teacherRecords.filter(r => r.status === 'Absent').length;
      const total = present + absent;
      const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';
      return { 
        name: teacher.name, 
        photo: teacher.photo,
        present, 
        absent, 
        percentage 
      };
    });
  }

  // Student & Student Attendance
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

  addStudents(newStudents: { name: string, roll: string, mobile: string, photo?: string, totalFee?: number }[]) {
    const teacherId = this.activeTeacher()!.id;
    const studentsToAdd: Student[] = newStudents.map(s => ({
      id: Math.random().toString(36).substr(2, 9), teacherId, name: s.name,
      rollNumber: s.roll, mobileNumber: s.mobile, photo: s.photo,
      totalFee: s.totalFee || 0,
      feeHistory: []
    }));
    this.students.update(list => [...list, ...studentsToAdd]);
    this.persistState();
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
    this.persistState();
  }

  saveAttendance(date: string, records: { studentId: string, status: 'Present' | 'Absent' }[]) {
    const teacherId = this.activeTeacher()!.id;
    this.attendance.update(list => list.filter(r => !(r.date === date && r.teacherId === teacherId)));
    
    const newRecords: AttendanceRecord[] = records.map(r => ({
      date, teacherId, studentId: r.studentId, status: r.status, lastUpdated: Date.now()
    }));
    this.attendance.update(list => [...list, ...newRecords]);
    this.persistState();
  }

  getAttendanceForDate(date: string) {
    const teacherId = this.activeTeacher()?.id;
    return this.attendance().filter(r => r.date === date && r.teacherId === teacherId);
  }

  getAttendanceForRange(startDate: string, endDate: string) {
    const teacherId = this.activeTeacher()?.id;
    return this.attendance().filter(r => r.teacherId === teacherId && r.date >= startDate && r.date <= endDate);
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
  
  getMonthlyBreakdownForRange(startDate: string, endDate: string) {
    const allRecordsInRange = this.getAttendanceForRange(startDate, endDate);
    const students = this.activeStudents();
    
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

        const monthRecords = allRecordsInRange.filter(r => {
            const recordDate = new Date(r.date);
            return recordDate >= monthStart && recordDate <= monthEnd;
        });

        if (monthRecords.length > 0) {
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
    const start = `${yearMonth}-01`;
    const [year, month] = yearMonth.split('-').map(Number);
    const end = new Date(year, month, 0).toISOString().split('T')[0];
    
    const records = this.getAttendanceForRange(start, end);
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
    
    // Calculate this month's percentage up to the selected date
    const [year, month] = date.split('-');
    const monthStart = `${year}-${month}-01`;
    const allRecordsThisMonth = this.attendance().filter(r => 
        r.teacherId === this.activeTeacher()?.id && r.date >= monthStart && r.date <= date
    );

    return students.map(s => {
        const statusRecord = recordsForDate.find(r => r.studentId === s.id);
        const status = statusRecord ? statusRecord.status : 'N/A';
        
        // Calculate percentage for the current month up to the selected date
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
}