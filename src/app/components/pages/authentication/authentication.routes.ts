import { Routes } from '@angular/router';

export const authenticationRoutingModule: Routes = [
  {
    path: 'pages/authentication', children: [
      {
        path: 'signin',
        loadComponent: () => import('./sign-in/sign-in').then((m) => m.SignIn),
        title: 'Nowa - Sign In',
      },
      {
        path: 'signup',
        loadComponent: () => import('./sign-up/sign-up').then((m) => m.SignUp),
        title: 'Nowa - Sign Up',
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./forgot-password/forgot-password').then((m) => m.ForgotPassword),
        title: 'Nowa - Forgot Password',
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./reset-password/reset-password').then((m) => m.ResetPassword),
        title: 'Nowa - reset-password',
      },

      {
        path: 'lockscreen',
        loadComponent: () => import('./lockscreen/lockscreen').then((m) => m.Lockscreen),
        title: 'Nowa - LockScreen',
      },

      {
        path: 'underconstruction',
        loadComponent: () => import('./underconstruction/underconstruction').then((m) => m.Underconstruction),
        title: 'Nowa - Underconstruction',
      },

      {
        path: 'error-404',
        loadComponent: () => import('./error-404/error-404').then((m) => m.Error404),
        title: 'Nowa - error-404',
      },

      {
        path: 'error-500',
        loadComponent: () => import('./error-500/error-500').then((m) => m.Error500),
        title: 'Nowa - error-500',
      },
      {
        path: 'error-501',
        loadComponent: () => import('./error-501/error-501').then((m) => m.Error501),
        title: 'Nowa - error-501',
      },

    ]
  }
];
