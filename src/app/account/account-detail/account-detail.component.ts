import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountService } from 'src/app/core/services/account.service';
import { Account } from 'src/app/core/models/account';

@Component({
  selector: 'app-account-detail',
  templateUrl: './account-detail.component.html',
  styleUrls: ['./account-detail.component.scss']
})
export class AccountDetailComponent implements OnInit {
  account: Account | null = null;
  loading = false;
  accountId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private accountService: AccountService
  ) { }

  ngOnInit(): void {
    this.accountId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadAccountDetails();
  }

  loadAccountDetails(): void {
    this.loading = true;
    this.accountService.getAccountById(this.accountId).subscribe({
      next: (response) => {
        this.account = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading account', error);
        this.loading = false;
      }
    });
  }

  freezeAccount(): void {
    if (this.account && confirm('Are you sure you want to freeze this account?')) {
      this.accountService.freezeAccount(this.account.accountNumber).subscribe({
        next: () => {
          this.loadAccountDetails();
        },
        error: (error) => console.error('Error freezing account', error)
      });
    }
  }

  unfreezeAccount(): void {
    if (this.account && confirm('Are you sure you want to unfreeze this account?')) {
      this.accountService.unfreezeAccount(this.account.accountNumber).subscribe({
        next: () => {
          this.loadAccountDetails();
        },
        error: (error) => console.error('Error unfreezing account', error)
      });
    }
  }

  closeAccount(): void {
    if (this.account && confirm('Are you sure you want to close this account? This action cannot be undone.')) {
      this.accountService.deleteAccount(this.accountId).subscribe({
        next: () => {
          this.router.navigate(['/account/list']);
        },
        error: (error) => console.error('Error closing account', error)
      });
    }
  }

  viewStatement(): void {
    if (this.account) {
      this.router.navigate(['/account/statement', this.account.accountNumber]);
    }
  }

  goBack(): void {
    this.router.navigate(['/account/list']);
  }
}

