<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Wybierz miejsca</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div v-if="loading" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
      </div>
      <div v-else-if="error" class="error-container">
        <p>{{ error }}</p>
        <ion-button @click="loadScreening" fill="outline" color="light">Spróbuj ponownie</ion-button>
      </div>

      <div v-else-if="screening && movie" class="booking-container">
        <div class="screening-details ion-padding-horizontal">
          <h1 class="movie-title">{{ movie.title }}</h1>
          <p class="screening-time">{{ formatDate(screening.date) }} • {{ screening.time }} • Sala {{ screening.hall }}</p>
        </div>
        
        <SeatSelector 
          :seats="seats"
          @seats-changed="handleSeatsChanged"
        />
      </div>
    </ion-content>

    <ion-footer v-if="!loading && !error">
      <ion-toolbar class="booking-summary-toolbar">
        <div class="summary-content">
          <div class="price-details">
            <span class="total-label">Łącznie:</span>
            <span class="total-price">{{ totalPrice.toFixed(2) }} zł</span>
            <span v-if="selectedSeats.length > 0" class="seats-count">
              Wybrano: {{ selectedSeats.map(s => `${s.row}${s.number}`).join(', ') }}
            </span>
          </div>
          <ion-button 
            @click="confirmBooking" 
            :disabled="selectedSeats.length === 0 || bookingInProgress"
            class="confirm-button"
          >
            <ion-spinner v-if="bookingInProgress" name="crescent" slot="start"></ion-spinner>
            {{ bookingButtonText }}
          </ion-button>
        </div>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonSpinner, IonButton, IonIcon, toastController, IonFooter, onIonViewWillEnter
} from '@ionic/vue';
import { alertCircle } from 'ionicons/icons';
import SeatSelector from '../components/SeatSelector.vue';
import { MovieService } from '../services/movieService';
import { BookingService } from '../services/bookingService';
import { user } from '../services/authService';
import type { Movie, Screening, Seat } from '../types';

const route = useRoute();
const router = useRouter();
const movie = ref<Movie | null>(null);
const screening = ref<Screening | null>(null);
const seats = ref<Seat[]>([]);
const loading = ref(true);
const error = ref('');
const bookingInProgress = ref(false);

const selectedSeats = computed(() => 
  seats.value.filter(seat => seat.isSelected)
);

const totalPrice = computed(() => 
  selectedSeats.value.length * (screening.value?.price || 0)
);

const bookingButtonText = computed(() => {
  const count = selectedSeats.value.length;
  if (count === 1) {
    return 'Kup bilet';
  }
  return 'Kup bilety';
});

