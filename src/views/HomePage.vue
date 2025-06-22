<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-icon :icon="filmOutline" size="large" class="logo-icon"></ion-icon>
        </ion-buttons>
        <ion-title>Kino Booking App</ion-title>
        <ion-buttons slot="end">
          <div v-if="user">
            <ion-chip @click="presentUserMenu($event)">
              <ion-avatar>
                <img :src="user.photoURL || 'https://ionicframework.com/docs/img/demos/avatar.svg'" />
              </ion-avatar>
              <ion-label>{{ user.displayName || user.email }}</ion-label>
            </ion-chip>
          </div>
          <div v-else>
            <ion-button router-link="/login">Zaloguj się</ion-button>
          </div>
        </ion-buttons>
      </ion-toolbar>
      
      <!-- Selektor daty -->
      <ion-toolbar>
        <ion-segment v-model="selectedDate" @ionChange="onDateChange" class="date-selector">
          <ion-segment-button 
            v-for="date in availableDates" 
            :key="date.value" 
            :value="date.value"
          >
            <ion-label>{{ date.label }}</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Kino Booking App</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="container">
        <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
          <ion-refresher-content></ion-refresher-content>
        </ion-refresher>

        <div class="filters-section">
          <div class="filters-header">
            <ion-button 
              fill="clear" 
              @click="toggleFilters"
              class="toggle-filters-btn"
            >
              <ion-icon :icon="filterOutline" slot="start"></ion-icon>
              {{ showFilters ? 'Ukryj filtry' : 'Pokaż filtry' }}
              <ion-icon :icon="showFilters ? chevronUp : chevronDown" slot="end"></ion-icon>
            </ion-button>
          </div>
          
          <div v-if="showFilters" class="filters-content">
            <MovieFilters v-model="currentFilters" />
          </div>
        </div>

        <div v-if="loading" class="loading">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Ładowanie filmów...</p>
        </div>

        <div v-else-if="error" class="error">
          <ion-icon :icon="alertCircle" size="large" color="danger"></ion-icon>
          <p>{{ error }}</p>
          <ion-button @click="loadMovies">Spróbuj ponownie</ion-button>
        </div>

        <div v-else-if="movies.length === 0" class="no-results">
          <ion-icon :icon="searchOutline" size="large" color="medium"></ion-icon>
          <p v-if="Object.keys(currentFilters).length > 0">Nie znaleziono filmów spełniających kryteria wyszukiwania</p>
          <p v-else>Brak filmów w repertuarze na wybrany dzień</p>
          <ion-button v-if="Object.keys(currentFilters).length > 0" @click="clearFiltersAndReload">Wyczyść filtry</ion-button>
        </div>

        <div v-else class="movies-grid">
          <MovieCard 
            v-for="movie in movies" 
            :key="movie.id" 
            :movie="movie"
          />
        </div>

        <ion-fab v-if="user" vertical="bottom" horizontal="end" slot="fixed">
          <ion-fab-button @click="navigateToBookings">
            <ion-icon :icon="ticket"></ion-icon>
          </ion-fab-button>
        </ion-fab>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, h, watch } from 'vue';
import { useRouter } from 'vue-router';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, 
  IonIcon, IonRefresher, IonRefresherContent, IonSpinner, IonFab, IonFabButton,
  IonChip, IonAvatar, IonLabel, popoverController, onIonViewWillEnter, IonSegment, IonSegmentButton
} from '@ionic/vue';
import { ticket, alertCircle, logOut, personCircle, exitOutline, filmOutline, searchOutline, filterOutline, chevronUp, chevronDown } from 'ionicons/icons';
import MovieCard from '../components/MovieCard.vue';
import MovieFilters from '../components/MovieFilters.vue';
import { MovieService, type MovieFilters as MovieFiltersType } from '../services/movieService';
import { AuthService, user } from '../services/authService';
import type { Movie } from '../types';
import { defineComponent } from 'vue';

const router = useRouter();
const movies = ref<Movie[]>([]);
const loading = ref(true);
const error = ref('');
const currentFilters = ref<MovieFiltersType>({});
const showFilters = ref(false);
const selectedDate = ref('today');
const availableDates = ref([
  { value: 'today', label: 'Dzisiaj' },
  { value: 'tomorrow', label: 'Jutro' },
  { value: 'dayAfterTomorrow', label: 'Pojutrze' }
]);

const getTargetDateString = (): string => {
  const date = new Date();
  switch (selectedDate.value) {
    case 'tomorrow':
      date.setDate(date.getDate() + 1);
      break;
    case 'dayAfterTomorrow':
      date.setDate(date.getDate() + 2);
      break;
  }
  return date.toISOString().split('T')[0];
};

