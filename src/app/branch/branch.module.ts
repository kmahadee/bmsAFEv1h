import { NgModule } from '@angular/core';
// import { CommonModule } from '@angular/common';

// import { BranchRoutingModule } from './branch-routing.module';
// import { BranchListComponent } from './branch-list/branch-list.component';
// import { BranchDetailComponent } from './branch-detail/branch-detail.component';
// import { BranchCreateComponent } from './branch-create/branch-create.component';
// import { BranchEditComponent } from './branch-edit/branch-edit.component';

import { CommonModule } from '@angular/common';
import { BranchRoutingModule } from './branch-routing.module';
import { SharedModule } from '../shared/shared.module';
import { BranchListComponent } from './branch-list/branch-list.component';
import { BranchDetailComponent } from './branch-detail/branch-detail.component';
import { BranchCreateComponent } from './branch-create/branch-create.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BranchEditComponent } from './branch-edit/branch-edit.component';


@NgModule({
  declarations: [
    BranchListComponent,
    BranchDetailComponent,
    BranchCreateComponent,
    BranchEditComponent
  ],
  imports: [
    CommonModule,
    BranchRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class BranchModule { }
