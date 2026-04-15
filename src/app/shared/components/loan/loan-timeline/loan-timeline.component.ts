import { Component, Input, OnInit } from '@angular/core';
import { LoanResponse } from 'src/app/core/models/loanModels/loan-response.model';
import { TimelineEvent } from 'src/app/core/models/loanModels/TimelineEvent.model';

@Component({
  selector: 'app-loan-timeline',
  templateUrl: './loan-timeline.component.html',
  styleUrls: ['./loan-timeline.component.scss']
})
export class LoanTimelineComponent implements OnInit {
  @Input() loan!: LoanResponse;
  @Input() compact: boolean = false;

  timeline: TimelineEvent[] = [];

  constructor() { }

  ngOnInit(): void {
    this.buildTimeline();
  }

  buildTimeline(): void {
    this.timeline = [];

    // Application
    this.timeline.push({
      date: this.loan.applicationDate,
      title: 'Application Submitted',
      description: `Loan application for ${this.formatAmount(this.loan.principal)} submitted`,
      icon: 'bi-file-earmark-text',
      status: 'completed',
      badgeClass: 'bg-primary'
    });

    // Approval
    if (this.loan.approvalStatus === 'APPROVED' && this.loan.approvedDate) {
      this.timeline.push({
        date: this.loan.approvedDate,
        title: 'Loan Approved',
        description: `Loan approved with ${this.loan.annualInterestRate}% interest rate`,
        icon: 'bi-check-circle-fill',
        status: 'completed',
        badgeClass: 'bg-success'
      });
    } else if (this.loan.approvalStatus === 'PENDING') {
      this.timeline.push({
        date: '',
        title: 'Pending Approval',
        description: 'Loan is under review',
        icon: 'bi-clock',
        status: 'current',
        badgeClass: 'bg-warning'
      });
    } else if (this.loan.approvalStatus === 'REJECTED') {
      this.timeline.push({
        date: this.loan.approvedDate || '',
        title: 'Loan Rejected',
        description: 'Loan application was rejected',
        icon: 'bi-x-circle-fill',
        status: 'completed',
        badgeClass: 'bg-danger'
      });
    }

    // Disbursement
    if (this.loan.disbursementStatus === 'COMPLETED' && this.loan.actualDisbursementDate) {
      this.timeline.push({
        date: this.loan.actualDisbursementDate,
        title: 'Loan Disbursed',
        description: `Amount of ${this.formatAmount(this.loan.disbursedAmount)} disbursed`,
        icon: 'bi-cash-coin',
        status: 'completed',
        badgeClass: 'bg-info'
      });
    } else if (this.loan.disbursementStatus === 'SCHEDULED') {
      this.timeline.push({
        date: '',
        title: 'Disbursement Scheduled',
        description: 'Loan disbursement is scheduled',
        icon: 'bi-calendar-check',
        status: 'current',
        badgeClass: 'bg-info'
      });
    } else if (this.loan.disbursementStatus === 'PENDING' && this.loan.approvalStatus === 'APPROVED') {
      this.timeline.push({
        date: '',
        title: 'Awaiting Disbursement',
        description: 'Disbursement process pending',
        icon: 'bi-hourglass-split',
        status: 'pending',
        badgeClass: 'bg-secondary'
      });
    }

    // Active
    if (this.loan.loanStatus === 'ACTIVE') {
      this.timeline.push({
        date: this.loan.actualDisbursementDate || '',
        title: 'Loan Active',
        description: `Outstanding balance: ${this.formatAmount(this.loan.outstandingBalance)}`,
        icon: 'bi-check-circle',
        status: 'current',
        badgeClass: 'bg-primary'
      });
    }

    // Closed
    if (this.loan.loanStatus === 'CLOSED') {
      this.timeline.push({
        date: '',
        title: 'Loan Closed',
        description: 'Loan has been fully repaid and closed',
        icon: 'bi-check-circle-fill',
        status: 'completed',
        badgeClass: 'bg-success'
      });
    }

    // Defaulted
    if (this.loan.loanStatus === 'DEFAULTED') {
      this.timeline.push({
        date: '',
        title: 'Loan Defaulted',
        description: 'Loan has been marked as defaulted',
        icon: 'bi-exclamation-triangle-fill',
        status: 'completed',
        badgeClass: 'bg-danger'
      });
    }
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date: string): string {
    if (!date) return 'Pending';
    return new Date(date).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}
