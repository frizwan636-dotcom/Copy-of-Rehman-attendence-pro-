import { Injectable } from '@angular/core';
import type { Teacher, Coordinator, Student, AttendanceRecord, TeacherAttendanceRecord } from './attendance.service';

const APP_DATA_KEY = 'rehman_attendance_app_data';
const DATA_VERSION = 5;

// This interface must be kept in sync with the structure in attendance.service.ts
export interface AppData {
  version: number;
  teachers: Teacher[];
  coordinators: Coordinator[];
  students: Student[];
  attendance: AttendanceRecord[];
  teacherAttendance: TeacherAttendanceRecord[];
}

@Injectable({ providedIn: 'root' })
export class BackendService {

  constructor() {
    console.log("BackendService Initialized: Using LocalStorage.");
  }

  // --- BACKEND INTEGRATION POINT ---
  // To use a real backend like Firebase:
  // 1. Set up a Firebase project and enable Firestore.
  // 2. Add your Firebase config to this project.
  // 3. Import Firebase modules: import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
  // 4. Replace the localStorage logic in loadData() and saveData()
  //    with your Firestore read/write operations.
  //
  // EXAMPLE (Firebase):
  //   private db = getFirestore(firebaseApp);
  //   private dataDocRef = doc(this.db, "appData", "mainDocument");
  //
  //   async loadData(): Promise<AppData | null> {
  //     const docSnap = await getDoc(this.dataDocRef);
  //     if (docSnap.exists()) {
  //       console.log("Data loaded from Firestore");
  //       return this.runVersionMigrations(docSnap.data() as AppData);
  //     } else {
  //       console.log("No data in Firestore, starting fresh.");
  //       return null;
  //     }
  //   }
  //
  //   async saveData(data: AppData): Promise<void> {
  //     await setDoc(this.dataDocRef, data);
  //     console.log("Data saved to Firestore");
  //   }
  // -----------------------------------------


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
      const data = JSON.parse(rawData) as AppData;
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
  private runVersionMigrations(data: AppData): AppData {
    let currentVersion = data.version || 1;
    if (currentVersion < 2) {
      console.log(`Upgrading data from v${currentVersion} to v2...`);
      data.teachers = data.teachers.map(teacher => ({
        ...teacher,
        schoolName: teacher.schoolName || '',
      }));
      currentVersion = 2;
    }
    
    if (currentVersion < 3) {
      console.log(`Upgrading data from v${currentVersion} to v3...`);
      data.students = data.students.map(student => ({
        ...student,
        totalFee: (student as any).totalFee || 0,
        feeHistory: (student as any).feeHistory || [],
      }));
       currentVersion = 3;
    }

    if (currentVersion < 4) {
      console.log(`Upgrading data from v${currentVersion} to v4...`);
      // Add placeholder email to teachers and coordinators
      data.teachers = data.teachers.map(teacher => ({
        ...teacher,
        email: teacher.email || `${teacher.id}@rehman-attendance.com`, // Add placeholder
      }));
      data.coordinators = data.coordinators.map(coordinator => ({
        ...coordinator,
        email: coordinator.email || `${coordinator.id}@rehman-attendance.com`, // Add placeholder
      }));
      currentVersion = 4;
    }
    
    if (currentVersion < 5) {
      console.log(`Upgrading data from v${currentVersion} to v5...`);
      // Back-fill className and section on students from their teacher
      const teacherMap = new Map(data.teachers.map(t => [t.id, t]));
      data.students = data.students.map(student => {
        if (!student.className || !student.section) {
          const teacher = teacherMap.get(student.teacherId);
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


    data.version = DATA_VERSION;
    return data;
  }
}