import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCmuSlutrlDKtoUuJispdNgyeZkaulIElw',
  authDomain: 'exercise-7-c1dff.firebaseapp.com',
  projectId: 'exercise-7-c1dff',
  storageBucket: 'exercise-7-c1dff.firebasestorage.app',
  messagingSenderId: '204527987423',
  appId: '1:204527987423:web:66e3443d5b37bc8515176a',
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();