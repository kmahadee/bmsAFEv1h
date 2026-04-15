import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  BankStatistics,
  Branch,
  BranchCreateRequest,
  BranchStatistics,
  BranchUpdateRequest
} from '../models/branch';
import { ApiResponse } from '../models/api-response';


@Injectable({
  providedIn: 'root'
})
export class BranchService {

private endpoint = '/branches';

  constructor(private apiService: ApiService) { }

  createBranch(data: BranchCreateRequest): Observable<ApiResponse<Branch>> {
    return this.apiService.post<ApiResponse<Branch>>(this.endpoint, data);
  }

  getAllBranches(): Observable<ApiResponse<Branch[]>> {
    return this.apiService.get<ApiResponse<Branch[]>>(this.endpoint);
  }

  getBranchById(id: number): Observable<ApiResponse<Branch>> {
    return this.apiService.get<ApiResponse<Branch>>(`${this.endpoint}/${id}`);
  }

  getBranchByCode(branchCode: string): Observable<ApiResponse<Branch>> {
    return this.apiService.get<ApiResponse<Branch>>(`${this.endpoint}/code/${branchCode}`);
  }

  getBranchByIfsc(ifscCode: string): Observable<ApiResponse<Branch>> {
    return this.apiService.get<ApiResponse<Branch>>(`${this.endpoint}/ifsc/${ifscCode}`);
  }

  getBranchesByCity(city: string): Observable<ApiResponse<Branch[]>> {
    return this.apiService.get<ApiResponse<Branch[]>>(`${this.endpoint}/city/${city}`);
  }

  getBranchesByStatus(status: string): Observable<ApiResponse<Branch[]>> {
    return this.apiService.get<ApiResponse<Branch[]>>(`${this.endpoint}/status/${status}`);
  }

  updateBranch(id: number, data: BranchUpdateRequest): Observable<ApiResponse<Branch>> {
    return this.apiService.put<ApiResponse<Branch>>(`${this.endpoint}/${id}`, data);
  }

  deleteBranch(id: number): Observable<ApiResponse<void>> {
    return this.apiService.delete<ApiResponse<void>>(`${this.endpoint}/${id}`);
  }



  
  /**
   * Get statistics for a specific branch
   * @param id - Branch ID
   * @returns Observable with branch statistics
   */
  getBranchStatistics(id: number): Observable<ApiResponse<BranchStatistics>> {
    return this.apiService.get<ApiResponse<BranchStatistics>>(`${this.endpoint}/${id}/statistics`);
  }

  /**
   * Get overall bank statistics across all branches
   * @returns Observable with bank-wide statistics
   */
  getBankStatistics(): Observable<ApiResponse<BankStatistics>> {
    return this.apiService.get<ApiResponse<BankStatistics>>(`${this.endpoint}/statistics/bank`);
  }

}
