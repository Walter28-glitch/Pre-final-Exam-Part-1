import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Switch,
  Image,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';



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

const auth = firebase.auth();
const db = firebase.firestore();


type ThemeType = 'light' | 'dark';

type ThemeColors = {
  background: string;
  cardBackground: string;
  text: string;
  secondaryText: string;
  title: string;
  buttonPrimary: string;
  buttonSecondary: string;
  buttonGoogle: string;
  buttonDanger: string;
  error: string;
  inputBorder: string;
  inputBackground: string;
  switchThumb: string;
  switchTrack: { false: string; true: string };
  success: string;
};

type ThemeContextValue = {
  theme: ThemeType;
  toggleTheme: () => void;
  colors: ThemeColors;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeType>('light');

  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync('app_theme');
        if (saved === 'light' || saved === 'dark') setTheme(saved);
      } catch {
        setTheme('light');
      }
    })();
  }, []);

  const toggleTheme = async () => {
    const next: ThemeType = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    try {
      await SecureStore.setItemAsync('app_theme', next);
    } catch {}
  };

  const themeColors: Record<ThemeType, ThemeColors> = {
    light: {
      background: '#f5f5f5',
      cardBackground: '#ffffff',
      text: '#333333',
      secondaryText: '#666666',
      title: '#333333',
      buttonPrimary: '#4CAF50',
      buttonSecondary: '#2196F3',
      buttonGoogle: '#4285F4',
      buttonDanger: '#f44336',
      error: '#f44336',
      inputBorder: '#dddddd',
      inputBackground: '#ffffff',
      switchThumb: '#f4f3f4',
      switchTrack: { false: '#767577', true: '#81b0ff' },
      success: '#4CAF50',
    },
    dark: {
      background: '#121212',
      cardBackground: '#1e1e1e',
      text: '#ffffff',
      secondaryText: '#bbbbbb',
      title: '#ffffff',
      buttonPrimary: '#388E3C',
      buttonSecondary: '#1976D2',
      buttonGoogle: '#357ae8',
      buttonDanger: '#d32f2f',
      error: '#f44336',
      inputBorder: '#333333',
      inputBackground: '#2d2d2d',
      switchThumb: '#f5dd4b',
      switchTrack: { false: '#767577', true: '#81b0ff' },
      success: '#388E3C',
    },
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors: themeColors[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
};



const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const accountSetupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});



type ScreenKey = 'login' | 'register' | 'accountSetup' | 'homepage';

