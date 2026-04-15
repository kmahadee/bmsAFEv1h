import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

import { ApiResponse } from '../models/api-response';
import { Customer, CustomerCreateRequest, CustomerListItem, CustomerUpdateRequest } from '../models/customer';


@Injectable({
  providedIn: 'root'
})
export class CustomerService {
private endpoint = '/customers';

  constructor(private apiService: ApiService) { }

  createCustomer(data: CustomerCreateRequest): Observable<ApiResponse<Customer>> {
    return this.apiService.post<ApiResponse<Customer>>(this.endpoint, data);
  }

  getAllCustomers(): Observable<ApiResponse<CustomerListItem[]>> {
    return this.apiService.get<ApiResponse<CustomerListItem[]>>(this.endpoint);
  }

  getCustomerById(id: number): Observable<ApiResponse<Customer>> {
    return this.apiService.get<ApiResponse<Customer>>(`${this.endpoint}/${id}`);
  }

  getCustomerByCustomerId(customerId: string): Observable<ApiResponse<Customer>> {
    return this.apiService.get<ApiResponse<Customer>>(`${this.endpoint}/customer-id/${customerId}`);
  }

  getCustomersByStatus(status: string): Observable<ApiResponse<CustomerListItem[]>> {
    return this.apiService.get<ApiResponse<CustomerListItem[]>>(`${this.endpoint}/status/${status}`);
  }

  getCustomersByKycStatus(kycStatus: string): Observable<ApiResponse<CustomerListItem[]>> {
    return this.apiService.get<ApiResponse<CustomerListItem[]>>(`${this.endpoint}/kyc-status/${kycStatus}`);
  }

  searchCustomers(searchTerm: string): Observable<ApiResponse<CustomerListItem[]>> {
    return this.apiService.get<ApiResponse<CustomerListItem[]>>(`${this.endpoint}/search`, { q: searchTerm });
  }

  updateCustomer(id: number, data: CustomerUpdateRequest): Observable<ApiResponse<Customer>> {
    return this.apiService.put<ApiResponse<Customer>>(`${this.endpoint}/${id}`, data);
  }

  updateKycStatus(customerId: string, status: string): Observable<ApiResponse<Customer>> {
    return this.apiService.patch<ApiResponse<Customer>>(`${this.endpoint}/${customerId}/kyc-status?status=${status}`);
  }

  deleteCustomer(id: number): Observable<ApiResponse<void>> {
    return this.apiService.delete<ApiResponse<void>>(`${this.endpoint}/${id}`);
  }

  hardDeleteCustomer(id: number): Observable<ApiResponse<void>> {
    return this.apiService.delete<ApiResponse<void>>(`${this.endpoint}/${id}/permanent`);
  }

}
