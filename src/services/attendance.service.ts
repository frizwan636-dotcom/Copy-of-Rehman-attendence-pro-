
import { Injectable, signal, computed, effect } from '@angular/core';
import { GoogleGenAI, Type } from "@google/genai";

export interface Teacher {
  id: string;
  name: string;
  schoolName?: string;
  className: string;
  section: string;
  setupComplete: boolean;
  synced?: boolean;
  password?: string;
}

export interface Coordinator {
  id: string;
  name: string;
  password?: string;
  synced?: boolean;
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
  mobileNumber: string; // New field for parental contact
  photo?: string; // Base64 student photo
  synced?: boolean;
  totalFee: number;
  feeHistory: FeePayment[];
}

export interface AttendanceRecord {
  date: string;
  teacherId: string;
  studentId: string;
  status: 'Present' | 'Absent';
  synced: boolean;
  lastUpdated: number;
}

export interface TeacherAttendanceRecord {
  date: string;
  coordinatorId: string;
  teacherId: string;
  status: 'Present' | 'Absent';
  synced: boolean;
}

type CurrentUser = { id: string, role: 'teacher' | 'coordinator' };

const APP_DATA_KEY = 'rehman_attendance_app_data';
const DATA_VERSION = 3; // V2 was schoolName, V3 adds fees

interface AppData {
  version: number;
  teachers: Teacher[];
  coordinators: Coordinator[];
  students: Student[];
  attendance: AttendanceRecord[];
  teacherAttendance: TeacherAttendanceRecord[];
}


