import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';

import HomePage from '../views/HomePage.vue'
import MovieDetailPage from '../views/MovieDetailPage.vue'
import BookingPage from '../views/BookingPage.vue'
import BookingConfirmationPage from '../views/BookingConfirmationPage.vue'
import BookingsPage from '../views/BookingsPage.vue'
import LoginPage from '../views/LoginPage.vue'
import RegisterPage from '../views/RegisterPage.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/movie/:id',
    name: 'MovieDetail',
    component: MovieDetailPage
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: { guestOnly: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterPage,
    meta: { guestOnly: true }
  },
  {
    path: '/booking/:id',
    name: 'Booking',
    component: BookingPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/booking-confirmation',
    name: 'BookingConfirmation',
    component: BookingConfirmationPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/bookings',
    name: 'Bookings',
    component: BookingsPage,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Funkcja pomocnicza do pobrania stanu użytkownika przy starcie
const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    // Ustawiamy limit czasu, aby aplikacja nie zawieszała się, gdy Firebase nie odpowiada
    const timeoutId = setTimeout(() => {
      reject(new Error("Sprawdzanie stanu uwierzytelnienia przekroczyło limit czasu."));
    }, 5000); // 5 sekund limitu

    const unsubscribe = onAuthStateChanged(auth, user => {
      clearTimeout(timeoutId); // Anuluj limit czasu, jeśli otrzymamy odpowiedź
      unsubscribe();
      resolve(user);
    }, error => {
      clearTimeout(timeoutId); // Anuluj limit czasu również w przypadku błędu
      reject(error);
    });
  });
};

// Strażnik nawigacji
router.beforeEach(async (to, from, next) => {
  try {
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const guestOnly = to.matched.some(record => record.meta.guestOnly);
    const currentUser = await getCurrentUser();

    if (requiresAuth && !currentUser) {
      // Użytkownik niezalogowany próbuje wejść na chronioną stronę
      next('/login');
    } else if (guestOnly && currentUser) {
      // Zalogowany użytkownik próbuje wejść na stronę logowania/rejestracji
      next('/home');
    } else {
      // W pozostałych przypadkach, kontynuuj nawigację
      next();
    }
  } catch (error) {
    console.error("Błąd w strażniku nawigacji:", error);
    // Jeśli wystąpi błąd, załóż, że użytkownik nie jest zalogowany.
    // Zablokuj dostęp do chronionych stron, ale pozwól na nawigację do publicznych.
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    if (requiresAuth) {
      next('/login');
    } else {
      next();
    }
  }
});

export default router
