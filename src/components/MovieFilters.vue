<template>
  <div class="filters-container">
    <ion-card class="filters-card">
      <ion-card-content>
        <!-- Wyszukiwanie -->
        <div class="filter-wrapper">
          <ion-label class="search-label">Wyszukaj</ion-label>
          <ion-item class="search-item" lines="none">
            <ion-icon :icon="search" slot="start"></ion-icon>
            <ion-input
              v-model="searchQuery"
              placeholder="Wpisz tytuł..."
              @ionInput="onSearchInput"
              clear-input
            ></ion-input>
          </ion-item>
        </div>

        <!-- Filtry -->
        <div class="filters-row">
          <!-- Gatunek -->
          <div class="filter-wrapper">
            <ion-label>Gatunek</ion-label>
            <ion-item class="filter-item" lines="none">
              <ion-select
                v-model="selectedGenre"
                placeholder="Wszystkie"
                @ionChange="applyFilters"
                interface="popover"
              >
                <ion-select-option value="">Wszystkie</ion-select-option>
                <ion-select-option
                  v-for="genre in genres"
                  :key="genre.id"
                  :value="genre.id"
                >
                  {{ genre.name }}
                </ion-select-option>
              </ion-select>
            </ion-item>
          </div>

          <!-- Rok -->
          <div class="filter-wrapper">
            <ion-label>Rok</ion-label>
            <ion-item class="filter-item" lines="none">
              <ion-select
                v-model="selectedYear"
                placeholder="Wszystkie"
                @ionChange="applyFilters"
                interface="popover"
              >
                <ion-select-option value="">Wszystkie</ion-select-option>
                <ion-select-option
                  v-for="year in availableYears"
                  :key="year"
                  :value="year"
                >
                  {{ year }}
                </ion-select-option>
              </ion-select>
            </ion-item>
          </div>

          <!-- Sortowanie -->
          <div class="filter-wrapper">
            <ion-label>Sortuj według</ion-label>
            <ion-item class="filter-item" lines="none">
              <ion-select
                v-model="selectedSort"
                @ionChange="applyFilters"
                interface="popover"
              >
                <ion-select-option value="popularity.desc">Popularność</ion-select-option>
                <ion-select-option value="vote_average.desc">Ocena</ion-select-option>
                <ion-select-option value="release_date.desc">Data premiery</ion-select-option>
                <ion-select-option value="title.asc">Tytuł A-Z</ion-select-option>
              </ion-select>
            </ion-item>
          </div>
        </div>

        <!-- Przyciski akcji -->
        <div class="filters-actions">
          <ion-button
            fill="clear"
            @click="clearFilters"
            :disabled="!hasActiveFilters"
          >
            <ion-icon :icon="refresh" slot="start"></ion-icon>
            Wyczyść filtry
          </ion-button>
        </div>
      </ion-card-content>
    </ion-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { 
  IonCard, IonCardContent, IonItem, IonLabel, IonInput, IonSelect, 
  IonSelectOption, IonButton, IonIcon 
} from '@ionic/vue';
import { search, refresh } from 'ionicons/icons';
import { MovieService, type MovieFilters, type Genre } from '../services/movieService';

interface Props {
  modelValue: MovieFilters;
}

interface Emits {
  (e: 'update:modelValue', value: MovieFilters): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const searchQuery = ref('');
const selectedGenre = ref<number | ''>('');
const selectedYear = ref<number | ''>('');
const selectedSort = ref('popularity.desc');
const genres = ref<Genre[]>([]);

// Generuj dostępne lata (od 2024 do 1990)
const availableYears = computed(() => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear; year >= 1990; year--) {
    years.push(year);
  }
  return years;
});

const hasActiveFilters = computed(() => {
  return searchQuery.value || selectedGenre.value || selectedYear.value;
});

// Debounced search
let searchTimeout: NodeJS.Timeout;
const onSearchInput = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    applyFilters();
  }, 500);
};

const applyFilters = () => {
  const filters: MovieFilters = {
    sortBy: selectedSort.value as any
  };

  if (searchQuery.value) {
    filters.searchQuery = searchQuery.value;
  } else {
    if (selectedGenre.value) {
      filters.genre = selectedGenre.value as number;
    }
    if (selectedYear.value) {
      filters.year = selectedYear.value as number;
    }
  }

  emit('update:modelValue', filters);
};

const clearFilters = () => {
  searchQuery.value = '';
  selectedGenre.value = '';
  selectedYear.value = '';
  selectedSort.value = 'popularity.desc';
  applyFilters();
};

const loadGenres = async () => {
  try {
    genres.value = await MovieService.getGenres();
  } catch (error) {
    console.error('Error loading genres:', error);
  }
};

onMounted(() => {
  loadGenres();
});
</script>

<style scoped>
.filters-container {
  margin-bottom: 20px;
}

.filters-card {
  margin: 0;
  border-radius: 12px;
  background: #1e1e1e;
  border: 1px solid #2a2a2a;
  padding: 8px;
}

.filter-wrapper {
  margin-bottom: 12px;
}

.filter-wrapper > ion-label {
  font-size: 0.9em;
  font-weight: 500;
  color: #c0c0c0;
  display: block;
  margin-bottom: 6px;
  padding-left: 4px;
}

.search-item,
.filter-item {
  --background: #282828;
  --border-radius: 8px;
  --padding-start: 12px;
  --inner-padding-end: 12px;
  --min-height: 48px;
}

.search-item ion-icon {
  color: #86888f;
  margin-right: 6px;
}

.search-item ion-input {
  --color: #ffffff;
  --placeholder-color: #86888f;
}

.filters-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 8px;
}

.filter-item ion-select {
  width: 100%;
  --color: #ffffff;
  --placeholder-color: #c0c0c0;
  font-size: 0.95em;
}

.filters-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.filters-actions ion-button {
  --color: #86888f;
  --color-hover: #ffffff;
  font-size: 0.9em;
}

.filters-actions ion-button[disabled] {
  --color: #414141;
}

@media (max-width: 768px) {
  .filters-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}
</style> 