const loadScreening = async () => {
  try {
    loading.value = true;
    error.value = '';
    
    const screeningDataString = route.query.screeningData as string;
    const movieDataString = route.query.movieData as string;

    // Zoptymalizowana ścieżka: dane przekazane w query
    if (screeningDataString && movieDataString) {
      screening.value = JSON.parse(screeningDataString);
      movie.value = JSON.parse(movieDataString);
      // Pobieramy już tylko układ miejsc
      seats.value = await MovieService.getSeatsForScreening(screening.value!.id);
    } else {
      // Ścieżka awaryjna: pobierz wszystko, jeśli brakuje danych w query
      const screeningId = route.params.id as string;
      const screeningFromDB = await MovieService.getScreeningById(screeningId);
      if (!screeningFromDB) throw new Error("Screening not found.");
      screening.value = screeningFromDB;
      
      const [movieData, seatsData] = await Promise.all([
        MovieService.getMovieById(screening.value.movieId),
        MovieService.getSeatsForScreening(screening.value.id)
      ]);

      if (!movieData) throw new Error('Movie not found');
      movie.value = movieData;
      seats.value = seatsData;
    }
  } catch (err) {
    error.value = 'Nie udało się załadować danych seansu.';
    console.error('Error loading screening:', err);
  } finally {
    loading.value = false;
  }
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

const handleSeatsChanged = (updatedSeats: Seat[]) => {
  seats.value = updatedSeats.map(s => ({ ...s }));
};

const confirmBooking = async () => {
  if (selectedSeats.value.length === 0) {
    const toast = await toastController.create({
      message: 'Wybierz przynajmniej jedno miejsce.',
      duration: 2000,
      color: 'warning'
    });
    await toast.present();
    return;
  }

  if (!user.value) {
    const toast = await toastController.create({
      message: 'Musisz być zalogowany, aby dokonać rezerwacji.',
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
    router.push('/login');
    return;
  }
  
  try {
    bookingInProgress.value = true;
    
    // Sprawdź dostępność miejsc przed rezerwacją
    const seatIds = selectedSeats.value.map(seat => seat.id);
    const availability = await BookingService.checkSeatsAvailability(screening.value!.id, seatIds);
    
    if (availability.unavailable.length > 0) {
      const unavailableSeats = availability.unavailable.map(id => {
        const seat = selectedSeats.value.find(s => s.id === id);
        return seat ? `${seat.row}${seat.number}` : id;
      }).join(', ');
      
      const toast = await toastController.create({
        message: `Następujące miejsca nie są już dostępne: ${unavailableSeats}. Wybierz inne miejsca.`,
        duration: 4000,
        color: 'danger'
      });
      await toast.present();
      
      // Odśwież listę miejsc, żeby pokazać aktualny stan
      seats.value = await MovieService.getSeatsForScreening(screening.value!.id);
      return;
    }
    
    const bookingData = {
      userId: user.value.uid,
      screeningId: screening.value!.id,
      movieId: movie.value!.id,
      movieTitle: movie.value!.title,
      movieImageUrl: movie.value!.imageUrl,
      screeningDate: screening.value!.date,
      screeningTime: screening.value!.time,
      seats: seatIds,
      totalPrice: totalPrice.value,
      status: 'confirmed' as const
    };
    
    const bookingId = await BookingService.createBooking(bookingData);
    
    // Przekieruj do strony potwierdzenia
    router.push({
      name: 'BookingConfirmation',
      query: { 
        bookingId: bookingId,
        totalPrice: totalPrice.value.toString(),
        seats: selectedSeats.value.map(s => `${s.row}${s.number}`).join(',')
      }
    });
    
  } catch (err: any) {
    console.error('Error creating booking:', err);
    
    // Handle specific error messages
    let errorMessage = 'Nie udało się zarezerwować miejsc. Spróbuj ponownie.';
    if (err.message?.includes('quota')) {
      errorMessage = 'Serwis tymczasowo niedostępny z powodu limitów. Spróbuj ponownie później.';
    } else if (err.message?.includes('Seat') && err.message?.includes('no longer available')) {
      errorMessage = 'Wybrane miejsca nie są już dostępne. Wybierz inne miejsca.';
    } else if (err.message?.includes('Not enough available seats')) {
      errorMessage = 'Brak wystarczającej liczby dostępnych miejsc.';
    }
    
    const toast = await toastController.create({
      message: errorMessage,
      duration: 4000,
      color: 'danger'
    });
    await toast.present();
    
    // Refresh seats to show current availability
    if (screening.value) {
      seats.value = await MovieService.getSeatsForScreening(screening.value.id);
    }
  } finally {
    bookingInProgress.value = false;
  }
};

onMounted(() => {
  loadScreening();
});

onIonViewWillEnter(() => {
  loadScreening();
});
</script>

<style scoped>
.booking-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #fff;
}

.screening-details {
  text-align: center;
  margin: 16px 0;
}

.movie-title {
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0 0 8px;
}

.screening-time {
  font-size: 1rem;
  color: #a0a0a0;
}

.booking-summary-toolbar {
  --background: #1e1e1e;
  padding: 8px 16px;
}

.summary-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.price-details {
  display: flex;
  flex-direction: column;
}

.total-label {
  font-size: 0.9rem;
  color: #a0a0a0;
}

.total-price {
  font-size: 1.4rem;
  font-weight: bold;
  color: #fff;
}

.seats-count {
  font-size: 0.8rem;
  color: #a0a0a0;
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.confirm-button {
  --background: #529aff;
  --color: white;
  font-weight: bold;
  height: 48px;
}
</style> 