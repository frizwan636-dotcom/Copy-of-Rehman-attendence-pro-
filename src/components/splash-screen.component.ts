import { Component, ChangeDetectionStrategy, signal, OnInit, OnDestroy, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <style>
      .blinking-cursor {
        border-right: 4px solid white;
        animation: blink 1s step-end infinite;
      }
      @keyframes blink {
        from, to { border-color: transparent }
        50% { border-color: white; }
      }
    </style>
    <div class="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 text-white text-center animate-in fade-in duration-1000 relative">
      <button (click)="skipAnimation()" class="absolute top-6 right-6 text-white/30 hover:text-white/80 text-sm font-medium transition-colors">
        Skip <i class="fa-solid fa-forward ml-1"></i>
      </button>
      <div class="w-28 h-28 bg-white/10 rounded-3xl flex items-center justify-center mb-8 animate-in zoom-in-50 duration-700 overflow-hidden">
        <img src="https://i.postimg.cc/YCyRb73f/launchericon-512x512.png" alt="MustEducate Logo" class="w-full h-full object-cover">
      </div>
      <h1 class="text-5xl font-black tracking-tight min-h-[72px]">
        Welcome to {{ displayedTitle() }}<span [class.blinking-cursor]="!isTitleComplete()"></span>
      </h1>
      @if(isTitleComplete()) {
        <p class="text-indigo-200/70 mt-4 max-w-2xl animate-in slide-in-from-bottom-10 fade-in duration-700">
          @for (item of displayedWords(); track $index) {
            <span [class.font-bold]="item.highlight" [class.text-amber-300]="item.highlight">{{ item.word }} </span>
          }
          <span [class.blinking-cursor]="!isParagraphComplete()"></span>
        </p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SplashScreenComponent implements OnInit, OnDestroy {
  animationFinished = output<void>();

  fullTitle = "MustEducate";
  fullParagraph = "Experience the next generation of school management. This application is the result of the tireless hard work and dedication of Rizwan Hanif.";
  private readonly highlightWords = new Set(['Rizwan', 'Hanif']);

  displayedTitle = signal('');
  isTitleComplete = signal(false);

  displayedWords = signal<{ word: string; highlight: boolean }[]>([]);
  isParagraphComplete = signal(false);

  private titleInterval: any;
  private paragraphInterval: any;
  private titleTimeout: any;
  private completionTimeout: any;

  ngOnInit() {
    this.typeTitle();
  }

  ngOnDestroy() {
    this.clearTimers();
  }

  private clearTimers() {
    if (this.titleInterval) clearInterval(this.titleInterval);
    if (this.paragraphInterval) clearInterval(this.paragraphInterval);
    if (this.titleTimeout) clearTimeout(this.titleTimeout);
    if (this.completionTimeout) clearTimeout(this.completionTimeout);
  }

  private typeTitle() {
    const words = this.fullTitle.split(' ');
    let currentWordIndex = 0;
    this.titleInterval = setInterval(() => {
      if (currentWordIndex < words.length) {
        this.displayedTitle.update(val => val + (val ? ' ' : '') + words[currentWordIndex]);
        currentWordIndex++;
      } else {
        clearInterval(this.titleInterval);
        this.isTitleComplete.set(true);
        this.titleTimeout = setTimeout(() => this.typeParagraph(), 100); // Pause before typing paragraph
      }
    }, 150); // Speed of word appearance
  }

  private typeParagraph() {
    const words = this.fullParagraph.split(' ');
    let currentWordIndex = 0;
    this.paragraphInterval = setInterval(() => {
      if (currentWordIndex < words.length) {
        const word = words[currentWordIndex];
        const cleanWord = word.replace(/[.,]/g, ''); // Remove punctuation for checking
        const shouldHighlight = this.highlightWords.has(cleanWord);
        
        this.displayedWords.update(currentWords => [...currentWords, { word: word, highlight: shouldHighlight }]);
        currentWordIndex++;
      } else {
        clearInterval(this.paragraphInterval);
        this.isParagraphComplete.set(true);
        // Wait a moment after completion before notifying parent to hide splash
        this.completionTimeout = setTimeout(() => {
          this.animationFinished.emit();
        }, 500); // 0.5 second pause after text is complete
      }
    }, 80); // Slower speed for the paragraph
  }

  skipAnimation() {
    this.clearTimers();
    this.animationFinished.emit();
  }
}

