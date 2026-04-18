import { Injectable, signal } from '@angular/core';

export interface FeeRecord {
  id: string;
  month: string;
  amount: number;
  status: 'Paid' | 'Unpaid';
}

@Injectable({ providedIn: 'root' })
export class FeesService {
  allFees = signal<FeeRecord[]>([
    { id: '1', month: 'January', amount: 5000, status: 'Paid' },
    { id: '2', month: 'February', amount: 5000, status: 'Paid' },
    { id: '3', month: 'March', amount: 5000, status: 'Unpaid' },
  ]);
}
