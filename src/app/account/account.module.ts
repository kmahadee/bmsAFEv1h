import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AccountRoutingModule } from './account-routing.module';
import { AccountListComponent } from './account-list/account-list.component';
import { AccountDetailComponent } from './account-detail/account-detail.component';
import { AccountCreateComponent } from './account-create/account-create.component';
import { AccountStatementComponent } from './account-statement/account-statement.component';
import { SharedModule } from '../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CoreModule } from '../core/core.module';


@NgModule({
  declarations: [
    AccountListComponent,
    AccountDetailComponent,
    AccountCreateComponent,
    AccountStatementComponent
  ],
  imports: [
    CommonModule,
    AccountRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    CoreModule
    
  ],
  exports: [
    AccountListComponent,
    AccountDetailComponent,
    AccountCreateComponent,
    AccountStatementComponent
  ]
})
export class AccountModule { }
