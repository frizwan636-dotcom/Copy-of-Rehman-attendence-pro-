import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarService } from '../services/calendar.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-6">Events Calendar</h2>
      <div class="bg-white p-6 rounded-xl shadow-md">
        <div class="grid grid-cols-7 gap-2">
          <!-- Calendar header -->
          <div class="font-bold text-center">Sun</div>
          <div class="font-bold text-center">Mon</div>
          <div class="font-bold text-center">Tue</div>
          <div class="font-bold text-center">Wed</div>
          <div class="font-bold text-center">Thu</div>
          <div class="font-bold text-center">Fri</div>
          <div class="font-bold text-center">Sat</div>
          <!-- Calendar days placeholder -->
          @for (day of [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30]; track day) {
            <div class="border p-4 rounded hover:bg-indigo-50 cursor-pointer">
              {{ day }}
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class CalendarComponent {
  calendarService = inject(CalendarService);
}
