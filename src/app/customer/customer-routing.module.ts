import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
// import { RouterModule, Routes } from '@angular/router';
import { CustomerListComponent } from './customer-list/customer-list.component';
import { CustomerDetailComponent } from './customer-detail/customer-detail.component';
import { CustomerCreateComponent } from './customer-create/customer-create.component';
import { CustomerEditComponent } from './customer-edit/customer-edit.component';
import { CustomerCardsComponent } from '../cards/customer-cards/customer-cards.component';
const routes: Routes = [
  { path: 'list', component: CustomerListComponent },
  { path: 'detail/:id', component: CustomerDetailComponent },
  { path: 'create', component: CustomerCreateComponent },
  { path: 'edit/:id', component: CustomerEditComponent },
  { path: 'cards', component: CustomerCardsComponent },
  { path: '', redirectTo: 'list', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomerRoutingModule { }
