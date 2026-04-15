import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AccountService } from 'src/app/core/services/account.service';
import { AccountStatement } from 'src/app/core/models/account';


@Component({
  selector: 'app-account-statement',
  templateUrl: './account-statement.component.html',
  styleUrls: ['./account-statement.component.scss']
})
export class AccountStatementComponent implements OnInit {
  statementForm!: FormGroup;
  statement: AccountStatement | null = null;
  loading = false;
  submitted = false;
  accountNumber!: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private accountService: AccountService
  ) { }

  ngOnInit(): void {
    this.accountNumber = this.route.snapshot.paramMap.get('accountNumber')!;

    // Set default date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    this.statementForm = this.formBuilder.group({
      accountNumber: [this.accountNumber, Validators.required],
      startDate: [this.formatDate(startDate), Validators.required],
      endDate: [this.formatDate(endDate), Validators.required]
    });

    // Auto-load statement on init
    this.generateStatement();
  }

  get f() {
    return this.statementForm.controls;
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  generateStatement(): void {
    this.submitted = true;

    if (this.statementForm.invalid) {
      return;
    }

    this.loading = true;

    const request = {
      accountNumber: this.statementForm.value.accountNumber,
      startDate: new Date(this.statementForm.value.startDate).toISOString(),
      endDate: new Date(this.statementForm.value.endDate).toISOString()
    };

    this.accountService.getAccountStatement(request).subscribe({
      next: (response) => {
        this.statement = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error generating statement', error);
        this.loading = false;
      }
    });
  }

  printStatement(): void {
    window.print();
  }

  downloadStatement(): void {
    // TODO: Implement PDF download
    alert('PDF download functionality will be implemented');
  }

  goBack(): void {
    this.router.navigate(['/account/list']);
  }
}
