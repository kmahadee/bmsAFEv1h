import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/api-response';
import { LoanApplicationRequest, LoanRepaymentRequest, LoanForeclosureRequest, LoanSearchRequest, LoanApprovalRequest, LoanDisbursementRequest } from '../../models/loanModels/loan-request.model';
import { LoanResponse, LoanListItem, LoanSearchResponse } from '../../models/loanModels/loan-response.model';
import { LoanStatementResponse } from '../../models/loanModels/loan-statement.model';
import { Transaction } from '../../models/transaction';
import { ApiService } from '../api.service';

@Injectable({
  providedIn: 'root'
})
export class LoanService {
  private endpoint = '/loans';

  constructor(private apiService: ApiService) { }

  // ============================================
  // CUSTOMER ENDPOINTS
  // ============================================

  /**
   * Apply for a new loan
   */
  applyForLoan(data: LoanApplicationRequest): Observable<ApiResponse<LoanResponse>> {
    return this.apiService.post<ApiResponse<LoanResponse>>(`${this.endpoint}/apply`, data);
  }

  /**
   * Get all loans for the authenticated customer
   * Note: Token is automatically added by AuthInterceptor
   */
  getMyLoans(): Observable<ApiResponse<LoanListItem[]>> {
    return this.apiService.get<ApiResponse<LoanListItem[]>>(`${this.endpoint}/my-loans`);
  }

  /**
   * Get loan details by ID
   * Note: Token is automatically added by AuthInterceptor
   */
  getLoanById(loanId: string): Observable<ApiResponse<LoanResponse>> {
    return this.apiService.get<ApiResponse<LoanResponse>>(`${this.endpoint}/${loanId}`);
  }

  /**
   * Get loan statement with repayment schedule
   * Note: Token is automatically added by AuthInterceptor
   */
  getLoanStatement(loanId: string): Observable<ApiResponse<LoanStatementResponse>> {
    return this.apiService.get<ApiResponse<LoanStatementResponse>>(`${this.endpoint}/${loanId}/statement`);
  }

  /**
   * Make loan repayment (EMI payment)
   * Note: Token is automatically added by AuthInterceptor
   */
  repayLoan(loanId: string, data: LoanRepaymentRequest): Observable<ApiResponse<Transaction>> {
    return this.apiService.post<ApiResponse<Transaction>>(`${this.endpoint}/${loanId}/repay`, data);
  }

  /**
   * Foreclose loan (early closure)
   * Note: Token is automatically added by AuthInterceptor
   */
  foreCloseLoan(loanId: string, data: LoanForeclosureRequest): Observable<ApiResponse<LoanResponse>> {
    return this.apiService.post<ApiResponse<LoanResponse>>(`${this.endpoint}/${loanId}/foreclose`, data);
  }

  // ============================================
  // EMPLOYEE/ADMIN ENDPOINTS
  // ============================================

  /**
 * Get all loans with pagination (Admin/Employee only)
 */
  getAllLoans(pageNumber: number = 1, pageSize: number = 10): Observable<ApiResponse<LoanSearchResponse>> {
    const params = {
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString()
    };
    return this.apiService.get<ApiResponse<LoanSearchResponse>>(`${this.endpoint}`, params);
  }

  /**
   * Get all loans by customer ID
   */
  getLoansByCustomerId(customerId: string): Observable<ApiResponse<LoanListItem[]>> {
    return this.apiService.get<ApiResponse<LoanListItem[]>>(`${this.endpoint}/customer/${customerId}`);
  }

  /**
   * Get all pending approval loans
   */
  getPendingApprovalLoans(): Observable<ApiResponse<LoanListItem[]>> {
    return this.apiService.get<ApiResponse<LoanListItem[]>>(`${this.endpoint}/pending-approval`);
  }

  /**
   * Search loans with filters and pagination
   */
  searchLoans(data: LoanSearchRequest): Observable<ApiResponse<LoanSearchResponse>> {
    return this.apiService.post<ApiResponse<LoanSearchResponse>>(`${this.endpoint}/search`, data);
  }

  /**
   * Approve a loan
   */
  approveLoan(loanId: string, data: LoanApprovalRequest): Observable<ApiResponse<LoanResponse>> {
    return this.apiService.post<ApiResponse<LoanResponse>>(`${this.endpoint}/${loanId}/approve`, data);
  }

  /**
   * Reject a loan
   */
  rejectLoan(loanId: string, data: LoanApprovalRequest): Observable<ApiResponse<LoanResponse>> {
    return this.apiService.post<ApiResponse<LoanResponse>>(`${this.endpoint}/${loanId}/reject`, data);
  }

  /**
   * Disburse a loan
   */
  disburseLoan(loanId: string, data: LoanDisbursementRequest): Observable<ApiResponse<LoanResponse>> {
    return this.apiService.post<ApiResponse<LoanResponse>>(`${this.endpoint}/${loanId}/disburse`, data);
  }

