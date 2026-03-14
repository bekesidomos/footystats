import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Favourites } from './pages/favourites/favourites';
import { Leagues } from './pages/leagues/leagues';
import { Auth } from './pages/auth/auth';
import { MatchDetails } from './pages/match-details/match-details';
import { authGuard } from './pages/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: Home
  },
  {
    path: 'match/:id',
    component: MatchDetails
  },
  {
    path: 'favourites',
    component: Favourites,
    canActivate:[authGuard]
  },
  {
    path: 'league',
    component: Leagues
  },
  {
    path: 'auth',
    component: Auth
  },
  {
    path: '**',
    redirectTo: ''
  }
];
