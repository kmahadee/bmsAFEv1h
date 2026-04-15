import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DpsListComponent } from './dps-list/dps-list.component';
import { DpsDetailComponent } from './dps-detail/dps-detail.component';
import { DpsCreateComponent } from './dps-create/dps-create.component';
import { DpsStatementComponent } from './dps-statement/dps-statement.component';
import DpsPaymentComponent from './dps-payment/dps-payment.component';


const routes: Routes = [
  { path: 'list', component: DpsListComponent },
  { path: 'create', component: DpsCreateComponent },
  { path: 'detail/:dpsNumber', component: DpsDetailComponent },
  { path: 'statement/:dpsNumber', component: DpsStatementComponent },
  { path: 'payment/:dpsNumber', component: DpsPaymentComponent },
  { path: '', component: DpsListComponent }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DpsRoutingModule { }
