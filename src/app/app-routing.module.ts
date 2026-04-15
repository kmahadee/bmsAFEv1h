import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';


const routes: Routes = [

  /* ===============================
     DEFAULT REDIRECT
  =============================== */
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  // {
  //   path: '**',
  //   redirectTo: 'auth/login',
  //   pathMatch: 'full'
  // },

  /* ===============================
     PUBLIC ROUTES
  =============================== */
  {
    path: 'auth',
    loadChildren: () =>
      import('./auth/auth.module').then(m => m.AuthModule)
  },

  /* ===============================
     PROTECTED ROUTES
  =============================== */
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'customer',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./customer/customer.module').then(m => m.CustomerModule)
  },
  {
    path: 'account',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./account/account.module').then(m => m.AccountModule)
  },
  {
    path: 'transaction',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./transaction/transaction.module').then(m => m.TransactionModule)
  },
  {
    path: 'cards',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./cards/cards/cards.module').then(m => m.CardsModule)
  },
  {
    path: 'branch',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./branch/branch.module').then(m => m.BranchModule)
  },
  {
    path: 'dps',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./dps/dps.module').then(m => m.DpsModule)
  },
  {
    path: 'loans',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./loan/loan.module').then(m => m.LoanModule)
  },

  /* ===============================
     FALLBACK ROUTE
  =============================== */
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];


// Routes = [ 
// {
//     path: '',
//     redirectTo: 'auth/login',
//     pathMatch: 'full'
//   },
//   {
//     path: 'auth',
//     loadChildren: () =>
//       import('./auth/auth.module').then(m => m.AuthModule)
//   },
//   {
//     path: 'dashboard',
//     canActivate: [AuthGuard],
//     loadChildren: () =>
//       import('./dashboard/dashboard.module').then(m => m.DashboardModule)
//   },
//   {
//     path: 'customer',
//     loadChildren: () =>
//       import('./customer/customer.module').then(m => m.CustomerModule)
//   },
//   {
//     path: 'account',
//     loadChildren: () =>
//       import('./account/account.module').then(m => m.AccountModule)
//   },
//   {
//     path: 'transactions',
//     loadChildren: () =>
//       import('./transaction/transaction.module').then(m => m.TransactionModule)
//   },
//   {
//     path: 'branch',
//     loadChildren: () =>
//       import('./branch/branch.module').then(m => m.BranchModule)
//   },
//   {
//     path: 'dps',
//     loadChildren: () =>
//       import('./dps/dps.module').then(m => m.DpsModule)
//   },
  // {
  //   path: '**',
  //   redirectTo: 'dashboard'
  // }
// ];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
