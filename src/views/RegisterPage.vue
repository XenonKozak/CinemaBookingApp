<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/login"></ion-back-button>
        </ion-buttons>
        <ion-title>Rejestracja</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" class="ion-padding">
      <div class="register-container">
        <ion-card class="register-card">
          <ion-card-header>
            <ion-card-title class="ion-text-center">Utwórz konto</ion-card-title>
            <ion-card-subtitle class="ion-text-center">Wypełnij formularz, aby dołączyć</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <ion-input
              label="Email"
              label-placement="floating"
              fill="outline"
              v-model="email"
              type="email"
              class="ion-margin-bottom"
              required>
            </ion-input>

            <ion-input
              label="Hasło"
              label-placement="floating"
              fill="outline"
              v-model="password"
              type="password"
              class="ion-margin-bottom"
              required>
            </ion-input>

            <ion-input
              label="Potwierdź hasło"
              label-placement="floating"
              fill="outline"
              v-model="confirmPassword"
              type="password"
              required>
            </ion-input>

            <div v-if="error" class="error-message">
              <ion-icon :icon="alertCircle" color="danger"></ion-icon>
              <span>{{ error }}</span>
            </div>

            <ion-button expand="block" @click="handleRegister" :disabled="loading" class="register-button">
              <ion-spinner v-if="loading" name="crescent"></ion-spinner>
              <span v-if="!loading">Zarejestruj się</span>
            </ion-button>

            <ion-button expand="block" color="danger" @click="handleGoogleRegister" :disabled="loading" class="google-register-button">
              <ion-icon slot="start" :icon="logoGoogle"></ion-icon>
              Zarejestruj się z Google
            </ion-button>

            <div class="login-link">
              <p>Masz już konto? <router-link to="/login">Zaloguj się</router-link></p>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, 
  IonCardTitle, IonCardSubtitle, IonCardContent, IonInput, 
  IonButton, IonSpinner, IonIcon, IonButtons, IonBackButton
} from '@ionic/vue';
import { alertCircle, logoGoogle } from 'ionicons/icons';
import { AuthService } from '../services/authService';

const router = useRouter();
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const error = ref('');
const loading = ref(false);

const handleRegister = async () => {
  if (!email.value || !password.value || !confirmPassword.value) {
    error.value = 'Wszystkie pola są wymagane.';
    return;
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'Hasła nie są takie same.';
    return;
  }

  try {
    loading.value = true;
    error.value = '';
    await AuthService.register(email.value, password.value);
    router.push('/home');
  } catch (err: any) {
    handleAuthError(err);
  } finally {
    loading.value = false;
  }
};

const handleGoogleRegister = async () => {
  try {
    loading.value = true;
    error.value = '';
    await AuthService.loginWithGoogle();
    router.push('/home');
  } catch (err: any) {
    handleAuthError(err);
  } finally {
    loading.value = false;
  }
};

const handleAuthError = (err: any) => {
  switch (err.code) {
    case 'auth/email-already-in-use':
      error.value = 'Ten adres email jest już zajęty.';
      break;
    case 'auth/invalid-email':
      error.value = 'Nieprawidłowy format adresu email.';
      break;
    case 'auth/weak-password':
      error.value = 'Hasło jest zbyt słabe. Powinno mieć co najmniej 6 znaków.';
      break;
    case 'auth/popup-closed-by-user':
      error.value = 'Rejestracja przez Google została przerwana.';
      break;
    default:
      error.value = 'Wystąpił błąd podczas rejestracji. Spróbuj ponownie.';
      break;
  }
  console.error('Registration error:', err);
};
</script>

<style scoped>
ion-content {
  --background: #121212;
}

ion-card-title,
ion-card-subtitle {
  color: #ffffff;
}

.register-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.register-card {
  max-width: 450px;
  width: 100%;
  margin: 20px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  --background: #1e1e1e;
  background: #1e1e1e;
  color: #ffffff;
  padding: 16px;
}

ion-card-header {
  padding-bottom: 16px;
  box-shadow: none;
  color: #ffffff;
}

.register-button, .google-register-button {
  margin-top: 16px;
  height: 48px;
  font-size: 16px;
  --border-radius: 12px;
}

.google-register-button {
  margin-top: 12px;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ion-color-danger);
  margin-top: 16px;
  font-size: 0.9em;
}

.login-link {
  text-align: center;
  margin-top: 24px;
  font-size: 0.9em;
}

ion-input {
  margin-bottom: 16px;
}
</style> 