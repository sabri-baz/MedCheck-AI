import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Alert,
  ActivityIndicator,
  Image,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { ThemeContext } from '../context/ThemeContext';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'];

const ProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const { theme } = useContext(ThemeContext);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState('');
  const [chronicDiseases, setChronicDiseases] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProfile();
    });
    
    fetchProfile();
    
    return unsubscribe;
  }, [navigation]);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile');
      if (response.data) {
        setProfile(response.data);
      }
    } catch (error) {
      console.error('Profil çekme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    setHeight(profile?.height ? profile.height.toString() : '');
    setWeight(profile?.weight ? profile.weight.toString() : '');
    setBloodType(profile?.bloodType || '');
    setAllergies(profile?.allergies ? profile.allergies.join(', ') : '');
    setChronicDiseases(profile?.chronicDiseases ? profile.chronicDiseases.join(', ') : '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        bloodType: bloodType || null,
        allergies: allergies ? allergies.split(',').map(item => item.trim()).filter(i => i) : [],
        chronicDiseases: chronicDiseases ? chronicDiseases.split(',').map(item => item.trim()).filter(i => i) : []
      };

      const response = await api.post('/profile', payload);
      // Backend returns the updated profile without the joined user by default from our previous update if it's an update,
      // let's just refetch to be safe and ensure `user` object is there.
      await fetchProfile();
      setIsEditing(false);
      Alert.alert('Başarılı', 'Sağlık bilgileriniz güncellendi.');
    } catch (error) {
      console.error('Profil kaydetme hatası:', error);
      Alert.alert('Hata', 'Profil kaydedilirken bir sorun oluştu.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    const loaderStyles = getStyles(theme);
    return (
      <View style={loaderStyles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 12, color: theme.colors.textSecondary }}>Profil Yükleniyor...</Text>
      </View>
    );
  }

  const styles = getStyles(theme);

  const fullName = profile?.user?.fullName || 'Kullanıcı';
  const allergiesList = profile?.allergies || [];
  const chronicList = profile?.chronicDiseases || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Profile Info */}
        <View style={styles.headerArea}>
          <Image 
            source={{ uri: 'https://i.pravatar.cc/150?img=12' }} 
            style={styles.avatar} 
          />
          <Text style={styles.userName}>{fullName}</Text>
          <Text style={styles.userSubInfo}>{profile?.age ? `${profile.age} Yaş` : 'Bilinmeyen Yaş'}, İstanbul</Text>
        </View>

        {/* Info Cards Row */}
        <View style={styles.cardsRow}>
          <View style={styles.infoBox}>
            <View style={[styles.iconCircle, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="water" size={24} color="#ef4444" />
            </View>
            <Text style={styles.infoBoxLabel}>Kan Grubu</Text>
            <Text style={styles.infoBoxValue}>{profile?.bloodType || 'Belirtilmedi'}</Text>
          </View>
          <View style={styles.infoBox}>
            <View style={[styles.iconCircle, { backgroundColor: '#e0f2fe' }]}>
              <Ionicons name="body" size={24} color="#0ea5e9" />
            </View>
            <Text style={styles.infoBoxLabel}>Boy / Kilo</Text>
            <Text style={styles.infoBoxValue}>
              {profile?.height ? `${profile.height}cm` : '--'} / {profile?.weight ? `${profile.weight}kg` : '--'}
            </Text>
          </View>
        </View>

        {/* Allergies Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alerjilerim</Text>
          {allergiesList.length > 0 ? (
            <View style={styles.chipsContainer}>
              {allergiesList.map((item, index) => (
                <View key={index} style={styles.allergyChip}>
                  <Text style={styles.allergyChipText}>{item}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Kayıtlı alerji bulunmuyor.</Text>
          )}
        </View>

        {/* Chronic Diseases Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kronik Hastalıklarım</Text>
          {chronicList.length > 0 ? (
            <View style={styles.chipsContainer}>
              {chronicList.map((item, index) => (
                <View key={index} style={styles.chronicChip}>
                  <Text style={styles.chronicChipText}>{item}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Kayıtlı kronik hastalık bulunmuyor.</Text>
          )}
        </View>

      </ScrollView>

      {/* Edit Button */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
          <Ionicons name="create-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.editButtonText}>Sağlık Bilgilerimi Düzenle</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isEditing} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsEditing(false)}>
              <Text style={styles.modalCancelText}>İptal</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Düzenle</Text>
            <View style={{ width: 40 }} />
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              
              <View style={styles.inputRow}>
                <View style={styles.inputGroupHalf}>
                  <Text style={styles.label}>Boy (cm)</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    value={height} 
                    onChangeText={setHeight}
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </View>
                <View style={styles.inputGroupHalf}>
                  <Text style={styles.label}>Kilo (kg)</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    value={weight} 
                    onChangeText={setWeight}
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Kan Grubu</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bloodTypeContainer}>
                  {BLOOD_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.bloodTypeChip, bloodType === type && styles.bloodTypeChipActive]}
                      onPress={() => setBloodType(type)}
                    >
                      <Text style={[styles.bloodTypeText, bloodType === type && styles.bloodTypeTextActive]}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Alerjiler</Text>
                <Text style={styles.helperText}>Virgülle ayırın (Örn: Penisilin, Fıstık)</Text>
                <TextInput 
                  style={styles.input} 
                  value={allergies} 
                  onChangeText={setAllergies} 
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Kronik Hastalıklar</Text>
                <Text style={styles.helperText}>Virgülle ayırın (Örn: Diyabet, Astım)</Text>
                <TextInput 
                  style={[styles.input, styles.textArea]} 
                  value={chronicDiseases} 
                  onChangeText={setChronicDiseases} 
                  multiline 
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

            </ScrollView>

            <View style={styles.modalBottom}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Kaydet</Text>}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: theme.isDarkMode ? theme.colors.border : '#e0f2fe',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
  },
  userSubInfo: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  infoBox: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: theme.colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme.isDarkMode ? 0.3 : 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoBoxLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoBoxValue: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergyChip: {
    backgroundColor: theme.isDarkMode ? '#451a1a' : '#fef2f2',
    borderColor: theme.isDarkMode ? '#7f1d1d' : '#fca5a5',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  allergyChipText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 14,
  },
  chronicChip: {
    backgroundColor: theme.isDarkMode ? '#1e3a8a' : '#eff6ff',
    borderColor: theme.isDarkMode ? '#1e40af' : '#bfdbfe',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  chronicChipText: {
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  editButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  modalCancelText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  modalScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  inputGroupHalf: {
    width: '48%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 55,
    color: theme.colors.text,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  bloodTypeContainer: {
    flexDirection: 'row',
  },
  bloodTypeChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 10,
  },
  bloodTypeChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  bloodTypeText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  bloodTypeTextActive: {
    color: '#ffffff',
  },
  modalBottom: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  });
};

export default ProfileScreen;
