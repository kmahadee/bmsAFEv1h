import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TransactionService } from 'src/app/core/services/transaction.service';
import { AccountService } from 'src/app/core/services/account.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { DepositRequest } from 'src/app/core/models/transaction';

@Component({
  selector: 'app-deposit',
  templateUrl: './deposit.component.html',
  styleUrls: ['./deposit.component.scss']
})
export class DepositComponent implements OnInit {
  depositForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  success = '';
  myAccounts: any[] = [];

  depositModes = ['CASH', 'CHEQUE', 'CARD'];

  constructor(
    private formBuilder: FormBuilder,
    private transactionService: TransactionService,
    private accountService: AccountService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.depositForm = this.formBuilder.group({
      accountNumber: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      depositMode: ['CASH', Validators.required],
      description: [''],
      remarks: [''],
      chequeNumber: [''],
      bankName: ['']
    });

    this.loadMyAccounts();

    // Show/hide cheque fields based on deposit mode
    this.depositForm.get('depositMode')?.valueChanges.subscribe(mode => {
      if (mode === 'CHEQUE') {
        this.depositForm.get('chequeNumber')?.setValidators(Validators.required);
        this.depositForm.get('bankName')?.setValidators(Validators.required);
      } else {
        this.depositForm.get('chequeNumber')?.clearValidators();
        this.depositForm.get('bankName')?.clearValidators();
      }
      this.depositForm.get('chequeNumber')?.updateValueAndValidity();
      this.depositForm.get('bankName')?.updateValueAndValidity();
    });
  }

  get f() {
    return this.depositForm.controls;
  }

  loadMyAccounts(): void {
    // Get customer ID directly from auth service
    const custId = this.authService.getCustomerId();

    if (custId) {
      this.accountService.getAccountsByCustomerId(custId).subscribe({
        next: (accountResponse) => {
          this.myAccounts = accountResponse.data.filter(acc => acc.status === 'active');
          if (this.myAccounts.length > 0) {
            this.depositForm.patchValue({ accountNumber: this.myAccounts[0].accountNumber });
          }
        },
        error: (error) => {
          console.error('Error loading accounts', error);
          this.error = 'Failed to load your accounts. Please try again.';
        }
      });
    } else {
      console.error('No customer ID found in session. Ensure you are logged in as a Customer.');
      this.error = 'Customer information not found. Please log in again.';
    }
  }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';
    this.success = '';

    if (this.depositForm.invalid) {
      return;
    }

    this.loading = true;
    const depositData: DepositRequest = this.depositForm.value;

    this.transactionService.depositMoney(depositData).subscribe({
      next: (response) => {
        this.success = 'Deposit successful! Transaction ID: ' + response.data.transactionId;
        this.depositForm.reset({ depositMode: 'CASH' });
        this.submitted = false;
        this.loading = false;
        
        setTimeout(() => {
          // this.router.navigate(['/transaction/history']);
          this.router.navigate(['/account/list']);
        }, 2000);
      },
      error: (error) => {
        this.error = error.error?.message || 'Deposit failed. Please try again.';
        this.loading = false;
      }
    });
  }
}







// import { Component, OnInit } from '@angular/core';
// import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { Router } from '@angular/router';
// import { TransactionService } from 'src/app/core/services/transaction.service';
// import { AccountService } from 'src/app/core/services/account.service';
// import { AuthService } from 'src/app/core/services/auth.service';
// import { CustomerService } from 'src/app/core/services/customer.service';
// import { DepositRequest } from 'src/app/core/models/transaction';

// @Component({
//   selector: 'app-deposit',
//   templateUrl: './deposit.component.html',
//   styleUrls: ['./deposit.component.scss']
// })
// export class DepositComponent implements OnInit {
//   depositForm!: FormGroup;
//   loading = false;
//   submitted = false;
//   error = '';
//   success = '';
//   myAccounts: any[] = [];

//   depositModes = ['CASH', 'CHEQUE', 'CARD'];

//   constructor(
//     private formBuilder: FormBuilder,
//     private transactionService: TransactionService,
//     private accountService: AccountService,
//     private authService: AuthService,
//     private customerService: CustomerService,
//     private router: Router
//   ) { }

//   ngOnInit(): void {
//     this.depositForm = this.formBuilder.group({
//       accountNumber: ['', Validators.required],
//       amount: ['', [Validators.required, Validators.min(0.01)]],
//       depositMode: ['CASH', Validators.required],
//       description: [''],
//       remarks: [''],
//       chequeNumber: [''],
//       bankName: ['']
//     });

//     this.loadMyAccounts();

//     // Show/hide cheque fields based on deposit mode
//     this.depositForm.get('depositMode')?.valueChanges.subscribe(mode => {
//       if (mode === 'CHEQUE') {
//         this.depositForm.get('chequeNumber')?.setValidators(Validators.required);
//         this.depositForm.get('bankName')?.setValidators(Validators.required);
//       } else {
//         this.depositForm.get('chequeNumber')?.clearValidators();
//         this.depositForm.get('bankName')?.clearValidators();
//       }
//       this.depositForm.get('chequeNumber')?.updateValueAndValidity();
//       this.depositForm.get('bankName')?.updateValueAndValidity();
//     });
//   }

//   get f() {
//     return this.depositForm.controls;
//   }

//   loadMyAccounts(): void {
//     const user = this.authService.currentUserValue;
//     if (user?.id) {
//       this.customerService.getCustomerById(user.id).subscribe({
//         next: (response) => {
//           const customerId = response.data.customerId;
//           this.accountService.getAccountsByCustomerId(customerId).subscribe({
//             next: (accountResponse) => {
//               this.myAccounts = accountResponse.data.filter(acc => acc.status === 'active');
//               if (this.myAccounts.length > 0) {
//                 this.depositForm.patchValue({ accountNumber: this.myAccounts[0].accountNumber });
//               }
//             },
//             error: (error) => console.error('Error loading accounts', error)
//           });
//         },
//         error: (error) => console.error('Error loading customer', error)
//       });
//     }
//   }

//   onSubmit(): void {
//     this.submitted = true;
//     this.error = '';
//     this.success = '';

//     if (this.depositForm.invalid) {
//       return;
//     }

//     this.loading = true;
//     const depositData: DepositRequest = this.depositForm.value;

//     this.transactionService.depositMoney(depositData).subscribe({
//       next: (response) => {
//         this.success = 'Deposit successful! Transaction ID: ' + response.data.transactionId;
//         this.depositForm.reset({ depositMode: 'CASH' });
//         this.submitted = false;
//         this.loading = false;
        
//         setTimeout(() => {
//           this.router.navigate(['/transaction/history']);
//         }, 2000);
//       },
//       error: (error) => {
//         this.error = error.error?.message || 'Deposit failed. Please try again.';
//         this.loading = false;
//       }
//     });
//   }
// }

