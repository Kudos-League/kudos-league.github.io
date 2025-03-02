import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigation } from "@react-navigation/native";
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { Button } from "react-native-paper";
import { useAuth } from "shared/hooks/useAuth";
import Input from "shared/components/forms/input";
import { Image } from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';

type LoginFormProps = {
  onSuccess?: () => void;
  onError?: (errorMessage: string) => void;
};

type FormValues = {
  username: string;
  password: string;
};

export default function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const { login, token, logout } = useAuth();
  const form = useForm<FormValues>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigation = useNavigation<any>();

  const onSubmit = async (data: FormValues) => {
    setErrorMessage(null);
    try {
      await login(data.username, data.password);
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.";
      setErrorMessage(message);
      onError?.(message);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigation.navigate("SignIn");
    } catch (error) {
      setErrorMessage("Failed to log out. Please try again.");
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  if (token) {
    return (
      <View style={styles.container}>
        <Text>You are logged in.</Text>
        <Button onPress={handleLogout} mode="contained">
          Log Out
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <Image 
        style={styles.backgroundImage} 
        source={require('../assets/images/login_background.jpg')} 
        resizeMode="cover"
      />
      
      <View style={styles.contentContainer}>
        <Text style={styles.welcomeText}>WELCOME</Text>
        
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#888"
              onChangeText={value => form.setValue('username', value)}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#888"
              secureTextEntry={!passwordVisible}
              onChangeText={value => form.setValue('password', value)}
            />
            <TouchableOpacity 
              style={styles.passwordToggle} 
              onPress={togglePasswordVisibility}
            >
              <Icon 
                name={passwordVisible ? "visibility" : "visibility-off"} 
                size={24} 
                color="#888" 
              />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.forgotPasswordContainer}
            onPress={() => navigation.navigate("forgotPassword")}
          >
            <Text style={styles.forgotPasswordText}>FORGOT PASSWORD</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.loginButton}
            onPress={form.handleSubmit(onSubmit)}
          >
            <Text style={styles.loginButtonText}>LOG IN</Text>
          </TouchableOpacity>
          
          <Text style={styles.orText}>OR LOG IN WITH</Text>
          
          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity style={[styles.socialButton, styles.googleButton]}>
              <Text style={styles.socialButtonText}>G</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialButton, styles.appleButton]}>
              <Text style={styles.socialButtonText}>A</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialButton, styles.facebookButton]}>
              <Text style={styles.socialButtonText}>f</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.signUpContainer}>
            <Text style={styles.noAccountText}>Don't have account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
              <Text style={styles.signUpText}>SIGN UP</Text>
            </TouchableOpacity>
          </View>
          
          {errorMessage && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorMessage}>{errorMessage}</Text>
            </View>
          )}
        </View>
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
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  container: {
    padding: 20,
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
    marginTop: 30,
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
  forgotPasswordContainer: {
    alignSelf: 'center',
    marginTop: 5,
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#5A5AD0',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#5A5AD0',
    borderRadius: 30,
    width: '100%',
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orText: {
    color: '#666',
    fontSize: 14,
    marginVertical: 15,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 15,
  },
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  googleButton: {
    backgroundColor: '#E3DFFD',
  },
  appleButton: {
    backgroundColor: '#E3DFFD',
  },
  facebookButton: {
    backgroundColor: '#E3DFFD',
  },
  socialButtonText: {
    fontSize: 16,
    color: '#5A5AD0',
    fontWeight: 'bold',
  },
  signUpContainer: {
    flexDirection: 'row',
    marginTop: 15,
  },
  noAccountText: {
    color: '#666',
    marginRight: 5,
  },
  signUpText: {
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
});