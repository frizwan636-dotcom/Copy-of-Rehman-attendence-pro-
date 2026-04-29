import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { AttendanceService, Quiz, QuizQuestion, QuizSubmission } from '../services/attendance.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="p-4 sm:p-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 class="text-xl sm:text-2xl font-bold text-slate-800">Quizzes</h2>
        @if (attendanceService.activeUser()?.role === 'teacher') {
          <div class="flex gap-2 w-full sm:w-auto">
            <button (click)="showSubjectModal.set(true)" class="flex-1 sm:flex-none px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 text-sm font-bold">
              <i class="fa-solid fa-book text-xs"></i>
              Subjects
            </button>
            <button (click)="openCreateModal()" class="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-indigo-200">
              <i class="fa-solid fa-plus text-xs"></i>
              Create Quiz
            </button>
          </div>
        }
      </div>

      <!-- Teacher View: Quiz Management -->
      @if (attendanceService.activeUser()?.role === 'teacher') {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (quiz of attendanceService.allQuizzes(); track quiz.id) {
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-all">
              <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                  <span class="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg mb-2 inline-block uppercase tracking-wider">
                    {{ getSubjectName(quiz.subject_id) }}
                  </span>
                  <h3 class="font-bold text-lg text-slate-800 leading-tight">{{ quiz.title }}</h3>
                </div>
                <div class="flex gap-1 ml-2">
                  <button (click)="editQuiz(quiz)" class="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                    <i class="fa-solid fa-pen-to-square text-sm"></i>
                  </button>
                  <button (click)="attendanceService.deleteQuiz(quiz.id)" class="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                    <i class="fa-solid fa-trash text-sm"></i>
                  </button>
                </div>
              </div>
              <p class="text-sm text-slate-500 mb-4 line-clamp-2 flex-1">{{ quiz.description }}</p>
              <div class="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] sm:text-xs text-slate-400 font-bold">
                <span class="flex items-center gap-1.5">
                  <i class="fa-solid fa-clock text-[10px]"></i>
                  {{ quiz.duration_minutes }} mins
                </span>
                <span class="flex items-center gap-1.5">
                  <i class="fa-solid fa-list-check text-[10px]"></i>
                  {{ quiz.questions.length }} Qs
                </span>
              </div>
              <button (click)="viewSubmissions(quiz)" class="mt-4 w-full py-2.5 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors border border-slate-100">
                View Submissions
              </button>
            </div>
          } @empty {
            <div class="col-span-full py-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
              <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fa-solid fa-vial-circle-check text-slate-200 text-2xl"></i>
              </div>
              <h3 class="text-xl font-bold text-slate-400">No quizzes created yet</h3>
              <p class="text-slate-400">Start by creating your first interactive quiz.</p>
            </div>
          }
        </div>
      }

      <!-- Student View: Available Quizzes -->
      @if (attendanceService.activeUser()?.role === 'student') {
        @if (!activeQuiz()) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (quiz of attendanceService.allQuizzes(); track quiz.id) {
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-all">
                <div class="mb-4">
                  <span class="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg mb-2 inline-block uppercase tracking-wider">
                    {{ getSubjectName(quiz.subject_id) }}
                  </span>
                  <h3 class="font-bold text-lg text-slate-800 leading-tight">{{ quiz.title }}</h3>
                </div>
                <p class="text-sm text-slate-500 mb-4 line-clamp-2 flex-1">{{ quiz.description }}</p>
                <div class="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] sm:text-xs text-slate-400 font-bold">
                  <span class="flex items-center gap-1.5">
                    <i class="fa-solid fa-clock text-[10px]"></i>
                    {{ quiz.duration_minutes }} mins
                  </span>
                  <span class="flex items-center gap-1.5">
                    <i class="fa-solid fa-list-check text-[10px]"></i>
                    {{ quiz.questions.length }} Qs
                  </span>
                </div>
                @if (hasSubmitted(quiz.id)) {
                  <div class="mt-4 w-full py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold text-center border border-emerald-100">
                    <i class="fa-solid fa-circle-check mr-1.5"></i>
                    Submitted - {{ getScore(quiz.id) }}
                  </div>
                } @else {
                  <button (click)="startQuiz(quiz)" class="mt-4 w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">
                    Start Quiz
                  </button>
                }
              </div>
            }
          </div>
        } @else {
          <!-- Active Quiz Interface -->
          <div class="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div class="bg-indigo-600 p-4 sm:p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 class="text-lg sm:text-xl font-bold">{{ activeQuiz()?.title }}</h3>
                <p class="text-indigo-100 text-xs sm:text-sm">{{ getSubjectName(activeQuiz()?.subject_id!) }}</p>
              </div>
              <div class="bg-white/20 px-4 py-2 rounded-xl backdrop-blur-sm flex items-center gap-2 self-end sm:self-auto">
                <i class="fa-solid fa-stopwatch text-sm sm:text-base"></i>
                <span class="font-mono text-lg sm:text-xl font-bold">{{ formatTime(timeLeft()) }}</span>
              </div>
            </div>

            <div class="p-4 sm:p-8">
              <div class="mb-6 sm:mb-8">
                <div class="flex justify-between text-[10px] sm:text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                  <span>Question {{ currentQuestionIndex() + 1 }} of {{ activeQuiz()?.questions?.length }}</span>
                  <span>{{ (currentQuestionIndex() + 1) / activeQuiz()?.questions?.length! * 100 | number:'1.0-0' }}% Complete</span>
                </div>
                <div class="h-1.5 sm:h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full bg-indigo-600 transition-all duration-500" [style.width.%]="(currentQuestionIndex() + 1) / activeQuiz()?.questions?.length! * 100"></div>
                </div>
              </div>

              <div class="space-y-4 sm:space-y-6">
                <h4 class="text-lg sm:text-xl font-bold text-slate-800 leading-snug">{{ currentQuestion()?.question }}</h4>
                
                <div class="grid gap-2 sm:gap-3">
                  @for (option of currentQuestion()?.options; track $index; let i = $index) {
                    <button (click)="selectOption(option)" 
                            [class]="selectedAnswers()[currentQuestionIndex()] === option ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-[1.01]' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-slate-50'"
                            class="w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-all flex items-center gap-3 sm:gap-4 group">
                      <span [class]="selectedAnswers()[currentQuestionIndex()] === option ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-400'"
                            class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm">
                        {{ String.fromCharCode(65 + i) }}
                      </span>
                      <span class="font-medium text-sm sm:text-base">{{ option }}</span>
                    </button>
                  }
                </div>
              </div>

              <div class="flex justify-between mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-slate-100">
                <button (click)="prevQuestion()" [disabled]="currentQuestionIndex() === 0" class="px-4 sm:px-6 py-2 text-slate-500 font-bold text-sm sm:text-base disabled:opacity-30">Previous</button>
                @if (currentQuestionIndex() === activeQuiz()?.questions?.length! - 1) {
                  <button (click)="submitQuiz()" class="px-6 sm:px-8 py-2.5 sm:py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm sm:text-base hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all">Submit Quiz</button>
                } @else {
                  <button (click)="nextQuestion()" class="px-6 sm:px-8 py-2.5 sm:py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm sm:text-base hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">Next Question</button>
                }
              </div>
            </div>
          </div>
        }
      }

      <!-- Create/Edit Quiz Modal -->
      @if (showQuizModal()) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90dvh]">
            <div class="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 class="text-xl font-bold text-slate-800">{{ editingQuiz() ? 'Edit Quiz' : 'Assign New Quiz' }}</h3>
              <button (click)="showQuizModal.set(false)" class="text-slate-400 hover:text-slate-600">
                <i class="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <div class="overflow-y-auto flex-1 p-6">
              <form [formGroup]="quizForm" id="quizFormId" (ngSubmit)="saveQuiz()" class="space-y-6">
                <!-- Grid layouts ... -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <input formControlName="title" type="text" class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Science Test">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                    <select formControlName="subject_id" class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="">Select Subject</option>
                      @for (sub of attendanceService.allSubjects(); track sub.id) {
                        <option [value]="sub.id">{{ sub.name }}</option>
                      }
                    </select>
                  </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Duration (minutes)</label>
                    <input formControlName="duration_minutes" type="number" class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select formControlName="status" class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea formControlName="description" rows="2" class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Instructions..."></textarea>
                </div>

                <!-- Questions Section -->
                <div class="space-y-4">
                  <div class="flex justify-between items-center">
                    <h4 class="font-bold text-slate-700">Questions</h4>
                    <button type="button" (click)="addQuestion()" class="text-sm text-indigo-600 font-bold flex items-center gap-1.5 hover:text-indigo-700 transition-colors">
                      <i class="fa-solid fa-circle-plus"></i> Add Question
                    </button>
                  </div>
                  
                  <div formArrayName="questions" class="space-y-6">
                    @for (q of questions.controls; track $index; let i = $index) {
                      <div [formGroupName]="i" class="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative">
                        <button type="button" (click)="removeQuestion(i)" class="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors">
                          <i class="fa-solid fa-trash-can text-sm"></i>
                        </button>
                        <div class="mb-4">
                          <label class="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Question {{ i + 1 }}</label>
                          <input formControlName="question" type="text" class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div formArrayName="options" class="space-y-2">
                            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Options</label>
                            @for (opt of getOptions(i).controls; track $index; let j = $index) {
                              <div class="flex gap-2">
                                <span class="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-400">{{ String.fromCharCode(65 + j) }}</span>
                                <input [formControlName]="j" (input)="null" type="text" class="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-white">
                              </div>
                            }
                          </div>
                          <div>
                            <label class="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Correct Answer</label>
                            <select formControlName="correct_answer" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-white">
                              <option value="">Select correct option</option>
                              @for (opt of getOptions(i).value; track $index) {
                                @if (opt) {
                                  <option [value]="opt">{{ opt }}</option>
                                }
                              }
                            </select>
                          </div>
                        </div>
                      </div>
                    }
                    @if (questions.length === 0) {
                      <div class="text-center p-6 bg-slate-50 border border-slate-200 border-dashed rounded-2xl">
                        <p class="text-slate-500 text-sm">No questions added yet. Please add at least one question.</p>
                      </div>
                    }
                  </div>
                </div>
              </form>
            </div>
            <div class="p-6 border-t border-slate-100 shrink-0 flex gap-3">
              <button type="button" (click)="showQuizModal.set(false)" class="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-bold">Cancel</button>
              <button type="submit" form="quizFormId" class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-bold">
                {{ editingQuiz() ? 'Update Quiz' : 'Assign Quiz' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Submissions Modal -->
      @if (showSubmissionsModal()) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[80vh] flex flex-col">
            <div class="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 class="text-xl font-bold text-slate-800">Submissions</h3>
                <p class="text-sm text-slate-500">{{ selectedQuizForSubmissions()?.title }}</p>
              </div>
              <button (click)="showSubmissionsModal.set(false)" class="text-slate-400 hover:text-slate-600">
                <i class="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <div class="p-6 overflow-y-auto overflow-x-auto">
              <table class="w-full text-left min-w-[600px]">
                <thead>
                  <tr class="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th class="pb-3">Student</th>
                    <th class="pb-3">Submitted At</th>
                    <th class="pb-3">Score</th>
                    <th class="pb-3">Status</th>
                    <th class="pb-3">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                  @for (sub of getSubmissionsForQuiz(); track sub.id) {
                    <tr>
                      <td class="py-4">
                        <p class="font-bold text-slate-800">{{ getStudentName(sub.student_id) }}</p>
                      </td>
                      <td class="py-4 text-sm text-slate-500">{{ sub.submitted_at | date:'short' }}</td>
                      <td class="py-4 font-mono font-bold text-indigo-600">{{ sub.score }} / {{ sub.total_marks }}</td>
                      <td class="py-4">
                        <span [class]="sub.marked ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'" class="px-2 py-1 rounded-lg text-xs font-bold">
                          {{ sub.marked ? 'Marked' : 'Pending' }}
                        </span>
                      </td>
                      <td class="py-4">
                        @if (!sub.marked) {
                          <button (click)="markSubmission(sub)" class="text-xs font-bold text-indigo-600 hover:underline">Mark as Reviewed</button>
                        }
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5" class="py-12 text-center text-slate-400 italic">No submissions yet.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }

      <!-- Subject Management Modal -->
      @if (showSubjectModal()) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div class="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 class="text-xl font-bold text-slate-800">Manage Subjects</h3>
              <button (click)="showSubjectModal.set(false)" class="text-slate-400 hover:text-slate-600">
                <i class="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <div class="p-6 space-y-4">
              <div class="flex gap-2">
                <input #newSubInput (input)="null" type="text" class="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="New subject name" [disabled]="isAddingSubject()">
                <button (click)="addSubject(newSubInput.value); newSubInput.value = ''" [disabled]="!newSubInput.value.trim() || isAddingSubject()" class="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold transition-colors disabled:opacity-50 flex items-center gap-2">
                  @if (isAddingSubject()) {
                    <i class="fa-solid fa-circle-notch animate-spin"></i>
                  } @else {
                    Add
                  }
                </button>
              </div>
              <div class="max-h-64 overflow-y-auto space-y-2">
                @for (sub of attendanceService.allSubjects(); track sub.id) {
                  <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span class="text-slate-700 font-medium">{{ sub.name }}</span>
                    <button (click)="attendanceService.removeSubject(sub.id)" class="text-rose-500 hover:text-rose-700 p-1">
                      <i class="fa-solid fa-trash-can text-sm"></i>
                    </button>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class QuizComponent {
  attendanceService = inject(AttendanceService);
  fb = inject(FormBuilder);
  String = String;

  showQuizModal = signal(false);
  showSubmissionsModal = signal(false);
  showSubjectModal = signal(false);
  isAddingSubject = signal(false);
  editingQuiz = signal<Quiz | null>(null);
  selectedQuizForSubmissions = signal<Quiz | null>(null);

  // Student Quiz State
  activeQuiz = signal<Quiz | null>(null);
  currentQuestionIndex = signal(0);
  selectedAnswers = signal<string[]>([]);
  timeLeft = signal(0);
  timerInterval: any;

  quizForm = this.fb.group({
    title: ['', Validators.required],
    subject_id: ['', Validators.required],
    description: [''],
    duration_minutes: [30, [Validators.required, Validators.min(1)]],
    status: ['active', Validators.required],
    questions: this.fb.array([])
  });

  get questions() {
    return this.quizForm.get('questions') as FormArray;
  }

  getOptions(questionIndex: number) {
    return this.questions.at(questionIndex).get('options') as FormArray;
  }

  currentQuestion = computed(() => {
    const quiz = this.activeQuiz();
    if (!quiz) return null;
    return quiz.questions[this.currentQuestionIndex()];
  });

  constructor() {
    effect(() => {
      if (this.timeLeft() === 0 && this.activeQuiz()) {
        this.submitQuiz();
      }
    });
  }

  openCreateModal() {
    this.editingQuiz.set(null);
    this.quizForm.reset({
      title: '',
      subject_id: '',
      description: '',
      duration_minutes: 30,
      status: 'active'
    });
    this.questions.clear();
    this.addQuestion();
    this.showQuizModal.set(true);
  }

  editQuiz(quiz: Quiz) {
    this.editingQuiz.set(quiz);
    this.quizForm.reset({
      title: quiz.title,
      subject_id: quiz.subject_id,
      description: quiz.description,
      duration_minutes: quiz.duration_minutes,
      status: quiz.status
    });
    this.questions.clear();
    quiz.questions.forEach(q => {
      const qGroup = this.fb.group({
        question: [q.question, Validators.required],
        options: this.fb.array(q.options.map(o => this.fb.control(o, Validators.required))),
        correct_answer: [q.correct_answer, Validators.required]
      });
      this.questions.push(qGroup);
    });
    this.showQuizModal.set(true);
  }

  addQuestion() {
    const qGroup = this.fb.group({
      question: ['', Validators.required],
      options: this.fb.array([
        this.fb.control('', Validators.required),
        this.fb.control('', Validators.required),
        this.fb.control('', Validators.required),
        this.fb.control('', Validators.required)
      ]),
      correct_answer: ['', Validators.required]
    });
    this.questions.push(qGroup);
  }

  removeQuestion(index: number) {
    this.questions.removeAt(index);
  }

  async saveQuiz() {
    if (this.quizForm.invalid || this.questions.length === 0) {
      if (this.questions.length === 0) {
        this.attendanceService.showToast('Please add at least one question.', 'error');
      } else {
        this.attendanceService.showToast('Please fill all required fields correctly. Check correct answers.', 'error');
      }
      return;
    }
    const val = this.quizForm.value;
    const quizData: Partial<Quiz> = {
      title: val.title!,
      subject_id: val.subject_id!,
      description: val.description || '',
      duration_minutes: val.duration_minutes!,
      status: val.status as 'active' | 'inactive',
      questions: val.questions as QuizQuestion[]
    };

    if (this.editingQuiz()) {
      await this.attendanceService.updateQuiz(this.editingQuiz()!.id, quizData);
    } else {
      await this.attendanceService.addQuiz(quizData as Omit<Quiz, 'id' | 'school_id'>);
    }
    this.showQuizModal.set(false);
  }

  // Student Methods
  startQuiz(quiz: Quiz) {
    this.activeQuiz.set(quiz);
    this.currentQuestionIndex.set(0);
    this.selectedAnswers.set(new Array(quiz.questions.length).fill(''));
    this.timeLeft.set(quiz.duration_minutes * 60);
    
    this.timerInterval = setInterval(() => {
      this.timeLeft.update(t => t > 0 ? t - 1 : 0);
    }, 1000);
  }

  selectOption(option: string) {
    const answers = [...this.selectedAnswers()];
    answers[this.currentQuestionIndex()] = option;
    this.selectedAnswers.set(answers);
  }

  nextQuestion() {
    if (this.currentQuestionIndex() < this.activeQuiz()!.questions.length - 1) {
      this.currentQuestionIndex.update(i => i + 1);
    }
  }

  prevQuestion() {
    if (this.currentQuestionIndex() > 0) {
      this.currentQuestionIndex.update(i => i - 1);
    }
  }

  async submitQuiz() {
    clearInterval(this.timerInterval);
    const quiz = this.activeQuiz();
    if (!quiz) return;

    const answers = this.selectedAnswers();
    let score = 0;
    const studentAnswers: string[] = [];
    
    quiz.questions.forEach((q, i) => {
      const answer = answers[i] || '';
      studentAnswers.push(answer);
      if (q.correct_answer === answer) {
        score++;
      }
    });

    await this.attendanceService.submitQuiz({
      quiz_id: quiz.id,
      student_id: this.attendanceService.activeUser()!.id,
      answers: studentAnswers,
      score: score,
      total_marks: quiz.questions.length,
      submitted_at: new Date().toISOString(),
      marked: true
    });

    this.activeQuiz.set(null);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Helper Methods
  getSubjectName(id: string) {
    return this.attendanceService.allSubjects().find(s => s.id === id)?.name || 'Unknown';
  }

  getStudentName(id: string) {
    return this.attendanceService.allSchoolStudents().find(s => s.id === id)?.name || 'Unknown';
  }

  hasSubmitted(quizId: string) {
    return this.attendanceService.allQuizSubmissions().some(
      s => s.quiz_id === quizId && s.student_id === this.attendanceService.activeUser()?.id
    );
  }

  getScore(quizId: string) {
    const sub = this.attendanceService.allQuizSubmissions().find(
      s => s.quiz_id === quizId && s.student_id === this.attendanceService.activeUser()?.id
    );
    return sub ? `${sub.score}/${sub.total_marks}` : '';
  }

  viewSubmissions(quiz: Quiz) {
    this.selectedQuizForSubmissions.set(quiz);
    this.showSubmissionsModal.set(true);
  }

  getSubmissionsForQuiz() {
    const quiz = this.selectedQuizForSubmissions();
    if (!quiz) return [];
    return this.attendanceService.allQuizSubmissions().filter(s => s.quiz_id === quiz.id);
  }

  async markSubmission(submission: QuizSubmission) {
    await this.attendanceService.markQuiz(submission.id, { score: submission.score, marked: true });
  }

  async addSubject(name: string) {
    if (!name.trim()) return;
    this.isAddingSubject.set(true);
    try {
      await this.attendanceService.addSubject(name);
    } catch (e) {
      // Error handled by service toast
    } finally {
      this.isAddingSubject.set(false);
    }
  }
}
