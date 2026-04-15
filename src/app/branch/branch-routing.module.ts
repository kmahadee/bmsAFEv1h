import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BranchListComponent } from './branch-list/branch-list.component';
import { BranchDetailComponent } from './branch-detail/branch-detail.component';
import { BranchCreateComponent } from './branch-create/branch-create.component';
import { BranchEditComponent } from './branch-edit/branch-edit.component';



const routes: Routes = [{ path: 'list', component: BranchListComponent },
{ path: 'detail/:id', component: BranchDetailComponent },
{ path: 'create', component: BranchCreateComponent },
{ path: 'edit/:id', component: BranchEditComponent },
{ path: '', redirectTo: 'list', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BranchRoutingModule { }
