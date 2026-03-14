import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { FootballService } from '../../services/football.service';

@Component({
  selector: 'app-leagues',
  standalone : true,
  imports: [MatButtonModule, MatFormFieldModule, MatSelectModule, MatIconModule],
  templateUrl: './leagues.html',
  styleUrls: ['./leagues.scss']
})
export class Leagues {
  private footballService = inject(FootballService);

  //api/bajnoksag
  leagues = [
    { name: 'Premier League', code: 'PL' },
    { name: 'La Liga', code: 'PD' },
    { name: 'Serie A', code: 'SA' },
    { name: 'Bundesliga', code: 'BL1' },
    { name: 'Ligue 1', code: 'FL1' }
  ];

  selectedLeague: any = null; 
  selectedStandings: any[] = [];
  isLoading = false; 

  selectLeague(league: any) {
    this.selectedLeague = league;
    this.isLoading = true;
    this.selectedStandings = []; 

    this.footballService.getStandings(league.code).subscribe({
      next: (data) => {
        this.selectedStandings = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('api hiba:', err);
        this.isLoading = false;
      }
    });
  }

  clearSelection() {
    this.selectedLeague = null;
    this.selectedStandings = [];
  }
}
