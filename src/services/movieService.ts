import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { apiConfig } from '../apiConfig';
import type { Movie, Screening } from '../types';

// Funkcja haszująca, która zamienia ID seansu (string) na liczbę (seed)
const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Konwertuj na 32-bitową liczbę całkowitą
  }
  return Math.abs(hash);
};

//  generator liczb pseudolosowych 
// 
const lcg = (seed: number) => () => (seed = (seed * 1664525 + 1013904223) % 2**32) / 2**32;

// Funkcja pomocnicza do mapowania danych z API na nasz typ Movie
const mapApiDataToMovie = (apiMovie: any): Movie => {
  return {
    id: apiMovie.id.toString(),
    title: apiMovie.title,
    description: apiMovie.overview,
    duration: apiMovie.runtime ? `${Math.floor(apiMovie.runtime / 60)}h ${apiMovie.runtime % 60}min` : 'N/A',
    genre: apiMovie.genres ? apiMovie.genres.map((g: any) => g.name).join(', ') : 'N/A',
    imageUrl: apiMovie.poster_path ? `${apiConfig.imageBaseUrl}${apiMovie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image',
    rating: Math.round(apiMovie.vote_average / 2), // Skalowanie oceny z 10 do 5
  };
};

export interface MovieFilters {
  genre?: number;
  year?: number;
  sortBy?: 'popularity.desc' | 'vote_average.desc' | 'release_date.desc' | 'title.asc';
  searchQuery?: string;
}

export interface Genre {
  id: number;
  name: string;
}

export class MovieService {
  static async getMovies(): Promise<Movie[]> {
    try {
      const response = await fetch(`${apiConfig.baseUrl}/movie/popular?api_key=${apiConfig.apiKey}&language=pl-PL&page=1`);
      if (!response.ok) {
        throw new Error('Failed to fetch movies from TMDb');
      }
      const data = await response.json();
      // Ogranicz do 12 filmów
      return data.results.slice(0, 12).map(mapApiDataToMovie);
    } catch (error) {
      console.error('Error fetching movies:', error);
      throw error;
    }
  }

  /**
   * Pobiera filmy z filtrami.
   */
  static async getMoviesWithFilters(filters: MovieFilters): Promise<Movie[]> {
    try {
      let url: string;
      const params = new URLSearchParams({
        api_key: apiConfig.apiKey,
        language: 'pl-PL',
        include_adult: 'false',
        include_video: 'false',
        page: '1'
      });

      if (filters.searchQuery) {
        url = `${apiConfig.baseUrl}/search/movie`;
        params.append('query', filters.searchQuery);
      } else {
        url = `${apiConfig.baseUrl}/discover/movie`;
        if (filters.genre) params.append('with_genres', filters.genre.toString());
        if (filters.year) params.append('primary_release_year', filters.year.toString());
        if (filters.sortBy) params.append('sort_by', filters.sortBy);
      }

      const response = await fetch(`${url}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch movies with filters from TMDb');
      
      const data = await response.json();
      return data.results.map(mapApiDataToMovie);
    } catch (error) {
      console.error('Error fetching movies with filters:', error);
      throw error;
    }
  }

  /**
   * Pobiera dostępne gatunki filmów.
   */
  static async getGenres(): Promise<Genre[]> {
    try {
      const response = await fetch(`${apiConfig.baseUrl}/genre/movie/list?api_key=${apiConfig.apiKey}&language=pl-PL`);
      if (!response.ok) throw new Error('Failed to fetch genres from TMDb');
      const data = await response.json();
      return data.genres;
    } catch (error) {
      console.error('Error fetching genres:', error);
      throw error;
    }
  }

  /**
   * Pobiera szczegóły filmu z TMDb API po jego ID.
   */
  static async getMovieById(id: string): Promise<Movie | null> {
    try {
      const response = await fetch(`${apiConfig.baseUrl}/movie/${id}?api_key=${apiConfig.apiKey}&language=pl-PL`);
      if (!response.ok) throw new Error('Failed to fetch movie details from TMDb');
      const data = await response.json();
      return mapApiDataToMovie(data);
    } catch (error) {
      console.error('Error fetching movie:', error);
      throw error;
    }
  }

  /**
   * Pobiera szczegóły seansu z Firestore po jego ID.
   */
  static async getScreeningById(screeningId: string): Promise<Screening | null> {
    try {
      const screeningRef = doc(db, 'screenings', screeningId);
      const screeningSnap = await getDoc(screeningRef);
      
      if (screeningSnap.exists()) {
        return { id: screeningSnap.id, ...screeningSnap.data() } as Screening;
      }
      return null;
    } catch (error: any) {
      console.error('Error fetching screening:', error);
      // Handle Firebase quota exceeded error
      if (error.code === 'resource-exhausted' || error.message?.includes('quota')) {
        console.warn('Firebase quota exceeded. Cannot fetch screening.');
        return null;
      }
      throw error;
    }
  }
  
  private static generateMockScreenings(movieId: string): Screening[] {
    console.warn(`Generowanie danych zastępczych dla filmu ${movieId}`);
    const screenings: Screening[] = [];
    
    // Generuj seanse na 3 dni w przód
    for (let i = 0; i < 3; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split('T')[0]; // Format YYYY-MM-DD
      console.log(`Generating screening for date: ${dateString} (day +${i})`);
      
      // 2 seanse dziennie: popołudniowy i wieczorny
      const times = ['18:00', '21:00'];
      const halls = ['A', 'B'];
      const prices = [25, 28];
      
      times.forEach((time, index) => {
        screenings.push({
          id: `mock-${movieId}-${i}-${index}`,
          movieId,
          date: dateString,
          time,
          hall: halls[index],
          price: prices[index],
          availableSeats: Math.floor(Math.random() * 50) + 30, // 30-80 miejsc
          totalSeats: 100
        });
      });
    }
    
    console.log('Generated screenings:', screenings);
    return screenings;
  }

  static async getOrCreateScreeningsForMovie(movieId: string): Promise<Screening[]> {
    try {
      const screeningsCollectionRef = collection(db, 'screenings');
      const q = query(screeningsCollectionRef, where('movieId', '==', movieId));
      const querySnapshot = await getDocs(q);

      const todayString = new Date().toISOString().split('T')[0];

      // Sprawdź, czy istnieją jakiekolwiek seanse od dzisiaj w przyszłość.
      const futureScreenings = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Screening))
        .filter(s => s.date && s.date >= todayString);

      // Jeśli mamy prawidłowe przyszłe seanse, zwróć je.
      if (futureScreenings.length > 0) {
        return futureScreenings;
      }
      
      // Jeśli seanse są nieaktualne lub nie istnieją, usuń stare i stwórz nowe.
      console.log(`Seanse dla filmu ${movieId} są nieaktualne lub nie istnieją. Generowanie nowych.`);

      if (!querySnapshot.empty) {
        const deleteBatch = writeBatch(db);
        querySnapshot.docs.forEach(doc => deleteBatch.delete(doc.ref));
        await deleteBatch.commit();
        console.log(`Usunięto ${querySnapshot.size} starych seansów.`);
      }

      // Generuj nowe dane seansów na 3 dni w przód z 4 godzinami
      const newScreeningsData: Omit<Screening, 'id'>[] = [];
      const times = ['16:00', '18:15', '20:30', '22:15'];

      for (let i = 0; i < 3; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];

        times.forEach(time => {
          newScreeningsData.push({
            movieId: movieId,
            date: dateString,
            time,
            hall: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
            price: Math.random() > 0.5 ? 28 : 25,
            availableSeats: Math.floor(Math.random() * 50) + 30,
            totalSeats: 100
          });
        });
      }

      const createBatch = writeBatch(db);
      const createdScreenings: Screening[] = [];

      for (const screeningData of newScreeningsData) {
        const newDocRef = doc(screeningsCollectionRef);
        createBatch.set(newDocRef, screeningData);
        createdScreenings.push({ id: newDocRef.id, ...screeningData });
      }
      await createBatch.commit();
      
      console.log(`Utworzono ${createdScreenings.length} nowych seansów.`);
      return createdScreenings;

    } catch (error: any) {
      console.error('Nieoczekiwany błąd w getOrCreateScreeningsForMovie:', error);
      return [];
    }
  }

  private static generateMockSeats(screeningId: string): any[] {
    const seed = simpleHash(screeningId);
    const random = lcg(seed); // Inicjalizacja generatora z ziarnem z ID seansu

    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const seats = [];
    for (const row of rows) {
      for (let i = 1; i <= 12; i++) {
        seats.push({
          id: `${row}${i}`, row, number: i,
          isAvailable: random() > 0.3, // Użycie naszego deterministycznego generatora
          isSelected: false,
        });
      }
    }
    return seats;
  }

  static async getSeatsForScreening(screeningId: string): Promise<any[]> {
    try {
      const seatsCollectionRef = collection(db, 'screenings', screeningId, 'seats');
      const seatsSnapshot = await getDocs(seatsCollectionRef);

      if (!seatsSnapshot.empty) {
        return seatsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      console.log(`Generowanie miejsc dla seansu ${screeningId}`);
      const seatsToCreate = this.generateMockSeats(screeningId);
      
      const batch = writeBatch(db);
      seatsToCreate.forEach(seat => {
        const seatDocRef = doc(seatsCollectionRef, seat.id);
        const { id, ...seatData } = seat;
        batch.set(seatDocRef, seatData);
      });
      
      await batch.commit();
      
      return seatsToCreate;
    } catch (error: any) {
      console.error('Błąd podczas pobierania lub tworzenia miejsc:', error);
      return this.generateMockSeats(screeningId); 
    }
  }

  // Dodaj nowy film (dla admina)
  static async addMovie(movie: Omit<Movie, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'movies'), movie);
      return docRef.id;
    } catch (error) {
      console.error('Error adding movie:', error);
      throw error;
    }
  }

  static async getMoviesByScreeningDate(dateString: string): Promise<Movie[]> {
    try {
      console.log(`Pobieranie filmów z seansami na dzień: ${dateString}`);
      const screeningsCollectionRef = collection(db, 'screenings');
      const q = query(screeningsCollectionRef, where('date', '==', dateString));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log(`Nie znaleziono seansów na dzień: ${dateString}`);
        return [];
      }

      // Zbierz unikalne ID filmów z seansów
      const movieIds = [...new Set(querySnapshot.docs.map(doc => doc.data().movieId as string))];
      
      // Ogranicz do 12 filmów, aby uniknąć zbyt wielu zapytań do API
      const limitedMovieIds = movieIds.slice(0, 12);
      console.log(`Znaleziono ${limitedMovieIds.length} unikalnych filmów do pobrania.`);

      // Pobierz szczegóły dla każdego filmu równolegle
      const moviePromises = limitedMovieIds.map(id => this.getMovieById(id));
      const movieResults = await Promise.allSettled(moviePromises);

      const movies: Movie[] = [];
      movieResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          movies.push(result.value);
        } else if (result.status === 'rejected') {
          console.error('Błąd podczas pobierania szczegółów filmu:', result.reason);
        }
      });
      
      return movies;

    } catch (error) {
      console.error('Błąd w getMoviesByScreeningDate:', error);
      throw error; // Rzuć błąd, aby komponent mógł go obsłużyć
    }
  }
} 