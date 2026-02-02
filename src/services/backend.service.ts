import { Injectable } from '@angular/core';
import type { Teacher, Student, AttendanceRecord, TeacherAttendanceRecord } from './attendance.service';

const APP_DATA_KEY = 'rehman_attendance_app_data';
const DATA_VERSION = 11;

// This interface must be kept in sync with the structure in attendance.service.ts
export interface AppData {
  version: number;
  teachers: Teacher[];
  students: Student[];
  attendance: AttendanceRecord[];
  teacherAttendance: TeacherAttendanceRecord[];
  loggedInUserId: string | null;
}

@Injectable({ providedIn: 'root' })
export class BackendService {

  constructor() {
    console.log("BackendService Initialized: Using LocalStorage.");
  }

  /**
   * Loads data from the persistent storage (currently localStorage).
   * This is made async to mimic a real backend call.
   */
  async loadData(): Promise<AppData | null> {
    console.log("Attempting to load data from LocalStorage...");
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network latency

    const rawData = localStorage.getItem(APP_DATA_KEY);
    if (!rawData) {
      console.log("No data found in LocalStorage.");
      return null;
    }

    try {
      const data = JSON.parse(rawData) as any; // Parse as any to handle old structure
      console.log("Data loaded successfully, checking for migrations...");
      return this.runVersionMigrations(data);
    } catch (e) {
      console.error("Failed to parse data from LocalStorage", e);
      return null;
    }
  }

  /**
   * Saves the entire application state to persistent storage.
   * This is made async to mimic a real backend call.
   */
  async saveData(data: AppData): Promise<void> {
    console.log("Saving data to LocalStorage...");
    try {
      const jsonString = JSON.stringify(data);
      localStorage.setItem(APP_DATA_KEY, jsonString);
      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, 500)); 
      console.log("Data saved successfully.");
    } catch (e) {
      console.error("Failed to save data to LocalStorage", e);
    }
  }

  /**
   * Ensures the data structure is up-to-date with the latest version.
   */
  private runVersionMigrations(data: any): AppData {
    let currentVersion = data.version || 1;
    if (currentVersion < 2) {
      console.log(`Upgrading data from v${currentVersion} to v2...`);
      data.teachers = data.teachers.map((teacher: any) => ({
        ...teacher,
        schoolName: teacher.schoolName || '',
      }));
      currentVersion = 2;
    }
    
    if (currentVersion < 3) {
      console.log(`Upgrading data from v${currentVersion} to v3...`);
      data.students = data.students.map((student: any) => ({
        ...student,
        totalFee: (student as any).totalFee || 0,
        feeHistory: (student as any).feeHistory || [],
      }));
       currentVersion = 3;
    }

    if (currentVersion < 4) {
      console.log(`Upgrading data from v${currentVersion} to v4...`);
      // Add placeholder email to teachers
      data.teachers = data.teachers.map((teacher: any) => ({
        ...teacher,
        email: teacher.email || `${teacher.id}@rehman-attendance.com`, // Add placeholder
      }));
      currentVersion = 4;
    }
    
    if (currentVersion < 5) {
      console.log(`Upgrading data from v${currentVersion} to v5...`);
      // Back-fill className and section on students from their teacher
      const teacherMap = new Map(data.teachers.map((t: any) => [t.id, t]));
      data.students = data.students.map((student: any) => {
        if (!student.className || !student.section) {
          const teacher = teacherMap.get(student.teacherId) as any | undefined;
          if (teacher) {
            return {
              ...student,
              className: student.className || teacher.className,
              section: student.section || teacher.section,
            };
          }
        }
        return student;
      });
      currentVersion = 5;
    }

    if (currentVersion < 6) {
      console.log(`Upgrading data from v${currentVersion} to v6...`);
      data.teacherAttendance = data.teacherAttendance || [];
      currentVersion = 6;
    }
    
    if (currentVersion < 7) {
        console.log(`Upgrading data from v${currentVersion} to v7...`);
        data.loggedInUserId = null; // Initialize loggedInUserId for existing users
        currentVersion = 7;
    }

    if (currentVersion < 8) {
        console.log(`Upgrading data from v${currentVersion} to v8...`);
        if (data.teachers && Array.isArray(data.teachers)) {
            // Remove the 'role' property as it's no longer needed in the single-user version.
            data.teachers.forEach((teacher: any) => delete teacher.role);
        }
        currentVersion = 8;
    }
    
    if (currentVersion < 9) {
        console.log(`Upgrading data from v${currentVersion} to v9...`);
        if (data.teachers && Array.isArray(data.teachers) && data.teachers.length > 0) {
            // Re-introduce roles. The first user becomes the coordinator.
            data.teachers = data.teachers.map((teacher: any, index: number) => ({
                ...teacher,
                role: index === 0 ? 'coordinator' : 'teacher'
            }));
        }
        currentVersion = 9;
    }

    if (currentVersion < 10) {
        console.log(`Upgrading data from v${currentVersion} to v10...`);
        if (data.teachers && Array.isArray(data.teachers)) {
            data.teachers = data.teachers.map((teacher: any) => ({
                ...teacher,
                pin: teacher.pin || '1234' // Set default PIN for existing users
            }));
        }
        currentVersion = 10;
    }

    if (currentVersion < 11) {
        console.log(`Upgrading data from v${currentVersion} to v11...`);
        if (data.teachers && Array.isArray(data.teachers)) {
            data.teachers = data.teachers.map((teacher: any) => ({
                ...teacher,
                securityQuestion: teacher.securityQuestion || 'What is your favorite number?',
                securityAnswer: teacher.securityAnswer || '1'
            }));
        }
        currentVersion = 11;
    }


    const finalData: AppData = {
      version: DATA_VERSION,
      teachers: data.teachers || [],
      students: data.students || [],
      attendance: data.attendance || [],
      teacherAttendance: data.teacherAttendance || [],
      loggedInUserId: data.loggedInUserId !== undefined ? data.loggedInUserId : null,
    };

    return finalData;
  }
}
