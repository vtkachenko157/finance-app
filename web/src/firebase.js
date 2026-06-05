// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
//import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC_ADc77AyzXpShSgJudFCuRMqiq07qiLA",
  authDomain: "finance-instrument.firebaseapp.com",
  projectId: "finance-instrument",
  storageBucket: "finance-instrument.firebasestorage.app",
  messagingSenderId: "110217367013",
  appId: "1:110217367013:web:be55909df43a21a41bb30c",
  measurementId: "G-7BPQM62L0X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);

export const auth = getAuth(app);