import { ref } from 'vue';
import { auth } from '../firebase/config';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  type User as FirebaseUser
} from 'firebase/auth';
import { Browser } from '@capacitor/browser';

// Ref to hold the current user state, accessible throughout the app
export const user = ref<FirebaseUser | null>(null);

// Listen for authentication state changes and update the user ref
onAuthStateChanged(auth, (firebaseUser) => {
  user.value = firebaseUser;
  console.log('Auth state changed. Current user:', user.value?.email);
});

export class AuthService {
  /**
   * Registers a new user with email and password.
   */
  static async register(email: string, password: string): Promise<FirebaseUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Error during registration:', error);
      throw error;
    }
  }

  /**
   * Signs in a user with email and password.
   */
  static async login(email: string, password: string): Promise<FirebaseUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  }

  /**
   * Signs in a user with Google.
   */
  static async loginWithGoogle(): Promise<FirebaseUser> {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      return userCredential.user;
    } catch (error: any) {
      // Handle OAuth consent screen closing if necessary
      if (error.code === 'auth/popup-closed-by-user') {
        // This can be handled in the UI to show a message
      }
      console.error('Error during Google login:', error);
      throw error;
    }
  }

  /**
   * Signs out the current user.
   */
  static async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }

  /**
   * Gets the current authenticated user.
   */
  static getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }
} 