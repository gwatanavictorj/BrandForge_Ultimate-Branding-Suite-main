import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged as firebaseOnAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  enableIndexedDbPersistence
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC7pnDesYupv814wPMVfMEB3C8Oafsv-dM",
  authDomain: "brandforge-492618.firebaseapp.com",
  projectId: "brandforge-492618",
  storageBucket: "brandforge-492618.firebasestorage.app",
  messagingSenderId: "30465031003",
  appId: "1:30465031003:web:cd6a58e73b41d8dd75b87e",
  measurementId: "G-4DQY363CQG"
};

// Initialize Firebase Production App
export const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence for Local-First Sync
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a a time.
    console.warn("Multiple tabs open, persistence can only be enabled in one tab at a a time.");
  } else if (err.code == 'unimplemented') {
    // The current browser does not support all of the features required to enable persistence
    console.warn("The current browser does not support all of the features required to enable persistence");
  }
});
export const googleProvider = new GoogleAuthProvider();

export const onAuthStateChanged = firebaseOnAuthStateChanged;

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, pass: string) => {
  return await signInWithEmailAndPassword(auth, email, pass);
};

export const signUpWithEmail = async (email: string, pass: string, name: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  return userCredential;
};

export const logout = async () => {
  await signOut(auth);
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error('[Firestore Error]', operationType, path, error);
}