const loadMovies = async () => {
  try {
    loading.value = true;
    error.value = '';

    const hasFilters = currentFilters.value && (currentFilters.value.genre || currentFilters.value.searchQuery || currentFilters.value.sortBy || currentFilters.value.year);

    if (hasFilters) {
      movies.value = await MovieService.getMoviesWithFilters(currentFilters.value);
    } else {
      const targetDate = getTargetDateString();
      movies.value = await MovieService.getMoviesByScreeningDate(targetDate);
    }

  } catch (err) {
    error.value = 'Nie udało się załadować filmów. Sprawdź połączenie z internetem.';
    console.error('Error loading movies:', err);
    movies.value = [];
  } finally {
    loading.value = false;
  }
};

const handleRefresh = async (event: any) => {
  await loadMovies();
  event.target.complete();
};

const clearFiltersAndReload = () => {
  currentFilters.value = {};
  loadMovies();
};

const navigateToMovie = (movieId: string) => {
  router.push(`/movie/${movieId}`);
};

const navigateToBookings = () => {
  router.push('/bookings');
};

const toggleFilters = () => {
  showFilters.value = !showFilters.value;
};

const onDateChange = () => {
  localStorage.setItem('selectedDate', selectedDate.value);
  loadMovies();
};

onIonViewWillEnter(() => {
  const savedDate = localStorage.getItem('selectedDate');
  if (savedDate && ['today', 'tomorrow', 'dayAfterTomorrow'].includes(savedDate)) {
    selectedDate.value = savedDate;
  }
  loadMovies();
});

watch(currentFilters, (newFilters) => {
  loadMovies();
}, { deep: true });

const UserMenu = defineComponent({
  setup() {
    const router = useRouter();
    
    const dismissPopover = () => popoverController.dismiss();

    const navigateToBookings = () => {
      router.push('/bookings');
      dismissPopover();
    };

    const handleLogout = async () => {
      await AuthService.logout();
      router.push('/login');
      dismissPopover();
    };

    return () => h(
      'ion-list',
      { style: { padding: '0' } },
      [
        h(
          'ion-item',
          { button: true, onClick: navigateToBookings, lines: 'full' },
          [
            h(IonIcon, { icon: ticket, slot: 'start' }),
            h(IonLabel, 'Moje rezerwacje')
          ]
        ),
        h(
          'ion-item',
          { button: true, onClick: handleLogout, lines: 'none' },
          [
            h(IonIcon, { icon: exitOutline, slot: 'start' }),
            h(IonLabel, 'Wyloguj się')
          ]
        ),
      ]
    );
  }
});

const presentUserMenu = async (event: Event) => {
  const popover = await popoverController.create({
    component: UserMenu,
    event: event,
    translucent: true,
    dismissOnSelect: true
  });
  await popover.present();
};
</script>

<style scoped>
ion-toolbar {
  --background: #000000;
}

.logo-icon {
  margin-inline-start: 10px;
}

ion-content {
  --background: #000000;
}

ion-chip {
  cursor: pointer;
  --background: #1a1a1a;
  --color: #ffffff;
}

.container {
  padding: 16px;
}

.loading, .error, .no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  text-align: center;
}

.loading ion-spinner {
  margin-bottom: 16px;
}

.error ion-icon, .no-results ion-icon {
  margin-bottom: 16px;
}

.error p, .no-results p {
  margin-bottom: 16px;
  color: #ffffff;
}

.movies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
  padding: 16px 0;
}

.loading p {
  color: #ffffff;
}

.error ion-button, .no-results ion-button {
  --color: #ffffff;
}

@media (max-width: 768px) {
  .movies-grid {
    grid-template-columns: 1fr;
  }
}

.filters-section {
  margin-bottom: 16px;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
}

.toggle-filters-btn {
  --color: #ffffff;
}

.filters-content {
  padding: 8px;
}

.date-selector {
  --background: #1e1e1e;
  --color: #a0a0a0;
  --color-checked: #529aff;
  --indicator-color: #529aff;
  padding: 8px 16px;
}

.date-selector ion-segment-button {
  --color: #a0a0a0;
  --color-checked: #529aff;
  --indicator-color: #529aff;
  font-size: 0.9rem;
  font-weight: 500;
}

.date-selector ion-segment-button::part(indicator) {
  background: #529aff;
}

.date-selector ion-segment-button::part(indicator-background) {
  background: transparent;
}
</style>
