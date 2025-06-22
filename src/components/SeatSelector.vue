<template>
  <div class="seat-selector-container">
    <div class="screen-arc">
      <span>EKRAN</span>
    </div>
    
    <div class="seats-grid">
      <template v-for="row in seatRows" :key="row">
        <div class="row-label">{{ row }}</div>
        <div class="seat" v-for="seat in getSeatsInRow(row)" :key="seat.id"
             :class="{
               available: seat.isAvailable,
               selected: seat.isSelected,
               occupied: !seat.isAvailable
             }"
             @click="toggleSeat(seat)">
        </div>
        <div class="row-label">{{ row }}</div>
      </template>
    </div>

    <div class="legend">
      <div class="legend-item">
        <div class="legend-box available"></div>
        <span>Dostępne</span>
      </div>
      <div class="legend-item">
        <div class="legend-box selected"></div>
        <span>Wybrane</span>
      </div>
      <div class="legend-item">
        <div class="legend-box occupied"></div>
        <span>Zajęte</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Seat } from '../types';

interface Props {
  seats: Seat[];
}

interface Emits {
  (e: 'seats-changed', seats: Seat[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const seatRows = computed(() => 
  [...new Set(props.seats.map(seat => seat.row))].sort()
);

const getSeatsInRow = (row: string) => 
  props.seats.filter(seat => seat.row === row).sort((a, b) => a.number - b.number);

const toggleSeat = (seat: Seat) => {
  if (!seat.isAvailable) return;
  
  const updatedSeats = props.seats.map(s => {
    if (s.id === seat.id) {
      return { ...s, isSelected: !s.isSelected };
    }
    return s;
  });
  
  emit('seats-changed', updatedSeats);
};
</script>

<style scoped>
.seat-selector-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0;
  overflow-x: auto;
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
.seat-selector-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}


.screen-arc {
  width: 80%;
  max-width: 500px;
  height: 40px;
  border-bottom: 4px solid #444;
  border-radius: 0 0 50% 50% / 0 0 100% 100%;
  text-align: center;
  margin-bottom: 32px;
  color: #888;
  font-weight: bold;
}

.seats-grid {
  display: grid;
  grid-template-columns: auto repeat(12, 1fr) auto;
  gap: 8px;
  justify-content: center;
  perspective: 500px;
}

.row-label {
  text-align: center;
  color: #888;
  font-weight: bold;
  align-self: center;
}

.seat {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: #444;
}

.seat.available:hover {
  background-color: #666;
  transform: scale(1.1);
}

.seat.selected {
  background-color: #529aff;
  transform: scale(1.1);
  box-shadow: 0 0 16px 2px #529aff;
}

.seat.occupied {
  background-color: #2a2a2a;
  cursor: not-allowed;
}

.legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 32px;
  width: 100%;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ccc;
  font-size: 0.9rem;
}

.legend-box {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

.legend-box.available {
  background-color: #444;
}

.legend-box.selected {
  background-color: #529aff;
}

.legend-box.occupied {
  background-color: #2a2a2a;
}
</style> 