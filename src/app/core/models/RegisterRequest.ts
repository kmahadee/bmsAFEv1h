export interface RegisterResponse {
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
  status: string;
  kycStatus: string;
  image: string;
  createdDate: string;
  lastUpdated: string;
  username: string;
  isActive: boolean;
  totalAccounts: number;
  totalLoans: number;
  totalCards: number;
}

export interface RegisterRequest {
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