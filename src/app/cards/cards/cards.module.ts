import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CardsRoutingModule } from './cards-routing.module';
import { CardDetailComponent } from '../card-detail/card-detail.component';
import { CardIssueComponent } from '../card-issue/card-issue.component';
import { CardListComponent } from '../card-list/card-list/card-list.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';


@NgModule({
  declarations: [
    CardListComponent,
    CardIssueComponent,
    CardDetailComponent
  ],
  imports: [
    CommonModule,
    CardsRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class CardsModule { }
