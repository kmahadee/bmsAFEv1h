import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/api-response';
import { CardIssueRequest, Card, CardListItem, CardStatusUpdateRequest, CardPinUpdateRequest, CardLimitUpdateRequest } from '../models/card.model';


@Injectable({
  providedIn: 'root'
})
export class CardService {
  private endpoint = '/cards';

  constructor(private apiService: ApiService) { }

  /**
   * Issue a new card (Admin/Employee only)
   */
  issueCard(request: CardIssueRequest): Observable<ApiResponse<Card>> {
    return this.apiService.post<ApiResponse<Card>>(this.endpoint, request);
  }

  /**
   * Get all cards (Admin/Employee only)
   */
  getAllCards(): Observable<ApiResponse<CardListItem[]>> {
    return this.apiService.get<ApiResponse<CardListItem[]>>(this.endpoint);
  }

  /**
   * Get card by ID
   */
  getCardById(id: number): Observable<ApiResponse<Card>> {
    return this.apiService.get<ApiResponse<Card>>(`${this.endpoint}/${id}`);
  }

  /**
   * Get cards by customer ID
   */
  getCardsByCustomerId(customerId: string): Observable<ApiResponse<CardListItem[]>> {
    return this.apiService.get<ApiResponse<CardListItem[]>>(`${this.endpoint}/customer/${customerId}`);
  }

  /**
   * Get cards by account ID
   */
  getCardsByAccountId(accountId: number): Observable<ApiResponse<CardListItem[]>> {
    return this.apiService.get<ApiResponse<CardListItem[]>>(`${this.endpoint}/account/${accountId}`);
  }

  /**
   * Get cards by status (Admin/Employee only)
   */
  getCardsByStatus(status: string): Observable<ApiResponse<CardListItem[]>> {
    return this.apiService.get<ApiResponse<CardListItem[]>>(`${this.endpoint}/status/${status}`);
  }

  /**
   * Get cards expiring within 30 days (Admin/Employee only)
   */
  getCardsExpiringSoon(): Observable<ApiResponse<CardListItem[]>> {
    return this.apiService.get<ApiResponse<CardListItem[]>>(`${this.endpoint}/expiring-soon`);
  }

  /**
   * Update card status
   */
  updateCardStatus(id: number, request: CardStatusUpdateRequest): Observable<ApiResponse<Card>> {
    return this.apiService.put<ApiResponse<Card>>(`${this.endpoint}/${id}/status`, request);
  }

  /**
   * Update card PIN
   */
  updateCardPin(id: number, request: CardPinUpdateRequest): Observable<ApiResponse<Card>> {
    return this.apiService.patch<ApiResponse<Card>>(`${this.endpoint}/${id}/pin`, request);
  }

  /**
   * Update card credit limit (Admin/Employee only)
   */
  updateCardLimit(id: number, request: CardLimitUpdateRequest): Observable<ApiResponse<Card>> {
    return this.apiService.patch<ApiResponse<Card>>(`${this.endpoint}/${id}/limit`, request);
  }

  /**
   * Activate a card
   */
  activateCard(id: number): Observable<ApiResponse<Card>> {
    return this.apiService.patch<ApiResponse<Card>>(`${this.endpoint}/${id}/activate`);
  }

  /**
   * Block a card
   */
  blockCard(id: number, reason: string): Observable<ApiResponse<Card>> {
    return this.apiService.patch<ApiResponse<Card>>(
      `${this.endpoint}/${id}/block?reason=${encodeURIComponent(reason)}`
    );
  }

  /**
   * Unblock a card (Admin/Employee only)
   */
  unblockCard(id: number): Observable<ApiResponse<Card>> {
    return this.apiService.patch<ApiResponse<Card>>(`${this.endpoint}/${id}/unblock`);
  }

  /**
   * Cancel a card (Admin/Employee only)
   */
  cancelCard(id: number, reason: string): Observable<ApiResponse<void>> {
    return this.apiService.delete<ApiResponse<void>>(
      `${this.endpoint}/${id}?reason=${encodeURIComponent(reason)}`
    );
  }
}























// import { Injectable } from '@angular/core';

// import { Observable } from 'rxjs';
// import { ApiService } from './api.service';
// import { ApiResponse } from '../models/api-response';
// import { CardIssueRequest, Card, CardListItem, CardStatusUpdateRequest, CardPinUpdateRequest, CardLimitUpdateRequest } from '../models/card.model';