  /**
   * Mark defaulted loans (manual trigger)
   */
  markDefaults(): Observable<ApiResponse<void>> {
    return this.apiService.post<ApiResponse<void>>(`${this.endpoint}/mark-defaults`, {});
  }

  /**
   * Health check
   */
  healthCheck(): Observable<ApiResponse<string>> {
    return this.apiService.get<ApiResponse<string>>(`${this.endpoint}/health`);
  }
}







// export class LoanService {
//   private endpoint = '/loans';

//   constructor(private apiService: ApiService) { }

//   // ============================================
//   // CUSTOMER ENDPOINTS
//   // ============================================

//   /**
//    * Apply for a new loan
//    */
//   applyForLoan(data: LoanApplicationRequest): Observable<ApiResponse<LoanResponse>> {
//     return this.apiService.post<ApiResponse<LoanResponse>>(`${this.endpoint}/apply`, data);
//   }

//   /**
//    * Get all loans for the authenticated customer
//    * Note: Token is automatically added by AuthInterceptor
//    */
//   getMyLoans(): Observable<ApiResponse<LoanListItem[]>> {
//     return this.apiService.get<ApiResponse<LoanListItem[]>>(`${this.endpoint}/my-loans`);
//   }

//   /**
//    * Get loan details by ID
//    * Note: Token is automatically added by AuthInterceptor
//    */
//   getLoanById(loanId: string): Observable<ApiResponse<LoanResponse>> {
//     return this.apiService.get<ApiResponse<LoanResponse>>(`${this.endpoint}/${loanId}`);
//   }

//   /**
//    * Get loan statement with repayment schedule
//    * Note: Token is automatically added by AuthInterceptor
//    */
//   getLoanStatement(loanId: string): Observable<ApiResponse<LoanStatementResponse>> {
//     return this.apiService.get<ApiResponse<LoanStatementResponse>>(`${this.endpoint}/${loanId}/statement`);
//   }

//   /**
//    * Make loan repayment (EMI payment)
//    * Note: Token is automatically added by AuthInterceptor
//    */
//   repayLoan(loanId: string, data: LoanRepaymentRequest): Observable<ApiResponse<Transaction>> {
//     return this.apiService.post<ApiResponse<Transaction>>(`${this.endpoint}/${loanId}/repay`, data);
//   }

//   /**
//    * Foreclose loan (early closure)
//    * Note: Token is automatically added by AuthInterceptor
//    */
//   foreCloseLoan(loanId: string, data: LoanForeclosureRequest): Observable<ApiResponse<LoanResponse>> {
//     return this.apiService.post<ApiResponse<LoanResponse>>(`${this.endpoint}/${loanId}/foreclose`, data);
//   }

//   // ============================================
//   // EMPLOYEE/ADMIN ENDPOINTS
//   // ============================================

//   /**
//    * Get all loans by customer ID
//    */
//   getLoansByCustomerId(customerId: string): Observable<ApiResponse<LoanListItem[]>> {
//     return this.apiService.get<ApiResponse<LoanListItem[]>>(`${this.endpoint}/customer/${customerId}`);
//   }

//   /**
//    * Get all pending approval loans
//    */
//   getPendingApprovalLoans(): Observable<ApiResponse<LoanListItem[]>> {
//     return this.apiService.get<ApiResponse<LoanListItem[]>>(`${this.endpoint}/pending-approval`);
//   }

//   /**
//    * Search loans with filters and pagination
//    */
//   searchLoans(data: LoanSearchRequest): Observable<ApiResponse<LoanSearchResponse>> {
//     return this.apiService.post<ApiResponse<LoanSearchResponse>>(`${this.endpoint}/search`, data);
//   }

//   /**
//    * Approve a loan
//    */
//   approveLoan(loanId: string, data: LoanApprovalRequest): Observable<ApiResponse<LoanResponse>> {
//     return this.apiService.post<ApiResponse<LoanResponse>>(`${this.endpoint}/${loanId}/approve`, data);
//   }

//   /**
//    * Reject a loan
//    */
//   rejectLoan(loanId: string, data: LoanApprovalRequest): Observable<ApiResponse<LoanResponse>> {
//     return this.apiService.post<ApiResponse<LoanResponse>>(`${this.endpoint}/${loanId}/reject`, data);
//   }

//   /**
//    * Disburse a loan
//    */
//   disburseLoan(loanId: string, data: LoanDisbursementRequest): Observable<ApiResponse<LoanResponse>> {
//     return this.apiService.post<ApiResponse<LoanResponse>>(`${this.endpoint}/${loanId}/disburse`, data);
//   }

//   /**
//    * Mark defaulted loans (manual trigger)
//    */
//   markDefaults(): Observable<ApiResponse<void>> {
//     return this.apiService.post<ApiResponse<void>>(`${this.endpoint}/mark-defaults`, {});
//   }

//   /**
//    * Health check
//    */
//   healthCheck(): Observable<ApiResponse<string>> {
//     return this.apiService.get<ApiResponse<string>>(`${this.endpoint}/health`);
//   }
// }