import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";

// paste your config from Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCeQ6pQwGvzr5V9C-WIe4kniefNih-Z9c",
  authDomain: "studysync-gdc.firebaseapp.com",
  projectId: "studysync-gdc",
  storageBucket: "studysync-gdc.appspot.com",
  messagingSenderId: "1037440409982",
  appId: "1:1037440409982:web:0f5152bcd7503fbad32f",
  // measurementId is optional for auth, you can include it if you like
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup, signOut };
