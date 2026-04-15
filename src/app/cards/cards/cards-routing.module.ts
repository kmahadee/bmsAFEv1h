import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CardListComponent } from '../card-list/card-list/card-list.component';
import { CardIssueComponent } from '../card-issue/card-issue.component';
import { CardDetailComponent } from '../card-detail/card-detail.component';

const routes: Routes = [
  { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'list', component: CardListComponent },
      { path: 'issue', component: CardIssueComponent },
      { path: 'detail/:id', component: CardDetailComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CardsRoutingModule { }
