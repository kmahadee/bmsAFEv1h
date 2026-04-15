import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AccountListItem } from 'src/app/core/models/account';
import { AccountService } from 'src/app/core/services/account.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { CustomerService } from 'src/app/core/services/customer.service';



@Component({
  selector: 'app-account-list',
  templateUrl: './account-list.component.html',
  styleUrls: ['./account-list.component.scss']
})
export class AccountListComponent implements OnInit {
  accounts: AccountListItem[] = [];
  filteredAccounts: AccountListItem[] = [];
  loading = false;
  searchTerm = '';
  selectedStatus = 'all';
  customerId: string | null = null;

  constructor(
    private accountService: AccountService,
    public authService: AuthService,
    private customerService: CustomerService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.loading = true;

    // If customer, load only their accounts
    if (this.authService.isCustomer()) {
      this.loadCustomerAccounts();
    } else {
      this.loadAllAccounts();
    }
  }

  loadAllAccounts(): void {
    this.accountService.getAllAccounts().subscribe({
      next: (response) => {
        this.accounts = response.data;
        this.filteredAccounts = this.accounts;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading accounts', error);
        this.loading = false;
      }
    });
  }

  // loadCustomerAccounts(): void {
  //   const user = this.authService.currentUserValue;
  //   console.log();
  //   if (user?.id) {
  //     this.customerService.getCustomerById(user.id).subscribe({
  //       next: (response) => {
  //         this.customerId = response.data.customerId;
  //         this.accountService.getAccountsByCustomerId(this.customerId!).subscribe({
  //           next: (accountResponse) => {
  //             this.accounts = accountResponse.data;
  //             this.filteredAccounts = this.accounts;
  //             this.loading = false;
  //           },
  //           error: (error) => {
  //             console.error('Error loading accounts', error);
  //             this.loading = false;
  //           }
  //         });
  //       },
  //       error: (error) => {
  //         console.error('Error loading customer', error);
  //         this.loading = false;
  //       }
  //     });
  //   }
  // }
  loadCustomerAccounts(): void {
  // Directly get the correct Customer ID from storage (Sally's 10)
  const custId = this.authService.getCustomerId();

  if (custId) {
    this.customerId = custId;
    this.accountService.getAccountsByCustomerId(custId).subscribe({
      next: (accountResponse) => {
        this.accounts = accountResponse.data;
        this.filteredAccounts = this.accounts;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading accounts for customer', error);
        this.loading = false;
      }
    });
  } else {
    console.error('No customer ID found in session. Ensure you are logged in as a Customer.');
    this.loading = false;
    // Optional: Redirect to login or show an error message
  }
}

  onSearch(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.applyFilters();
      return;
    }

    this.filteredAccounts = this.accounts.filter(account =>
      account.accountNumber.toLowerCase().includes(term) ||
      account.customerId.toLowerCase().includes(term) ||
      account.customerName.toLowerCase().includes(term) ||
      account.accountType.toLowerCase().includes(term)
    );
  }

  applyFilters(): void {
    this.filteredAccounts = this.accounts.filter(account => {
      const statusMatch = this.selectedStatus === 'all' || account.status === this.selectedStatus;
      return statusMatch;
    });
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  viewAccount(id: number): void {
    this.router.navigate(['/account/detail', id]);
  }

  viewStatement(accountNumber: string): void {
    this.router.navigate(['/account/statement', accountNumber]);
  }

  createAccount(): void {
    this.router.navigate(['/account/create']);
  }

  freezeAccount(id: number, accountNumber: string): void {
    if (confirm('Are you sure you want to freeze this account?')) {
      this.accountService.freezeAccount(accountNumber).subscribe({
        next: () => {
          this.loadAccounts();
        },
        error: (error) => console.error('Error freezing account', error)
      });
    }
  }

  unfreezeAccount(id: number, accountNumber: string): void {
    if (confirm('Are you sure you want to unfreeze this account?')) {
      this.accountService.unfreezeAccount(accountNumber).subscribe({
        next: () => {
          this.loadAccounts();
        },
        error: (error) => console.error('Error unfreezing account', error)
      });
    }
  }

  getTotalBalance(): number {
    return this.filteredAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  }
}


