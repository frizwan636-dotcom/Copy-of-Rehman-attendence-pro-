import { Component, inject, signal, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../services/attendance.service';

@Component({
  selector: 'app-setup-wizard',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen p-4 md:p-8 flex items-center justify-center bg-slate-50">
      <div class="max-w-2xl w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
        
        <!-- Animated Header -->
        <div class="bg-indigo-600 p-8 text-white relative overflow-hidden">
          <div class="absolute top-0 right-0 p-8 opacity-10">
            <i class="fa-solid fa-user-shield text-9xl -mr-10 -mt-10"></i>
          </div>
          
          <div class="relative z-10">
            <div class="flex justify-between items-center mb-6">
              <div>
                <h2 class="text-2xl font-black tracking-tight">Teacher Onboarding</h2>
                <p class="text-indigo-100/80 text-sm font-medium">Securely setting up your digital classroom</p>
              </div>
              <span class="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
                Step {{ step() }} of 2
              </span>
            </div>
            
            <div class="flex gap-3 h-1.5">
              <div [class]="step() >= 1 ? 'flex-1 bg-white rounded-full transition-all duration-500' : 'flex-1 bg-white/30 rounded-full'"></div>
              <div [class]="step() >= 2 ? 'flex-1 bg-white rounded-full transition-all duration-500' : 'flex-1 bg-white/30 rounded-full'"></div>
            </div>
          </div>
        </div>

        <div class="p-8 md:p-12">
          @if (step() === 1) {
            <!-- Step 1: Class Details -->
            <div class="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[1.25rem] flex items-center justify-center">
                  <i class="fa-solid fa-school-flag text-2xl"></i>
                </div>
                <div>
                  <h3 class="text-xl font-bold text-slate-800">Institute & Class Information</h3>
                  <p class="text-sm text-slate-500">Define your primary teaching scope</p>
                </div>
              </div>

              <div class="grid grid-cols-1 gap-6">
                <div class="space-y-2">
                  <label class="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">School / Institute Name</label>
                  <!-- Fix: Use [ngModel] and (ngModelChange) for signal-based two-way binding -->
                  <input type="text" [ngModel]="schoolName()" (ngModelChange)="schoolName.set($event)" placeholder="e.g. National Public School" class="w-full p-5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50 font-medium">
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <label class="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Class Designation</label>
                    <!-- Fix: Use [ngModel] and (ngModelChange) for signal-based two-way binding -->
                    <input type="text" [ngModel]="className()" (ngModelChange)="className.set($event)" placeholder="e.g. Grade 10-A" class="w-full p-5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50 font-medium">
                  </div>
                  <div class="space-y-2">
                    <label class="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Section</label>
                    <!-- Fix: Use [ngModel] and (ngModelChange) for signal-based two-way binding -->
                    <input type="text" [ngModel]="section()" (ngModelChange)="section.set($event)" placeholder="e.g. Science" class="w-full p-5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50 font-medium">
                  </div>
                </div>
              </div>

              <div class="flex gap-4 pt-4">
                <button (click)="step.set(2)" [disabled]="!schoolName() || !className() || !section()" class="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all">
                  Next: Student Roster
                </button>
              </div>
            </div>
          } @else if (step() === 2) {
            <!-- Step 2: Add Students -->
            <div class="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div class="flex justify-between items-end">
                <div>
                  <h3 class="text-xl font-bold text-slate-800">Enroll Students</h3>
                  <p class="text-sm text-slate-500">Add members to {{ className() }}</p>
                </div>
                <div class="text-right">
                   <span class="text-3xl font-black text-indigo-600 leading-none">{{ studentList().length }}</span>
                   <p class="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Students</p>
                </div>
              </div>

              <div class="flex p-1.5 bg-slate-100 rounded-2xl">
                <button (click)="inputMode.set('single')" [class]="inputMode() === 'single' ? 'flex-1 py-2.5 bg-white rounded-xl shadow-sm font-bold text-indigo-600 text-sm' : 'flex-1 py-2.5 text-slate-500 font-bold text-sm'">Individual</button>
                <button (click)="inputMode.set('bulk')" [class]="inputMode() === 'bulk' ? 'flex-1 py-2.5 bg-white rounded-xl shadow-sm font-bold text-indigo-600 text-sm' : 'flex-1 py-2.5 text-slate-500 font-bold text-sm'">Bulk Text</button>
                <button (click)="inputMode.set('scan')" [class]="inputMode() === 'scan' ? 'flex-1 py-2.5 bg-white rounded-xl shadow-sm font-bold text-indigo-600 text-sm' : 'flex-1 py-2.5 text-slate-500 font-bold text-sm'">Magic Scan</button>
              </div>
              
              <div class="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 shadow-inner relative overflow-hidden min-h-[12rem]">
                
                @if (isScanning()) {
                  <div class="absolute inset-0 bg-white/80 backdrop-blur-md z-20 flex flex-col items-center justify-center text-center p-6 animate-in fade-in">
                    <div class="w-16 h-16 relative mb-4">
                      <div class="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
                      <div class="absolute inset-0 border-t-4 border-indigo-600 rounded-full animate-spin"></div>
                    </div>
                    <h4 class="font-black text-slate-800 uppercase tracking-widest text-xs">AI Vision Processing</h4>
                    <p class="text-[10px] text-slate-500 font-bold mt-1">Extracting student data from your image...</p>
                  </div>
                }

                @if (inputMode() === 'single') {
                  <div class="flex gap-4 mb-4">
                    <!-- Photo Capture -->
                    <div class="w-20 h-20 bg-white rounded-2xl border-2 border-dashed border-indigo-200 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:bg-indigo-50 transition-colors relative" (click)="triggerPhotoUpload()">
                      @if (studentPhoto()) {
                        <img [src]="studentPhoto()" class="w-full h-full object-cover">
                        <div class="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                          <i class="fa-solid fa-camera text-white"></i>
                        </div>
                      } @else {
                        <i class="fa-solid fa-camera text-indigo-300 text-xl"></i>
                      }
                    </div>

                    <div class="flex-1 grid grid-cols-1 gap-2">
                      <!-- Fix: Use [ngModel] and (ngModelChange) for signal-based two-way binding -->
                      <input type="text" [ngModel]="newName()" (ngModelChange)="newName.set($event)" placeholder="Full Name" class="w-full p-3 rounded-xl border-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-sm">
                      <div class="grid grid-cols-3 gap-2">
                        <!-- Fix: Use [ngModel] and (ngModelChange) for signal-based two-way binding -->
                        <input type="text" [ngModel]="newRoll()" (ngModelChange)="newRoll.set($event)" placeholder="Roll #" class="p-3 rounded-xl border-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-sm">
                        <!-- Fix: Use [ngModel] and (ngModelChange) for signal-based two-way binding -->
                        <input type="tel" [ngModel]="newMobile()" (ngModelChange)="newMobile.set($event)" placeholder="Contact Mobile" class="p-3 rounded-xl border-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-sm">
                        <!-- Fix: Use [ngModel] and (ngModelChange) for signal-based two-way binding -->
                        <input type="number" [ngModel]="newTotalFee()" (ngModelChange)="newTotalFee.set($event)" placeholder="Total Fee" class="p-3 rounded-xl border-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-sm">
                      </div>
                    </div>
                  </div>
                  <button (click)="addStudentToList()" [disabled]="!newName() || !newRoll() || !newMobile()" class="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50">
                    <i class="fa-solid fa-plus-circle mr-2"></i> Add Student
                  </button>
                  <input type="file" #studentPhotoInput accept="image/*" (change)="onPhotoSelected($event)" class="hidden">
                } @else if (inputMode() === 'bulk') {
                  <div class="space-y-4">
                    <div class="bg-indigo-600/5 p-3 rounded-xl text-[10px] text-indigo-600 font-bold border border-indigo-100">
                      Format: Name, Roll, Mobile, Total Fee (one per line)
                    </div>
                    <!-- Fix: Use [ngModel] and (ngModelChange) for signal-based two-way binding -->
                    <textarea [ngModel]="bulkText()" (ngModelChange)="bulkText.set($event)" rows="4" placeholder="John Doe, 101, 923001234567, 5000&#10;Jane Smith, 102, 923117654321, 4500" class="w-full p-5 rounded-2xl border-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-sm font-mono"></textarea>
                    <button (click)="parseBulkStudents()" [disabled]="!bulkText().trim()" class="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50">
                      <i class="fa-solid fa-file-import mr-2"></i> Process Bulk List
                    </button>
                  </div>
                } @else {
                  <div class="text-center py-6 space-y-4">
                    <div class="w-16 h-16 bg-white rounded-3xl shadow-sm border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
                      <i class="fa-solid fa-wand-sparkles text-2xl"></i>
                    </div>
                    <div>
                      <h4 class="font-bold text-slate-800 text-sm">Scan Roster Image</h4>
                      <p class="text-[10px] text-slate-400 max-w-[200px] mx-auto">Take a clear photo of your student list and AI will extract the data for you.</p>
                    </div>
                    <button (click)="triggerListScan()" class="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                      Take Photo
                    </button>
                    <video #scanVideo autoplay playsinline class="hidden"></video>
                    <canvas #scanCanvas class="hidden"></canvas>
                  </div>
                }
              </div>

              @if (studentList().length > 0) {
                <div class="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  @for (s of studentList(); track s.roll) {
                    <div class="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl shadow-sm animate-in fade-in slide-in-from-left-2">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden">
                          @if (s.photo) {
                            <img [src]="s.photo" class="w-full h-full object-cover">
                          } @else {
                            <div class="w-full h-full flex items-center justify-center text-[8px] text-slate-400">NO IMG</div>
                          }
                        </div>
                        <div>
                          <p class="font-bold text-slate-700 text-sm leading-tight">{{ s.name }}</p>
                          <div class="flex items-center gap-2 mt-0.5">
                            <span class="text-[9px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">#{{ s.roll }}</span>
                            <span class="text-[9px] font-medium text-slate-400"><i class="fa-solid fa-phone text-[8px] mr-1"></i>{{ s.mobile }}</span>
                          </div>
                        </div>
                      </div>
                      <div class="flex items-center gap-4">
                         <span class="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-full">Fee: {{ s.totalFee }}</span>
                        <button (click)="removeStudent(s.roll)" class="text-slate-300 hover:text-red-500 transition-colors">
                          <i class="fa-solid fa-xmark text-lg"></i>
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }

              <div class="flex gap-4 pt-4 border-t border-slate-100">
                <button (click)="step.set(1)" class="flex-1 py-5 text-slate-400 font-bold hover:text-slate-600 transition-colors">
                  Back
                </button>
                <button (click)="finishSetup()" [disabled]="studentList().length === 0" class="flex-[2] py-5 bg-green-600 text-white rounded-2xl font-black shadow-xl shadow-green-100 hover:bg-green-700 transition-all disabled:opacity-50">
                  Finish & Start Class
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
  `],
  // FIX: Set change detection strategy to OnPush for better performance with signals.
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SetupWizardComponent {
  attendanceService = inject(AttendanceService);
  
  step = signal(1);
  inputMode = signal<'single' | 'bulk' | 'scan'>('single');
  isScanning = signal(false);
  schoolName = signal('');
  className = signal('');
  section = signal('');
  
  studentList = signal<{ name: string, roll: string, mobile: string, photo?: string, totalFee: number }[]>([]);
  studentPhoto = signal<string | null>(null);
  newName = signal('');
  newRoll = signal('');
  newMobile = signal('');
  newTotalFee = signal<number|null>(null);
  bulkText = signal('');

  @ViewChild('studentPhotoInput') studentPhotoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('scanVideo') scanVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('scanCanvas') scanCanvas!: ElementRef<HTMLCanvasElement>;

  triggerPhotoUpload() {
    this.studentPhotoInput.nativeElement.click();
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.studentPhoto.set(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  async triggerListScan() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = this.scanVideo.nativeElement;
      video.srcObject = stream;

      // Provide visual feedback wait
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const canvas = this.scanCanvas.nativeElement;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg', 0.75);
      
      stream.getTracks().forEach(t => t.stop());
      
      this.isScanning.set(true);
      try {
        const extracted = await this.attendanceService.parseStudentListFromImage(base64);
        let addedCount = 0;
        let dupCount = 0;

        extracted.forEach(s => {
          if (s.name && s.roll && !this.studentList().some(existing => existing.roll === s.roll)) {
            this.studentList.update(list => [...list, { ...s, totalFee: 0 }]); // Add with 0 fee, can be edited later
            addedCount++;
          } else if (s.roll) {
            dupCount++;
          }
        });

        if (addedCount > 0) {
          alert(`Successfully imported ${addedCount} students via AI Scan.${dupCount > 0 ? ` (${dupCount} duplicates ignored)` : ''}. Please set their fees manually.`);
        } else {
          alert("No new students found in image.");
        }
        this.inputMode.set('single');
      } catch (e) {
        alert("Magic Scan failed: " + e);
      } finally {
        this.isScanning.set(false);
      }

    } catch (err) {
      alert("Scanner failed: " + err);
    }
  }

  addStudentToList() {
    const name = this.newName().trim();
    const roll = this.newRoll().trim();
    const mobile = this.newMobile().trim();
    const totalFee = this.newTotalFee() || 0;

    if (name && roll && mobile) {
      if (this.studentList().some(s => s.roll === roll)) {
        alert(`Roll number ${roll} already exists in the current list.`);
        return;
      }
      this.studentList.update(list => [...list, { name, roll, mobile, photo: this.studentPhoto() || undefined, totalFee }]);
      this.newName.set('');
      this.newRoll.set('');
      this.newMobile.set('');
      this.newTotalFee.set(null);
      this.studentPhoto.set(null);
    }
  }

  parseBulkStudents() {
    const lines = this.bulkText().trim().split('\n');
    let addedCount = 0;
    let dupCount = 0;

    lines.forEach(line => {
      const parts = line.split(/[,\t;]/);
      if (parts.length >= 3) { // Expect at least 3, fee is optional
        const name = parts[0].trim();
        const roll = parts[1].trim();
        const mobile = parts[2].trim();
        const totalFee = (parts.length >= 4) ? parseInt(parts[3].trim(), 10) || 0 : 0;
        
        if (name && roll && mobile) {
          if (!this.studentList().some(s => s.roll === roll)) {
            this.studentList.update(list => [...list, { name, roll, mobile, totalFee }]);
            addedCount++;
          } else {
            dupCount++;
          }
        }
      }
    });

    if (addedCount > 0) {
      alert(`Imported ${addedCount} students from text list.${dupCount > 0 ? ` (${dupCount} duplicates ignored)` : ''}`);
      this.bulkText.set('');
      this.inputMode.set('single');
    } else if (dupCount > 0) {
      alert("All students in the list are already registered.");
    } else {
      alert("Could not find valid student data. Please use format: Name, Roll, Mobile, Total Fee");
    }
  }

  removeStudent(roll: string) {
    this.studentList.update(list => list.filter(s => s.roll !== roll));
  }

  finishSetup() {
    this.attendanceService.updateTeacherSetup(this.schoolName(), this.className(), this.section());
    this.attendanceService.addStudents(this.studentList());
  }
}
