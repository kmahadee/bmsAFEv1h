  export interface Customer {
    id: number;
    customerId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    status: CustomerStatus;
    kycStatus: KycStatus;
    image?: string;
    createdDate: string;
    lastUpdated: string;
    username: string;
    isActive: boolean;
    totalAccounts: number;
    totalLoans: number;
    totalCards: number;
  }

  export interface CustomerListItem {
    id: number;
    customerId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    status: string;
    kycStatus: string;
    image?: string;
    createdDate: string;
  }

  export interface CustomerCreateRequest {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    image?: string;
    username: string;
    password: string;
  }

  export interface CustomerUpdateRequest {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    image?: string;
    status?: string;
    kycStatus?: string;
  }

  export enum CustomerStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended'
  }

  export enum KycStatus {
    PENDING = 'pending',
    VERIFIED = 'verified',
    REJECTED = 'rejected'
  }