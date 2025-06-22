<template>
  <ion-card class="movie-card" @click="navigateToMovie">
    <ion-img :src="movie.imageUrl" :alt="movie.title" class="movie-image"></ion-img>
    <div class="card-content-wrapper">
      <ion-card-header>
        <ion-card-title>{{ movie.title }}</ion-card-title>
        <ion-card-subtitle v-if="movie.genre !== 'N/A' && movie.duration !== 'N/A'">
          {{ movie.genre }} • {{ movie.duration }}
        </ion-card-subtitle>
      </ion-card-header>
      <ion-card-content>
        <p class="description">{{ movie.description }}</p>
        <div class="rating">
          <ion-icon :icon="star" v-for="i in 5" :key="i" 
                    :class="{ 'filled': i <= movie.rating, 'empty': i > movie.rating }">
          </ion-icon>
          <span class="rating-text">{{ movie.rating.toFixed(1) }}/5</span>
        </div>
      </ion-card-content>
    </div>
  </ion-card>
</template>

<script setup lang="ts">
import { IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonImg, IonIcon } from '@ionic/vue';
import { star } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import type { Movie } from '../types';

interface Props {
  movie: Movie;
}

const props = defineProps<Props>();
const router = useRouter();

const navigateToMovie = () => {
  router.push(`/movie/${props.movie.id}`);
};
</script>

<style scoped>
.movie-card {
  margin: 0;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  background: var(--ion-color-step-100, #f8f9fa);
}

.movie-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.movie-image {
  width: 100%;
  height: 300px;
  object-fit: cover;
  filter: brightness(0.9);
  transition: filter 0.3s ease;
}

.card-content-wrapper {
  padding: 16px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

ion-card-header {
  padding: 0;
}

ion-card-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--ion-text-color, #000);
}

ion-card-subtitle {
  font-size: 0.8rem;
  color: var(--ion-color-medium-shade, #86888f);
  margin-bottom: 12px;
}

ion-card-content {
  padding: 0;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.description {
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--ion-color-medium, #666);
  flex-grow: 1;
  margin-bottom: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
}

.rating {
  display: flex;
  align-items: center;
  margin-top: auto;
}

.rating ion-icon {
  font-size: 18px;
  margin-right: 3px;
}

.rating .filled {
  color: #ffc409;
}

.rating .empty {
  color: var(--ion-color-step-300, #ddd);
}

.rating-text {
  margin-left: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--ion-color-medium-shade, #86888f);
}

/* Dark mode specific styles */
@media (prefers-color-scheme: dark) {
  .movie-card {
    background: #1e1e1e;
    border: 1px solid #2a2a2a;
  }
  
  ion-card-title {
    color: #f4f5f8;
  }

  ion-card-subtitle {
    color: #989aa2;
  }

  .description {
    color: #989aa2;
  }

  .rating .empty {
    color: #414141;
  }

  .rating-text {
    color: #86888f;
  }
}
</style> 