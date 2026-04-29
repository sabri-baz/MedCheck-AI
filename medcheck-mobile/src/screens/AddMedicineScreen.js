import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import api from '../services/api';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

const AddMedicineScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const handleOpenCamera = async () => {
    if (!permission?.granted) {
      const status = await requestPermission();
      if (!status.granted) {
        Alert.alert('Hata', 'Kamera izni verilmeden bu özellik kullanılamaz.');
        return;
      }
    }
    setIsCameraOpen(true);
  };

  const handleTakePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.5,
        });
        
        setIsCameraOpen(false);
        setIsAnalyzing(true);

        try {
          const response = await api.post('/ai/scan-image', {
            image: photo.base64
          });

          if (response.data && response.data.medicineName) {
            setName(response.data.medicineName);
          }
          if (response.data && response.data.dosage) {
            setDosage(response.data.dosage);
          }
        } catch (apiError) {
          console.error('OCR API Error:', apiError);
          Alert.alert('Hata', 'Okunamadı, lütfen elle girin.');
        } finally {
          setIsAnalyzing(false);
        }

      } catch (error) {
        console.error('Fotoğraf Çekme Hatası:', error);
        setIsCameraOpen(false);
        setIsAnalyzing(false);
      }
    }
  };

  const saveMedicineToDB = async () => {
    setLoading(true);
    try {
      await api.post('/medicines', {
        name,
        dosage,
        time,
        isActive: true
      });
      
      // Kayıt başarılı, formu temizle ve yönlendir
      setName('');
      setDosage('');
      setTime('');
      Alert.alert(
        'Başarılı',
        'İlaç başarıyla eklendi.',
        [{ text: 'Tamam', onPress: () => navigation.navigate('MyMedicines') }]
      );
    } catch (error) {
      console.error('Kayıt Hatası:', error);
      Alert.alert('Hata', 'İlaç veritabanına kaydedilirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name || !dosage || !time) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm alanları eksiksiz doldurun.');
      return;
    }

    setLoading(true);
    try {
      // 1. İstek: AI Risk Analizi
      const aiResponse = await api.post('/ai/analyze', {
        medicines: [name] 
      });

      const riskLevel = aiResponse.data.risk;
      
      if (riskLevel === 'high_risk') {
        setLoading(false); // Alert beklerken loading dursun
        Alert.alert(
          '⚠️ Kritik Uyarı',
          aiResponse.data.message,
          [
            { 
              text: 'İptal', 
              style: 'cancel' 
            },
            { 
              text: 'Yine de Kaydet', 
              style: 'destructive',
              onPress: () => saveMedicineToDB() 
            }
          ]
        );
      } else {
        // Risk düşükse doğrudan 2. İstek (Veritabanı Kaydı)
        await saveMedicineToDB();
      }
    } catch (error) {
      console.error('Risk Analizi Hatası:', error);
      Alert.alert('Hata', 'Risk analizi yapılırken bir ağ sorunu oluştu.');
      setLoading(false);
    }
  };

  if (isCameraOpen) {
    if (!permission) {
      return (
        <View style={styles.cameraContainer}>
          <Text style={styles.permissionText}>Kamera izni bekleniyor...</Text>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.cameraContainer}>
          <Text style={styles.permissionText}>Kameraya erişim izniniz yok.</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>İzin İste</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { marginTop: 10, backgroundColor: '#95a5a6' }]} onPress={() => setIsCameraOpen(false)}>
            <Text style={styles.buttonText}>İptal Et</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing="back" ref={cameraRef} />
        
        {/* Overlay'ı kameranın dışına (seviye/kardeş element) taşıdık */}
        <View style={[StyleSheet.absoluteFillObject, styles.overlay, { zIndex: 10 }]}>
          <View style={styles.topOverlay} />
          <View style={styles.middleOverlay}>
            <View style={styles.sideOverlay} />
            <View style={styles.focusFrame}>
              {/* Köşebentler */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <View style={styles.sideOverlay} />
          </View>
          <View style={styles.bottomOverlay}>
            <View style={styles.cameraActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsCameraOpen(false)}>
                <Text style={styles.cancelButtonText}>İptal Et</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.captureButton} onPress={handleTakePicture}>
                <View style={styles.captureInnerButton} />
              </TouchableOpacity>
              <View style={{ width: 80 }} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inner}>
        {/* Reçete Tara Butonu */}
        <TouchableOpacity 
          style={styles.scanButton} 
          activeOpacity={0.8}
          onPress={handleOpenCamera}
        >
          <View style={styles.scanButtonContent}>
            <Ionicons name="camera-outline" size={32} color="#fff" />
            <View style={styles.scanButtonTextContainer}>
              <Text style={styles.scanButtonTitle}>Reçete / Kutu Tara</Text>
              <Text style={styles.scanButtonSubtitle}>Hızlıca ilaç bilgilerini çekin</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={24} color="#fff" />
          </View>
        </TouchableOpacity>

        <Text style={styles.title}>Yeni İlaç Ekle</Text>
        <Text style={styles.subtitle}>Detayları girerek takibe başlayın</Text>

        {isAnalyzing ? (
          <View style={styles.analyzingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.analyzingText}>Yapay Zeka Reçeteyi Çözümlüyor...</Text>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="İlaç Adı (örn: Aspirin)"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <TextInput
              style={styles.input}
              placeholder="Dozaj (örn: 100mg)"
              value={dosage}
              onChangeText={setDosage}
            />
            <TextInput
              style={styles.input}
              placeholder="Kullanım Saati (örn: Sabah tok karnına)"
              value={time}
              onChangeText={setTime}
            />
          </View>
        )}

        <TouchableOpacity 
          style={[styles.button, (loading || isAnalyzing) && { opacity: 0.7 }]} 
          activeOpacity={0.7}
          onPress={handleSave}
          disabled={loading || isAnalyzing}
        >
          <Text style={styles.buttonText}>{loading ? 'Kaydediliyor...' : 'Kaydet ve Analiz Et'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  analyzingContainer: {
    marginBottom: 24,
    backgroundColor: '#ebf8ff',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bee3f8',
  },
  analyzingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#2b6cb0',
    fontWeight: '500',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    width: '100%',
    height: 55,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
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
  scanButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  scanButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scanButtonTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  scanButtonTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scanButtonSubtitle: {
    color: '#e2e8f0',
    fontSize: 14,
    marginTop: 4,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  middleOverlay: {
    flexDirection: 'row',
    height: 300,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  focusFrame: {
    width: 300,
    height: 300,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#fff',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  cameraActions: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInnerButton: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#fff',
  },
  cancelButton: {
    width: 80,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddMedicineScreen;
