import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  StatusBar,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../api/config';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const RegisterScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/register', {
        fullName,
        email,
        password
      });

      Alert.alert('Başarılı', 'Kayıt işlemi başarılı!', [
        { text: 'Tamam', onPress: () => navigation.navigate('Login') }
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            <View style={styles.topSection}>
              <View style={styles.logoContainer}>
                <MaterialCommunityIcons name="medical-bag" size={32} color="#FFF" />
              </View>
              <Text style={styles.logoText}>MedCheck</Text>
              <Text style={styles.logoSubtext}>Sağlığınız Emin Ellerde</Text>
            </View>

        <View style={styles.bottomSection}>
          <Text style={styles.title}>Hesap Oluştur</Text>

          <ScrollView 
            style={styles.formContainer} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.label}>AD SOYAD</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ad Soyad"
                placeholderTextColor="#A0A0A0"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            <Text style={styles.label}>E-POSTA</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="ornek@medcheck.com"
                placeholderTextColor="#A0A0A0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.label}>ŞİFRE</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#A0A0A0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <Text style={styles.label}>ŞİFRE TEKRAR</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="lock-reset" size={22} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#A0A0A0"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              style={[styles.registerButton, loading && { opacity: 0.7 }]} 
              activeOpacity={0.8}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.registerButtonText}>{loading ? 'Kaydediliyor...' : 'Kaydol'}</Text>
              <Ionicons name="arrow-forward-outline" size={20} color="#FFF" style={styles.btnIconRight} />
            </TouchableOpacity>

            <View style={styles.orContainer}>
              <View style={styles.divider} />
              <Text style={styles.orText}>VEYA</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity style={styles.googleButton} activeOpacity={0.8}>
              <Ionicons name="logo-google" size={20} color="#DB4437" style={styles.googleIcon} />
              <Text style={styles.googleButtonText}>Google ile Kaydol</Text>
            </TouchableOpacity>
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>Zaten hesabın var mı? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}>Giriş Yap</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A3055', // Match top section
  },
  topSection: {
    height: '30%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  logoSubtext: {
    fontSize: 12,
    color: '#D0D8E0',
    letterSpacing: 1,
    fontWeight: '600'
  },
  bottomSection: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 30,
    paddingTop: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 24,
  },
  formContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginBottom: 20,
    height: 56,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#1E293B',
    fontSize: 16,
  },
  registerButton: {
    backgroundColor: '#2A5C8A',
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2A5C8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 8,
  },
  registerButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  btnIconRight: {
    marginLeft: 8,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  orText: {
    color: '#94A3B8',
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#64748B',
    fontSize: 14,
  },
  footerLink: {
    color: '#2A5C8A',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
