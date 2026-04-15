import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccountListComponent } from './account-list/account-list.component';
import { AccountDetailComponent } from './account-detail/account-detail.component';
import { AccountCreateComponent } from './account-create/account-create.component';
import { AccountStatementComponent } from './account-statement/account-statement.component';


const routes: Routes = [
  { path: 'list', component: AccountListComponent },
  { path: 'detail/:id', component: AccountDetailComponent },
  { path: 'create', component: AccountCreateComponent },
  { path: 'statement/:accountNumber', component: AccountStatementComponent },
  { path: '', redirectTo: 'list', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountRoutingModule { }
