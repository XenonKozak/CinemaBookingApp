# 🎬 Cinema Booking App

Nowoczesna i w pełni responsywna aplikacja do rezerwacji biletów w kinie, zbudowana przy użyciu **Ionic Vue** i **Firebase**. Projekt oferuje płynne animacje, intuicyjny interfejs oraz obsługę rezerwacji w czasie rzeczywistym.

---

## ✨ Kluczowe Funkcjonalności

-   **Logowanie i Rejestracja**:
    -   Obsługa uwierzytelniania za pomocą emaila/hasła.
    -   Integracja z **Google Sign-In** dla szybkiego dostępu.
-   **Przeglądanie Filmów**:
    -   Dynamicznie ładowana lista filmów z Firebase.
    -   Wyświetlanie ocen, gatunków i czasu trwania.
-   **Szczegóły Filmu**:
    -   Dedykowana strona dla każdego filmu z pełnym opisem.
    -   Lista dostępnych seansów.
-   **System Rezerwacji**:
    -   Interaktywny selektor miejsc z wizualizacją statusu (wolne, zajęte, wybrane).
    -   Podsumowanie rezerwacji w czasie rzeczywistym.
-   **Moje Rezerwacje**:
    -   Dostęp do historii rezerwacji użytkownika.
    -   Możliwość anulowania potwierdzonych rezerwacji.
-   **Nowoczesny Interfejs**:
    -   Płynne animacje przejść między stronami.
    -   Wsparcie dla **Dark Mode** i responsywny design.

## 🛠️ Użyte Technologie

| Kategoria  | Technologia                                          |
| :--------- | :--------------------------------------------------- |
| Framework  | **Ionic 8** z **Vue 3** (Composition API)            |
| Język      | **TypeScript**                                       |
| Backend    | **Firebase** (Firestore, Authentication)             |
| Build Tool | **Vite**                                             |
| Wdrożenie  | **Capacitor**                                        |
| Routing    | `vue-router`                                         |
| Styling    | CSS Variables, Scoped CSS                            |

## 🚀 Instalacja i Uruchomienie

### Wymagania wstępne

-   [Node.js](https://nodejs.org/) (wersja 18.x lub nowsza)
-   Konto [Firebase](https://firebase.google.com/)

### 1. Klonowanie Repozytorium

```bash
git clone <adres-repozytorium>
cd cinemaBookingApp
```

### 2. Instalacja Zależności

```bash
npm install
```

### 3. Konfiguracja Firebase

1.  Przejdź do [konsoli Firebase](https://console.firebase.google.com/) i utwórz nowy projekt.
2.  W ustawieniach projektu dodaj nową aplikację webową.
3.  Skopiuj obiekt `firebaseConfig` i wklej go do pliku `src/firebase/config.ts`.
4.  W zakładce **Authentication** włącz dostawców "Email/Password" oraz "Google".
5.  W zakładce **Firestore Database** utwórz nową bazę danych w trybie produkcyjnym.

**Przykład pliku `src/firebase/config.ts`:**

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "TWOJ_KLUCZ_API",
  authDomain: "TWOJ_AUTH_DOMAIN",
  projectId: "TWOJ_PROJECT_ID",
  storageBucket: "TWOJ_STORAGE_BUCKET",
  messagingSenderId: "TWOJ_MESSAGING_SENDER_ID",
  appId: "TWOJ_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
```

### 4. Uruchomienie Aplikacji

```bash
# Uruchomienie serwera deweloperskiego
npm run dev
```

## 🏗️ Struktura Projektu

```
/
├── public/                # Zasoby statyczne
├── src/
│   ├── apiConfig.ts       # Konfiguracja API (opcjonalnie)
│   ├── components/        # Komponenty reużywalne (MovieCard, SeatSelector)
│   ├── firebase/          # Konfiguracja Firebase
│   ├── router/            # Konfiguracja vue-router
│   ├── services/          # Logika biznesowa (auth, booking, movie)
│   ├── theme/             # Globalne style i zmienne CSS
│   ├── types/             # Interfejsy TypeScript
│   ├── views/             # Komponenty stron
│   ├── App.vue            # Główny komponent aplikacji
│   └── main.ts            # Plik startowy
├── capacitor.config.ts    # Konfiguracja Capacitor
├── package.json           # Zależności i skrypty
└── README.md              # Ta dokumentacja
```

## 📱 Wdrożenie na Urządzenia Mobilne (Capacitor)

### Android

```bash
# Dodaj platformę Android do projektu
npx cap add android

# Zsynchronizuj projekt webowy z natywnym
npx cap sync

# Otwórz projekt w Android Studio
npx cap open android
```

### iOS

```bash
# Dodaj platformę iOS do projektu
npx cap add ios

# Zsynchronizuj projekt webowy z natywnym
npx cap sync

# Otwórz projekt w Xcode
npx cap open ios
```

---

Projekt stworzony w celach edukacyjnych i demonstracyjnych. 