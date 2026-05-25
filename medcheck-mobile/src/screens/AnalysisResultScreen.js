import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { ThemeContext } from '../context/ThemeContext';
import { scheduleMedicineAlarm } from '../services/notificationService';

const AnalysisResultScreen = ({ route, navigation }) => {
  const { analysisResult, medicineData } = route.params;
  const [saving, setSaving] = useState(false);
  const { theme } = useContext(ThemeContext);

  const isDanger = analysisResult.status === 'danger';

  const themeColor = isDanger ? '#ef4444' : '#10b981';
  const dynamicBgColor = isDanger ? (theme.isDarkMode ? '#451a1a' : '#fef2f2') : (theme.isDarkMode ? '#064e3b' : '#ecfdf5');
  const iconName = isDanger ? 'warning' : 'checkmark-circle';
  const title = isDanger ? 'Kritik Risk Uyarısı' : 'İlaç Güvenli';

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/medicines', {
        name: medicineData.name || 'İsimsiz İlaç',
        dosage: medicineData.dosage || 'Belirtilmedi',
        frequency: medicineData.frequency || 'Belirtilmedi',
        time: medicineData.time || '09:00',
        usage_instructions: medicineData.usage_instructions || '',
        isActive: true
      });
      
      // Kurulacak alarmı planla
      await scheduleMedicineAlarm(
        medicineData.name || 'İsimsiz İlaç',
        medicineData.dosage || 'Belirtilmedi',
        medicineData.time || '09:00'
      );

      Alert.alert('Başarılı', 'İlaç başarıyla eklendi ve hatırlatıcı kuruldu.', [
        { text: 'Tamam', onPress: () => navigation.navigate('MainTabs', { screen: 'Ana Sayfa' }) }
      ]);
    } catch (error) {
      console.error('Kayıt Hatası:', error);
      Alert.alert('Hata', 'İlaç kaydedilirken bir sorun oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const styles = getStyles(theme);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dynamicBgColor }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analiz Sonucu</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.iconCircle, { backgroundColor: isDanger ? '#fca5a5' : '#a7f3d0' }]}>
          <Ionicons name={iconName} size={64} color={themeColor} />
        </View>
        
        <Text style={[styles.title, { color: themeColor }]}>{title}</Text>
        <Text style={styles.analysisTitle}>{analysisResult.title}</Text>
        
        <View style={styles.card}>
          <Text style={styles.description}>{analysisResult.description}</Text>
          <View style={styles.recommendationBox}>
            <Ionicons name="information-circle" size={20} color="#3b82f6" />
            <Text style={styles.recommendationText}>{analysisResult.recommendation}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {isDanger ? (
          <>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>İşlemi Durdur ve İptal Et</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.saveAnywayButton} 
              onPress={handleSave} 
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#475569" /> : <Text style={styles.saveAnywayButtonText}>Yine de Kaydet</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.safeSaveButton} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.safeSaveButtonText}>Güvenli - Kaydet ve Çık</Text>}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

function getStyles(theme) {
  return StyleSheet.create({
  container: {
    flex: 1,
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 30,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    shadowColor: theme.colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme.isDarkMode ? 0.3 : 0.1,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  description: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    marginBottom: 20,
  },
  recommendationBox: {
    flexDirection: 'row',
    backgroundColor: theme.isDarkMode ? '#1e3a8a' : '#eff6ff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: theme.isDarkMode ? '#93c5fd' : '#1e40af',
    fontWeight: '600',
    marginLeft: 8,
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    gap: 12,
    paddingBottom: 34,
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  saveAnywayButton: {
    backgroundColor: theme.colors.border,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveAnywayButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  safeSaveButton: {
    backgroundColor: '#10b981',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  safeSaveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
});
}

export default AnalysisResultScreen;
