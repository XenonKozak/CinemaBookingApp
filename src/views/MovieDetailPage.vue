<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" />
        </ion-buttons>
        <ion-title>{{ movie?.title || 'Film' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div v-if="loadingMovie" class="loading-container">
        <ion-spinner name="crescent" />
      </div>
      <div v-else-if="movieError" class="error-container">
        <p>{{ movieError }}</p>
        <ion-button @click="loadMovieAndScreenings" fill="outline" color="light">Spróbuj ponownie</ion-button>
      </div>

      <div v-else-if="movie" class="movie-detail-container">
        <div class="hero-background" :style="{ backgroundImage: `url(${movie.imageUrl})` }"></div>
        <div class="hero-content">
          <div class="poster">
            <ion-img :src="movie.imageUrl" :alt="movie.title" />
          </div>
          <div class="info">
            <h1 class="title">{{ movie.title }}</h1>
            <div class="meta">
              <ion-chip>{{ movie.genre }}</ion-chip>
              <ion-chip>{{ movie.duration }}</ion-chip>
              <div class="rating">
                <template v-for="i in 5" :key="i">
                  <ion-icon 
                    :icon="i <= Math.floor(movie.rating) ? star : i - 0.5 <= movie.rating ? starHalf : starOutline"
                  />
                </template>
                <span>{{ movie.rating.toFixed(1) }}/5</span>
              </div>
            </div>
          </div>
        </div>

        <div class="content-wrapper">
          <div class="section">
            <h2 class="section-title">Opis</h2>
            <p class="description">{{ movie.description }}</p>
          </div>

          <div class="section">
            <h2 class="section-title">Dostępne seanse</h2>
            <div v-if="loadingScreenings" class="loading-container">
              <ion-spinner name="crescent" />
            </div>
            <div v-else-if="screeningsError" class="error-container">
              <p>{{ screeningsError }}</p>
              <ion-button @click="loadMovieAndScreenings" fill="outline" color="light">Spróbuj ponownie</ion-button>
            </div>
            <div v-else-if="filteredScreenings.length > 0" class="screenings-grid">
              <ion-card
                v-for="screening in filteredScreenings"
                :key="screening.id"
                @click="selectScreening(screening)"
                button
                class="screening-card"
              >
                <ion-card-header>
                  <ion-card-title>{{ screening.time || 'Brak godziny' }}</ion-card-title>
                  <ion-card-subtitle>Sala {{ screening.hall }}</ion-card-subtitle>
                </ion-card-header>
                <ion-card-content>
                  <div class="price">{{ screening.price }} zł</div>
                  <div class="seats">{{ screening.availableSeats }} miejsc</div>
                </ion-card-content>
              </ion-card>
            </div>
            <div v-else class="no-screenings-info">
              <p>Brak dostępnych seansów dla wybranego dnia.</p>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonSpinner, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonChip,
  IonIcon, IonImg, IonButton, IonCardSubtitle, onIonViewWillEnter
} from '@ionic/vue';
import { star, starHalf, starOutline } from 'ionicons/icons';
import { MovieService } from '../services/movieService';
import type { Movie, Screening } from '../types';

const route = useRoute();
const router = useRouter();

const movie = ref<Movie | null>(null);
const loadingMovie = ref(true);
const movieError = ref('');

const screenings = ref<Screening[]>([]);
const loadingScreenings = ref(true);
const screeningsError = ref('');

const filteredScreenings = ref<Screening[]>([]);

const loadMovieAndScreenings = async () => {
  const movieId = route.params.id as string;
  if (!movieId) {
    movieError.value = "Nie znaleziono ID filmu.";
    loadingMovie.value = false;
    return;
  }

  // Reset stanów
  loadingMovie.value = true;
  movieError.value = '';
  loadingScreenings.value = true;
  screeningsError.value = '';
  
  // Równoległe pobieranie danych filmu i seansów
  const [movieResult, screeningsResult] = await Promise.allSettled([
    MovieService.getMovieById(movieId),
    MovieService.getOrCreateScreeningsForMovie(movieId)
  ]);

  // Obsługa wyniku pobierania filmu
  if (movieResult.status === 'fulfilled' && movieResult.value) {
    movie.value = movieResult.value;
  } else {
    console.error("Błąd podczas ładowania danych filmu:", movieResult.status === 'rejected' ? movieResult.reason : 'Film nie istnieje');
    movieError.value = "Nie udało się pobrać informacji o filmie.";
  }
  loadingMovie.value = false;

  // Obsługa wyniku pobierania seansów
  if (screeningsResult.status === 'fulfilled' && screeningsResult.value.length > 0) {
    screenings.value = screeningsResult.value;
    filterScreeningsByDate();
  } else {
    const reason = screeningsResult.status === 'rejected' ? screeningsResult.reason : 'Brak seansów';
    console.error("Błąd podczas ładowania seansów:", reason);
    screeningsError.value = "Nie udało się załadować listy seansów lub są one niedostępne.";
  }
  loadingScreenings.value = false;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pl-PL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const selectScreening = (screening: Screening) => {
  console.log('Wybrano seans:', screening);
  console.log('Nawigacja do /booking/ z danymi:', { movie: movie.value, screening });
  
  router.push({
    name: 'Booking',
    params: { id: screening.id },
    query: { 
      screeningData: JSON.stringify(screening),
      movieData: JSON.stringify(movie.value) 
    }
  });
};

const filterScreeningsByDate = () => {
  const selectedDate = localStorage.getItem('selectedDate') || 'today';
  
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  let targetDate: string;
  switch (selectedDate) {
    case 'today':
      targetDate = today.toISOString().split('T')[0];
      break;
    case 'tomorrow':
      targetDate = tomorrow.toISOString().split('T')[0];
      break;
    case 'dayAfterTomorrow':
      targetDate = dayAfterTomorrow.toISOString().split('T')[0];
      break;
    default:
      targetDate = today.toISOString().split('T')[0];
  }

  filteredScreenings.value = screenings.value
    .filter(screening => screening.date === targetDate)
    .sort((a, b) => a.time.localeCompare(b.time));
};

onIonViewWillEnter(() => {
  loadMovieAndScreenings();
});
</script>

<style scoped>
ion-toolbar {
  --background: #121212;
}

ion-content {
  --background: #121212;
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #fff;
  padding: 16px;
  text-align: center;
}

.movie-detail-container {
  color: #fff;
}

.hero-background {
  height: 35vh;
  background-size: cover;
  background-position: center;
  filter: blur(20px) brightness(0.4);
  transform: scale(1.1);
}

.hero-content {
  display: flex;
  align-items: flex-end;
  gap: 24px;
  padding: 24px;
  margin-top: -15vh;
  position: relative;
}

.poster {
  width: 150px;
  flex-shrink: 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}

.info .title {
  font-size: 2.2rem;
  font-weight: bold;
  margin: 0 0 16px;
  line-height: 1.2;
}

.meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.meta ion-chip {
  --background: rgba(255, 255, 255, 0.1);
  --color: #f4f5f8;
  font-size: 0.9rem;
}

.rating {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ffc409;
}

.rating span {
  margin-left: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #fff;
}

.content-wrapper {
  padding: 0 24px 24px;
}

.section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.description {
  font-size: 1rem;
  line-height: 1.7;
  color: #dcdcdc;
}

.screenings-section {
  margin-top: 16px;
}

.screenings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.screening-card {
  --background: #1e1e1e;
  color: #fff;
  border-radius: 12px;
  text-align: center;
  transition: all 0.2s ease-in-out;
}

.screening-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.3);
}

.screening-card ion-card-header {
  padding: 16px 12px 8px;
}

.screening-card ion-card-title {
  font-size: 1.4rem;
  font-weight: bold;
}

.screening-card ion-card-subtitle {
  font-size: 0.85rem;
  color: #a0a0a0;
}

.screening-card ion-card-content {
  padding: 0 12px 16px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  font-size: 0.9rem;
}
.no-screenings-info {
  text-align: center;
  color: #888;
  margin-top: 24px;
}
</style> 