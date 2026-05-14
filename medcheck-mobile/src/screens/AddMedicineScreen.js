import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { ThemeContext } from '../context/ThemeContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { scheduleMedicineAlarm } from '../services/notificationService';

const AddMedicineScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [usageInstructions, setUsageInstructions] = useState('');
  const [time, setTime] = useState('');

  const { theme } = useContext(ThemeContext);

  const [loading, setLoading] = useState(false);
  const [isOcrAnalyzing, setIsOcrAnalyzing] = useState(false);
  
  const [selectedImageUri, setSelectedImageUri] = useState(null);

  // Focus refs for inputs
  const nameRef = useRef(null);
  const dosageRef = useRef(null);
  const freqRef = useRef(null);
  const usageRef = useRef(null);

  const handleOpenCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('İzin Gerekli', 'Kamerayı kullanabilmek için izin vermelisiniz.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setSelectedImageUri(asset.uri);
      analyzeImageWithAI(asset.base64);
    }
  };

  const handleOpenGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('İzin Gerekli', 'Galeriye erişebilmek için izin vermelisiniz.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setSelectedImageUri(asset.uri);
      analyzeImageWithAI(asset.base64);
    }
  };

  const handleClearImage = () => {
    setSelectedImageUri(null);
    setName('');
    setDosage('');
    setFrequency('');
    setUsageInstructions('');
    setTime('');
  };

  const analyzeImageWithAI = async (base64) => {
    if (!base64) return;

    setIsOcrAnalyzing(true);
    try {
      const response = await api.post('/ai/scan-image', {
        image: `data:image/jpeg;base64,${base64}`
      });

      if (response.data && response.data.success) {
        if (response.data.name) setName(response.data.name);
        if (response.data.dosage) setDosage(response.data.dosage);
        if (response.data.frequency) setFrequency(response.data.frequency);
        if (response.data.time) setTime(response.data.time);
        if (response.data.usage_instructions) setUsageInstructions(response.data.usage_instructions);
      } else {
        Alert.alert('Okunamadı', 'Reçete okunamadı, lütfen manuel girin.');
      }
    } catch (error) {
      console.error('OCR API Error:', error);
      Alert.alert('Hata', 'Reçete okunamadı, lütfen manuel girin.');
    } finally {
      setIsOcrAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!frequency) return;
    
    const freqLower = frequency.toLowerCase();
    if (freqLower.includes('1') || freqLower.includes('bir')) {
      setTime('09:00');
    } else if (freqLower.includes('2') || freqLower.includes('iki')) {
      setTime('09:00, 21:00');
    } else if (freqLower.includes('3') || freqLower.includes('üç')) {
      setTime('08:00, 14:00, 20:00');
    } else {
      setTime(time || '09:00');
    }
  }, [frequency]);

  const saveMedicineToDB = async () => {
    setLoading(true);
    try {
      await api.post('/medicines', {
        name: name || 'İsimsiz İlaç',
        dosage: dosage || 'Belirtilmedi',
        frequency,
        time: time || '09:00',
        usage_instructions: usageInstructions,
        isActive: true
      });
      
      // Kurulacak alarmı planla
      await scheduleMedicineAlarm(
        name || 'İsimsiz İlaç',
        dosage || 'Belirtilmedi',
        time || '09:00'
      );

      Alert.alert(
        'Başarılı',
        'İlaç başarıyla eklendi ve hatırlatıcı kuruldu.',
        [{ text: 'Tamam', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Kayıt Hatası:', error);
      Alert.alert('Hata', 'İlaç kaydedilirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name || !dosage) {
      Alert.alert('Eksik Bilgi', 'Lütfen İlaç Adı ve Dozaj alanlarını doldurun.');
      return;
    }

    setLoading(true);
    try {
      const medicineData = {
        name,
        dosage,
        frequency,
        time,
        usage_instructions: usageInstructions
      };

      const aiResponse = await api.post('/ai/analyze-risk', {
        newMedicine: medicineData
      });

      setLoading(false);
      navigation.navigate('AnalysisResult', {
        analysisResult: aiResponse.data,
        medicineData: medicineData
      });
    } catch (error) {
      console.error('Risk Analizi Hatası:', error);
      Alert.alert('Hata', 'Risk analizi yapılırken bir ağ sorunu oluştu.');
      setLoading(false);
    }
  };

  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>İlaç Ekle</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false}>
          
          {/* Top Camera/Image Area */}
          <View style={styles.cameraArea}>
            {selectedImageUri ? (
              <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderContainer}>
                <Ionicons name="scan-outline" size={80} color="#3b82f6" style={styles.scanIcon} />
              </View>
            )}
            
            {/* Overlay Frame */}
            <View style={styles.overlayFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>

            {/* Camera Buttons Overlay */}
            <View style={styles.cameraControls}>
              <TouchableOpacity style={styles.smallCamBtn} onPress={handleOpenGallery}>
                <Ionicons name="image" size={20} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.mainCamBtn} onPress={handleOpenCamera}>
                <Ionicons name="camera" size={30} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.smallCamBtn} onPress={handleClearImage}>
                <Ionicons name="flash" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Details Area */}
          <View style={styles.detailsArea}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsTitle}>Tespit Edilen{'\n'}Bilgiler</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>OTOMATİK TARAMA</Text>
              </View>
            </View>

            {isOcrAnalyzing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Yapay Zeka Analiz Ediyor...</Text>
              </View>
            ) : (
              <View style={styles.inputsList}>
                
                {/* Name */}
                <View style={styles.inputRow}>
                  <View style={styles.iconBox}>
                    <MaterialCommunityIcons name="pill" size={24} color={theme.colors.textSecondary} />
                  </View>
                  <View style={styles.inputBody}>
                    <Text style={styles.inputLabel}>İLAÇ ADI</Text>
                    <TextInput 
                      ref={nameRef}
                      style={styles.inputText}
                      value={name}
                      onChangeText={setName}
                      placeholder="İlaç adını girin"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  <TouchableOpacity onPress={() => nameRef.current?.focus()}>
                    <Ionicons name="pencil" size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Dosage */}
                <View style={styles.inputRow}>
                  <View style={styles.iconBox}>
                    <Ionicons name="cube" size={24} color={theme.colors.textSecondary} />
                  </View>
                  <View style={styles.inputBody}>
                    <Text style={styles.inputLabel}>DOZAJ</Text>
                    <TextInput 
                      ref={dosageRef}
                      style={styles.inputText}
                      value={dosage}
                      onChangeText={setDosage}
                      placeholder="Örn: 500mg"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  <TouchableOpacity onPress={() => dosageRef.current?.focus()}>
                    <Ionicons name="pencil" size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Frequency */}
                <View style={styles.inputRow}>
                  <View style={styles.iconBox}>
                    <Ionicons name="calendar" size={24} color={theme.colors.textSecondary} />
                  </View>
                  <View style={styles.inputBody}>
                    <Text style={styles.inputLabel}>SIKLIK</Text>
                    <TextInput 
                      ref={freqRef}
                      style={styles.inputText}
                      value={frequency}
                      onChangeText={setFrequency}
                      placeholder="Örn: Günde İki Kez"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  <TouchableOpacity onPress={() => freqRef.current?.focus()}>
                    <Ionicons name="pencil" size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Condition */}
                <View style={styles.inputRow}>
                  <View style={styles.iconBox}>
                    <Ionicons name="restaurant" size={24} color={theme.colors.textSecondary} />
                  </View>
                  <View style={styles.inputBody}>
                    <Text style={styles.inputLabel}>DURUM</Text>
                    <TextInput 
                      ref={usageRef}
                      style={styles.inputText}
                      value={usageInstructions}
                      onChangeText={setUsageInstructions}
                      placeholder="Örn: Yemeklerden Sonra"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  <TouchableOpacity onPress={() => usageRef.current?.focus()}>
                    <Ionicons name="pencil" size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>

              </View>
            )}
          </View>
        </ScrollView>
        
        {/* Fixed Bottom Button */}
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity 
            style={[styles.saveButton, loading && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={loading || isOcrAnalyzing}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.saveButtonText}>Onayla ve Kaydet</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>

    </SafeAreaView>
  );
};

function getStyles(theme) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  scrollContent: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
  },
  cameraArea: {
    height: 380,
    backgroundColor: '#1e293b',
    position: 'relative',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  scanIcon: {
    opacity: 0.5,
  },
  overlayFrame: {
    position: 'absolute',
    top: '15%',
    left: '15%',
    right: '15%',
    bottom: '25%',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#3b82f6',
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 10 },
  topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 10 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 10 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 10 },
  cameraControls: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  smallCamBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainCamBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  detailsArea: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 100, // Make room for fixed button
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    lineHeight: 28,
  },
  badge: {
    backgroundColor: theme.isDarkMode ? theme.colors.border : '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: theme.isDarkMode ? '#ffffff' : '#0369a1',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  loadingText: {
    marginTop: 12,
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  inputsList: {
    gap: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.isDarkMode ? theme.colors.background : '#f8fafc',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.isDarkMode ? theme.colors.border : '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  inputBody: {
    flex: 1,
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  inputText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    padding: 0,
    margin: 0,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  });
}

export default AddMedicineScreen;
