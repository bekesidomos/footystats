import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, AsyncPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { DataStoreService, FavouriteTeam } from '../../services/data-store.service';
import { FootballService } from '../../services/football.service';
import { HighlightWinnerDirective } from '../../directives/highlight-winner';

@Component({
  selector: 'app-favourites',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatSelectModule, 
    MatInputModule, 
    AsyncPipe, 
    MatIconModule,
    DatePipe,
    RouterLink,
    MatCardModule,
    HighlightWinnerDirective
  ],
  templateUrl: './favourites.html',
  styleUrl: './favourites.scss'
})
export class Favourites implements OnInit {
  favourites$!: Observable<FavouriteTeam[]>;

  leagues = [
    { name: 'Premier League', code: 'PL' },
    { name: 'La Liga', code: 'PD' },
    { name: 'Serie A', code: 'SA' },
    { name: 'Bundesliga', code: 'BL1' },
    { name: 'Ligue 1', code: 'FL1' }
  ];

  availableTeams: any[] = [];
  //aktual allapot
  newTeamLeague: string = '';
  selectedTeam: any = null;

  selectedFavMatches: any[] = [];
  isLoadingMatches = false;

  activeFavId = signal<string | null>(null);
  isEditingNote = signal<boolean>(false);

  currentNote: string = '';

  private dataStore = inject(DataStoreService);
  private footballService = inject(FootballService);

  ngOnInit(): void {
    this.favourites$ = this.dataStore.getFavourites();
  }

  onLeagueChange(leagueCode: string) {
    this.availableTeams = [];
    this.selectedTeam = null;
    
    if (!leagueCode) return;

    this.footballService.getTeams(leagueCode).subscribe({
      next: (teams) => {
        this.availableTeams = teams;
      },
      error: (err) => console.error('hiba a csapatok betoltesekor:', err)
    });
  }

  addFavourite(): void {
    if (!this.selectedTeam || !this.newTeamLeague) {
      return;
    }
    this.dataStore.addFavourite(this.selectedTeam.id, this.selectedTeam.name, this.newTeamLeague);
    
    this.selectedTeam = null;
  }

  onSelectFavourite(fav: FavouriteTeam) {
    //ki az aktiv, szinezeshez
    this.activeFavId.set(fav.id || null);
    this.currentNote = fav.note || ''; 
    this.isEditingNote.set(false);

    this.isLoadingMatches = true;
    this.selectedFavMatches = [];

    this.footballService.getTeamMatches(fav.apiId).subscribe({
      next: (matches) => {
        this.selectedFavMatches = matches;
        this.isLoadingMatches = false;
      },
      error: () => this.isLoadingMatches = false
    });
  }

  saveNote() {
    const id = this.activeFavId();
    if (id) {
      this.dataStore.updateFavouriteNote(id, this.currentNote);
      this.isEditingNote.set(false);
    }
  }

  cancelEdit() {
    this.isEditingNote.set(false);
  }

  startEdit() {
    this.isEditingNote.set(true);
  }

  deleteFavourite(id: string): void {
    this.dataStore.deleteFavourite(id);

    if (this.activeFavId() === id) {
      this.selectedFavMatches = [];
      //kell jobb oldalra is clear
      this.activeFavId.set(null);
    }
  }
}