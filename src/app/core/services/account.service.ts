import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Account,
  AccountListItem,
  AccountCreateRequest,
  AccountUpdateRequest,
  AccountBalance,
  AccountStatement,
  AccountStatementRequest
} from '../models/account';
import { ApiResponse } from '../models/api-response';


@Injectable({
  providedIn: 'root'
})
export class AccountService {

private endpoint = '/accounts';

  constructor(private apiService: ApiService) { }

  createAccount(data: AccountCreateRequest): Observable<ApiResponse<Account>> {
    return this.apiService.post<ApiResponse<Account>>(this.endpoint, data);
  }

  getAllAccounts(): Observable<ApiResponse<AccountListItem[]>> {
    return this.apiService.get<ApiResponse<AccountListItem[]>>(this.endpoint);
  }

  getAccountById(id: number): Observable<ApiResponse<Account>> {
    return this.apiService.get<ApiResponse<Account>>(`${this.endpoint}/${id}`);
  }

  getAccountByAccountNumber(accountNumber: string): Observable<ApiResponse<Account>> {
    return this.apiService.get<ApiResponse<Account>>(`${this.endpoint}/account-number/${accountNumber}`);
  }

  getAccountsByCustomerId(customerId: string): Observable<ApiResponse<AccountListItem[]>> {
    return this.apiService.get<ApiResponse<AccountListItem[]>>(`${this.endpoint}/customer/${customerId}`);
  }

  getAccountsByStatus(status: string): Observable<ApiResponse<AccountListItem[]>> {
    return this.apiService.get<ApiResponse<AccountListItem[]>>(`${this.endpoint}/status/${status}`);
  }

  updateAccount(id: number, data: AccountUpdateRequest): Observable<ApiResponse<Account>> {
    return this.apiService.put<ApiResponse<Account>>(`${this.endpoint}/${id}`, data);
  }

  freezeAccount(accountNumber: string): Observable<ApiResponse<Account>> {
    return this.apiService.patch<ApiResponse<Account>>(`${this.endpoint}/${accountNumber}/freeze`);
  }

  unfreezeAccount(accountNumber: string): Observable<ApiResponse<Account>> {
    return this.apiService.patch<ApiResponse<Account>>(`${this.endpoint}/${accountNumber}/unfreeze`);
  }

  deleteAccount(id: number): Observable<ApiResponse<void>> {
    return this.apiService.delete<ApiResponse<void>>(`${this.endpoint}/${id}`);
  }

  getAccountStatement(data: AccountStatementRequest): Observable<ApiResponse<AccountStatement>> {
    return this.apiService.post<ApiResponse<AccountStatement>>(`${this.endpoint}/statement`, data);
  }

}
