import { Component, OnInit } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { AccountListItem } from "src/app/core/models/account";
import { CustomerListItem } from "src/app/core/models/customer";
import { AccountService } from "src/app/core/services/account.service";
import { CardService } from "src/app/core/services/card.service";
import { CustomerService } from "src/app/core/services/customer.service";



@Component({
  selector: 'app-card-issue',
  templateUrl: './card-issue.component.html',
  styleUrls: ['./card-issue.component.scss']
})
export class CardIssueComponent implements OnInit {
  issueForm!: FormGroup;
  loading = false;
  error: string | null = null;
  success: string | null = null;
  issuedCard: any = null;
  showPinModal = false;

  customers: CustomerListItem[] = [];
  accounts: AccountListItem[] = [];
  filteredAccounts: AccountListItem[] = [];

  cardTypes = [
    { value: 'DEBIT_CARD', label: 'Debit Card' },
    { value: 'CREDIT_CARD', label: 'Credit Card' },
    { value: 'PREPAID_CARD', label: 'Prepaid Card' }
  ];

  constructor(
    private fb: FormBuilder,
    private cardService: CardService,
    private customerService: CustomerService,
    private accountService: AccountService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCustomers();
  }

  initForm(): void {
    this.issueForm = this.fb.group({
      customerId: ['', Validators.required],
      accountId: ['', Validators.required],
      cardType: ['', Validators.required],
      creditLimit: [''],
      isInternational: [false, Validators.required],
      isOnlinePurchaseEnabled: [true, Validators.required],
      isContactless: [true, Validators.required]
    });

    // Watch for card type changes to handle credit limit
    this.issueForm.get('cardType')?.valueChanges.subscribe(cardType => {
      const creditLimitControl = this.issueForm.get('creditLimit');
      if (cardType === 'CREDIT_CARD') {
        creditLimitControl?.setValidators([Validators.required, Validators.min(100), Validators.max(1000000)]);
      } else {
        creditLimitControl?.clearValidators();
        creditLimitControl?.setValue(null);
      }
      creditLimitControl?.updateValueAndValidity();
    });

    // Watch for customer changes to filter accounts
    this.issueForm.get('customerId')?.valueChanges.subscribe(customerId => {
      this.filterAccountsByCustomer(customerId);
      this.issueForm.get('accountId')?.setValue('');
    });
  }

  loadCustomers(): void {
    this.loading = true;
    this.customerService.getAllCustomers().subscribe({
      next: (response) => {
        if (response.success) {
          this.customers = response.data.filter(c => c.status === 'active' && c.kycStatus === 'verified');
        }
        this.loadAccounts();
      },
      error: (err) => {
        this.error = 'Failed to load customers.';
        this.loading = false;
        console.error('Error loading customers:', err);
      }
    });
  }

