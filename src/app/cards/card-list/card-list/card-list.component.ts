import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CardListItem, getCardTypeBadgeClass, getCardStatusBadgeClass, formatCardType } from 'src/app/core/models/card.model';
import { CardService } from 'src/app/core/services/card.service';
// import { CardListItem, getCardTypeBadgeClass, getCardStatusBadgeClass, formatCardType } from '../../../core/models/card.model';

declare var bootstrap: any;
@Component({
  selector: 'app-card-list',
  templateUrl: './card-list.component.html',
  styleUrls: ['./card-list.component.scss']
})
export class CardListComponent implements OnInit {
  cards: CardListItem[] = [];
  filteredCards: CardListItem[] = [];
  loading = false;
  error: string | null = null;

  // Filter options
  filterStatus = '';
  filterType = '';
  searchTerm = '';

  // Modal data
  selectedCard: CardListItem | null = null;
  unblockReason = '';
  cancelReason = '';
  newCreditLimit: number | null = null;

  constructor(
    private cardService: CardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCards();
  }

  loadCards(): void {
    this.loading = true;
    this.error = null;

    this.cardService.getAllCards().subscribe({
      next: (response) => {
        if (response.success) {
          this.cards = response.data;
          this.applyFilters();
        } else {
          this.error = response.message;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load cards. Please try again.';
        this.loading = false;
        console.error('Error loading cards:', err);
      }
    });
  }

  applyFilters(): void {
    this.filteredCards = this.cards.filter(card => {
      const matchesStatus = !this.filterStatus || card.status.toLowerCase() === this.filterStatus.toLowerCase();
      const matchesType = !this.filterType || card.cardType.toLowerCase() === this.filterType.toLowerCase();
      const matchesSearch = !this.searchTerm || 
        card.maskedCardNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        card.cardHolderName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        card.customerId.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      return matchesStatus && matchesType && matchesSearch;
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  viewDetails(id: number): void {
    this.router.navigate(['/cards/detail', id]);
  }

  issueNewCard(): void {
    this.router.navigate(['/cards/issue']);
  }

  // Modal operations
  openUnblockModal(card: CardListItem): void {
    this.selectedCard = card;
    this.unblockReason = '';
    const modal = new bootstrap.Modal(document.getElementById('unblockModal'));
    modal.show();
  }

  confirmUnblock(): void {
    if (!this.selectedCard) return;

    this.loading = true;
    this.cardService.unblockCard(this.selectedCard.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadCards();
          const modal = bootstrap.Modal.getInstance(document.getElementById('unblockModal'));
          modal?.hide();
        } else {
          this.error = response.message;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to unblock card.';
        this.loading = false;
        console.error('Error unblocking card:', err);
      }
    });
  }

  openCancelModal(card: CardListItem): void {
    this.selectedCard = card;
    this.cancelReason = '';
    const modal = new bootstrap.Modal(document.getElementById('cancelModal'));
    modal.show();
  }

  confirmCancel(): void {
    if (!this.selectedCard || !this.cancelReason.trim()) {
      this.error = 'Please provide a reason for cancellation.';
      return;
    }

    this.loading = true;
    this.cardService.cancelCard(this.selectedCard.id, this.cancelReason).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadCards();
          const modal = bootstrap.Modal.getInstance(document.getElementById('cancelModal'));
          modal?.hide();
        } else {
          this.error = response.message;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to cancel card.';
        this.loading = false;
        console.error('Error cancelling card:', err);
      }
    });
  }

  openLimitModal(card: CardListItem): void {
    this.selectedCard = card;
    this.newCreditLimit = card.creditLimit || null;
    const modal = new bootstrap.Modal(document.getElementById('limitModal'));
    modal.show();
  }

  confirmLimitUpdate(): void {
    if (!this.selectedCard || !this.newCreditLimit || this.newCreditLimit <= 0) {
      this.error = 'Please provide a valid credit limit.';
      return;
    }

    this.loading = true;
    this.cardService.updateCardLimit(this.selectedCard.id, { creditLimit: this.newCreditLimit }).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadCards();
          const modal = bootstrap.Modal.getInstance(document.getElementById('limitModal'));
          modal?.hide();
        } else {
          this.error = response.message;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to update credit limit.';
        this.loading = false;
        console.error('Error updating limit:', err);
      }
    });
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
}
