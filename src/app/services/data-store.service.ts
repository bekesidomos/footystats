import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable, catchError, of, tap, from } from 'rxjs';
import { Firestore, collection, addDoc, deleteDoc, doc, collectionData, getDocs, updateDoc, setDoc, getDoc } from '@angular/fire/firestore';

export interface FavouriteTeam {
  id?: string; //firestore
  apiId: number;
  name: string;
  league: string;
  createdAt: any;
  syncPending?: boolean;
  action?: 'add' | 'delete';
  note?: string;
}

export interface MatchPrediction {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  updatedAt: any;
}

export interface MatchAttendance {
  matchId: string;
  stadium: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  attendedAt: any; 
}

@Injectable({
  providedIn: 'root',
})
export class DataStoreService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  private dbName = 'footystats-cache';
  private storeName = 'favourites_cache';
  private dbPromise: Promise<IDBDatabase>;
  private isOnline = navigator.onLine;

  constructor() {
    this.dbPromise = this.initIndexedDB();
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncLocalChanges(); 
    });
    window.addEventListener('offline', () => this.isOnline = false);

  }

  //indexeddb init

  private initIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        // uj tabla ha meg nem letezik
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event: any) => resolve(event.target.result);
      request.onerror = (event: any) => reject(event.target.error);
    });
  }

  //create,update

  private async saveToIndexedDB(items: FavouriteTeam[]) {
    const db = await this.dbPromise;
    const tx = db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);
    items.forEach(item => store.put(item));
  }

  private async addLocalItem(item: FavouriteTeam) {
    const db = await this.dbPromise;
    const tx = db.transaction(this.storeName, 'readwrite');
    tx.objectStore(this.storeName).put(item);
  }

  private async deleteLocalItem(id: string) {
    const db = await this.dbPromise;
    const tx = db.transaction(this.storeName, 'readwrite');
    tx.objectStore(this.storeName).delete(id);
  }

  private async loadFromIndexedDB(): Promise<FavouriteTeam[]> {
    const db = await this.dbPromise;
    return new Promise((resolve) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }
  //del
  async clearLocalData() {
    const db = await this.dbPromise;
    const tx = db.transaction(this.storeName, 'readwrite');
    tx.objectStore(this.storeName).clear();
  }

  //kedvencek hozzadasa

  getFavourites(): Observable<FavouriteTeam[]> {
    const user = this.authService.currentUser;
    
    if (!user) {
      return of([]);
    }
    //ha online firestore
    if (this.isOnline) {
      const userFavCollection = collection(this.firestore, `users/${user.uid}/favourites`);
      return (collectionData(userFavCollection, { idField: 'id' }) as Observable<FavouriteTeam[]>).pipe(
        tap((data) => {
          this.saveToIndexedDB(data);
        }),
        catchError(() => {
          console.warn('firestore hiba');
          return from(this.loadFromIndexedDB());
        })
      );
    }
    else {
      return from(this.loadFromIndexedDB());
    }
  }

  async addFavourite(apiId: number, name: string, league: string) {
  const user = this.authService.currentUser;
  if (!user) return;

  const tempId = 'local_' + new Date().getTime();

  const newItem: FavouriteTeam = {
      id: tempId,
      apiId,
      name,
      league,
      createdAt: new Date(),
      syncPending: true, 
      action: 'add'
    };

  if (this.isOnline) {
      try {
        const userFavCollection = collection(this.firestore, `users/${user.uid}/favourites`);
        const { id, syncPending, action, ...firestoreData } = newItem;
        await addDoc(userFavCollection, firestoreData);
      } catch (err) {
        console.error('sikertelen mentes, mentes offline', err);
        await this.addLocalItem(newItem); 
      }
    } else {
      await this.addLocalItem(newItem);
    }
  }

  async deleteFavourite(id: string) {
    const user = this.authService.currentUser;
    if (!user) return;

    await this.deleteLocalItem(id);

    if (this.isOnline && !id.startsWith('local_')) {
      const docRef = doc(this.firestore, `users/${user.uid}/favourites/${id}`);
      await deleteDoc(docRef);
    } 
  }

    async updateFavouriteNote(id: string, note: string) {
    const user = this.authService.currentUser;
    if (!user) return;
    //lokal refresh
    const db = await this.dbPromise;
    const tx = db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);
    
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const item = getReq.result;
      if (item) {
        item.note = note;
        store.put(item);
      }
    };

    // firestore mentes
    if (this.isOnline && !id.startsWith('local_')) {
      const docRef = doc(this.firestore, `users/${user.uid}/favourites/${id}`);
      await updateDoc(docRef, { note: note });
    }
  }

    private async syncLocalChanges() {
    const user = this.authService.currentUser;
    if (!user) return;

    const allLocalItems = await this.loadFromIndexedDB();
    const pendingItems = allLocalItems.filter(item => item.syncPending === true);

    if (pendingItems.length === 0) {
      return;
    }

    const userFavCollection = collection(this.firestore, `users/${user.uid}/favourites`);

    for (const item of pendingItems) {
      if (item.action === 'add') {
        try {
          // mehet firestoreba
          const { id, syncPending, action, ...firestoreData } = item;
          await addDoc(userFavCollection, firestoreData);
          if (item.id) await this.deleteLocalItem(item.id);
        } catch (err) {
          console.error('szinkronizalasi hiba:', err);
        }
      }
    }
  }

  // pred
  async savePrediction(prediction: MatchPrediction) {
    const user = this.authService.currentUser;
    if (!user) return;

    //docid=matchid
    const docRef = doc(this.firestore, `users/${user.uid}/predictions/${prediction.matchId}`);
    await setDoc(docRef, prediction); 
  }

  async getPrediction(matchId: string): Promise<MatchPrediction | null> {
    const user = this.authService.currentUser;
    if (!user) return null;

    const docRef = doc(this.firestore, `users/${user.uid}/predictions/${matchId}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as MatchPrediction;
    } else {
      return null;
    }
  }

  async deletePrediction(matchId: string) {
    const user = this.authService.currentUser;
    if (!user) return;

    const docRef = doc(this.firestore, `users/${user.uid}/predictions/${matchId}`);
    await deleteDoc(docRef);
  }

  async saveAttendance(attendance: MatchAttendance) {
    const user = this.authService.currentUser;
    if (!user) return;

    const docRef = doc(this.firestore, `users/${user.uid}/attendance/${attendance.matchId}`);
    await setDoc(docRef, attendance);
  }

  async getAttendance(matchId: string): Promise<boolean> {
    const user = this.authService.currentUser;
    if (!user) return false;

    const docRef = doc(this.firestore, `users/${user.uid}/attendance/${matchId}`);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  }

  async deleteAttendance(matchId: string) {
    const user = this.authService.currentUser;
    if (!user) return;

    const docRef = doc(this.firestore, `users/${user.uid}/attendance/${matchId}`);
    await deleteDoc(docRef);
  }
}