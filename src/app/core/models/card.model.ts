
export interface Card {
  id: number;
  maskedCardNumber: string;
  cardHolderName: string;
  cardType: CardType;
  expiryDate: string;
  status: CardStatus;
  customerId: string;
  customerName: string;
  accountId: number;
  accountNumber: string;
  creditLimit?: number;
  availableLimit?: number;
  outstandingBalance?: number;
  isInternational: boolean;
  isOnlinePurchaseEnabled: boolean;
  isContactless: boolean;
  issueDate: string;
  activationDate?: string;
  blockDate?: string;
  blockReason?: string;
  createdDate: string;
  lastModified: string;
}

export interface CardListItem {
  id: number;
  maskedCardNumber: string;
  cardHolderName: string;
  cardType: string;
  status: string;
  expiryDate: string;
  creditLimit?: number;
  availableLimit?: number;
  customerId: string;
  accountNumber: string;
  isInternational: boolean;
}

export interface CardIssueRequest {
  customerId: string;
  accountId: number;
  cardType: string;
  creditLimit?: number;
  isInternational: boolean;
  isOnlinePurchaseEnabled: boolean;
  isContactless: boolean;
}

export interface CardStatusUpdateRequest {
  status: string;
  reason?: string;
}

export interface CardPinUpdateRequest {
  oldPin: string;
  newPin: string;
}

export interface CardLimitUpdateRequest {
  creditLimit: number;
}

export enum CardType {
  DEBIT_CARD = 'debit_card',
  CREDIT_CARD = 'credit_card',
  PREPAID_CARD = 'prepaid_card'
}

export enum CardStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

// Helper function to format card type for display
export function formatCardType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Helper function to get card type badge class
export function getCardTypeBadgeClass(type: string): string {
  const typeUpper = type.toUpperCase();
  switch (typeUpper) {
    case 'DEBIT_CARD':
      return 'bg-primary';
    case 'CREDIT_CARD':
      return 'bg-success';
    case 'PREPAID_CARD':
      return 'bg-info';
    default:
      return 'bg-secondary';
  }
}

// Helper function to get status badge class
export function getCardStatusBadgeClass(status: string): string {
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case 'active':
      return 'bg-success';
    case 'inactive':
      return 'bg-warning';
    case 'blocked':
      return 'bg-danger';
    case 'expired':
      return 'bg-secondary';
    case 'cancelled':
      return 'bg-dark';
    default:
      return 'bg-secondary';
  }
}
