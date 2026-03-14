import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FootballService {
  private http = inject(HttpClient);
  private apiKey = environment.footballApiKey; 
  private proxyUrl = 'https://corsproxy.io/?';
  private baseUrl = 'https://api.football-data.org/v4';

  // hitelesites api kulccsal
  private getHeaders() {
    return new HttpHeaders({
      'X-Auth-Token': this.apiKey
    });
  }

  //kivalasztott liga
  private selectedLeagueSubject = new BehaviorSubject<string>('');
  selectedLeague$ = this.selectedLeagueSubject.asObservable();

  setSelectedLeague(leagueCode: string) {
    this.selectedLeagueSubject.next(leagueCode);
  }

  getCurrentLeague(): string {
    return this.selectedLeagueSubject.value;
  }

  getStandings(leagueCode: string): Observable<any[]> {
    // proxy es sima url osszefuzes
    // encode spec karakter miatt
    const targetUrl = `${this.baseUrl}/competitions/${leagueCode}/standings`;
    const fullUrl = `${this.proxyUrl}${encodeURIComponent(targetUrl)}`;

    return this.http.get<any>(fullUrl, {
      headers: this.getHeaders()
    }).pipe(
    //api valaszbol tabella
      map(response => response.standings[0].table)
    );
  }

  getMatches(leagueCode: string | null, status: 'SCHEDULED' | 'FINISHED', dateFrom?: string, dateTo?: string): Observable<any[]> {
    let apiUrl = `${this.baseUrl}/matches?status=${status}`;

    if (leagueCode) {
      apiUrl += `&competitions=${leagueCode}`;
    } else {
      apiUrl += `&competitions=PL,PD,SA,BL1,FL1`; 
    }

    //datum
    if (dateFrom && dateTo) {
      apiUrl += `&dateFrom=${dateFrom}&dateTo=${dateTo}`;
    }

    const fullUrl = `${this.proxyUrl}${encodeURIComponent(apiUrl)}`;
    console.log(`Fetching ${status} matches:`, fullUrl);

    return this.http.get<any>(fullUrl, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.matches)
    );
  }

  //konkret meccs
  getMatchById(id: string): Observable<any> {
    const targetUrl = `${this.baseUrl}/matches/${id}`;
    const fullUrl = `${this.proxyUrl}${encodeURIComponent(targetUrl)}`;
    return this.http.get<any>(fullUrl, {
      headers: this.getHeaders()
    });
  }

  //konkret csapat (fav) meccsei
  getTeamMatches(teamId: number): Observable<any[]> {
    const targetUrl = `${this.baseUrl}/teams/${teamId}/matches?limit=10`;
    const fullUrl = `${this.proxyUrl}${encodeURIComponent(targetUrl)}`;
    return this.http.get<any>(fullUrl, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.matches)
    );
  }

  //csapatok kedvencekhez
  getTeams(leagueCode: string): Observable<any[]> {
    const targetUrl = `${this.baseUrl}/competitions/${leagueCode}/teams`;
    const fullUrl = `${this.proxyUrl}${encodeURIComponent(targetUrl)}`;
    return this.http.get<any>(fullUrl, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.teams)
    );
  }
}