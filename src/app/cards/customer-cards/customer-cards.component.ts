import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { CardListItem, getCardTypeBadgeClass, getCardStatusBadgeClass, formatCardType } from "src/app/core/models/card.model";
import { AuthService } from "src/app/core/services/auth.service";
import { CardService } from "src/app/core/services/card.service";



declare var bootstrap: any;

@Component({
  selector: 'app-customer-cards',
  templateUrl: './customer-cards.component.html',
  styleUrls: ['./customer-cards.component.scss']
})
export class CustomerCardsComponent implements OnInit {
  cards: CardListItem[] = [];
  loading = false;
  error: string | null = null;
  success: string | null = null;

  // Modal data
  selectedCard: CardListItem | null = null;
  blockReason = '';
  oldPin = '';
  newPin = '';
  confirmPin = '';

  constructor(
    private cardService: CardService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMyCards();
  }

  loadMyCards(): void {
    const customerId = this.authService.getCustomerId();
    if (!customerId) {
      this.error = 'Customer ID not found. Please log in again.';
      return;
    }

    this.loading = true;
    this.error = null;

    this.cardService.getCardsByCustomerId(customerId).subscribe({
      next: (response) => {
        if (response.success) {
          this.cards = response.data;
        } else {
          this.error = response.message;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load your cards. Please try again.';
        this.loading = false;
        console.error('Error loading cards:', err);
      }
    });
  }

  viewCardDetails(id: number): void {
    // this.router.navigate(['/customer/cards/detail', id]);
    this.router.navigate(['/cards/detail/:id', id]);
  }

  openBlockModal(card: CardListItem): void {
    this.selectedCard = card;
    this.blockReason = '';
    const modal = new bootstrap.Modal(document.getElementById('blockModal'));
    modal.show();
  }

  confirmBlock(): void {
    if (!this.selectedCard || !this.blockReason.trim()) {
      this.error = 'Please provide a reason for blocking.';
      return;
    }

    this.loading = true;
    this.cardService.blockCard(this.selectedCard.id, this.blockReason).subscribe({
      next: (response) => {
        if (response.success) {
          this.success = 'Card blocked successfully.';
          this.loadMyCards();
          const modal = bootstrap.Modal.getInstance(document.getElementById('blockModal'));
          modal?.hide();
        } else {
          this.error = response.message;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to block card.';
        this.loading = false;
        console.error('Error blocking card:', err);
      }
    });
  }

  openPinModal(card: CardListItem): void {
    this.selectedCard = card;
    this.oldPin = '';
    this.newPin = '';
    this.confirmPin = '';
    this.error = null;
    const modal = new bootstrap.Modal(document.getElementById('pinModal'));
    modal.show();
  }

  confirmPinUpdate(): void {
    if (!this.selectedCard || !this.oldPin || !this.newPin || !this.confirmPin) {
      this.error = 'All PIN fields are required.';
      return;
    }

    if (this.newPin !== this.confirmPin) {
      this.error = 'New PIN and confirmation do not match.';
      return;
    }

    if (!/^\d{4}$/.test(this.newPin)) {
      this.error = 'PIN must be exactly 4 digits.';
      return;
    }

    if (this.oldPin === this.newPin) {
      this.error = 'New PIN must be different from old PIN.';
      return;
    }

    this.loading = true;
    const request = {
      oldPin: this.oldPin,
      newPin: this.newPin
    };

    this.cardService.updateCardPin(this.selectedCard.id, request).subscribe({
      next: (response) => {
        if (response.success) {
          this.success = 'PIN updated successfully.';
          const modal = bootstrap.Modal.getInstance(document.getElementById('pinModal'));
          modal?.hide();
          this.oldPin = '';
          this.newPin = '';
          this.confirmPin = '';
        } else {
          this.error = response.message;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update PIN.';
        this.loading = false;
        console.error('Error updating PIN:', err);
      }
    });
  }

  activateCard(card: CardListItem): void {
    if (confirm('Are you sure you want to activate this card?')) {
      this.loading = true;
      this.cardService.activateCard(card.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.success = 'Card activated successfully.';
            this.loadMyCards();
          } else {
            this.error = response.message;
          }
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to activate card.';
          this.loading = false;
          console.error('Error activating card:', err);
        }
      });
    }
  }

  // Helper methods
  getCardTypeBadge(type: string): string {
    return getCardTypeBadgeClass(type);
  }

  getStatusBadge(status: string): string {
    return getCardStatusBadgeClass(status);
  }

  formatType(type: string): string {
    return formatCardType(type);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  isExpiringSoon(expiryDate: string): boolean {
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry <= thirtyDaysFromNow;
  }

  canActivate(card: CardListItem): boolean {
    return card.status === 'inactive';
  }

  canBlock(card: CardListItem): boolean {
    return card.status === 'active' || card.status === 'inactive';
  }

  canUpdatePin(card: CardListItem): boolean {
    return card.status === 'active';
  }
}

