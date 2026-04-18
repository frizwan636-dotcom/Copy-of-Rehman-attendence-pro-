import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LibraryService } from '../services/library.service';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-6">Library Management</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (book of libraryService.allBooks(); track book.id) {
          <div class="bg-white p-6 rounded-xl shadow-md border-l-4" [class]="book.isAvailable ? 'border-green-500' : 'border-red-500'">
            <h3 class="font-bold text-lg">{{ book.title }}</h3>
            <p class="text-sm text-gray-500">{{ book.author }}</p>
            <p class="text-sm mt-2 font-bold" [class]="book.isAvailable ? 'text-green-600' : 'text-red-600'">
              {{ book.isAvailable ? 'Available' : 'Checked Out' }}
            </p>
          </div>
        }
      </div>
    </div>
  `
})
export class LibraryComponent {
  libraryService = inject(LibraryService);
}
