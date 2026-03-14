import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FootballService } from '../../services/football.service';

import { StatusTranslatePipe } from '../../pipes/status-translate-pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatIconModule, 
    DatePipe, 
    RouterLink,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    StatusTranslatePipe
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  // minden fetch
  private allUpcoming: any[] = [];
  private allPast: any[] = [];

  // htmlbe szurt
  filteredUpcoming: any[] = [];
  filteredPast: any[] = [];

  isLoading = signal<boolean>(false);

  selectedLeague: string = ''; 
  
  leagues = [
    { name: 'All Top Leagues', code: '' },
    { name: 'Premier League', code: 'PL' },
    { name: 'La Liga', code: 'PD' },
    { name: 'Serie A', code: 'SA' },
    { name: 'Bundesliga', code: 'BL1' },
    { name: 'Ligue 1', code: 'FL1' }
  ];

  private footballService = inject(FootballService);

  ngOnInit() {
    this.selectedLeague = this.footballService.getCurrentLeague();
    this.loadData();
  }

  onFilterChange() {
    this.footballService.setSelectedLeague(this.selectedLeague);
    this.applyFilter();
  }

  loadData() {
    this.isLoading.set(true);
    this.footballService.getMatches('', 'SCHEDULED').subscribe({
      next: (data) => {
        this.allUpcoming = data;
        this.applyFilter(); 
      },
      error: () => this.isLoading.set(false)
    });

    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);

    const toDateStr = today.toISOString().split('T')[0];
    const fromDateStr = lastWeek.toISOString().split('T')[0];

    this.footballService.getMatches('', 'FINISHED', fromDateStr, toDateStr).subscribe({
      next: (data) => {
        this.allPast = data.reverse(); //legfrisebb elol
        this.applyFilter();
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  applyFilter() {
    if (!this.selectedLeague) {
      this.filteredUpcoming = this.allUpcoming.slice(0, 12); //12 is kinda sok
      this.filteredPast = this.allPast;
    } else { // ligakod szerinti szures
      this.filteredUpcoming = this.allUpcoming.filter(m => m.competition.code === this.selectedLeague);
      this.filteredPast = this.allPast.filter(m => m.competition.code === this.selectedLeague);
    }
  }
}