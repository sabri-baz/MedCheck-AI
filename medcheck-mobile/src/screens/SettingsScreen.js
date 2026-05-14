import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Switch, 
  ScrollView, 
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { ThemeContext } from '../context/ThemeContext';

const SettingsScreen = ({ navigation }) => {
  const [user, setUser] = useState({ fullName: '', email: '' });
  const [preferences, setPreferences] = useState({
    twoFactorAuth: false,
    biometricLogin: false,
    darkMode: false,
    language: 'tr'
  });

  const { theme, toggleTheme } = useContext(ThemeContext);

  const [loading, setLoading] = useState(true);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await api.get('/users/me');
      setUser({
        fullName: response.data.fullName,
        email: response.data.email
      });
      if (response.data.preferences) {
        setPreferences(response.data.preferences);
        if (response.data.preferences.darkMode !== undefined) {
          toggleTheme(response.data.preferences.darkMode);
        }
      }
    } catch (error) {
      console.error('Kullanıcı bilgileri alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key, value) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    
    if (key === 'darkMode') {
      toggleTheme(value);
    }
    
    try {
      await api.put('/users/preferences', { preferences: newPrefs });
    } catch (error) {
      console.error('Tercih güncellenemedi:', error);
      Alert.alert('Hata', 'Ayar kaydedilemedi.');
      // Revert on failure
      setPreferences(preferences);
    }
  };

  const handleBiometricToggle = async (value) => {
    if (value) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert('Desteklenmiyor', 'Cihazınızda biyometrik doğrulama bulunmuyor veya ayarlanmamış.');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Biyometrik Doğrulamayı Aktifleştir',
        fallbackLabel: 'Şifre Kullan'
      });

      if (result.success) {
        updatePreference('biometricLogin', true);
        Alert.alert('Başarılı', 'Face ID / Parmak İzi aktif edildi.');
      }
    } else {
      updatePreference('biometricLogin', false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    setChangingPassword(true);
    try {
      await api.put('/users/change-password', {
        oldPassword,
        newPassword
      });
      Alert.alert('Başarılı', 'Şifreniz başarıyla güncellendi.');
      setPasswordModalVisible(false);
      setOldPassword('');
      setNewPassword('');
    } catch (error) {
      const msg = error.response?.data?.error || 'Şifre güncellenirken bir hata oluştu.';
      Alert.alert('Hata', msg);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Çıkış Yap', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('token');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        }
      ]
    );
  };

  const renderSectionHeader = (title) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const renderSettingRow = (icon, title, type, value, onValueChange, onPress) => (
    <TouchableOpacity 
      style={styles.settingRow} 
      onPress={type === 'link' ? onPress : null}
      disabled={type !== 'link'}
      activeOpacity={0.7}
    >
      <View style={styles.settingRowLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={22} color={theme.isDarkMode ? theme.colors.primary : "#475569"} />
        </View>
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      
      {type === 'switch' && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          thumbColor={Platform.OS === 'ios' ? '#ffffff' : (value ? '#ffffff' : '#f8fafc')}
        />
      )}
      {type === 'link' && (
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      )}
      {type === 'text' && (
        <Text style={styles.settingValueText}>{value}</Text>
      )}
    </TouchableOpacity>
  );

  const styles = getStyles(theme);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ayarlar</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Account Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{user.fullName ? user.fullName.charAt(0) : 'U'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.fullName || 'Kullanıcı'}</Text>
            <Text style={styles.profileEmail}>{user.email || 'email@example.com'}</Text>
          </View>
          <TouchableOpacity style={styles.editProfileBtn} onPress={() => navigation.navigate('Profil')}>
            <Text style={styles.editProfileText}>Düzenle</Text>
          </TouchableOpacity>
        </View>

        {/* Security Section */}
        {renderSectionHeader('Güvenlik')}
        <View style={styles.sectionBlock}>
          {renderSettingRow('lock-closed-outline', 'Şifre Değiştir', 'link', null, null, () => setPasswordModalVisible(true))}
          <View style={styles.divider} />
          {renderSettingRow('scan-outline', 'Face ID / Parmak İzi', 'switch', preferences.biometricLogin, handleBiometricToggle)}
          <View style={styles.divider} />
          {renderSettingRow('shield-checkmark-outline', 'İki Faktörlü Doğrulama', 'switch', preferences.twoFactorAuth, (val) => updatePreference('twoFactorAuth', val))}
        </View>

        {/* Preferences Section */}
        {renderSectionHeader('Tercihler')}
        <View style={styles.sectionBlock}>
          {renderSettingRow('moon-outline', 'Karanlık Mod', 'switch', preferences.darkMode, (val) => updatePreference('darkMode', val))}
          <View style={styles.divider} />
          {renderSettingRow('globe-outline', 'Dil', 'text', preferences.language === 'tr' ? 'Türkçe' : 'English', null, null)}
        </View>

        {/* Support Section */}
        {renderSectionHeader('Yardım ve Destek')}
        <View style={styles.sectionBlock}>
          {renderSettingRow('help-circle-outline', 'Sıkça Sorulan Sorular', 'link', null, null, () => Alert.alert('Bilgi', 'SSS sayfası yakında eklenecektir.'))}
          <View style={styles.divider} />
          {renderSettingRow('chatbubble-ellipses-outline', 'Bize Ulaşın', 'link', null, null, () => Alert.alert('İletişim', 'destek@medcheck.ai adresinden bize ulaşabilirsiniz.'))}
          <View style={styles.divider} />
          {renderSettingRow('document-text-outline', 'Gizlilik Politikası', 'link', null, null, () => Alert.alert('Gizlilik', 'Gizlilik politikası yakında eklenecektir.'))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
        </TouchableOpacity>

        {/* Version Info */}
        <Text style={styles.versionText}>MedCheck AI v1.0.0</Text>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={passwordModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Şifre Değiştir</Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Mevcut Şifreniz</Text>
              <TextInput 
                style={styles.inputField} 
                secureTextEntry 
                placeholder="Mevcut şifrenizi girin"
                placeholderTextColor={theme.colors.textSecondary}
                value={oldPassword}
                onChangeText={setOldPassword}
              />
              
              <Text style={styles.inputLabel}>Yeni Şifreniz</Text>
              <TextInput 
                style={styles.inputField} 
                secureTextEntry 
                placeholder="Yeni şifrenizi girin"
                placeholderTextColor={theme.colors.textSecondary}
                value={newPassword}
                onChangeText={setNewPassword}
              />

              <TouchableOpacity 
                style={styles.modalSaveButton} 
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSaveButtonText}>Şifreyi Güncelle</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

function getStyles(theme) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
  },
  scrollContent: {
    padding: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: theme.colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.isDarkMode ? 0.3 : 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.isDarkMode ? '#0369a1' : '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.isDarkMode ? '#ffffff' : '#0369a1',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  editProfileBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.isDarkMode ? theme.colors.border : '#f1f5f9',
    borderRadius: 20,
  },
  editProfileText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionBlock: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: theme.colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.isDarkMode ? 0.3 : 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: theme.colors.surface,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.isDarkMode ? theme.colors.border : '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  settingValueText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: 60, // Align with text
  },
  logoutButton: {
    backgroundColor: theme.isDarkMode ? '#7f1d1d' : '#fee2e2',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  logoutButtonText: {
    color: theme.isDarkMode ? '#fca5a5' : '#ef4444',
    fontSize: 16,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 350,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
  },
  modalBody: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  inputField: {
    backgroundColor: theme.isDarkMode ? theme.colors.background : '#f8fafc',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 20,
  },
  modalSaveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  modalSaveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
}

export default SettingsScreen;
