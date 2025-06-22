import { collection, getDocs, doc, getDoc, addDoc, updateDoc, query, where, orderBy, runTransaction } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Booking, Seat } from '../types';

export class BookingService {
  /**
   * Sprawdza dostępność wybranych miejsc przed rezerwacją.
   */
  static async checkSeatsAvailability(screeningId: string, seatIds: string[]): Promise<{ available: string[], unavailable: string[] }> {
    try {
      const available: string[] = [];
      const unavailable: string[] = [];

      for (const seatId of seatIds) {
        const seatRef = doc(db, 'screenings', screeningId, 'seats', seatId);
        const seatSnap = await getDoc(seatRef);
        
        if (seatSnap.exists() && seatSnap.data()?.isAvailable) {
          available.push(seatId);
        } else {
          unavailable.push(seatId);
        }
      }

      return { available, unavailable };
    } catch (error: any) {
      console.error('Error checking seats availability:', error);
      // W przypadku błędu, załóż że wszystkie miejsca są niedostępne
      return { available: [], unavailable: seatIds };
    }
  }

  /**
   * Tworzy nową rezerwację.
   */
  static async createBooking(bookingData: Omit<Booking, 'id' | 'bookingDate'>): Promise<string> {
    try {
      let bookingId = '';

      await runTransaction(db, async (transaction) => {
        const { screeningId, seats } = bookingData;

        // 1. Definiowanie wszystkich referencji
        const newBookingRef = doc(collection(db, 'bookings'));
        bookingId = newBookingRef.id;
        const screeningRef = doc(db, 'screenings', screeningId);
        const seatRefs = seats.map(seatId => doc(db, 'screenings', screeningId, 'seats', seatId));
        
        // 2. Wszystkie odczyty na początku transakcji
        const screeningSnap = await transaction.get(screeningRef);
        const seatSnaps = await Promise.all(seatRefs.map(ref => transaction.get(ref)));

        // 3. Walidacja danych (po odczytach)
        if (!screeningSnap.exists()) {
          throw new Error("Screening does not exist!");
        }

        for (const seatSnap of seatSnaps) {
            if (!seatSnap.exists() || !seatSnap.data()?.isAvailable) {
                const seatId = seatSnap.ref.id;
                throw new Error(`Seat ${seatId} is no longer available.`);
            }
        }

        const currentAvailableSeats = screeningSnap.data().availableSeats;
        if (currentAvailableSeats < seats.length) {
            throw new Error("Not enough available seats.");
        }
        
        // 4. Wszystkie zapisy na końcu transakcji
        const newAvailableSeats = currentAvailableSeats - seats.length;
        transaction.update(screeningRef, { availableSeats: newAvailableSeats });

        for (const seatRef of seatRefs) {
            transaction.update(seatRef, { isAvailable: false });
        }
        
        const bookingWithDate = {
            ...bookingData,
            bookingDate: new Date()
        };
        transaction.set(newBookingRef, bookingWithDate);
      });
      
      return bookingId;
    } catch (error: any) {
      
      if (error.code === 'resource-exhausted' || error.message?.includes('quota')) {
        console.warn('Firebase quota exceeded. Cannot create booking.');
        throw new Error('Service temporarily unavailable due to quota limits. Please try again later.');
      }
      
      
      if (error.code === 'permission-denied' || error.code === 'unavailable') {
        console.warn('Firebase access denied or unavailable.');
        throw new Error('Service temporarily unavailable. Please try again later.');
      }
      
      console.error('Error creating booking with transaction:', error);
      // Rzuć błąd dalej, aby można było go obsłużyć w komponencie
      throw error;
    }
  }

  /**
   * Pobiera rezerwacje użytkownika.
   */
  static async getUserBookings(userId: string): Promise<Booking[]> {
    try {
      const q = query(
        collection(db, 'bookings'), 
        where('userId', '==', userId),
        orderBy('bookingDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const bookings = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Konwertuj Firebase Timestamp na obiekt Date
          bookingDate: data.bookingDate.toDate()
        } as Booking;
      });
      
      return bookings;
    } catch (error: any) {
      
      if (error.code === 'resource-exhausted' || error.message?.includes('quota')) {
        console.warn('Firebase quota exceeded. Returning empty bookings list.');
        return [];
      }
      
      // Handle other Firebase errors
      if (error.code === 'permission-denied' || error.code === 'unavailable') {
        console.warn('Firebase access denied or unavailable. Returning empty bookings list.');
        return [];
      }
      
      console.error('Error fetching user bookings:', error);
      throw error;
    }
  }

  /**
   * Pobiera jedną rezerwację po jej ID.
   */
  static async getBookingById(id: string): Promise<Booking | null> {
    try {
      const docRef = doc(db, 'bookings', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return { 
          id: docSnap.id, 
          ...data,
          bookingDate: data.bookingDate.toDate()
        } as Booking;
      }
      return null;
    } catch (error: any) {
      
      if (error.code === 'resource-exhausted' || error.message?.includes('quota')) {
        console.warn('Firebase quota exceeded. Cannot fetch booking.');
        return null;
      }
      
     
      if (error.code === 'permission-denied' || error.code === 'unavailable') {
        console.warn('Firebase access denied or unavailable. Cannot fetch booking.');
        return null;
      }
      
      console.error('Error fetching booking:', error);
      throw error;
    }
  }

  /**
   * Anuluje rezerwację, zmieniając jej status.
   */
  static async cancelBooking(bookingId: string): Promise<void> {
    try {
      const docRef = doc(db, 'bookings', bookingId);
      await updateDoc(docRef, { status: 'cancelled' });
    } catch (error: any) {
      // Handle Firebase quota exceeded error
      if (error.code === 'resource-exhausted' || error.message?.includes('quota')) {
        console.warn('Firebase quota exceeded. Cannot cancel booking.');
        throw new Error('Service temporarily unavailable due to quota limits. Please try again later.');
      }
      
      
      if (error.code === 'permission-denied' || error.code === 'unavailable') {
        console.warn('Firebase access denied or unavailable. Cannot cancel booking.');
        throw new Error('Service temporarily unavailable. Please try again later.');
      }
      
      console.error('Error cancelling booking:', error);
      throw error;
    }
  }

  // Sprawdź dostępność miejsc
  static async checkSeatAvailability(screeningId: string): Promise<Seat[]> {
    try {
      const q = query(collection(db, 'seats'), where('screeningId', '==', screeningId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Seat[];
    } catch (error: any) {
      // Handle Firebase quota exceeded error
      if (error.code === 'resource-exhausted' || error.message?.includes('quota')) {
        console.warn('Firebase quota exceeded. Cannot check seat availability.');
        return [];
      }
      
      // Handle other Firebase errors
      if (error.code === 'permission-denied' || error.code === 'unavailable') {
        console.warn('Firebase access denied or unavailable. Cannot check seat availability.');
        return [];
      }
      
      console.error('Error checking seat availability:', error);
      throw error;
    }
  }
} 