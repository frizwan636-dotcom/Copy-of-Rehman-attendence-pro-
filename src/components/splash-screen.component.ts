import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 text-white text-center animate-in fade-in duration-1000">
      <div class="w-28 h-28 bg-white/10 rounded-3xl flex items-center justify-center mb-8 animate-in zoom-in-50 duration-700">
        <i class="fa-solid fa-clipboard-user text-6xl text-white"></i>
      </div>
      <h1 class="text-5xl font-black tracking-tight animate-in slide-in-from-bottom-10 fade-in duration-700 delay-200">
        Welcome to Rehman Attendance Pro
      </h1>
      <p class="text-indigo-200/70 mt-4 max-w-2xl animate-in slide-in-from-bottom-10 fade-in duration-700 delay-400">
        This application is the result of the tireless hard work and dedication of 
        <span class="font-extrabold text-cyan-300 tracking-wider underline decoration-cyan-300/50 underline-offset-4">Rizwan Hanif</span>. 
        Enjoy a seamless and efficient attendance management experience.
      </p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SplashScreenComponent {}
