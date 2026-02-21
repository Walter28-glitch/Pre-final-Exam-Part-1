import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';


const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z .object({
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
  const [currentScreen, setCurrentScreen] = useState('login');

  
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    setValue: setLoginValue,
    watch: watchLogin,
    formState: { errors: loginErrors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  
  const {
    register: registerRegister,
    handleSubmit: handleRegisterSubmit,
    setValue: setRegisterValue,
    watch: watchRegister,
    formState: { errors: registerErrors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  
  const {
    register: registerSetup,
    handleSubmit: handleSetupSubmit,
    setValue: setSetupValue,
    watch: watchSetup,
    formState: { errors: setupErrors },
  } = useForm({
    resolver: zodResolver(accountSetupSchema),
  });

  
  React.useEffect(() => {
    registerLogin('email');
    registerLogin('password');
    registerRegister('email');
    registerRegister('password');
    registerRegister('confirmPassword');
    registerSetup('firstName');
    registerSetup('lastName');
  }, [registerLogin, registerRegister, registerSetup]);

  
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

  
  const renderLoginScreen = () => (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Login</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, loginErrors.email && styles.errorInput]}
          placeholder="Enter your email"
          onChangeText={(text) => setLoginValue('email', text)}
          value={watchLogin('email') || ''}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {loginErrors.email && (
          <Text style={styles.errorText}>{loginErrors.email.message}</Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={[styles.input, loginErrors.password && styles.errorInput]}
          placeholder="Enter your password"
          onChangeText={(text) => setLoginValue('password', text)}
          value={watchLogin('password') || ''}
          secureTextEntry
        />
        {loginErrors.password && (
          <Text style={styles.errorText}>{loginErrors.password.message}</Text>
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLoginSubmit(onLogin)}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <View style={styles.switchContainer}>
        <Text>Don't have an account? </Text>
        <TouchableOpacity onPress={() => setCurrentScreen('register')}>
          <Text style={styles.linkText}>Register</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  
  const renderRegisterScreen = () => (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Register</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, registerErrors.email && styles.errorInput]}
          placeholder="Enter your email"
          onChangeText={(text) => setRegisterValue('email', text)}
          value={watchRegister('email') || ''}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {registerErrors.email && (
          <Text style={styles.errorText}>{registerErrors.email.message}</Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={[styles.input, registerErrors.password && styles.errorInput]}
          placeholder="Enter your password"
          onChangeText={(text) => setRegisterValue('password', text)}
          value={watchRegister('password') || ''}
          secureTextEntry
        />
        {registerErrors.password && (
          <Text style={styles.errorText}>{registerErrors.password.message}</Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={[styles.input, registerErrors.confirmPassword && styles.errorInput]}
          placeholder="Confirm your password"
          onChangeText={(text) => setRegisterValue('confirmPassword', text)}
          value={watchRegister('confirmPassword') || ''}
          secureTextEntry
        />
        {registerErrors.confirmPassword && (
          <Text style={styles.errorText}>{registerErrors.confirmPassword.message}</Text>
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleRegisterSubmit(onRegister)}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      <View style={styles.switchContainer}>
        <Text>Already have an account? </Text>
        <TouchableOpacity onPress={() => setCurrentScreen('login')}>
          <Text style={styles.linkText}>Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  
  const renderAccountSetupScreen = () => (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Complete Your Profile</Text>
      
      {/* Profile Photo Placeholder */}
      <View style={styles.photoContainer}>
        <View style={styles.photoPlaceholder}>
          <Text style={styles.photoText}>+</Text>
        </View>
        <Text style={styles.photoLabel}>Add Profile Photo</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>First Name</Text>
        <TextInput
          style={[styles.input, setupErrors.firstName && styles.errorInput]}
          placeholder="Enter your first name"
          onChangeText={(text) => setSetupValue('firstName', text)}
          value={watchSetup('firstName') || ''}
        />
        {setupErrors.firstName && (
          <Text style={styles.errorText}>{setupErrors.firstName.message}</Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Last Name</Text>
        <TextInput
          style={[styles.input, setupErrors.lastName && styles.errorInput]}
          placeholder="Enter your last name"
          onChangeText={(text) => setSetupValue('lastName', text)}
          value={watchSetup('lastName') || ''}
        />
        {setupErrors.lastName && (
          <Text style={styles.errorText}>{setupErrors.lastName.message}</Text>
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSetupSubmit(onAccountSetup)}>
        <Text style={styles.buttonText}>Complete Setup</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  
  const renderHomepage = () => (
    <View style={styles.homeContainer}>
      <Text style={styles.homeTitle}>Welcome to the Homepage!</Text>
      <Text style={styles.homeSubtitle}>You have successfully logged in or completed registration.</Text>
      
      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={() => setCurrentScreen('login')}
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

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  errorInput: {
    borderColor: '#f44336',
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    marginTop: 5,
  },
  button: {
    backgroundColor: '#4CAF50',
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
    color: '#2196F3',
    fontWeight: '600',
    fontSize: 16,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  photoText: {
    fontSize: 40,
    color: '#999',
  },
  photoLabel: {
    color: '#666',
    fontSize: 14,
  },
  homeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  homeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  homeSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  logoutButton: {
    backgroundColor: '#f44336',
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
});

export default AuthFlow;