  loadAccounts(): void {
    this.accountService.getAllAccounts().subscribe({
      next: (response) => {
        if (response.success) {
          this.accounts = response.data.filter(a => a.status === 'active' 
            // && a.kycStatus === 'verified'
          );
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load accounts.';
        this.loading = false;
        console.error('Error loading accounts:', err);
      }
    });
  }

  filterAccountsByCustomer(customerId: string): void {
    this.filteredAccounts = this.accounts.filter(a => a.customerId === customerId);
  }

  onSubmit(): void {
    if (this.issueForm.invalid) {
      Object.keys(this.issueForm.controls).forEach(key => {
        this.issueForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    const formValue = this.issueForm.value;
    const request = {
      customerId: formValue.customerId,
      accountId: parseInt(formValue.accountId),
      cardType: formValue.cardType,
      creditLimit: formValue.creditLimit || undefined,
      isInternational: formValue.isInternational,
      isOnlinePurchaseEnabled: formValue.isOnlinePurchaseEnabled,
      isContactless: formValue.isContactless
    };

    this.cardService.issueCard(request).subscribe({
      next: (response) => {
        if (response.success) {
          this.success = 'Card issued successfully!';
          this.issuedCard = response.data;
          
          // Show PIN modal if temporary PIN is provided
          if (this.issuedCard.temporaryPin) {
            this.showPinModal = true;
          } else {
            // If no PIN is provided, navigate after 2 seconds
            setTimeout(() => {
              this.router.navigate(['/cards/list']);
            }, 2000);
          }
        } else {
          this.error = response.message;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to issue card. Please try again.';
        this.loading = false;
        console.error('Error issuing card:', err);
      }
    });
  }

  closePinModal(): void {
    this.showPinModal = false;
    this.router.navigate(['/cards/list']);
  }

  printCardDetails(): void {
    window.print();
  }

  cancel(): void {
    this.router.navigate(['/cards/list']);
  }

  // Helper methods
  get f() {
    return this.issueForm.controls;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.issueForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getCustomerName(customerId: string): string {
    const customer = this.customers.find(c => c.customerId === customerId);
    return customer ? `${customer.firstName} ${customer.lastName}` : '';
  }

  getAccountDisplay(account: AccountListItem): string {
    return `${account.accountNumber} - ${account.accountType} (Balance: $${account.balance.toFixed(2)})`;
  }
}













// import { Component, OnInit } from '@angular/core';
// import { FormGroup, FormBuilder, Validators } from '@angular/forms';
// import { Router } from '@angular/router';
// import { AccountListItem } from 'src/app/core/models/account';
// import { CustomerListItem } from 'src/app/core/models/customer';
// import { AccountService } from 'src/app/core/services/account.service';
// import { CardService } from 'src/app/core/services/card.service';

// import { CustomerService } from 'src/app/core/services/customer.service';

// @Component({
//   selector: 'app-card-issue',
//   templateUrl: './card-issue.component.html',
//   styleUrls: ['./card-issue.component.scss']
// })
// export class CardIssueComponent implements OnInit {
//   issueForm!: FormGroup;
//   loading = false;
//   error: string | null = null;
//   success: string | null = null;

//   customers: CustomerListItem[] = [];
//   accounts: AccountListItem[] = [];
//   filteredAccounts: AccountListItem[] = [];

//   cardTypes = [
//     { value: 'DEBIT_CARD', label: 'Debit Card' },
//     { value: 'CREDIT_CARD', label: 'Credit Card' },
//     { value: 'PREPAID_CARD', label: 'Prepaid Card' }
//   ];

//   constructor(
//     private fb: FormBuilder,
//     private cardService: CardService,
//     private customerService: CustomerService,
//     private accountService: AccountService,
//     private router: Router
//   ) {}

//   ngOnInit(): void {
//     this.initForm();
//     this.loadCustomers();
//   }

//   initForm(): void {
//     this.issueForm = this.fb.group({
//       customerId: ['', Validators.required],
//       accountId: ['', Validators.required],
//       cardType: ['', Validators.required],
//       creditLimit: [''],
//       isInternational: [false, Validators.required],
//       isOnlinePurchaseEnabled: [true, Validators.required],
//       isContactless: [true, Validators.required]
//     });

//     // Watch for card type changes to handle credit limit
//     this.issueForm.get('cardType')?.valueChanges.subscribe(cardType => {
//       const creditLimitControl = this.issueForm.get('creditLimit');
//       if (cardType === 'CREDIT_CARD') {
//         creditLimitControl?.setValidators([Validators.required, Validators.min(100), Validators.max(1000000)]);
//       } else {
//         creditLimitControl?.clearValidators();
//         creditLimitControl?.setValue(null);
//       }
//       creditLimitControl?.updateValueAndValidity();
//     });

//     // Watch for customer changes to filter accounts
//     this.issueForm.get('customerId')?.valueChanges.subscribe(customerId => {
//       this.filterAccountsByCustomer(customerId);
//       this.issueForm.get('accountId')?.setValue('');
//     });
//   }

//   loadCustomers(): void {
//     this.loading = true;
//     this.customerService.getAllCustomers().subscribe({
//       next: (response) => {
//         if (response.success) {
//           this.customers = response.data.filter(c => c.status === 'active' && c.kycStatus === 'verified');
//         }
//         this.loadAccounts();
//       },
//       error: (err) => {
//         this.error = 'Failed to load customers.';
//         this.loading = false;
//         console.error('Error loading customers:', err);
//       }
//     });
//   }

//   loadAccounts(): void {
//     this.accountService.getAllAccounts().subscribe({
//       next: (response) => {
//         if (response.success) {
//           this.accounts = response.data.filter(a => a.status === 'active'
            
//             // && a.kycStatus === 'verified'

//           );
//         }
//         this.loading = false;
//       },
//       error: (err) => {
//         this.error = 'Failed to load accounts.';
//         this.loading = false;
//         console.error('Error loading accounts:', err);
//       }
//     });
//   }

//   filterAccountsByCustomer(customerId: string): void {
//     this.filteredAccounts = this.accounts.filter(a => a.customerId === customerId);
//   }

//   onSubmit(): void {
//     if (this.issueForm.invalid) {
//       Object.keys(this.issueForm.controls).forEach(key => {
//         this.issueForm.get(key)?.markAsTouched();
//       });
//       return;
//     }

//     this.loading = true;
//     this.error = null;
//     this.success = null;

//     const formValue = this.issueForm.value;
//     const request = {
//       customerId: formValue.customerId,
//       accountId: parseInt(formValue.accountId),
//       cardType: formValue.cardType,
//       creditLimit: formValue.creditLimit || undefined,
//       isInternational: formValue.isInternational,
//       isOnlinePurchaseEnabled: formValue.isOnlinePurchaseEnabled,
//       isContactless: formValue.isContactless
//     };

//     this.cardService.issueCard(request).subscribe({
//       next: (response) => {
//         if (response.success) {
//           this.success = 'Card issued successfully!';
//           setTimeout(() => {
//             this.router.navigate(['/cards/list']);
//           }, 2000);
//         } else {
//           this.error = response.message;
//         }
//         this.loading = false;
//       },
//       error: (err) => {
//         this.error = err.error?.message || 'Failed to issue card. Please try again.';
//         this.loading = false;
//         console.error('Error issuing card:', err);
//       }
//     });
//   }

//   cancel(): void {
//     this.router.navigate(['/cards/list']);
//   }

//   // Helper methods
//   get f() {
//     return this.issueForm.controls;
//   }

//   isFieldInvalid(fieldName: string): boolean {
//     const field = this.issueForm.get(fieldName);
//     return !!(field && field.invalid && field.touched);
//   }

//   getCustomerName(customerId: string): string {
//     const customer = this.customers.find(c => c.customerId === customerId);
//     return customer ? `${customer.firstName} ${customer.lastName}` : '';
//   }

//   getAccountDisplay(account: AccountListItem): string {
//     return `${account.accountNumber} - ${account.accountType} (Balance: $${account.balance.toFixed(2)})`;
//   }
// }
