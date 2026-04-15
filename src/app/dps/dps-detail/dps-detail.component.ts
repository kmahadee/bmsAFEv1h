import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DPS } from 'src/app/core/models/dps';
import { DpsService } from 'src/app/core/services/dps.service';

@Component({
  selector: 'app-dps-detail',
  templateUrl: './dps-detail.component.html',
  styleUrls: ['./dps-detail.component.scss']
})
export class DpsDetailComponent implements OnInit {
  dps: DPS | null = null;
  loading = false;
  error = '';
  dpsNumber = '';
  showCloseModal = false;
  closeReason = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dpsService: DpsService
  ) { }

  ngOnInit(): void {
    this.dpsNumber = this.route.snapshot.params['dpsNumber'];
    if (this.dpsNumber) {
      this.loadDPSDetails();
    }
  }

  loadDPSDetails(): void {
    this.loading = true;
    this.error = '';

    this.dpsService.getDPSByNumber(this.dpsNumber).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.dps = response.data;
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load DPS details';
        this.loading = false;
        console.error('Error loading DPS:', err);
      }
    });
  }

  makePayment(): void {
    this.router.navigate(['/dps/payment', this.dpsNumber]);
  }

  viewStatement(): void {
    this.router.navigate(['/dps/statement', this.dpsNumber]);
  }

  openCloseModal(): void {
    this.showCloseModal = true;
  }

  closeModal(): void {
    this.showCloseModal = false;
    this.closeReason = '';
  }

  confirmClose(): void {
    if (this.dps && this.dps.status === 'active') {
      this.loading = true;
      this.error = '';
      
      this.dpsService.closeDPS(this.dpsNumber, this.closeReason).subscribe({
        next: (response) => {
          if (response.success) {
            this.showCloseModal = false;
            this.closeReason = '';
            alert('DPS account closed successfully');
            this.loadDPSDetails(); // Reload to show updated status
          }
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to close DPS account';
          this.loading = false;
          this.showCloseModal = false;
          console.error('Error closing DPS:', err);
        }
      });
    }
  }

  matureDPS(): void {
    if (this.dps && this.dps.pendingInstallments === 0) {
      if (confirm('Are you sure you want to mature this DPS account? This action cannot be undone.')) {
        this.loading = true;
        this.error = '';
        
        this.dpsService.matureDPS(this.dpsNumber).subscribe({
          next: (response) => {
            if (response.success) {
              alert('DPS account matured successfully');
              this.loadDPSDetails(); // Reload to show updated status
            }
          },
          error: (err) => {
            this.error = err.error?.message || 'Failed to mature DPS account';
            this.loading = false;
            console.error('Error maturing DPS:', err);
          }
        });
      }
    } else if (this.dps && this.dps.pendingInstallments > 0) {
      alert(`Cannot mature DPS. There are ${this.dps.pendingInstallments} pending installments.`);
    }
  }

  goBack(): void {
    this.router.navigate(['/dps']);
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': 'badge bg-success',
      'matured': 'badge bg-primary',
      'closed': 'badge bg-secondary',
      'defaulted': 'badge bg-danger',
      'suspended': 'badge bg-warning text-dark'
    };
    return statusMap[status.toLowerCase()] || 'badge bg-secondary';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatDate(date: string | Date): string {
    if (!date) return '-';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  calculateProgress(): number {
    if (!this.dps || this.dps.tenureMonths === 0) return 0;
    
    const progress = (this.dps.totalInstallmentsPaid / this.dps.tenureMonths) * 100;
    return Math.min(Math.max(progress, 0), 100); // Ensure between 0 and 100
  }

  calculateDaysToMaturity(): number {
    if (!this.dps || !this.dps.maturityDate) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    const maturityDate = new Date(this.dps.maturityDate);
    maturityDate.setHours(0, 0, 0, 0); // Reset time to start of day
    
    const diffTime = maturityDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  }

  getProgressBarColor(): string {
    const progress = this.calculateProgress();
    
    if (progress < 30) return 'bg-danger';
    if (progress < 70) return 'bg-warning';
    return 'bg-success';
  }

  isOverdue(): boolean {
    if (!this.dps || !this.dps.nextPaymentDate) return false;
    
    const today = new Date();
    const nextPaymentDate = new Date(this.dps.nextPaymentDate);
    
    return today > nextPaymentDate && this.dps.status === 'active';
  }

  getDaysOverdue(): number {
    if (!this.isOverdue() || !this.dps?.nextPaymentDate) return 0;
    
    const today = new Date();
    const nextPaymentDate = new Date(this.dps.nextPaymentDate);
    const diffTime = today.getTime() - nextPaymentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  }
}