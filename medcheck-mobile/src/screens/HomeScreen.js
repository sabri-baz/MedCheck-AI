import React, { useEffect, useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image,
  SafeAreaView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';
import ReminderModal from '../components/ReminderModal';
import { ThemeContext } from '../context/ThemeContext';

const HomeScreen = ({ navigation }) => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reminderVisible, setReminderVisible] = useState(false);
  const [activeReminderMed, setActiveReminderMed] = useState(null);

  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchDashboardData();
    });
    fetchDashboardData();
    return unsubscribe;
  }, [navigation]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/medicines');
      if (response.data) {
        setMedicines(response.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCalendar = () => {
    const days = ['PT', 'SA', 'ÇAR', 'PER', 'CU', 'CMT', 'PAZ'];
    const dates = [2, 3, 4, 5, 6, 7, 8];
    const selectedDate = 4;

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.monthSelector}>
          <Ionicons name="chevron-back" size={20} color="#2A5C8A" />
          <Text style={styles.monthText}>Ekim 2023</Text>
          <Ionicons name="chevron-forward" size={20} color="#2A5C8A" />
        </View>
        <View style={styles.daysRow}>
          {days.map((day, index) => {
            const date = dates[index];
            const isSelected = date === selectedDate;
            return (
              <View key={index} style={[styles.dayItem, isSelected && styles.selectedDayItem]}>
                <Text style={[styles.dayName, isSelected && styles.selectedDayText]}>{day}</Text>
                <Text style={[styles.dayDate, isSelected && styles.selectedDayText]}>{date}</Text>
                {isSelected && <View style={styles.activeDot} />}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const getTodaySchedule = () => {
    let schedule = [];
    const today = new Date();
    
    medicines.forEach(med => {
      if (med.time) {
        const times = med.time.split(',').map(t => t.trim());
        times.forEach(t => {
          
          let isTaken = false;
          if (med.lastTaken) {
            const lastTakenDate = new Date(med.lastTaken);
            if (lastTakenDate.toDateString() === today.toDateString()) {
              // Very simple heuristic: if it was taken today and the current time string is <= current hour
              // For a real app, you'd map taken events strictly to scheduled times.
              const takenHour = lastTakenDate.getHours();
              const schHour = parseInt(t.split(':')[0], 10);
              if (schHour <= takenHour + 2) {
                 isTaken = true;
              }
            }
          }

          schedule.push({
            id: `${med.id}-${t}`,
            medicine: med,
            timeStr: t,
            isTaken
          });
        });
      }
    });

    schedule.sort((a, b) => a.timeStr.localeCompare(b.timeStr));
    return schedule;
  };

  const schedule = getTodaySchedule();
  
  // Find next medicine (first one not taken today, ideally after current time)
  const nowHour = new Date().getHours();
  const nextMedicineItem = schedule.find(item => {
    const schHour = parseInt(item.timeStr.split(':')[0], 10);
    return !item.isTaken && schHour >= nowHour - 1; // allow 1 hour grace
  }) || schedule.find(item => !item.isTaken) || schedule[0];

  const handleOpenReminder = (item) => {
    if (!item) return;
    setActiveReminderMed({ ...item.medicine, nextTime: item.timeStr });
    setReminderVisible(true);
  };

  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="medical-bag" size={28} color={theme.colors.primary} />
            <Text style={styles.headerTitle}>MedCheck AI</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="notifications" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Motivating Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryTitle}>Merhaba, Sabri!</Text>
              <Text style={styles.summarySubtitle}>Bugün harika görünüyorsun. İlaçlarını düzenli alarak sağlığını korumaya devam et.</Text>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: '65%' }]} />
              </View>
              <Text style={styles.progressText}>Günlük ilerleme: %65</Text>
            </View>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="sunny" size={48} color="#FBBF24" />
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={20} color={theme.colors.primary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Sıradaki İlaç</Text>
          </View>

          {nextMedicineItem ? (
            <View style={styles.nextMedicineCard}>
              <View style={styles.nextMedTopRow}>
                <View style={styles.nextMedImagePlaceholder}>
                  <Ionicons name="medkit-outline" size={32} color={theme.isDarkMode ? '#34d399' : '#4DA68D'} />
                </View>
                <View style={styles.nextMedInfo}>
                  <View style={styles.nextMedHeader}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>YAKLAŞIYOR</Text>
                    </View>
                    <Text style={styles.nextMedTime}>{nextMedicineItem.timeStr}</Text>
                  </View>
                  <Text style={styles.nextMedName}>{nextMedicineItem.medicine.name}</Text>
                  <Text style={styles.nextMedDesc}>{nextMedicineItem.medicine.dosage} • {nextMedicineItem.medicine.usage_instructions || 'Talimat Yok'}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleOpenReminder(nextMedicineItem)}>
                <Ionicons name="checkmark-circle" size={18} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.actionButtonText}>İlacımı Aldım / Bildir</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.nextMedicineCard, { alignItems: 'center', paddingVertical: 30 }]}>
              <Text style={{ color: theme.colors.textSecondary }}>Bugün için kayıtlı ilaç bulunmuyor.</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
          
          <TouchableOpacity 
            style={styles.calendarLinkCard}
            onPress={() => navigation.navigate('Takvim')}
          >
            <View style={styles.calendarLinkInfo}>
              <Text style={styles.calendarLinkTitle}>Günlük Planını Gör</Text>
              <Text style={styles.calendarLinkSubtitle}>Tüm ilaç programını saatlik olarak incele.</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>

        <ReminderModal 
          visible={reminderVisible} 
          medicine={activeReminderMed} 
          onClose={() => setReminderVisible(false)} 
          onRefresh={fetchDashboardData}
        />

        {/* Floating Action Button */}
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => navigation.navigate('AddMedicine')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={32} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

function getStyles(theme) {
  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    marginLeft: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  summaryCard: {
    backgroundColor: theme.isDarkMode ? '#1E293B' : '#E0F2FE',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: theme.colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme.isDarkMode ? 0.4 : 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  progressContainer: {
    height: 6,
    backgroundColor: theme.isDarkMode ? '#334155' : '#BAE6FD',
    borderRadius: 3,
    marginBottom: 6,
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  summaryIconContainer: {
    marginLeft: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  nextMedicineCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: theme.colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme.isDarkMode ? 0.3 : 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  nextMedTopRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  nextMedImagePlaceholder: {
    width: 64,
    height: 64,
    backgroundColor: theme.isDarkMode ? '#064e3b' : '#E6F4EA',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  nextMedInfo: {
    flex: 1,
  },
  nextMedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    backgroundColor: theme.isDarkMode ? '#78350f' : '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.isDarkMode ? '#fcd34d' : '#D97706',
    letterSpacing: 0.5,
  },
  nextMedTime: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  nextMedName: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 4,
  },
  nextMedDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  calendarLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  calendarLinkInfo: {
    flex: 1,
  },
  calendarLinkTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  calendarLinkSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
}

export default HomeScreen;
