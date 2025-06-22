<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Potwierdzenie</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="confirmation-container">
        <div class="confirmation-box">
          
          <div class="header-icon">
            <ion-icon :icon="checkmarkDoneCircle" />
          </div>

          <h1 class="main-title">Rezerwacja potwierdzona!</h1>
          <p class="subtitle">Dziękujemy za zaufanie.</p>

          <div class="booking-details">
            <div class="detail-item">
              <span class="label">Numer rezerwacji</span>
              <span class="value code">{{ bookingId }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Wybrane miejsca</span>
              <span class="value">{{ seats }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Łączna cena</span>
              <span class="value price">{{ formattedPrice }} zł</span>
            </div>
          </div>

          <div class="action-buttons">
            <ion-button expand="block" @click="navigateToBookings" class="main-action">
              <ion-icon :icon="ticketOutline" slot="start" />
              Moje rezerwacje
            </ion-button>
            <ion-button expand="block" @click="navigateToHome" fill="clear" class="secondary-action">
              <ion-icon :icon="homeOutline" slot="start" />
              Powrót do filmów
            </ion-button>
          </div>
        </div>
        
        <div class="info-section">
          <h2 class="info-title">Ważne informacje</h2>
          <ul class="info-list">
            <li><ion-icon :icon="checkmark" /> Przyjdź 15 minut przed rozpoczęciem seansu.</li>
            <li><ion-icon :icon="checkmark" /> Miej przy sobie numer rezerwacji (wystarczy na telefonie).</li>
            <li><ion-icon :icon="checkmark" /> Rezerwację możesz anulować do 2 godzin przed seansem.</li>
            <li><ion-icon :icon="checkmark" /> W przypadku problemów skontaktuj się z obsługą kina.</li>
          </ul>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon 
} from '@ionic/vue';
import { 
  checkmarkDoneCircle, ticketOutline, homeOutline, checkmark
} from 'ionicons/icons';

const route = useRoute();
const router = useRouter();

const bookingId = ref('');
const totalPrice = ref('0');
const seats = ref('');

const formattedPrice = computed(() => {
  const price = parseFloat(totalPrice.value);
  return isNaN(price) ? '0.00' : price.toFixed(2);
});

const updateBookingDetails = () => {
  bookingId.value = route.query.bookingId as string || 'N/A';
  totalPrice.value = route.query.totalPrice as string || '0';
  seats.value = route.query.seats as string || 'N/A';
};

const navigateToBookings = () => {
  router.push('/bookings');
};

const navigateToHome = () => {
  router.push('/home');
};

onMounted(() => {
  updateBookingDetails();
});

watch(() => route.query, () => {
  updateBookingDetails();
});
</script>

<style scoped>
ion-toolbar {
  --background: #121212;
}

ion-content {
  --background: #121212;
}

.confirmation-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100%;
  padding: 24px;
}

.confirmation-box {
  background: #1e1e1e;
  color: #fff;
  border-radius: 20px;
  padding: 32px;
  text-align: center;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
  margin-bottom: 32px;
}

.header-icon {
  font-size: 64px;
  color: var(--ion-color-success, #2dd36f);
  margin-bottom: 16px;
  animation: pop-in 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
}

@keyframes pop-in {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.main-title {
  font-size: 2rem;
  font-weight: bold;
  margin: 0;
}

.subtitle {
  font-size: 1rem;
  color: #a0a0a0;
  margin: 4px 0 24px;
}

.booking-details {
  border-top: 1px solid rgba(255,255,255,0.1);
  border-bottom: 1px solid rgba(255,255,255,0.1);
  padding: 16px 0;
  margin-bottom: 24px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.label {
  color: #a0a0a0;
}

.value {
  font-weight: 500;
}

.value.code {
  font-family: monospace;
  background: rgba(255,255,255,0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.value.price {
  font-weight: bold;
  color: var(--ion-color-primary, #428cff);
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.main-action {
  --background: var(--ion-color-primary);
  --background-activated: var(--ion-color-primary-shade);
  --border-radius: 12px;
  font-weight: bold;
  height: 48px;
}

.secondary-action {
  --color: #a0a0a0;
  --color-activated: #fff;
}

.info-section {
  width: 100%;
  max-width: 500px;
  background: #1e1e1e;
  border-radius: 20px;
  padding: 24px;
}

.info-title {
  font-size: 1.2rem;
  font-weight: bold;
  margin: 0 0 16px;
  text-align: left;
}

.info-list {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
}

.info-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #dcdcdc;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.info-list li ion-icon {
  color: var(--ion-color-success, #2dd36f);
}
</style> 