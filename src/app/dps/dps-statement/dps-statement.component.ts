import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DPSStatement } from 'src/app/core/models/dps';
import { DpsService } from 'src/app/core/services/dps.service';

@Component({
  selector: 'app-dps-statement',
  templateUrl: './dps-statement.component.html',
  styleUrls: ['./dps-statement.component.scss']
})
export class DpsStatementComponent implements OnInit {
  statement: DPSStatement | null = null;
  loading = false;
  error = '';
  dpsNumber = '';
  
  filterStatus = '';
  filteredInstallments: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dpsService: DpsService
  ) { }

  ngOnInit(): void {
    this.dpsNumber = this.route.snapshot.params['dpsNumber'];
    if (this.dpsNumber) {
      this.loadStatement();
    }
  }

  loadStatement(): void {
    this.loading = true;
    this.error = '';

    this.dpsService.getDPSStatement(this.dpsNumber).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.statement = response.data;
          this.filteredInstallments = this.statement.installments;
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = 'Failed to load DPS statement';
        this.loading = false;
        console.error('Error loading statement:', err);
      }
    });
  }

  filterInstallments(): void {
    if (!this.statement) return;

    if (this.filterStatus) {
      this.filteredInstallments = this.statement.installments.filter(
        inst => inst.status.toLowerCase() === this.filterStatus.toLowerCase()
      );
    } else {
      this.filteredInstallments = this.statement.installments;
    }
  }

  clearFilter(): void {
    this.filterStatus = '';
    if (this.statement) {
      this.filteredInstallments = this.statement.installments;
    }
  }

  printStatement(): void {
    window.print();
  }

  downloadStatement(): void {
    // Implementation for downloading statement as PDF
    alert('Download functionality would be implemented here');
  }

  goBack(): void {
    this.router.navigate(['/dps/detail', this.dpsNumber]);
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'badge bg-warning text-dark',
      'paid': 'badge bg-success',
      'overdue': 'badge bg-danger',
      'waived': 'badge bg-secondary'
    };
    return statusMap[status.toLowerCase()] || 'badge bg-secondary';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getTotalPaidAmount(): number {
    if (!this.statement) return 0;
    return this.statement.installments
      .filter(inst => inst.status === 'paid')
      .reduce((sum, inst) => sum + inst.amount, 0);
  }

  getTotalPendingAmount(): number {
    if (!this.statement) return 0;
    return this.statement.installments
      .filter(inst => inst.status === 'pending')
      .reduce((sum, inst) => sum + inst.amount, 0);
  }

  getTotalPenaltyAmount(): number {
    if (!this.statement) return 0;
    return this.statement.installments
      .reduce((sum, inst) => sum + inst.penaltyAmount, 0);
  }

  calculateProgress(): number {
    if (!this.statement) return 0;
    return (this.statement.paidInstallments / this.statement.totalInstallments) * 100;
  }
  Date = Date;
}