import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Card, getCardTypeBadgeClass, getCardStatusBadgeClass, formatCardType } from 'src/app/core/models/card.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { CardService } from 'src/app/core/services/card.service';

@Component({
  selector: 'app-card-detail',
  templateUrl: './card-detail.component.html',
  styleUrls: ['./card-detail.component.scss']
})
export class CardDetailComponent implements OnInit {
  card: Card | null = null;
  loading = false;
  error: string | null = null;
  isAdmin = false;
  isCustomer = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cardService: CardService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin() || this.authService.isEmployee();
    this.isCustomer = this.authService.isCustomer();
    
    const cardId = this.route.snapshot.paramMap.get('id');
    if (cardId) {
      this.loadCardDetails(parseInt(cardId));
    }
  }

  loadCardDetails(id: number): void {
    this.loading = true;
    this.error = null;

    this.cardService.getCardById(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.card = response.data;
          
          // Verify ownership for customers
          if (this.isCustomer) {
            const customerId = this.authService.getCustomerId();
            if (this.card.customerId !== customerId) {
              this.error = 'Access denied: You can only view your own cards.';
              this.card = null;
            }
          }
        } else {
          this.error = response.message;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load card details.';
        this.loading = false;
        console.error('Error loading card:', err);
      }
    });
  }

  goBack(): void {
    if (this.isCustomer) {
      this.router.navigate(['/customer/cards']);
    } else {
      this.router.navigate(['/cards/list']);
    }
  }

  getCardTypeBadge(type: string): string {
    return getCardTypeBadgeClass(type);
  }

  getStatusBadge(status: string): string {
    return getCardStatusBadgeClass(status);
  }

  formatType(type: string): string {
    return formatCardType(type);
  }

  formatDate(dateString: string | undefined): string {
    return dateString ? new Date(dateString).toLocaleDateString() : 'N/A';
  }

  formatDateTime(dateString: string | undefined): string {
    return dateString ? new Date(dateString).toLocaleString() : 'N/A';
  }
}
