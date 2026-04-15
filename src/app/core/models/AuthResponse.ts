export interface AuthResponse {
  token: string;
  username: string;
  email: string;
  role: string;
  customerId?: string;
  firstName?: string;
  lastName?: string;
  id?:number;
}