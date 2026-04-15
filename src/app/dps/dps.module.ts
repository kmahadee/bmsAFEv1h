import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DpsRoutingModule } from './dps-routing.module';
import { DpsListComponent } from './dps-list/dps-list.component';
import { DpsDetailComponent } from './dps-detail/dps-detail.component';
import { DpsCreateComponent } from './dps-create/dps-create.component';
import { DpsStatementComponent } from './dps-statement/dps-statement.component';
import DpsPaymentComponent from './dps-payment/dps-payment.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    DpsListComponent,
    DpsDetailComponent,
    DpsCreateComponent,
    DpsStatementComponent,
    DpsPaymentComponent
  ],
  imports: [
    CommonModule,
    DpsRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class DpsModule { }
