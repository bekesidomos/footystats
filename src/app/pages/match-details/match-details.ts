import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { FootballService } from '../../services/football.service';
import { DataStoreService, MatchPrediction, MatchAttendance } from '../../services/data-store.service';
import { StatusTranslatePipe } from'../../pipes/status-translate-pipe';
import { HighlightWinnerDirective } from '../../directives/highlight-winner';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-match-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    MatDividerModule, 
    DatePipe, 
    StatusTranslatePipe, 
    HighlightWinnerDirective,
    FormsModule,
    MatInputModule
  ],
  templateUrl: './match-details.html',
  styleUrl: './match-details.scss'
})
export class MatchDetails implements OnInit {
  match: any = null;
  isLoading = true;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private footballService = inject(FootballService);

  myPrediction: MatchPrediction | null = null;
  predHome: number | null = null;
  predAway: number | null = null;
  isPredicting = false; //form allapota
  isAttended = false;

  private dataStore = inject(DataStoreService);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadMatchDetails(id);
    }
  }

  loadMatchDetails(id: string) {
    this.footballService.getMatchById(id).subscribe({
      next: (data) => {
        this.match = data;
        this.isLoading = false;
        this.loadPrediction(id);
        this.checkAttendance(id);
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  async checkAttendance(matchId: string) {
    this.isAttended = await this.dataStore.getAttendance(matchId);
  }

  async toggleAttendance() {
    if (!this.match) return;
    const matchId = this.match.id.toString();

    if (this.isAttended) {
      //ha bejelolve ->del
      await this.dataStore.deleteAttendance(matchId);
      this.isAttended = false;
    } else {
      //ha nem save
      const attendance: MatchAttendance = {
        matchId: matchId,
        stadium: this.match.venue || 'Unknown',
        homeTeam: this.match.homeTeam.name,
        awayTeam: this.match.awayTeam.name,
        date: this.match.utcDate,
        attendedAt: new Date()
      };
      await this.dataStore.saveAttendance(attendance);
      this.isAttended = true;
    }
  }

  async loadPrediction(matchId: string) {
    this.myPrediction = await this.dataStore.getPrediction(matchId);
    if (this.myPrediction) {
      this.predHome = this.myPrediction.homeScore;
      this.predAway = this.myPrediction.awayScore;
    }
  }

  async savePrediction() {
    if (this.predHome === null || this.predAway === null || this.predHome < 0 || this.predAway < 0 || !this.match) {
      return; 
    }
    const newPred: MatchPrediction = {
      matchId: this.match.id.toString(), 
      homeTeam: this.match.homeTeam.name,
      awayTeam: this.match.awayTeam.name,
      homeScore: this.predHome,
      awayScore: this.predAway,
      updatedAt: new Date()
    };

    await this.dataStore.savePrediction(newPred);
    this.myPrediction = newPred; 
    this.isPredicting = false;   // form close
  }

  async deletePrediction() {
    if (!this.match) return;
    await this.dataStore.deletePrediction(this.match.id.toString());
    this.myPrediction = null;
    this.predHome = null;
    this.predAway = null;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}