import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';
import { ThemeContext } from '../context/ThemeContext';

const HealthHistoryScreen = () => {
  const [period, setPeriod] = useState('1month'); // '1week', '1month', '3months'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    fetchHistory();
  }, [period]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/health-history?period=${period}`);
      setData(response.data);
    } catch (error) {
      console.error('Tarihçe çekme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!data) return;
    
    const message = `MedCheck AI Uyum Raporu\n\nGenel Uyum Oranım: %${data.complianceRate}\nZaman Aralığı: ${
      period === '1week' ? 'Son 1 Hafta' : period === '1month' ? 'Son 1 Ay' : 'Son 3 Ay'
    }\n\nSon İlaç Kayıtlarım:\n` + data.historyList.slice(0, 5).map(h => 
      `- ${h.medicineName} (${new Date(h.date).toLocaleDateString()}): ${h.status === 'taken' ? 'Alındı' : 'Kaçırıldı'}`
    ).join('\n') + `\n\nDetaylı bilgi ve AI analizi için MedCheck AI kullanıyorum.`;

    try {
      await Share.share({
        message,
        title: 'MedCheck AI Sağlık Raporu'
      });
    } catch (error) {
      console.error('Paylaşım Hatası:', error.message);
    }
  };

  const renderHistoryItem = ({ item }) => {
    const isTaken = item.status === 'taken';
    const dateObj = new Date(item.date);
    const dateStr = dateObj.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
    const timeStr = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={styles.historyItem}>
        <View style={[styles.iconBox, { backgroundColor: isTaken ? (theme.isDarkMode ? '#064e3b' : '#ecfdf5') : (theme.isDarkMode ? '#451a1a' : '#fef2f2') }]}>
          <MaterialCommunityIcons 
            name="pill" 
            size={24} 
            color={isTaken ? '#10b981' : '#ef4444'} 
          />
        </View>
        <View style={styles.historyInfo}>
          <Text style={styles.medicineName}>{item.medicineName}</Text>
          <Text style={styles.historyDate}>{dateStr} • {timeStr}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: isTaken ? (theme.isDarkMode ? '#064e3b' : '#ecfdf5') : (theme.isDarkMode ? '#451a1a' : '#fef2f2') }]}>
          <Text style={[styles.statusText, { color: isTaken ? '#10b981' : '#ef4444' }]}>
            {isTaken ? 'Alındı' : 'Kaçırıldı'}
          </Text>
        </View>
      </View>
    );
  };

  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sağlık Geçmişim</Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {['1week', '1month', '3months'].map((val, idx) => {
          const labels = ['Son 1 Hafta', 'Son 1 Ay', 'Son 3 Ay'];
          const isSelected = period === val;
          return (
            <TouchableOpacity 
              key={val} 
              style={[styles.filterTab, isSelected && styles.filterTabActive]}
              onPress={() => setPeriod(val)}
            >
              <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                {labels[idx]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <>
          {/* Progress Card */}
          <View style={styles.cardContainer}>
            <View style={styles.rateHeader}>
              <Text style={styles.rateTitle}>Genel Uyum Oranı</Text>
              <Text style={styles.rateValue}>%{data?.complianceRate || 0}</Text>
            </View>
            
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${data?.complianceRate || 0}%` }]} />
            </View>

            <View style={styles.motivationBox}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.motivationText}>
                {data?.complianceRate >= 80 ? `Harika! %${data.complianceRate} Başarı ile devam ediyorsun` : `Daha iyi olabilir! Yüzde %${data?.complianceRate} uyumdasın.`}
              </Text>
            </View>
          </View>

          {/* History List */}
          <View style={styles.listHeaderContainer}>
            <Text style={styles.listTitle}>Geçmiş Kayıtlar</Text>
          </View>
          
          <FlatList
            data={data?.historyList || []}
            keyExtractor={item => item.id.toString()}
            renderItem={renderHistoryItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Bu dönem için kayıt bulunamadı.</Text>
            }
          />

          {/* Share Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.shareButtonText}>Raporu Paylaş</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
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
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.isDarkMode ? theme.colors.border : '#f1f5f9',
  },
  filterTabActive: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  cardContainer: {
    margin: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 24,
    shadowColor: theme.colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme.isDarkMode ? 0.3 : 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  rateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  rateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  rateValue: {
    fontSize: 36,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  progressTrack: {
    height: 12,
    backgroundColor: theme.isDarkMode ? theme.colors.border : '#f1f5f9',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 6,
  },
  motivationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.isDarkMode ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5',
    padding: 12,
    borderRadius: 12,
  },
  motivationText: {
    color: '#10b981',
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 13,
  },
  listHeaderContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  historyInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginTop: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: theme.colors.background,
    paddingBottom: 34,
  },
  shareButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  });
}

export default HealthHistoryScreen;
