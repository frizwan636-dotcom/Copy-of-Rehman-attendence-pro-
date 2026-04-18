import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthService } from '../services/health.service';

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-in fade-in">
      <h2 class="text-2xl font-bold text-slate-800">Health Tracker</h2>
      <div class="space-y-4">
        @for (record of healthService.healthRecords(); track record.id) {
          <div class="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
            <h3 class="font-bold text-lg text-slate-800">{{ record.date }}</h3>
            <p class="text-sm text-slate-600 mt-1">{{ record.record }}</p>
            <div class="mt-4 p-4 bg-emerald-50 text-emerald-800 rounded-xl text-sm font-medium">
              <i class="fa-solid fa-lightbulb mr-2"></i> {{ record.suggestion }}
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class HealthComponent {
  healthService = inject(HealthService);
}