@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  isOnline = signal(navigator.onLine);
  isSyncing = signal(false);

  // Private state
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

  hasUnsyncedData = computed(() => {
    return this.attendance().some(r => !r.synced) || 
           this.teachers().some(t => !t.synced) ||
           this.coordinators().some(c => !c.synced) ||
           this.students().some(s => !s.synced) ||
           this.teacherAttendance().some(r => !r.synced);
  });
  
  unsyncedRecordCount = computed(() => {
    const unsyncedAttendance = this.attendance().filter(r => !r.synced).length;
    const unsyncedTeachers = this.teachers().filter(t => !t.synced).length;
    const unsyncedCoordinators = this.coordinators().filter(c => !c.synced).length;
    const unsyncedStudents = this.students().filter(s => !s.synced).length;
    const unsyncedTeacherAttendance = this.teacherAttendance().filter(r => !r.synced).length;
    return unsyncedAttendance + unsyncedTeachers + unsyncedCoordinators + unsyncedStudents + unsyncedTeacherAttendance;
  });

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline.set(true);
      this.syncData();
    });
    window.addEventListener('offline', () => this.isOnline.set(false));

    this.loadAndMigrateData();

    // Single persistence effect for all app data
    effect(() => {
      const data: AppData = {
        version: DATA_VERSION,
        teachers: this.teachers(),
        coordinators: this.coordinators(),
        students: this.students(),
        attendance: this.attendance(),
        teacherAttendance: this.teacherAttendance(),
      };
      localStorage.setItem(APP_DATA_KEY, JSON.stringify(data));
    });

    if (this.isOnline()) this.syncData();
  }

  private loadAndMigrateData() {
    const rawData = localStorage.getItem(APP_DATA_KEY);
    let data: AppData | null = null;

    if (rawData) {
      // Data exists in the new format, parse and migrate if needed
      data = JSON.parse(rawData);
      data = this.runVersionMigrations(data!);
    } else {
      // No new format data, check for old multi-key format
      const oldTeachersData = localStorage.getItem('teachers');
      if (oldTeachersData) {
        console.log('Migrating data from old multi-key format...');
        data = {
          version: 1, // Let's call the old system v1
          teachers: JSON.parse(localStorage.getItem('teachers') || '[]'),
          coordinators: JSON.parse(localStorage.getItem('coordinators') || '[]'),
          students: JSON.parse(localStorage.getItem('students') || '[]'),
          attendance: JSON.parse(localStorage.getItem('attendance') || '[]'),
          teacherAttendance: JSON.parse(localStorage.getItem('teacherAttendance') || '[]'),
        };

        data = this.runVersionMigrations(data);
        
        // Clean up old keys after successful migration
        localStorage.removeItem('teachers');
        localStorage.removeItem('coordinators');
        localStorage.removeItem('students');
        localStorage.removeItem('attendance');
        localStorage.removeItem('teacherAttendance');
        console.log('Old data migrated and cleaned up.');
      }
    }

    // Initialize signals from loaded/migrated data or empty arrays
    this.teachers.set(data?.teachers || []);
    this.coordinators.set(data?.coordinators || []);
    this.students.set(data?.students || []);
    this.attendance.set(data?.attendance || []);
    this.teacherAttendance.set(data?.teacherAttendance || []);

    // Current user is session state, can remain separate
    this.currentUser.set(JSON.parse(localStorage.getItem('currentUser') || 'null'));
    effect(() => {
      const user = this.currentUser();
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
      } else {
        localStorage.removeItem('currentUser');
      }
    });
  }

  private runVersionMigrations(data: AppData): AppData {
    if (!data.version || data.version < 2) {
      console.log(`Upgrading data from v${data.version || 1} to v2...`);
      // Migration for v2: Ensure all teachers have a schoolName property
      data.teachers = data.teachers.map(teacher => ({
        ...teacher,
        schoolName: teacher.schoolName || '', // Add empty schoolName if it doesn't exist
      }));
    }
    
    if (!data.version || data.version < 3) {
      console.log(`Upgrading data from v${data.version || 2} to v3...`);
      data.students = data.students.map(student => ({
        ...student,
        totalFee: (student as any).totalFee || 0,
        feeHistory: (student as any).feeHistory || [],
      }));
    }

    data.version = DATA_VERSION;
    return data;
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

    if (!user || !user.password) {
      return false; // User not found or no password set
    }
    
    // In a real application, passwords would be hashed. For this simulation, we use plaintext comparison.
    return user.password === passwordAttempt;
  }
  
  login(name: string, role: 'teacher' | 'coordinator') {
    const id = name.toLowerCase().replace(/\s/g, '_');
    this.currentUser.set({ id, role });
  }

  logout() { this.currentUser.set(null); }

  // Teacher specific actions
  registerTeacher(name: string, password: string) {
    const id = name.toLowerCase().replace(/\s/g, '_');
    if (this.teachers().some(t => t.id === id)) return; // Already exists
    const newTeacher: Teacher = { id, name, schoolName: '', className: '', section: '', setupComplete: false, synced: false, password: password };
    this.teachers.update(t => [...t, newTeacher]);
    this.login(name, 'teacher');
  }
  
  updateTeacherSetup(schoolName: string, className: string, section: string) {
    this.teachers.update(list => list.map(t => 
      t.id === this.activeTeacher()?.id ? { ...t, schoolName, className, section, setupComplete: true, synced: false } : t
    ));
  }

  // Coordinator specific actions
  registerCoordinator(name: string, password: string) {
    const id = name.toLowerCase().replace(/\s/g, '_');
    if (this.coordinators().some(c => c.id === id)) return;
    const newCoordinator: Coordinator = { id, name, password: password, synced: false };
    this.coordinators.update(c => [...c, newCoordinator]);
    this.login(name, 'coordinator');
  }

  getTeachers(): Teacher[] {
    return this.teachers();
  }

  addTeacher(name: string) {
    const id = name.toLowerCase().replace(/\s/g, '_');
    if (this.teachers().some(t => t.id === id)) {
      throw new Error("A teacher with this name already exists.");
    }
    const newTeacher: Teacher = { id, name, schoolName: '', className: '', section: '', setupComplete: false, synced: false };
    this.teachers.update(t => [...t, newTeacher]);
  }

  removeTeacher(teacherId: string) {
    this.teachers.update(t => t.filter(teacher => teacher.id !== teacherId));
    this.students.update(s => s.filter(student => student.teacherId !== teacherId));
    this.attendance.update(a => a.filter(att => att.teacherId !== teacherId));
  }

  saveTeacherAttendance(date: string, records: { teacherId: string, status: 'Present' | 'Absent' }[]) {
    const coordinatorId = this.activeCoordinator()!.id;
    this.teacherAttendance.update(list => list.filter(r => !(r.date === date && r.coordinatorId === coordinatorId)));
    
    const newRecords: TeacherAttendanceRecord[] = records.map(r => ({
      date, coordinatorId, teacherId: r.teacherId, status: r.status, synced: false,
    }));
    this.teacherAttendance.update(list => [...list, ...newRecords]);
  }

  getTeacherAttendanceForDate(date: string): TeacherAttendanceRecord[] {
    return this.teacherAttendance().filter(r => r.date === date);
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
      rollNumber: s.roll, mobileNumber: s.mobile, photo: s.photo, synced: false,
      totalFee: s.totalFee || 0,
      feeHistory: []
    }));
    this.students.update(list => [...list, ...studentsToAdd]);
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
                feeHistory: [...s.feeHistory, payment],
                synced: false
            };
        }
        return s;
    }));
  }

  saveAttendance(date: string, records: { studentId: string, status: 'Present' | 'Absent' }[]) {
    const teacherId = this.activeTeacher()!.id;
    this.attendance.update(list => list.filter(r => !(r.date === date && r.teacherId === teacherId)));
    
    const newRecords: AttendanceRecord[] = records.map(r => ({
      date, teacherId, studentId: r.studentId, status: r.status,
      synced: false, lastUpdated: Date.now()
    }));
    this.attendance.update(list => [...list, ...newRecords]);
  }

  async syncData() {
    if (this.isSyncing() || !this.isOnline() || !this.hasUnsyncedData()) return;
    this.isSyncing.set(true);
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 1500));
      this.teachers.update(list => list.map(t => ({ ...t, synced: true })));
      this.coordinators.update(list => list.map(c => ({ ...c, synced: true })));
      this.students.update(list => list.map(s => ({ ...s, synced: true })));
      this.attendance.update(list => list.map(r => ({ ...r, synced: true })));
      this.teacherAttendance.update(list => list.map(r => ({ ...r, synced: true })));
    } finally {
      this.isSyncing.set(false);
    }
  }

  getAttendanceForDate(date: string) {
    const teacherId = this.activeTeacher()?.id;
    return this.attendance().filter(r => r.date === date && r.teacherId === teacherId);
  }

  getAttendanceForRange(startDate: string, endDate: string) {
    const teacherId = this.activeTeacher()?.id;
    return this.attendance().filter(r => r.teacherId === teacherId && r.date >= startDate && r.date <= endDate);
  }

  getRangeReport(startDate: string, endDate: string) {
    const records = this.getAttendanceForRange(startDate, endDate);
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

  getMonthlyReport(yearMonth: string) {
    const start = `${yearMonth}-01`;
    const end = `${yearMonth}-31`;
    return this.getRangeReport(start, end);
  }

  getDailyReportData(date: string) {
    const students = this.activeStudents();
    const recordsForDate = this.getAttendanceForDate(date);
    const allRecordsUpToDate = this.attendance().filter(r => 
        r.teacherId === this.activeTeacher()?.id && r.date <= date
    );

    return students.map(s => {
        const statusRecord = recordsForDate.find(r => r.studentId === s.id);
        const status = statusRecord ? statusRecord.status : 'N/A';

        const studentTotalRecords = allRecordsUpToDate.filter(r => r.studentId === s.id);
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
