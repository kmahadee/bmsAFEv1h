import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TransactionService } from 'src/app/core/services/transaction.service';
import { AccountService } from 'src/app/core/services/account.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { WithdrawRequest } from 'src/app/core/models/transaction';


@Component({
  selector: 'app-withdraw',
  templateUrl: './withdraw.component.html',
  styleUrls: ['./withdraw.component.scss']
})
export class WithdrawComponent implements OnInit {
  withdrawForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  success = '';
  myAccounts: any[] = [];
  selectedAccountBalance = 0;

  withdrawalModes = ['CASH', 'CHEQUE', 'CARD', 'ATM'];

  constructor(
    private formBuilder: FormBuilder,
    private transactionService: TransactionService,
    private accountService: AccountService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.withdrawForm = this.formBuilder.group({
      accountNumber: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      withdrawalMode: ['CASH', Validators.required],
      description: [''],
      remarks: ['']
    });

    this.loadMyAccounts();

    // Update balance when account is selected
    this.withdrawForm.get('accountNumber')?.valueChanges.subscribe(accountNumber => {
      this.updateSelectedAccountBalance(accountNumber);
    });
  }

  get f() {
    return this.withdrawForm.controls;
  }

  loadMyAccounts(): void {
    // Get customer ID directly from auth service
    const custId = this.authService.getCustomerId();

    if (custId) {
      this.accountService.getAccountsByCustomerId(custId).subscribe({
        next: (accountResponse) => {
          this.myAccounts = accountResponse.data.filter(acc => acc.status === 'active');
          if (this.myAccounts.length > 0) {
            this.withdrawForm.patchValue({ accountNumber: this.myAccounts[0].accountNumber });
            this.updateSelectedAccountBalance(this.myAccounts[0].accountNumber);
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

  updateSelectedAccountBalance(accountNumber: string): void {
    const account = this.myAccounts.find(acc => acc.accountNumber === accountNumber);
    this.selectedAccountBalance = account ? account.balance : 0;
  }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';
    this.success = '';

    if (this.withdrawForm.invalid) {
      return;
    }

    // Validate sufficient balance
    if (this.withdrawForm.value.amount > this.selectedAccountBalance) {
      this.error = 'Insufficient balance. Available: ' + this.selectedAccountBalance;
      return;
    }

    this.loading = true;
    const withdrawData: WithdrawRequest = this.withdrawForm.value;

    this.transactionService.withdrawMoney(withdrawData).subscribe({
      next: (response) => {
        this.success = 'Withdrawal successful! Transaction ID: ' + response.data.transactionId;
        this.withdrawForm.reset({ withdrawalMode: 'CASH' });
        this.submitted = false;
        this.loading = false;
        
        setTimeout(() => {
          this.router.navigate(['/account/list']);
        }, 2000);
      },
      error: (error) => {
        this.error = error.error?.message || 'Withdrawal failed. Please try again.';
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
// import { WithdrawRequest } from 'src/app/core/models/transaction';


// @Component({
//   selector: 'app-withdraw',
//   templateUrl: './withdraw.component.html',
//   styleUrls: ['./withdraw.component.scss']
// })
// export class WithdrawComponent implements OnInit {
//   withdrawForm!: FormGroup;
//   loading = false;
//   submitted = false;
//   error = '';
//   success = '';
//   myAccounts: any[] = [];
//   selectedAccountBalance = 0;

//   withdrawalModes = ['CASH', 'CHEQUE', 'CARD', 'ATM'];

//   constructor(
//     private formBuilder: FormBuilder,
//     private transactionService: TransactionService,
//     private accountService: AccountService,
//     private authService: AuthService,
//     private customerService: CustomerService,
//     private router: Router
//   ) { }

//   ngOnInit(): void {
//     this.withdrawForm = this.formBuilder.group({
//       accountNumber: ['', Validators.required],
//       amount: ['', [Validators.required, Validators.min(0.01)]],
//       withdrawalMode: ['CASH', Validators.required],
//       description: [''],
//       remarks: ['']
//     });

//     this.loadMyAccounts();

//     // Update balance when account is selected
//     this.withdrawForm.get('accountNumber')?.valueChanges.subscribe(accountNumber => {
//       this.updateSelectedAccountBalance(accountNumber);
//     });
//   }

//   get f() {
//     return this.withdrawForm.controls;
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
//                 this.withdrawForm.patchValue({ accountNumber: this.myAccounts[0].accountNumber });
//               }
//             },
//             error: (error) => console.error('Error loading accounts', error)
//           });
//         },
//         error: (error) => console.error('Error loading customer', error)
//       });
//     }
//   }

//   updateSelectedAccountBalance(accountNumber: string): void {
//     const account = this.myAccounts.find(acc => acc.accountNumber === accountNumber);
//     this.selectedAccountBalance = account ? account.balance : 0;
//   }

//   onSubmit(): void {
//     this.submitted = true;
//     this.error = '';
//     this.success = '';

//     if (this.withdrawForm.invalid) {
//       return;
//     }

//     // Validate sufficient balance
//     if (this.withdrawForm.value.amount > this.selectedAccountBalance) {
//       this.error = 'Insufficient balance. Available: ' + this.selectedAccountBalance;
//       return;
//     }

//     this.loading = true;
//     const withdrawData: WithdrawRequest = this.withdrawForm.value;

//     this.transactionService.withdrawMoney(withdrawData).subscribe({
//       next: (response) => {
//         this.success = 'Withdrawal successful! Transaction ID: ' + response.data.transactionId;
//         this.withdrawForm.reset({ withdrawalMode: 'CASH' });
//         this.submitted = false;
//         this.loading = false;
        
//         setTimeout(() => {
//           this.router.navigate(['/transaction/history']);
//         }, 2000);
//       },
//       error: (error) => {
//         this.error = error.error?.message || 'Withdrawal failed. Please try again.';
//         this.loading = false;
//       }
//     });
//   }
// }
