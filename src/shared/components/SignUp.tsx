import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigation } from "@react-navigation/native";
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Keyboard,
  ActivityIndicator,
  Alert
} from "react-native";
import { useAuth } from "shared/hooks/useAuth";
import Icon from 'react-native-vector-icons/MaterialIcons';

type SignUpFormProps = {
  onSuccess?: () => void;
  onError?: (errorMessage: string) => void;
};

type SignUpFormValues = {
  username: string;
  email: string;
};

export default function SignUpForm({ onSuccess, onError }: SignUpFormProps) {
  const { register } = useAuth();
  const form = useForm<SignUpFormValues>({ mode: "onChange" });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigation = useNavigation<any>();
  
  // Form field states with their own visibility controls
  const [formPassword, setFormPassword] = useState({ value: "", visible: false });
  const [confirmFormPassword, setConfirmFormPassword] = useState({ value: "", visible: false });
  
  // Access password states
  const [accessPassword, setAccessPassword] = useState({ value: "", visible: false });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  
  // Constants
  const BACKEND_PASSWORD = "kudos";
  const MAX_ATTEMPTS = 3;
  const LOCK_TIME = 30; // seconds
  
  // Check for stored authentication state on component mount
  useEffect(() => {
    // In a real app, you would check AsyncStorage for persisted authentication
    // For demo purposes, we're just checking if there's a stored value in component state
    const checkStoredAuth = async () => {
      try {
        // This is where you would check AsyncStorage
        // const storedAuth = await AsyncStorage.getItem('klf_signup_auth');
        // if (storedAuth === 'true') {
        //   setIsAuthenticated(true);
        // }
      } catch (error) {
        console.error('Error checking stored authentication:', error);
      }
    };
    
    checkStoredAuth();
  }, []);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Handle countdown timer for locked state
    if (isLocked && lockTimer > 0) {
      interval = setInterval(() => {
        setLockTimer(prev => {
          const newValue = prev - 1;
          if (newValue <= 0) {
            clearInterval(interval);
            setIsLocked(false);
            setAttempts(0);
            return 0;
          }
          return newValue;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLocked, lockTimer]);
  
  // Handle password field visibility toggles separately for each field
  const toggleAccessPasswordVisibility = () => {
    setAccessPassword(prev => ({
      ...prev,
      visible: !prev.visible
    }));
  };
  
  const toggleFormPasswordVisibility = () => {
    setFormPassword(prev => ({
      ...prev,
      visible: !prev.visible
    }));
  };

  const toggleConfirmFormPasswordVisibility = () => {
    setConfirmFormPassword(prev => ({
      ...prev,
      visible: !prev.visible
    }));
  };
  
  const verifyPassword = () => {
    Keyboard.dismiss();
    
    if (isLocked) return;
    
    setIsVerifying(true);
    
    // Simulate network delay
    setTimeout(() => {
      if (accessPassword.value === BACKEND_PASSWORD) {
        setIsAuthenticated(true);
        setErrorMessage(null);
        setAttempts(0);
        
        // In a real app, you would store this in AsyncStorage
        // AsyncStorage.setItem('klf_signup_auth', 'true');
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= MAX_ATTEMPTS) {
          setIsLocked(true);
          setLockTimer(LOCK_TIME);
          setErrorMessage(`Too many failed attempts. Please try again in ${LOCK_TIME} seconds.`);
        } else {
          setErrorMessage(`Invalid password. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
        }
        
        setAccessPassword({ value: "", visible: false });
      }
      setIsVerifying(false);
    }, 600);
  };

  const onSubmit = async () => {
    setErrorMessage(null);
    
    // Get form values
    const username = form.getValues().username;
    const email = form.getValues().email;
    
    // Check if passwords match
    if (formPassword.value !== confirmFormPassword.value) {
      setErrorMessage("Passwords do not match");
      return;
    }
    
    // Check if all fields are filled
    if (!username || !email || !formPassword.value) {
      setErrorMessage("All fields are required");
      return;
    }
    
    try {
      setIsVerifying(true);
      await register(username, email, formPassword.value);
      setIsVerifying(false);
      onSuccess?.();
      navigation.navigate("Home", { screen: "Feed" });
    } catch (error) {
      setIsVerifying(false);
      const message =
        error instanceof Error ? error.message : "Sign-up failed. Try again.";
      setErrorMessage(message);
      onError?.(message);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <Image 
        style={styles.backgroundImage} 
        source={require('../assets/images/login_background.jpg')} 
        resizeMode="cover"
      />
      
      <View style={styles.contentContainer}>
        <Text style={styles.welcomeText}>SIGN UP</Text>
        
        {isAuthenticated ? (
          // Authenticated view - show sign up form
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#888"
                onChangeText={value => form.setValue('username', value)}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#888"
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={value => form.setValue('email', value)}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#888"
                secureTextEntry={!formPassword.visible}
                value={formPassword.value}
                onChangeText={value => setFormPassword({ ...formPassword, value })}
              />
              <TouchableOpacity 
                style={styles.passwordToggle} 
                onPress={toggleFormPasswordVisibility}
              >
                <Icon 
                  name={formPassword.visible ? "visibility" : "visibility-off"} 
                  size={24} 
                  color="#888" 
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#888"
                secureTextEntry={!confirmFormPassword.visible}
                value={confirmFormPassword.value}
                onChangeText={value => setConfirmFormPassword({ ...confirmFormPassword, value })}
              />
              <TouchableOpacity 
                style={styles.passwordToggle} 
                onPress={toggleConfirmFormPasswordVisibility}
              >
                <Icon 
                  name={confirmFormPassword.visible ? "visibility" : "visibility-off"} 
                  size={24} 
                  color="#888" 
                />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[
                styles.signUpButton,
                isVerifying && styles.disabledButton
              ]}
              onPress={onSubmit}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.signUpButtonText}>SIGN UP</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.loginContainer}>
              <Text style={styles.haveAccountText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
                <Text style={styles.loginText}>LOG IN</Text>
              </TouchableOpacity>
            </View>
            
            {errorMessage && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorMessage}>{errorMessage}</Text>
              </View>
            )}
          </View>
        ) : (
          // Not authenticated - show password entry
          <View style={styles.formContainer}>
            <Icon 
              name="lock" 
              size={50} 
              color="#5A5AD0" 
              style={styles.lockIcon}
            />
            
            <Text style={styles.accessTitle}>
              Restricted Access
            </Text>
            
            <Text style={styles.accessDescription}>
              Enter the access password to continue with registration.
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter access password"
                placeholderTextColor="#888"
                secureTextEntry={!accessPassword.visible}
                value={accessPassword.value}
                onChangeText={value => setAccessPassword({ ...accessPassword, value })}
                editable={!isLocked && !isVerifying}
              />
              <TouchableOpacity 
                style={styles.passwordToggle} 
                onPress={toggleAccessPasswordVisibility}
                disabled={isLocked}
              >
                <Icon 
                  name={accessPassword.visible ? "visibility" : "visibility-off"} 
                  size={24} 
                  color={isLocked ? "#ccc" : "#888"} 
                />
              </TouchableOpacity>
            </View>
            
            {isLocked && (
              <Text style={styles.lockTimerText}>
                Try again in {lockTimer} seconds
              </Text>
            )}
            
            <TouchableOpacity
              style={[
                styles.signUpButton,
                (isVerifying || isLocked || !accessPassword.value) && styles.disabledButton
              ]}
              onPress={verifyPassword}
              disabled={isVerifying || isLocked || !accessPassword.value}
            >
              {isVerifying ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.signUpButtonText}>VERIFY</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.loginContainer}>
              <Text style={styles.haveAccountText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
                <Text style={styles.loginText}>LOG IN</Text>
              </TouchableOpacity>
            </View>
            
            {errorMessage && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorMessage}>{errorMessage}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: '100%',
    opacity: 0.8,
    padding: 0
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 40,
    letterSpacing: 2,
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 40
  },
  inputContainer: {
    width: '100%',
    marginTop: 20,
    position: 'relative',
  },
  input: {
    backgroundColor: '#f2f2f2',
    borderRadius: 30,
    padding: 15,
    width: '100%',
    fontSize: 16,
  },
  passwordToggle: {
    position: 'absolute',
    right: 15,
    top: 12,
  },
  signUpButton: {
    backgroundColor: '#5A5AD0',
    borderRadius: 30,
    width: '100%',
    padding: 15,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
    minHeight: 50,
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#A0A0E8',
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    marginTop: 15,
  },
  haveAccountText: {
    color: '#666',
    marginRight: 5,
  },
  loginText: {
    color: '#5A5AD0',
    fontWeight: 'bold',
  },
  errorContainer: {
    marginTop: 15,
    width: '100%',
  },
  errorMessage: {
    color: 'red',
    textAlign: 'center',
  },
  // Access password styles
  lockIcon: {
    marginBottom: 15,
  },
  accessTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5A5AD0',
    marginBottom: 10,
    textAlign: 'center',
  },
  accessDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  lockTimerText: {
    color: '#ff6b6b',
    marginTop: 10,
    fontSize: 14,
    fontWeight: 'bold',
  },
});