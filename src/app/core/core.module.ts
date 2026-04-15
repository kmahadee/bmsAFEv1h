import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FilterPipe, SumAmountPipe } from './services/filter.pipe';
import { AccountService } from './services/account.service';
import { ApiService } from './services/api.service';


@NgModule({
  declarations: [
    FilterPipe,
    SumAmountPipe

  ],
  imports: [
    CommonModule,
    HttpClientModule
  ],
  exports: [
    FilterPipe,
    SumAmountPipe
  ]
})
export class CoreModule { }
