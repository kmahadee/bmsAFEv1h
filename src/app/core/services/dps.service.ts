import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  DPS,
  DPSCreateRequest,
  DPSUpdateRequest,
  DPSPaymentRequest,
  DPSStatement,
  DPSMaturityCalculation
} from '../models/dps';
import { Transaction } from '../models/transaction';
import { ApiResponse } from '../models/api-response';


@Injectable({
  providedIn: 'root'
})
export class DpsService {

private endpoint = '/dps';

  constructor(private apiService: ApiService) { }

  createDPS(data: DPSCreateRequest): Observable<ApiResponse<DPS>> {
    return this.apiService.post<ApiResponse<DPS>>(this.endpoint, data);
  }

  getAllDPS(): Observable<ApiResponse<DPS[]>> {
    return this.apiService.get<ApiResponse<DPS[]>>(this.endpoint);
  }

  getDPSById(id: number): Observable<ApiResponse<DPS>> {
    return this.apiService.get<ApiResponse<DPS>>(`${this.endpoint}/${id}`);
  }

  getDPSByNumber(dpsNumber: string): Observable<ApiResponse<DPS>> {
    return this.apiService.get<ApiResponse<DPS>>(`${this.endpoint}/number/${dpsNumber}`);
  }

  getDPSByCustomerId(customerId: string): Observable<ApiResponse<DPS[]>> {
    return this.apiService.get<ApiResponse<DPS[]>>(`${this.endpoint}/customer/${customerId}`);
  }

  getDPSByBranch(branchId: number): Observable<ApiResponse<DPS[]>> {
    return this.apiService.get<ApiResponse<DPS[]>>(`${this.endpoint}/branch/${branchId}`);
  }

  getDPSByStatus(status: string): Observable<ApiResponse<DPS[]>> {
    return this.apiService.get<ApiResponse<DPS[]>>(`${this.endpoint}/status/${status}`);
  }

  payInstallment(data: DPSPaymentRequest): Observable<ApiResponse<Transaction>> {
    return this.apiService.post<ApiResponse<Transaction>>(`${this.endpoint}/pay-installment`, data);
  }

  getDPSStatement(dpsNumber: string): Observable<ApiResponse<DPSStatement>> {
    return this.apiService.get<ApiResponse<DPSStatement>>(`${this.endpoint}/statement/${dpsNumber}`);
  }

  updateDPS(id: number, data: DPSUpdateRequest): Observable<ApiResponse<DPS>> {
    return this.apiService.put<ApiResponse<DPS>>(`${this.endpoint}/${id}`, data);
  }

  closeDPS(dpsNumber: string, reason?: string): Observable<ApiResponse<DPS>> {
    const params = reason ? { reason } : undefined;
    return this.apiService.patch<ApiResponse<DPS>>(`${this.endpoint}/${dpsNumber}/close`, null);
  }

  matureDPS(dpsNumber: string): Observable<ApiResponse<DPS>> {
    return this.apiService.patch<ApiResponse<DPS>>(`${this.endpoint}/${dpsNumber}/mature`);
  }

  calculateMaturity(
    monthlyInstallment: number,
    tenureMonths: number,
    interestRate: number
  ): Observable<ApiResponse<DPSMaturityCalculation>> {
    return this.apiService.get<ApiResponse<DPSMaturityCalculation>>(
      `${this.endpoint}/calculate-maturity`,
      { monthlyInstallment, tenureMonths, interestRate }
    );
  }

}
