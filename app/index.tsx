import React, { useState, createContext, useContext, useEffect } from 'react';
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
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';


const ThemeContext = createContext();
const useTheme = () => useContext(ThemeContext);

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await SecureStore.getItemAsync('app_theme');
        if (savedTheme) {
          setTheme(savedTheme);
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
        setTheme('light');
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      await SecureStore.setItemAsync('app_theme', newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const themeColors = {
    light: {
      background: '#f5f5f5',
      cardBackground: '#ffffff',
      text: '#333333',
      secondaryText: '#666666',
      title: '#333333',
      buttonPrimary: '#4CAF50',
      buttonSecondary: '#2196F3',
      error: '#f44336',
      inputBorder: '#dddddd',
      inputBackground: '#ffffff',
      switchThumb: '#f4f3f4',
      switchTrack: { false: "#767577", true: "#81b0ff" },
    },
    dark: {
      background: '#121212',
      cardBackground: '#1e1e1e',
      text: '#ffffff',
      secondaryText: '#bbbbbb',
      title: '#ffffff',
      buttonPrimary: '#388E3C',
      buttonSecondary: '#1976D2',
      error: '#f44336',
      inputBorder: '#333333',
      inputBackground: '#2d2d2d',
      switchThumb: '#f5dd4b',
      switchTrack: { false: "#767577", true: "#81b0ff" },
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      colors: themeColors[theme] 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};


const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const accountSetupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

const AuthFlow = () => {
  const { theme, toggleTheme, colors } = useTheme();
  const [currentScreen, setCurrentScreen] = useState('login');

  
  const {
    control: loginControl,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    setValue: setLoginValue,
    watch: watchLogin,
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  
  const {
    control: registerControl,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
    setValue: setRegisterValue,
    watch: watchRegister,
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  
  const {
    control: setupControl,
    handleSubmit: handleSetupSubmit,
    formState: { errors: setupErrors },
    setValue: setSetupValue,
    watch: watchSetup,
  } = useForm({
    resolver: zodResolver(accountSetupSchema),
  });

  
  const [profilePhoto, setProfilePhoto] = useState(null);

  
  useEffect(() => {
   
    setLoginValue('email', '');
    setLoginValue('password', '');
    
    
    setRegisterValue('email', '');
    setRegisterValue('password', '');
    setRegisterValue('confirmPassword', '');
    
    
    setSetupValue('firstName', '');
    setSetupValue('lastName', '');
  }, [setLoginValue, setRegisterValue, setSetupValue]);

  
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to make this work!');
        }
      }
    })();
  }, []);

  
  const onLogin = (data) => {
    Alert.alert('Success', 'Login successful!');
    setCurrentScreen('homepage');
  };

 
  const onRegister = (data) => {
    setCurrentScreen('accountSetup');
  };

  
  const onAccountSetup = (data) => {
    Alert.alert('Success', 'Account setup completed!');
    setCurrentScreen('homepage');
  };

  
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfilePhoto(result.assets[0].uri);
    }
  };

  
  const renderLoginScreen = () => (
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
      
      <Text style={[styles.title, { color: colors.title }]}>Login</Text>
      
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Email</Text>
        <TextInput
          style={[
            styles.input, 
            { 
              borderColor: loginErrors.email ? colors.error : colors.inputBorder,
              backgroundColor: colors.inputBackground,
              color: colors.text
            }
          ]}
          placeholder="Enter your email"
          placeholderTextColor={colors.secondaryText}
          onChangeText={(text) => setLoginValue('email', text)}
          value={watchLogin('email') || ''}
          keyboardType="email-address"
          autoCapitalize="none"
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
              color: colors.text
            }
          ]}
          placeholder="Enter your password"
          placeholderTextColor={colors.secondaryText}
          onChangeText={(text) => setLoginValue('password', text)}
          value={watchLogin('password') || ''}
          secureTextEntry
        />
        {loginErrors.password && (
          <Text style={[styles.errorText, { color: colors.error }]}>{loginErrors.password.message}</Text>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.buttonPrimary }]} 
        onPress={handleLoginSubmit(onLogin)}
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <View style={styles.switchContainer}>
        <Text style={{ color: colors.text }}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => setCurrentScreen('register')}>
          <Text style={[styles.linkText, { color: colors.buttonSecondary }]}>Register</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  
  const renderRegisterScreen = () => (
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
      
      <Text style={[styles.title, { color: colors.title }]}>Register</Text>
      
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Email</Text>
        <TextInput
          style={[
            styles.input, 
            { 
              borderColor: registerErrors.email ? colors.error : colors.inputBorder,
              backgroundColor: colors.inputBackground,
              color: colors.text
            }
          ]}
          placeholder="Enter your email"
          placeholderTextColor={colors.secondaryText}
          onChangeText={(text) => setRegisterValue('email', text)}
          value={watchRegister('email') || ''}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {registerErrors.email && (
          <Text style={[styles.errorText, { color: colors.error }]}>{registerErrors.email.message}</Text>
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
              color: colors.text
            }
          ]}
          placeholder="Enter your password"
          placeholderTextColor={colors.secondaryText}
          onChangeText={(text) => setRegisterValue('password', text)}
          value={watchRegister('password') || ''}
          secureTextEntry
        />
        {registerErrors.password && (
          <Text style={[styles.errorText, { color: colors.error }]}>{registerErrors.password.message}</Text>
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
              color: colors.text
            }
          ]}
          placeholder="Confirm your password"
          placeholderTextColor={colors.secondaryText}
          onChangeText={(text) => setRegisterValue('confirmPassword', text)}
          value={watchRegister('confirmPassword') || ''}
          secureTextEntry
        />
        {registerErrors.confirmPassword && (
          <Text style={[styles.errorText, { color: colors.error }]}>{registerErrors.confirmPassword.message}</Text>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.buttonPrimary }]} 
        onPress={handleRegisterSubmit(onRegister)}
      >
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      <View style={styles.switchContainer}>
        <Text style={{ color: colors.text }}>Already have an account? </Text>
        <TouchableOpacity onPress={() => setCurrentScreen('login')}>
          <Text style={[styles.linkText, { color: colors.buttonSecondary }]}>Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  
  const renderAccountSetupScreen = () => (
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
      
      {/* Profile Photo Upload - ENHANCED */}
      <TouchableOpacity style={styles.photoUploadContainer} onPress={pickImage}>
        {profilePhoto ? (
          <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
        ) : (
          <View style={[styles.photoPlaceholder, { backgroundColor: colors.inputBackground }]}>
            <Text style={[styles.photoText, { color: colors.secondaryText }]}>📷</Text>
            <Text style={[styles.photoLabelText, { color: colors.secondaryText }]}>Tap to add photo</Text>
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
              color: colors.text
            }
          ]}
          placeholder="Enter your first name"
          placeholderTextColor={colors.secondaryText}
          onChangeText={(text) => setSetupValue('firstName', text)}
          value={watchSetup('firstName') || ''}
        />
        {setupErrors.firstName && (
          <Text style={[styles.errorText, { color: colors.error }]}>{setupErrors.firstName.message}</Text>
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
              color: colors.text
            }
          ]}
          placeholder="Enter your last name"
          placeholderTextColor={colors.secondaryText}
          onChangeText={(text) => setSetupValue('lastName', text)}
          value={watchSetup('lastName') || ''}
        />
        {setupErrors.lastName && (
          <Text style={[styles.errorText, { color: colors.error }]}>{setupErrors.lastName.message}</Text>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.buttonPrimary }]} 
        onPress={handleSetupSubmit(onAccountSetup)}
      >
        <Text style={styles.buttonText}>Complete Setup</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  
  const renderHomepage = () => (
    <View style={[styles.homeContainer, { backgroundColor: colors.background }]}>
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
      
      <Text style={[styles.homeTitle, { color: colors.title }]}>Welcome to the Homepage!</Text>
      <Text style={[styles.homeSubtitle, { color: colors.secondaryText }]}>
        You have successfully logged in or completed registration.
      </Text>
      
      {profilePhoto && (
        <View style={styles.profilePreview}>
          <Text style={[styles.profilePreviewTitle, { color: colors.title }]}>Your Profile Photo:</Text>
          <Image source={{ uri: profilePhoto }} style={styles.profilePreviewImage} />
        </View>
      )}
      
      <TouchableOpacity 
        style={[styles.logoutButton, { backgroundColor: colors.buttonSecondary }]} 
        onPress={() => {
          setCurrentScreen('login');
          setProfilePhoto(null); // Reset profile photo on logout
        }}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'login':
        return renderLoginScreen();
      case 'register':
        return renderRegisterScreen();
      case 'accountSetup':
        return renderAccountSetupScreen();
      case 'homepage':
        return renderHomepage();
      default:
        return renderLoginScreen();
    }
  };

  return <View style={styles.screenContainer}>{renderCurrentScreen()}</View>;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthFlow />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  themeToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
    marginTop: 5,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    fontWeight: '600',
    fontSize: 16,
  },
  photoUploadContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  photoText: {
    fontSize: 30,
    marginBottom: 5,
  },
  photoLabelText: {
    fontSize: 14,
    textAlign: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
  },
  homeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  homeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  homeSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  logoutButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 150,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profilePreview: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profilePreviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  profilePreviewImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
  },
});