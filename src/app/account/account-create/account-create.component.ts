import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService } from 'src/app/core/services/account.service';
import { CustomerService } from 'src/app/core/services/customer.service';
import { AccountCreateRequest } from 'src/app/core/models/account';
import { BranchService } from 'src/app/core/services/branch.service';
import { map, Observable } from 'rxjs';
import { Branch } from 'src/app/core/models/branch';


@Component({
  selector: 'app-account-create',
  templateUrl: './account-create.component.html',
  styleUrls: ['./account-create.component.scss']
})


export class AccountCreateComponent implements OnInit {
  accountForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  success = '';
  branches$!: Observable<Branch[]>;
  customers: any[] = [];
  

  accountTypes = [
    { value: 'SAVINGS', label: 'Savings Account' },
    { value: 'CURRENT', label: 'Current Account' },
    { value: 'FIXED_DEPOSIT', label: 'Fixed Deposit' },
    { value: 'RECURRING_DEPOSIT', label: 'Recurring Deposit' }
  ];

  currencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'BDT', label: 'BDT - Bangladeshi Taka' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private accountService: AccountService,
    private branchService: BranchService,
    private customerService: CustomerService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadBranches();
    this.initializeForm();
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.customerService.getAllCustomers().subscribe({
      next: (response) => {
        this.customers = response.data;
      },
      error: (error) => console.error('Error loading customers', error)
    });
  }

  loadBranches(): void {
    // this.branches$ = this.branchService.getAllBranches();
    this.branches$ = this.branchService.getAllBranches().pipe(
    map(response => response.data) 
  );
  }

  initializeForm(): void {
  this.accountForm = this.formBuilder.group({
    customerId: ['', [Validators.required]],
    accountType: ['SAVINGS', Validators.required],
    branchCode: ['', Validators.required], // Changed from branchId to branchCode
    balance: [0, [Validators.required, Validators.min(0)]],
    currency: ['USD', Validators.required],
    interestRate: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    nomineeFirstName: [''],
    nomineeLastName: [''],
    nomineeRelationship: [''],
    nomineePhone: ['', Validators.pattern(/^\+?[1-9]\d{1,14}$/)]
  });
}


  // initializeForm(): void {
  //   this.accountForm = this.formBuilder.group({
  //     customerId: ['', [Validators.required]],
  //     accountType: ['SAVINGS', Validators.required],
  //     branchId: ['', Validators.required], // Changed from branch to branchId
  //     balance: [0, [Validators.required, Validators.min(0)]],
  //     currency: ['USD', Validators.required],
  //     interestRate: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
  //     nomineeFirstName: [''],
  //     nomineeLastName: [''],
  //     nomineeRelationship: [''],
  //     nomineePhone: ['', Validators.pattern(/^\+?[1-9]\d{1,14}$/)]
  //   });
  // }

  get f() {
    return this.accountForm.controls;
  }

  // onSubmit(): void {
  //   this.submitted = true;
  //   this.error = '';
  //   this.success = '';

  //   if (this.accountForm.invalid) {
  //     return;
  //   }

  //   this.loading = true;
  //   const accountData: AccountCreateRequest = {
  //     ...this.accountForm.value,
  //     branchId: Number(this.accountForm.value.branchId) // Ensure branchId is a number
  //   };

  //   this.accountService.createAccount(accountData).subscribe({
  //     next: (response) => {
  //       this.success = 'Account created successfully!';
  //       setTimeout(() => {
  //         this.router.navigate(['/account/detail', response.data.id]);
  //       }, 1500);
  //     },
  //     error: (error) => {
  //       this.error = error.error?.message || 'Failed to create account. Please try again.';
  //       this.loading = false;
  //     }
  //   });
  // }

  onSubmit(): void {
  this.submitted = true;
  if (this.accountForm.invalid) return;

  this.loading = true;

  // Manually construct the payload to match Swagger exactly
  const accountData: AccountCreateRequest = {
    customerId: String(this.accountForm.value.customerId),
    accountType: this.accountForm.value.accountType,
    branchCode: String(this.accountForm.value.branchCode), // Ensure this is a string
    balance: Number(this.accountForm.value.balance),
    currency: this.accountForm.value.currency,
    interestRate: Number(this.accountForm.value.interestRate),
    nomineeFirstName: this.accountForm.value.nomineeFirstName || '',
    nomineeLastName: this.accountForm.value.nomineeLastName || '',
    nomineeRelationship: this.accountForm.value.nomineeRelationship || '',
    nomineePhone: this.accountForm.value.nomineePhone || ''
  };

  this.accountService.createAccount(accountData).subscribe({
    next: (response) => {
      this.success = 'Account created successfully!';
      setTimeout(() => {
          this.router.navigate(['/account/detail', response.data.id]);
        }, 1500);
    },
    error: (error) => {
      console.error('Backend Error Details:', error);
      this.error = error.error?.message || 'Internal Server Error (500)';
      this.loading = false;
    }
  });
}

  cancel(): void {
    this.router.navigate(['/account/list']);
  }
}





// export class AccountCreateComponent implements OnInit {
//   accountForm!: FormGroup;
//   loading = false;
//   submitted = false;
//   error = '';
//   success = '';
//   customers: any[] = [];

//   accountTypes = [
//     'Savings',
//     'Current',
//     'Fixed Deposit',
//     'Recurring Deposit'
//   ];

//   currencies = ['USD', 'EUR', 'GBP', 'BDT'];

//   constructor(
//     private formBuilder: FormBuilder,
//     private accountService: AccountService,
//     private customerService: CustomerService,
//     private router: Router
//   ) { }

//   ngOnInit(): void {
//     this.accountForm = this.formBuilder.group({
//       customerId: ['', Validators.required],
//       accountType: ['', Validators.required],
//       branch: ['', Validators.required],
//       balance: [0, [Validators.required, Validators.min(0)]],
//       currency: ['USD', Validators.required],
//       interestRate: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
//       nomineeFirstName: [''],
//       nomineeLastName: [''],
//       nomineeRelationship: [''],
//       nomineePhone: ['']
//     });

//     this.loadCustomers();
//   }

//   get f() {
//     return this.accountForm.controls;
//   }

//   loadCustomers(): void {
//     this.customerService.getAllCustomers().subscribe({
//       next: (response) => {
//         this.customers = response.data;
//       },
//       error: (error) => console.error('Error loading customers', error)
//     });
//   }

//   onSubmit(): void {
//     this.submitted = true;
//     this.error = '';
//     this.success = '';

//     if (this.accountForm.invalid) {
//       return;
//     }

//     this.loading = true;
//     const accountData: AccountCreateRequest = this.accountForm.value;

//     this.accountService.createAccount(accountData).subscribe({
//       next: (response) => {
//         this.success = 'Account created successfully!';
//         setTimeout(() => {
//           this.router.navigate(['/account/detail', response.data.id]);
//         }, 1500);
//       },
//       error: (error) => {
//         this.error = error.error?.message || 'Failed to create account. Please try again.';
//         this.loading = false;
//       }
//     });
//   }

//   cancel(): void {
//     this.router.navigate(['/account/list']);
//   }
// }


