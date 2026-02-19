import { Component, ChangeDetectionStrategy, signal, OnInit, output } from '@angular/core';
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
      <div class="w-28 h-28 bg-white/10 rounded-3xl flex items-center justify-center mb-8 animate-in zoom-in-50 duration-700">
        <i class="fa-solid fa-book-open-reader text-6xl text-white"></i>
      </div>
      <h1 class="text-5xl font-black tracking-tight min-h-[72px]">
        {{ displayedTitle() }}<span [class.blinking-cursor]="!isTitleComplete()"></span>
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
export class SplashScreenComponent implements OnInit {
  animationFinished = output<void>();

  fullTitle = "Welcome to Rehman Attendance Pro";
  fullParagraph = "This application is the result of the tireless hard work and dedication of Rizwan Hanif. Enjoy a seamless and efficient attendance management experience.";
  private readonly highlightWords = new Set(['Rizwan', 'Hanif']);

  displayedTitle = signal('');
  isTitleComplete = signal(false);

  displayedWords = signal<{ word: string; highlight: boolean }[]>([]);
  isParagraphComplete = signal(false);

  ngOnInit() {
    this.typeTitle();
  }

  private typeTitle() {
    const words = this.fullTitle.split(' ');
    let currentWordIndex = 0;
    const interval = setInterval(() => {
      if (currentWordIndex < words.length) {
        this.displayedTitle.update(val => val + (val ? ' ' : '') + words[currentWordIndex]);
        currentWordIndex++;
      } else {
        clearInterval(interval);
        this.isTitleComplete.set(true);
        setTimeout(() => this.typeParagraph(), 100); // Pause before typing paragraph
      }
    }, 150); // Speed of word appearance
  }

  private typeParagraph() {
    const words = this.fullParagraph.split(' ');
    let currentWordIndex = 0;
    const interval = setInterval(() => {
      if (currentWordIndex < words.length) {
        const word = words[currentWordIndex];
        const cleanWord = word.replace(/[.,]/g, ''); // Remove punctuation for checking
        const shouldHighlight = this.highlightWords.has(cleanWord);
        
        this.displayedWords.update(currentWords => [...currentWords, { word: word, highlight: shouldHighlight }]);
        currentWordIndex++;
      } else {
        clearInterval(interval);
        this.isParagraphComplete.set(true);
        // Wait a moment after completion before notifying parent to hide splash
        setTimeout(() => {
          this.animationFinished.emit();
        }, 500); // 0.5 second pause after text is complete
      }
    }, 80); // Slower speed for the paragraph
  }

  skipAnimation() {
    this.animationFinished.emit();
  }
}
