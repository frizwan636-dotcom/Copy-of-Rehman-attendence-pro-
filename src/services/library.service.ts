import { Injectable, signal } from '@angular/core';

export interface Book {
  id: string;
  title: string;
  author: string;
  isAvailable: boolean;
}

@Injectable({ providedIn: 'root' })
export class LibraryService {
  private books = signal<Book[]>([]);
  allBooks = this.books.asReadonly();

  // Methods to interact with Supabase will be added here
}
