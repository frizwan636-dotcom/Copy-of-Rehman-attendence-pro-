import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StaffService } from '../services/staff.service';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-6">Staff Management</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (member of staffService.allStaff(); track member.id) {
          <div class="bg-white p-6 rounded-xl shadow-md">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
                {{ member.name.charAt(0) }}
              </div>
              <div>
                <h3 class="font-bold text-lg">{{ member.name }}</h3>
                <p class="text-sm text-gray-500">{{ member.designation }}</p>
              </div>
            </div>
            <p class="text-sm text-gray-600">Mobile: {{ member.mobile }}</p>
            <p class="text-sm text-gray-600">Email: {{ member.email }}</p>
          </div>
        }
      </div>
    </div>
  `
})
export class StaffComponent {
  staffService = inject(StaffService);
}
