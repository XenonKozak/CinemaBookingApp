<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Moje rezerwacje</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div v-if="loading" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
      </div>
      <div v-else-if="error" class="error-container">
        <p>{{ error }}</p>
        <ion-button @click="loadBookings" fill="outline" color="light">Spróbuj ponownie</ion-button>
      </div>
      <div v-else-if="bookings.length === 0" class="empty-state-container">
        <ion-icon :icon="ticketOutline" class="empty-icon"></ion-icon>
        <h2>Brak rezerwacji</h2>
        <p>Twoje zarezerwowane bilety pojawią się tutaj.</p>
        <ion-button @click="navigateToHome" fill="clear">
          Przeglądaj filmy
          <ion-icon :icon="arrowForward" slot="end"></ion-icon>
        </ion-button>
      </div>

      <ion-list v-else lines="none">
        <ion-card v-for="booking in bookings" :key="booking.id" class="booking-card">
          <div class="booking-header">
            <img 
              v-if="booking.movieImageUrl" 
              :src="booking.movieImageUrl" 
              :alt="booking.movieTitle"
              class="movie-poster"
              @error="handleImageError"
            />
            <div class="movie-info">
              <ion-card-title>{{ booking.movieTitle }}</ion-card-title>
              <ion-card-subtitle>{{ formatDate(booking.screeningDate) }} • {{ booking.screeningTime }}</ion-card-subtitle>
            </div>
          </div>
          <ion-card-content>
            <div class="details">
              <div class="detail-item">
                <ion-icon :icon="ticket" slot="start"></ion-icon>
                <ion-label>
                  <h2>Miejsca</h2>
                  <p>{{ booking.seats.join(', ') }}</p>
                </ion-label>
              </div>
              <div class="detail-item">
                <ion-icon :icon="card" slot="start"></ion-icon>
                <ion-label>
                  <h2>Cena</h2>
                  <p>{{ booking.totalPrice.toFixed(2) }} zł</p>
                </ion-label>
              </div>
            </div>
            <div class="footer">
              <ion-chip :color="getStatusColor(booking.status)" outline>
                <ion-label>{{ getStatusText(booking.status) }}</ion-label>
              </ion-chip>
              <ion-button 
                v-if="booking.status === 'confirmed'"
                @click="cancelBooking(booking.id)" 
                :disabled="cancellingBooking === booking.id"
                fill="clear" 
                color="danger" 
                size="small">
                <ion-spinner v-if="cancellingBooking === booking.id" slot="start" name="dots"></ion-spinner>
                Anuluj
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonRefresher, IonRefresherContent, IonSpinner, IonCard,
  IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonChip, toastController,
  IonList, IonLabel
} from '@ionic/vue';
import { 
  ticketOutline, arrowForward, ticket, card, time, closeCircle, refresh, alertCircle 
} from 'ionicons/icons';
import { BookingService } from '../services/bookingService';
import { user } from '../services/authService';
import type { Booking } from '../types';

const router = useRouter();
const bookings = ref<Booking[]>([]);
const loading = ref(true);
const error = ref('');
const cancellingBooking = ref<string | null>(null);

const loadBookings = async () => {
  if (!user.value) {
    error.value = 'Musisz być zalogowany, aby zobaczyć swoje rezerwacje.';
    loading.value = false;
    return;
  }

  try {
    loading.value = true;
    error.value = '';
    const userBookings = await BookingService.getUserBookings(user.value.uid);
    bookings.value = userBookings.sort((a, b) => b.bookingDate.getTime() - a.bookingDate.getTime());
  } catch (err) {
    console.error('Error loading bookings:', err);
    error.value = 'Nie udało się załadować rezerwacji.';
  } finally {
    loading.value = false;
  }
};

const handleRefresh = async (event: any) => {
  await loadBookings();
  event.target.complete();
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed': return 'success';
    case 'cancelled': return 'danger';
    default: return 'medium';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'confirmed': return 'Potwierdzona';
    case 'cancelled': return 'Anulowana';
    default: return 'Nieznany';
  }
};

const cancelBooking = async (bookingId: string) => {
  try {
    cancellingBooking.value = bookingId;
    await BookingService.cancelBooking(bookingId);
    
    const booking = bookings.value.find(b => b.id === bookingId);
    if (booking) {
      booking.status = 'cancelled';
    }

    const toast = await toastController.create({
      message: 'Rezerwacja została anulowana.',
      duration: 2000,
      color: 'success'
    });
    await toast.present();
    
  } catch (err) {
    console.error('Error cancelling booking:', err);
    const toast = await toastController.create({
      message: 'Nie udało się anulować rezerwacji.',
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
  } finally {
    cancellingBooking.value = null;
  }
};

const navigateToHome = () => {
  router.push('/home');
};

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src = 'https://via.placeholder.com/80x120?text=No+Image';
};

watch(user, (newUser) => {
  if (newUser) {
    loadBookings();
  } else {
    bookings.value = [];
    loading.value = false;
    error.value = 'Zaloguj się, aby zobaczyć rezerwacje.';
  }
});

onMounted(() => {
  loadBookings();
});
</script>

<style scoped>
ion-toolbar {
  --background: #121212;
}

ion-content {
  --background: #121212;
}

.loading-container, .error-container, .empty-state-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: calc(100% - 60px);
  text-align: center;
  padding: 24px;
  color: #fff;
}

.error-container p {
  color: #ffffff;
  margin-bottom: 16px;
}

.error-container ion-button {
  --color: #ffffff;
}

.empty-state-container .empty-icon {
  font-size: 64px;
  color: var(--ion-color-medium);
  margin-bottom: 16px;
}

.empty-state-container h2 {
  font-size: 1.4rem;
  font-weight: bold;
}

.empty-state-container p {
  color: var(--ion-color-medium);
  margin-bottom: 24px;
}

ion-list {
  background: transparent;
  padding: 16px 8px;
}

.booking-card {
  margin: 8px 16px;
  border-radius: 12px;
  --background: #1e1e1e;
  --color: #ffffff;
}

.booking-header {
  display: flex;
  align-items: flex-start;
  padding: 16px 16px 8px 16px;
  gap: 16px;
}

.movie-poster {
  width: 80px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.movie-info {
  flex: 1;
  min-width: 0;
}

.movie-info ion-card-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 4px;
  color: #ffffff;
}

.movie-info ion-card-subtitle {
  font-size: 0.9rem;
  color: #a0a0a0;
  margin-bottom: 8px;
}

.details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-item ion-icon {
  color: #529aff;
  font-size: 1.2rem;
}

.detail-item ion-label h2 {
  font-size: 0.9rem;
  font-weight: 600;
  color: #a0a0a0;
  margin: 0 0 2px 0;
}

.detail-item ion-label p {
  font-size: 1rem;
  color: #ffffff;
  margin: 0;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #333;
}

ion-chip {
  --background: transparent;
  --color: #ffffff;
  font-size: 0.8rem;
}

ion-chip[color="success"] {
  --color: #4ade80;
  --border-color: #4ade80;
}

ion-chip[color="danger"] {
  --color: #f87171;
  --border-color: #f87171;
}
</style> 