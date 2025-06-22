<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Logowanie</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" class="ion-padding">
      <div class="login-container">
        <ion-card class="login-card">
          <ion-card-header>
            <ion-card-title class="ion-text-center">Witaj z powrotem!</ion-card-title>
            <ion-card-subtitle class="ion-text-center">Zaloguj się, aby kontynuować</ion-card-subtitle>
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
              required>
            </ion-input>

            <div v-if="error" class="error-message ion-padding-start">
              <ion-icon :icon="alertCircle" color="danger"></ion-icon>
              <span>{{ error }}</span>
            </div>

            <ion-button expand="block" @click="handleLogin" :disabled="loading" class="login-button">
              <ion-spinner v-if="loading" name="crescent"></ion-spinner>
              <span v-if="!loading">Zaloguj się</span>
            </ion-button>
            
            <ion-button expand="block" color="danger" @click="handleGoogleLogin" :disabled="loading" class="google-login-button">
              <ion-icon slot="start" :icon="logoGoogle"></ion-icon>
              Zaloguj się z Google
            </ion-button>

            <div class="register-link ion-text-center">
              <p>Nie masz konta? <router-link to="/register">Zarejestruj się</router-link></p>
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
  IonCardTitle, IonCardSubtitle, IonCardContent, IonInput, IonButton, IonSpinner, IonIcon 
} from '@ionic/vue';
import { alertCircle, logoGoogle } from 'ionicons/icons';
import { AuthService } from '../services/authService';

const router = useRouter();
const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const handleLogin = async () => {
  if (!email.value || !password.value) {
    error.value = 'Wszystkie pola są wymagane.';
    return;
  }
  
  try {
    loading.value = true;
    error.value = '';
    await AuthService.login(email.value, password.value);
    router.push('/home');
  } catch (err: any) {
    handleAuthError(err);
  } finally {
    loading.value = false;
  }
};

const handleGoogleLogin = async () => {
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
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      error.value = 'Nieprawidłowy email lub hasło.';
      break;
    case 'auth/invalid-email':
      error.value = 'Nieprawidłowy format adresu email.';
      break;
    case 'auth/popup-closed-by-user':
      error.value = 'Logowanie przez Google zostało przerwane.';
      break;
    default:
      error.value = 'Wystąpił błąd podczas logowania. Spróbuj ponownie.';
      break;
  }
  console.error('Login error:', err);
};
</script>

<style scoped>
ion-content {
  --background: #121212;
}

.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.login-card {
  max-width: 450px;
  width: 100%;
  margin: 20px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
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

.login-button, .google-login-button {
  margin-top: 16px;
  height: 48px;
  font-size: 16px;
  --border-radius: 12px;
  margin-bottom: 16px;
}

.google-login-button {
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

.register-link {
  text-align: center;
  margin-top: 24px;
  font-size: 0.9em;
}

ion-input {
  margin-bottom: 16px;
}

ion-card-title, ion-card-subtitle {
  color: #ffffff;
}
</style> 