const AuthFlow = () => {
  const { theme, toggleTheme, colors } = useTheme();
  const [currentScreen, setCurrentScreen] = useState<ScreenKey>('login');
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  
  const {
    formState: { errors: loginErrors },
    setValue: setLoginValue,
    watch: watchLogin,
    reset: resetLogin,
    handleSubmit: handleLoginSubmit,
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const {
    formState: { errors: registerErrors },
    setValue: setRegisterValue,
    watch: watchRegister,
    reset: resetRegister,
    handleSubmit: handleRegisterSubmit,
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const {
    formState: { errors: setupErrors },
    setValue: setSetupValue,
    watch: watchSetup,
    reset: resetSetup,
    handleSubmit: handleSetupSubmit,
  } = useForm({
    resolver: zodResolver(accountSetupSchema),
    defaultValues: { firstName: '', lastName: '' },
  });

  
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'We need camera roll permissions.');
        }
      }
    })();
  }, []);

  
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (u) {
        setUser(u);
        try {
          const doc = await db.collection('users').doc(u.uid).get();
          if (doc.exists) {
            const data = doc.data();
            setUserData(data);
            if (data?.firstName && data?.lastName) {
              setCurrentScreen('homepage');
            } else {
              setCurrentScreen('accountSetup');
            }
          } else {
            setCurrentScreen('accountSetup');
          }
        } catch {
          setCurrentScreen('accountSetup');
        }
      } else {
        setUser(null);
        setUserData(null);
        setCurrentScreen('login');
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  

  const handleGoogleSignIn = async () => {
    
    const url = 'https://exercise-7-c1dff.web.app/google-signin.html';
    try {
      await Linking.openURL(url);
    } catch (error: any) {
      Alert.alert('Error', 'Could not open browser: ' + (error.message || 'Unknown error'));
    }
  };

  

  const onLogin = async (data: any) => {
    setAuthLoading(true);
    try {
      await auth.signInWithEmailAndPassword(data.email, data.password);
      resetLogin();
      Alert.alert('Success', 'Login successful!');
    } catch (error: any) {
      let msg = 'Login failed.';
      if (error.code === 'auth/user-not-found') msg = 'No user found with this email.';
      else if (error.code === 'auth/wrong-password') msg = 'Incorrect password.';
      else if (error.code === 'auth/invalid-email') msg = 'Invalid email address.';
      Alert.alert('Login Error', msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const onRegister = async (data: any) => {
    setAuthLoading(true);
    try {
      const cred = await auth.createUserWithEmailAndPassword(data.email, data.password);
      await db.collection('users').doc(cred.user.uid).set({
        email: data.email,
        createdAt: new Date().toISOString(),
        provider: 'email',
      });
      resetRegister();
      Alert.alert('Success', 'Registration successful!');
    } catch (error: any) {
      let msg = 'Registration failed.';
      if (error.code === 'auth/email-already-in-use') msg = 'This email is already registered.';
      else if (error.code === 'auth/weak-password') msg = 'Password should be at least 6 characters.';
      Alert.alert('Registration Error', msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const email = watchLogin('email');
    if (!email) {
      Alert.alert('Error', 'Please enter your email address first.');
      return;
    }
    setAuthLoading(true);
    try {
      await auth.sendPasswordResetEmail(email);
      Alert.alert('Success', 'Password reset email sent!');
    } catch {
      Alert.alert('Error', 'Failed to send password reset email.');
    } finally {
      setAuthLoading(false);
    }
  };

  
  const onAccountSetup = async (data: any) => {
    if (!user) return;
    setAuthLoading(true);
    try {
      await user.updateProfile({
        displayName: `${data.firstName} ${data.lastName}`,
        photoURL: profilePhoto || user.photoURL || undefined,
      });
      await db.collection('users').doc(user.uid).update({
        firstName: data.firstName,
        lastName: data.lastName,
        profilePhoto: profilePhoto || user.photoURL || '',
        updatedAt: new Date().toISOString(),
      });
      resetSetup();
      setProfilePhoto(null);
      const updatedDoc = await db.collection('users').doc(user.uid).get();
      if (updatedDoc.exists) setUserData(updatedDoc.data());
      Alert.alert('Success', 'Profile completed!');
      setCurrentScreen('homepage');
    } catch {
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setAuthLoading(true);
          try {
            await auth.signOut();
            setProfilePhoto(null);
            resetLogin();
            resetRegister();
            resetSetup();
            Alert.alert('Success', 'Logged out!');
          } catch {
            Alert.alert('Error', 'Failed to logout.');
          } finally {
            setAuthLoading(false);
          }
        },
      },
    ]);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      if (!result.canceled) setProfilePhoto(result.assets[0].uri);
    } catch {
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  

  const GoogleSignInButton = () => (
    <TouchableOpacity
      style={[styles.googleButton, { backgroundColor: colors.buttonGoogle }]}
      onPress={handleGoogleSignIn}
      disabled={authLoading}
    >
      <View style={styles.googleButtonContent}>
        <Image
          source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
          style={styles.googleIcon}
        />
        <Text style={styles.googleButtonText}>Sign in with Google</Text>
      </View>
    </TouchableOpacity>
  );

  const renderLoginScreen = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.themeToggleContainer}>
          <Text style={[styles.themeLabel, { color: colors.secondaryText }]}>
            {theme === 'light' ? '☀️ Light' : '🌙 Dark'}
          </Text>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={colors.switchTrack}
            thumbColor={colors.switchThumb}
          />
        </View>

        <Text style={[styles.title, { color: colors.title }]}>Welcome Back!</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>Sign in to continue</Text>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Email</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: loginErrors.email ? colors.error : colors.inputBorder,
                backgroundColor: colors.inputBackground,
                color: colors.text,
              },
            ]}
            placeholder="Enter your email"
            placeholderTextColor={colors.secondaryText}
            onChangeText={(t) => setLoginValue('email', t)}
            value={watchLogin('email')}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!authLoading}
          />
          {loginErrors.email && (
            <Text style={[styles.errorText, { color: colors.error }]}>{loginErrors.email.message}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Password</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: loginErrors.password ? colors.error : colors.inputBorder,
                backgroundColor: colors.inputBackground,
                color: colors.text,
              },
            ]}
            placeholder="Enter your password"
            placeholderTextColor={colors.secondaryText}
            onChangeText={(t) => setLoginValue('password', t)}
            value={watchLogin('password')}
            secureTextEntry
            editable={!authLoading}
          />
          {loginErrors.password && (
            <Text style={[styles.errorText, { color: colors.error }]}>{loginErrors.password.message}</Text>
          )}
        </View>

        <TouchableOpacity onPress={handlePasswordReset} disabled={authLoading}>
          <Text style={[styles.forgotPassword, { color: colors.buttonSecondary }]}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.buttonPrimary }]}
          onPress={handleLoginSubmit(onLogin)}
          disabled={authLoading}
        >
          {authLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Login</Text>}
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={[styles.divider, { backgroundColor: colors.inputBorder }]} />
          <Text style={[styles.dividerText, { color: colors.secondaryText }]}>OR</Text>
          <View style={[styles.divider, { backgroundColor: colors.inputBorder }]} />
        </View>

        <GoogleSignInButton />

        <View style={styles.switchContainer}>
          <Text style={{ color: colors.text }}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => setCurrentScreen('register')} disabled={authLoading}>
            <Text style={[styles.linkText, { color: colors.buttonSecondary }]}>Register</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderRegisterScreen = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.themeToggleContainer}>
          <Text style={[styles.themeLabel, { color: colors.secondaryText }]}>
            {theme === 'light' ? '☀️ Light' : '🌙 Dark'}
          </Text>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={colors.switchTrack}
            thumbColor={colors.switchThumb}
          />
        </View>

        <Text style={[styles.title, { color: colors.title }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>Sign up to get started</Text>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Email</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: registerErrors.email ? colors.error : colors.inputBorder,
                backgroundColor: colors.inputBackground,
                color: colors.text,
              },
            ]}
            placeholder="Enter your email"
            placeholderTextColor={colors.secondaryText}
            onChangeText={(t) => setRegisterValue('email', t)}
            value={watchRegister('email')}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!authLoading}
          />
          {registerErrors.email && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {registerErrors.email.message}
            </Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Password</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: registerErrors.password ? colors.error : colors.inputBorder,
                backgroundColor: colors.inputBackground,
                color: colors.text,
              },
            ]}
            placeholder="Enter your password"
            placeholderTextColor={colors.secondaryText}
            onChangeText={(t) => setRegisterValue('password', t)}
            value={watchRegister('password')}
            secureTextEntry
            editable={!authLoading}
          />
          {registerErrors.password && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {registerErrors.password.message}
            </Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: registerErrors.confirmPassword ? colors.error : colors.inputBorder,
                backgroundColor: colors.inputBackground,
                color: colors.text,
              },
            ]}
            placeholder="Confirm your password"
            placeholderTextColor={colors.secondaryText}
            onChangeText={(t) => setRegisterValue('confirmPassword', t)}
            value={watchRegister('confirmPassword')}
            secureTextEntry
            editable={!authLoading}
          />
          {registerErrors.confirmPassword && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {registerErrors.confirmPassword.message}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.buttonPrimary }]}
          onPress={handleRegisterSubmit(onRegister)}
          disabled={authLoading}
        >
          {authLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Register</Text>}
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={[styles.divider, { backgroundColor: colors.inputBorder }]} />
          <Text style={[styles.dividerText, { color: colors.secondaryText }]}>OR</Text>
          <View style={[styles.divider, { backgroundColor: colors.inputBorder }]} />
        </View>

        <GoogleSignInButton />

        <View style={styles.switchContainer}>
          <Text style={{ color: colors.text }}>Already have an account? </Text>
          <TouchableOpacity onPress={() => setCurrentScreen('login')} disabled={authLoading}>
            <Text style={[styles.linkText, { color: colors.buttonSecondary }]}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderAccountSetupScreen = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.themeToggleContainer}>
          <Text style={[styles.themeLabel, { color: colors.secondaryText }]}>
            {theme === 'light' ? '☀️ Light' : '🌙 Dark'}
          </Text>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={colors.switchTrack}
            thumbColor={colors.switchThumb}
          />
        </View>

        <Text style={[styles.title, { color: colors.title }]}>Complete Your Profile</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
          Add your details to get started
        </Text>

        <TouchableOpacity style={styles.photoUploadContainer} onPress={pickImage} disabled={authLoading}>
          {profilePhoto || userData?.profilePhoto || user?.photoURL ? (
            <Image
              source={{ uri: profilePhoto || userData?.profilePhoto || user?.photoURL }}
              style={styles.profileImage}
            />
          ) : (
            <View
              style={[
                styles.photoPlaceholder,
                { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
              ]}
            >
              <Text style={[styles.photoText, { color: colors.secondaryText }]}>📷</Text>
              <Text style={[styles.photoLabelText, { color: colors.secondaryText }]}>
                Tap to add photo
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>First Name</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: setupErrors.firstName ? colors.error : colors.inputBorder,
                backgroundColor: colors.inputBackground,
                color: colors.text,
              },
            ]}
            placeholder="Enter your first name"
            placeholderTextColor={colors.secondaryText}
            onChangeText={(t) => setSetupValue('firstName', t)}
            value={watchSetup('firstName')}
            editable={!authLoading}
          />
          {setupErrors.firstName && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {setupErrors.firstName.message}
            </Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Last Name</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: setupErrors.lastName ? colors.error : colors.inputBorder,
                backgroundColor: colors.inputBackground,
                color: colors.text,
              },
            ]}
            placeholder="Enter your last name"
            placeholderTextColor={colors.secondaryText}
            onChangeText={(t) => setSetupValue('lastName', t)}
            value={watchSetup('lastName')}
            editable={!authLoading}
          />
          {setupErrors.lastName && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {setupErrors.lastName.message}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.buttonPrimary }]}
          onPress={handleSetupSubmit(onAccountSetup)}
          disabled={authLoading}
        >
          {authLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Complete Setup</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setCurrentScreen('homepage')} disabled={authLoading}>
          <Text style={[styles.skipText, { color: colors.secondaryText }]}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderHomepage = () => (
    <ScrollView contentContainerStyle={[styles.homeContainer, { backgroundColor: colors.background }]}>
      <View style={styles.themeToggleContainer}>
        <Text style={[styles.themeLabel, { color: colors.secondaryText }]}>
          {theme === 'light' ? '☀️ Light' : '🌙 Dark'}
        </Text>
        <Switch
          value={theme === 'dark'}
          onValueChange={toggleTheme}
          trackColor={colors.switchTrack}
          thumbColor={colors.switchThumb}
        />
      </View>

      <View style={styles.homeContent}>
        {(profilePhoto || userData?.profilePhoto || user?.photoURL) && (
          <Image
            source={{ uri: profilePhoto || userData?.profilePhoto || user?.photoURL }}
            style={styles.homeProfileImage}
          />
        )}

        <Text style={[styles.homeTitle, { color: colors.title }]}>
          Welcome{userData?.firstName ? `, ${userData.firstName}` : ''}!
        </Text>

        <View style={[styles.infoCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.infoTitle, { color: colors.title }]}>Account Information</Text>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>Email:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user?.email}</Text>
          </View>

          {userData?.firstName && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>Name:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {userData.firstName} {userData.lastName}
              </Text>
            </View>
          )}

          {userData?.createdAt && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>Member Since:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {new Date(userData.createdAt).toLocaleDateString()}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>Auth Provider:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {userData?.provider === 'google' ? '🔵 Google' : '📧 Email'}
            </Text>
          </View>
        </View>

        {(!userData?.firstName || !userData?.lastName) && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.buttonSecondary, marginBottom: 10 }]}
            onPress={() => setCurrentScreen('accountSetup')}
          >
            <Text style={styles.buttonText}>Complete Profile</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.buttonDanger }]}
          onPress={handleLogout}
          disabled={authLoading}
        >
          {authLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Logout</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.buttonPrimary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
      </View>
    );
  }

  switch (currentScreen) {
    case 'login':
      return <View style={styles.screenContainer}>{renderLoginScreen()}</View>;
    case 'register':
      return <View style={styles.screenContainer}>{renderRegisterScreen()}</View>;
    case 'accountSetup':
      return <View style={styles.screenContainer}>{renderAccountSetupScreen()}</View>;
    case 'homepage':
      return <View style={styles.screenContainer}>{renderHomepage()}</View>;
    default:
      return <View style={styles.screenContainer}>{renderLoginScreen()}</View>;
  }
};


