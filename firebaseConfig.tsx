import {initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {

    apiKey: "AIzaSyBxkKNks9xlB28wTpWH7eYc8TWthyp9yCQ",
  
    authDomain: "nextapp-a005b.firebaseapp.com",
  
    projectId: "nextapp-a005b",
  
    storageBucket: "nextapp-a005b.firebasestorage.app",
  
    messagingSenderId: "590457681254",
  
    appId: "1:590457681254:web:7d55a7c2556d60f4ad84a7"
  
  };
  

    const firebaseApp = initializeApp(firebaseConfig);

    export const db = getFirestore(firebaseApp);
    export const auth = getAuth(firebaseApp);

    export default firebaseApp;