// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB4y9DtiC3czbBNHGcdQSo7ZNE445d_vlA",
  authDomain: "film-demo-b3215.firebaseapp.com",
  projectId: "film-demo-b3215",
  storageBucket: "film-demo-b3215.firebasestorage.app",
  messagingSenderId: "761960110088",
  appId: "1:761960110088:web:cae2b251d04d2eec7499bd",
  measurementId: "G-KYJBB51G4C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { auth }; // Export the auth object