const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingTop: 50 },
  themeToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
  },
  themeLabel: { fontSize: 16, fontWeight: '600' },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 30 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  errorText: { fontSize: 14, marginTop: 5 },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  googleButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  googleButtonContent: { flexDirection: 'row', alignItems: 'center' },
  googleIcon: { width: 24, height: 24, marginRight: 10, backgroundColor: 'white', borderRadius: 2 },
  googleButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divider: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 10, fontSize: 14 },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  linkText: { fontWeight: '600', fontSize: 16 },
  forgotPassword: { textAlign: 'right', fontSize: 14, fontWeight: '600', marginBottom: 20 },
  skipText: { textAlign: 'center', fontSize: 16, marginTop: 10 },
  photoUploadContainer: { alignItems: 'center', marginBottom: 30 },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  photoText: { fontSize: 30, marginBottom: 5 },
  photoLabelText: { fontSize: 14, textAlign: 'center' },
  profileImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: '#ddd' },
  homeContainer: { flexGrow: 1, padding: 20 },
  homeContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  homeProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  homeTitle: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  infoCard: {
    width: '100%',
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  infoLabel: { fontSize: 14, fontWeight: '600' },
  infoValue: { fontSize: 14, flex: 1, textAlign: 'right' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16 },
});


export default function App() {
  return (
    <ThemeProvider>
      <AuthFlow />
    </ThemeProvider>
  );
}