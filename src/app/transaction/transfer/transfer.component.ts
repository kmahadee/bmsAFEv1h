import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TransactionService } from 'src/app/core/services/transaction.service';
import { AccountService } from 'src/app/core/services/account.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { TransferRequest } from 'src/app/core/models/transaction';

@Component({
  selector: 'app-transfer',
  templateUrl: './transfer.component.html',
  styleUrls: ['./transfer.component.scss']
})
export class TransferComponent implements OnInit {
  transferForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  success = '';
  myAccounts: any[] = [];
  selectedAccountBalance = 0;

  transferModes = ['NEFT', 'RTGS', 'IMPS', 'UPI'];

  constructor(
    private formBuilder: FormBuilder,
    private transactionService: TransactionService,
    private accountService: AccountService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.transferForm = this.formBuilder.group({
      fromAccountNumber: ['', Validators.required],
      toAccountNumber: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      transferMode: ['NEFT', Validators.required],
      description: [''],
      remarks: [''],
      priority: ['normal'],
      transferType: ['other']
    });

    this.loadMyAccounts();

    // Update balance when account is selected
    this.transferForm.get('fromAccountNumber')?.valueChanges.subscribe(accountNumber => {
      this.updateSelectedAccountBalance(accountNumber);
    });
  }

  get f() {
    return this.transferForm.controls;
  }

  loadMyAccounts(): void {
    // Get customer ID directly from auth service
    const custId = this.authService.getCustomerId();

    if (custId) {
      this.accountService.getAccountsByCustomerId(custId).subscribe({
        next: (accountResponse) => {
          this.myAccounts = accountResponse.data.filter(acc => acc.status === 'active');
          if (this.myAccounts.length > 0) {
            this.transferForm.patchValue({ fromAccountNumber: this.myAccounts[0].accountNumber });
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

    if (this.transferForm.invalid) {
      return;
    }

    // Validate sufficient balance
    if (this.transferForm.value.amount > this.selectedAccountBalance) {
      this.error = 'Insufficient balance. Available: ' + this.selectedAccountBalance;
      return;
    }

    // Validate different accounts
    if (this.transferForm.value.fromAccountNumber === this.transferForm.value.toAccountNumber) {
      this.error = 'Cannot transfer to the same account';
      return;
    }

    this.loading = true;
    const transferData: TransferRequest = this.transferForm.value;

    this.transactionService.transferFunds(transferData).subscribe({
      next: (response) => {
        this.success = 'Transfer successful! Transaction ID: ' + response.data.transactionId;
        this.transferForm.reset({ transferMode: 'NEFT', priority: 'normal', transferType: 'other' });
        this.submitted = false;
        this.loading = false;
        
        setTimeout(() => {
          // this.router.navigate(['/transaction/history']);
          this.router.navigate(['/account/list']);
        }, 2000);
      },
      error: (error) => {
        this.error = error.error?.message || 'Transfer failed. Please try again.';
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
// import { TransferRequest } from 'src/app/core/models/transaction';

// @Component({
//   selector: 'app-transfer',
//   templateUrl: './transfer.component.html',
//   styleUrls: ['./transfer.component.scss']
// })
// export class TransferComponent implements OnInit {
//   transferForm!: FormGroup;
//   loading = false;
//   submitted = false;
//   error = '';
//   success = '';
//   myAccounts: any[] = [];
//   selectedAccountBalance = 0;

//   transferModes = ['NEFT', 'RTGS', 'IMPS', 'UPI'];

//   constructor(
//     private formBuilder: FormBuilder,
//     private transactionService: TransactionService,
//     private accountService: AccountService,
//     private authService: AuthService,
//     private customerService: CustomerService,
//     private router: Router
//   ) { }

//   ngOnInit(): void {
//     this.transferForm = this.formBuilder.group({
//       fromAccountNumber: ['', Validators.required],
//       toAccountNumber: ['', Validators.required],
//       amount: ['', [Validators.required, Validators.min(0.01)]],
//       transferMode: ['NEFT', Validators.required],
//       description: [''],
//       remarks: [''],
//       priority: ['normal'],
//       transferType: ['other']
//     });

//     this.loadMyAccounts();

//     // Update balance when account is selected
//     this.transferForm.get('fromAccountNumber')?.valueChanges.subscribe(accountNumber => {
//       this.updateSelectedAccountBalance(accountNumber);
//     });
//   }

//   get f() {
//     return this.transferForm.controls;
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
//                 this.transferForm.patchValue({ fromAccountNumber: this.myAccounts[0].accountNumber });
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

//     if (this.transferForm.invalid) {
//       return;
//     }

//     // Validate sufficient balance
//     if (this.transferForm.value.amount > this.selectedAccountBalance) {
//       this.error = 'Insufficient balance. Available: ' + this.selectedAccountBalance;
//       return;
//     }

//     // Validate different accounts
//     if (this.transferForm.value.fromAccountNumber === this.transferForm.value.toAccountNumber) {
//       this.error = 'Cannot transfer to the same account';
//       return;
//     }

//     this.loading = true;
//     const transferData: TransferRequest = this.transferForm.value;

//     this.transactionService.transferFunds(transferData).subscribe({
//       next: (response) => {
//         this.success = 'Transfer successful! Transaction ID: ' + response.data.transactionId;
//         this.transferForm.reset({ transferMode: 'NEFT', priority: 'normal', transferType: 'other' });
//         this.submitted = false;
//         this.loading = false;
        
//         setTimeout(() => {
//           this.router.navigate(['/transaction/history']);
//         }, 2000);
//       },
//       error: (error) => {
//         this.error = error.error?.message || 'Transfer failed. Please try again.';
//         this.loading = false;
//       }
//     });
//   }
// }
