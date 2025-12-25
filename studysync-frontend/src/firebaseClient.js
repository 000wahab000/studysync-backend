// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC19r28E-rO7IYLpHJW9PfgRSQeGEXUC5k",
  authDomain: "studysync-689c0.firebaseapp.com",
  projectId: "studysync-689c0",
  storageBucket: "studysync-689c0.firebasestorage.app",
  messagingSenderId: "368254985998",
  appId: "1:368254985998:web:0f8f695bd433563ec0995f",
  measurementId: "G-J8NB4FWQ18"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();


export { auth, provider, signInWithPopup, signOut };
