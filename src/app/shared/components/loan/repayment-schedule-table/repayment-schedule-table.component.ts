import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { LoanHelpers } from 'src/app/core/models/loanModels/loan-helper.model';
import { RepaymentScheduleItem } from 'src/app/core/models/loanModels/loan-statement.model';

@Component({
  selector: 'app-repayment-schedule-table',
  templateUrl: './repayment-schedule-table.component.html',
  styleUrls: ['./repayment-schedule-table.component.scss']
})
export class RepaymentScheduleTableComponent implements OnChanges {
  @Input() schedule: RepaymentScheduleItem[] = [];
  @Input() pageSize: number = 12;
  @Input() showPagination: boolean = true;
  @Input() compact: boolean = false;

  currentPage: number = 1;
  totalPages: number = 1;
  paginatedSchedule: RepaymentScheduleItem[] = [];

  // Summary statistics
  totalPaid: number = 0;
  totalPending: number = 0;
  totalOverdue: number = 0;
  totalPenalty: number = 0;

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['schedule'] || changes['pageSize']) {
      this.calculateSummary();
      this.updatePagination();
    }
  }

  calculateSummary(): void {
    this.totalPaid = this.schedule
      .filter(item => item.status === 'PAID')
      .reduce((sum, item) => sum + item.totalAmount, 0);

    this.totalPending = this.schedule
      .filter(item => item.status === 'PENDING')
      .reduce((sum, item) => sum + item.totalAmount, 0);

    this.totalOverdue = this.schedule
      .filter(item => item.status === 'OVERDUE')
      .reduce((sum, item) => sum + item.totalAmount, 0);

    this.totalPenalty = this.schedule
      .reduce((sum, item) => sum + (item.penaltyApplied || 0), 0);
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.schedule.length / this.pageSize);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedSchedule = this.schedule.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  getStatusBadgeClass(status: string): string {
    return LoanHelpers.getScheduleStatusBadgeClass(status);
  }

  formatAmount(amount: number): string {
    return LoanHelpers.formatAmount(amount, 'BDT');
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  isOverdue(item: RepaymentScheduleItem): boolean {
    if (item.status === 'PAID' || item.status === 'WAIVED') return false;
    
    const dueDate = new Date(item.dueDate);
    const today = new Date();
    return dueDate < today;
  }

  getDaysOverdue(item: RepaymentScheduleItem): number {
    if (!this.isOverdue(item)) return 0;
    
    const dueDate = new Date(item.dueDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - dueDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  exportToCSV(): void {
    const headers = ['Installment', 'Due Date', 'Payment Date', 'Principal', 'Interest', 'Total', 'Status', 'Balance', 'Penalty'];
    const rows = this.schedule.map(item => [
      item.installmentNumber,
      this.formatDate(item.dueDate),
      this.formatDate(item.paymentDate || ''),
      item.principalAmount,
      item.interestAmount,
      item.totalAmount,
      item.status,
      item.balanceAfterPayment,
      item.penaltyApplied || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `repayment-schedule-${new Date().getTime()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  Math = Math;
}
