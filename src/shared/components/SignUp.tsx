import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigation } from "@react-navigation/native";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Button } from "react-native-paper";
import { useAuth } from "shared/hooks/useAuth";
import Input from "shared/components/forms/input";
import Icon from 'react-native-vector-icons/MaterialIcons';

type SignUpFormProps = {
  onSuccess?: () => void;
  onError?: (errorMessage: string) => void;
};

type SignUpFormValues = {
  username: string;
  email: string;
  password: string;
  confirmedPassword: string;
};

export default function SignUpForm({ onSuccess, onError }: SignUpFormProps) {
  const { register } = useAuth();
  const form = useForm<SignUpFormValues>({ mode: "onChange" });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigation = useNavigation<any>();
  const password = form.watch("password");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const onSubmit = async (data: SignUpFormValues) => {
    setErrorMessage(null);
    try {
      await register(data.username, data.email, data.password);
      onSuccess?.();
      navigation.navigate("Home", { screen: "Feed" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Sign-up failed. Try again.";
      setErrorMessage(message);
      onError?.(message);
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
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
              onChangeText={value => form.setValue('email', value)}
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
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#888"
              secureTextEntry={!confirmPasswordVisible}
              onChangeText={value => form.setValue('confirmedPassword', value)}
            />
            <TouchableOpacity 
              style={styles.passwordToggle} 
              onPress={toggleConfirmPasswordVisibility}
            >
              <Icon 
                name={confirmPasswordVisible ? "visibility" : "visibility-off"} 
                size={24} 
                color="#888" 
              />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.signUpButton}
            onPress={form.handleSubmit(onSubmit)}
            disabled={!form.formState.isValid}
          >
            <Text style={styles.signUpButtonText}>SIGN UP</Text>
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
  signUpButton: {
    backgroundColor: '#5A5AD0',
    borderRadius: 30,
    width: '100%',
    padding: 15,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
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
});