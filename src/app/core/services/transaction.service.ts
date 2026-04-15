import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Transaction,
  TransferRequest,
  DepositRequest,
  WithdrawRequest
} from '../models/transaction';
import { ApiResponse } from '../models/api-response';
import { AccountBalance } from '../models/account';


@Injectable({
  providedIn: 'root'
})
export class TransactionService {

private endpoint = '/transactions';

  constructor(private apiService: ApiService) { }

  transferFunds(data: TransferRequest): Observable<ApiResponse<Transaction>> {
    return this.apiService.post<ApiResponse<Transaction>>(`${this.endpoint}/transfer`, data);
  }

  depositMoney(data: DepositRequest): Observable<ApiResponse<Transaction>> {
    return this.apiService.post<ApiResponse<Transaction>>(`${this.endpoint}/deposit`, data);
  }

  withdrawMoney(data: WithdrawRequest): Observable<ApiResponse<Transaction>> {
    return this.apiService.post<ApiResponse<Transaction>>(`${this.endpoint}/withdraw`, data);
  }

  getAccountBalance(accountNumber: string): Observable<ApiResponse<AccountBalance>> {
    return this.apiService.get<ApiResponse<AccountBalance>>(`${this.endpoint}/balance/${accountNumber}`);
  }

  healthCheck(): Observable<ApiResponse<string>> {
    return this.apiService.get<ApiResponse<string>>(`${this.endpoint}/health`);
  }
}
