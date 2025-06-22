export interface Movie {
  id: string;
  title: string;
  description: string;
  duration: string;
  genre: string;
  imageUrl: string;
  rating: number;
}

export interface Screening {
  id: string;
  movieId: string;
  date: string;
  time: string;
  hall: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
}

export interface Seat {
  id: string;
  row: string;
  number: number;
  isAvailable: boolean;
  isSelected: boolean;
}

export interface Booking {
  id: string;
  userId: string;
  screeningId: string;
  movieId: string;
  movieTitle: string;
  movieImageUrl?: string;
  screeningDate: string;
  screeningTime: string;
  seats: string[];
  totalPrice: number;
  bookingDate: Date;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
} 