// @Injectable({
//   providedIn: 'root'
// })
// export class CardService {
//   private endpoint = '/cards';

//   constructor(private apiService: ApiService) { }

//   /**
//    * Issue a new card (Admin/Employee only)
//    */
//   issueCard(request: CardIssueRequest): Observable<ApiResponse<Card>> {
//     return this.apiService.post<ApiResponse<Card>>(this.endpoint, request);
//   }

//   /**
//    * Get all cards (Admin/Employee only)
//    */
//   getAllCards(): Observable<ApiResponse<CardListItem[]>> {
//     return this.apiService.get<ApiResponse<CardListItem[]>>(this.endpoint);
//   }

//   /**
//    * Get card by ID
//    */
//   getCardById(id: number): Observable<ApiResponse<Card>> {
//     return this.apiService.get<ApiResponse<Card>>(`${this.endpoint}/${id}`);
//   }

//   /**
//    * Get cards by customer ID
//    */
//   getCardsByCustomerId(customerId: string): Observable<ApiResponse<CardListItem[]>> {
//     return this.apiService.get<ApiResponse<CardListItem[]>>(`${this.endpoint}/customer/${customerId}`);
//   }

//   /**
//    * Get cards by account ID
//    */
//   getCardsByAccountId(accountId: number): Observable<ApiResponse<CardListItem[]>> {
//     return this.apiService.get<ApiResponse<CardListItem[]>>(`${this.endpoint}/account/${accountId}`);
//   }

//   /**
//    * Get cards by status (Admin/Employee only)
//    */
//   getCardsByStatus(status: string): Observable<ApiResponse<CardListItem[]>> {
//     return this.apiService.get<ApiResponse<CardListItem[]>>(`${this.endpoint}/status/${status}`);
//   }

//   /**
//    * Get cards expiring within 30 days (Admin/Employee only)
//    */
//   getCardsExpiringSoon(): Observable<ApiResponse<CardListItem[]>> {
//     return this.apiService.get<ApiResponse<CardListItem[]>>(`${this.endpoint}/expiring-soon`);
//   }

//   /**
//    * Update card status
//    */
//   updateCardStatus(id: number, request: CardStatusUpdateRequest): Observable<ApiResponse<Card>> {
//     return this.apiService.put<ApiResponse<Card>>(`${this.endpoint}/${id}/status`, request);
//   }

//   /**
//    * Update card PIN
//    */
//   updateCardPin(id: number, request: CardPinUpdateRequest): Observable<ApiResponse<Card>> {
//     return this.apiService.patch<ApiResponse<Card>>(`${this.endpoint}/${id}/pin`, request);
//   }

//   /**
//    * Update card credit limit (Admin/Employee only)
//    */
//   updateCardLimit(id: number, request: CardLimitUpdateRequest): Observable<ApiResponse<Card>> {
//     return this.apiService.patch<ApiResponse<Card>>(`${this.endpoint}/${id}/limit`, request);
//   }

//   /**
//    * Activate a card
//    */
//   activateCard(id: number): Observable<ApiResponse<Card>> {
//     return this.apiService.patch<ApiResponse<Card>>(`${this.endpoint}/${id}/activate`);
//   }

//   /**
//    * Block a card
//    */
//   blockCard(id: number, reason: string): Observable<ApiResponse<Card>> {
//     return this.apiService.patch<ApiResponse<Card>>(
//       `${this.endpoint}/${id}/block?reason=${encodeURIComponent(reason)}`
//     );
//   }

//   /**
//    * Unblock a card (Admin/Employee only)
//    */
//   unblockCard(id: number): Observable<ApiResponse<Card>> {
//     return this.apiService.patch<ApiResponse<Card>>(`${this.endpoint}/${id}/unblock`);
//   }

//   /**
//    * Cancel a card (Admin/Employee only)
//    */
//   cancelCard(id: number, reason: string): Observable<ApiResponse<void>> {
//     return this.apiService.delete<ApiResponse<void>>(
//       `${this.endpoint}/${id}?reason=${encodeURIComponent(reason)}`
//     );
//   }
// }


// @Injectable({
//   providedIn: 'root'
// })
// export class CardService {

//   constructor() { }
// }
