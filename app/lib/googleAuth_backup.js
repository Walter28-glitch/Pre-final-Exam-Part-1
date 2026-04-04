import * as AuthSession from 'expo-auth-session';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { auth } from './firebaseConfig';

const CLIENT_ID = '204527987423-ln61t4m8vtmidr3ho1r492anpji64j2o.apps.googleusercontent.com';

export async function signInWithGoogleAsync() {
  try {
    
    const redirectUri = AuthSession.makeRedirectUri({
      useProxy: true,
    });

    const authUrl =
      'https://accounts.google.com/o/oauth2/v2/auth?' +
      'response_type=token&client_id=' +
      CLIENT_ID +
      '&redirect_uri=' +
      encodeURIComponent(redirectUri) +
      '&scope=' +
      encodeURIComponent('profile email');

    // Start the auth session
    const result = await AuthSession.startAsync({ authUrl });

    if (result.type === 'success') {
      const { access_token } = result.params;

      
      const userInfoResponse = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`
      );
      const userInfo = await userInfoResponse.json();

      
      const credential = firebase.auth.GoogleAuthProvider.credential(
        null,
        access_token
      );
      const userCredential = await auth.signInWithCredential(credential);

      return { userCredential, userInfo };
    } else {
      
      return null;
    }
  } catch (error) {
    console.log('Google sign in error:', error);
    throw error;
  }
}