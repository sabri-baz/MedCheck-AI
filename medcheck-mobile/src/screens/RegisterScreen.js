import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Alert
} from 'react-native';
import axios from 'axios';

const RegisterScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/auth/register`, {
        fullName,
        email,
        password
      });

      Alert.alert('Başarılı', 'Kayıt işlemi başarılı!', [
        { text: 'Tamam', onPress: () => navigation.navigate('Login') } // assuming 'Login' is the route name
      ]);
    } catch (error) {
      console.error('Registration Error:', error);
      const errorMsg = error.response?.data?.error || 'Kayıt işlemi başarısız oldu.';
      Alert.alert('Hata', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Register</Text>
        <Text style={styles.subtitle}>Join MedCheck AI family</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, loading && { opacity: 0.7 }]} 
          activeOpacity={0.7}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Kayıt Olunuyor...' : 'Register'}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => navigation.navigate('Login')} // use navigate explicitly instead of pop to be safe
          style={styles.linkButton}
        >
          <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Login</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    height: 55,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    marginBottom: 16,
  },
  button: {
    width: '100%',
    height: 55,
    backgroundColor: '#2ecc71',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2ecc71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 24,
  },
  linkText: {
    color: '#666',
    fontSize: 14,
  },
  linkBold: {
    color: '#2ecc71', // Match the button theme
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
