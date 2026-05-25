import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../services/api';
import { ThemeContext } from '../context/ThemeContext';
import { updateMedicineNotification } from '../services/notificationService';

const { width } = Dimensions.get('window');

const CalendarScreen = ({ navigation }) => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [takenMedicines, setTakenMedicines] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState([]);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);

  // Time Picker State
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [tempTime, setTempTime] = useState(new Date());

  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    generateWeekDates();
  }, []);

  const generateWeekDates = () => {
    const dates = [];
    const today = new Date();
    // Get 7 days starting from 3 days ago to 3 days ahead
    for (let i = -3; i <= 3; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    setWeekDates(dates);
  };

  const fetchMedicines = async () => {
    try {
      const response = await api.get('/medicines');
      if (response.data) {
        // Filter and sort by time
        const routineMeds = response.data
          .filter(med => med.time && med.time.trim() !== '')
          .sort((a, b) => a.time.localeCompare(b.time));
        setMedicines(routineMeds);
      }
    } catch (error) {
      console.error('İlaçlar çekilirken hata:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await fetchMedicines();
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMedicines();
    setRefreshing(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    
    loadData();

    return unsubscribe;
  }, [navigation]);

  const toggleTaken = (id) => {
    setTakenMedicines(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const openModal = (item) => {
    setSelectedMedicine(item);
    setModalVisible(true);
  };

  const handleEditTime = (item) => {
    setEditingMedicine(item);
    const [hours, minutes] = item.time.split(':').map(Number);
    const d = new Date();
    d.setHours(hours || 9, minutes || 0, 0, 0);
    setTempTime(d);
    setShowTimePicker(true);
  };

  const handleTimeChange = async (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (event.type === 'dismissed' || !selectedDate) {
      setShowTimePicker(false);
      setEditingMedicine(null);
      return;
    }

    if (Platform.OS === 'ios') {
      setShowTimePicker(false);
    }

    const hours = selectedDate.getHours().toString().padStart(2, '0');
    const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
    const newTimeString = `${hours}:${minutes}`;

    try {
      await api.patch(`/medicines/${editingMedicine.id}/time`, { time: newTimeString });
      
      setMedicines(prev => 
        prev.map(m => m.id === editingMedicine.id ? { ...m, time: newTimeString } : m)
            .sort((a, b) => a.time.localeCompare(b.time))
      );

      await updateMedicineNotification(editingMedicine.name, editingMedicine.dosage, editingMedicine.time, newTimeString);
    } catch (error) {
      console.error('Time update error:', error);
      Alert.alert('Hata', 'Saat güncellenirken bir sorun oluştu.');
    }
    
    setEditingMedicine(null);
  };

  const renderDateItem = ({ item }) => {
    const isSelected = item.toDateString() === selectedDate.toDateString();
    const dayName = item.toLocaleDateString('tr-TR', { weekday: 'short' });
    const dayNumber = item.getDate();

    return (
      <TouchableOpacity 
        style={[styles.dateItem, isSelected && styles.dateItemSelected]}
        onPress={() => setSelectedDate(item)}
      >
        <Text style={[styles.dateDayName, isSelected && styles.dateTextSelected]}>{dayName}</Text>
        <Text style={[styles.dateNumber, isSelected && styles.dateTextSelected]}>{dayNumber}</Text>
        {isSelected && <View style={styles.dateIndicator} />}
      </TouchableOpacity>
    );
  };

  const renderTimelineItem = ({ item, index }) => {
    const isTaken = takenMedicines[item.id];
    const isLastItem = index === medicines.length - 1;

    return (
      <View style={styles.timelineRow}>
        {/* Left Side: Time and Line */}
        <View style={styles.timelineLeft}>
          <Text style={[styles.timeLabel, isTaken && styles.textMuted]}>{item.time}</Text>
          <View style={styles.verticalLineContainer}>
            <View style={[styles.verticalLine, isLastItem && { height: 30 }]} />
            <View style={[styles.timelineDot, isTaken && styles.timelineDotTaken]}>
              {isTaken && <Ionicons name="checkmark" size={10} color="#fff" />}
            </View>
          </View>
        </View>

        {/* Right Side: Medicine Card */}
        <View style={styles.timelineRight}>
          <TouchableOpacity 
            style={[styles.cardContainer, isTaken && styles.cardContainerTaken]}
            activeOpacity={0.8}
            onPress={() => openModal(item)}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.pillIconContainer, { backgroundColor: isTaken ? '#e2e8f0' : '#dbeafe' }]}>
                <MaterialCommunityIcons 
                  name={isTaken ? "pill" : "pill"} 
                  size={24} 
                  color={isTaken ? "#94a3b8" : "#2563eb"} 
                />
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.medicineName, isTaken && styles.textMuted]}>{item.name}</Text>
                <Text style={[styles.medicineDosage, isTaken && styles.textMuted]}>{item.dosage || 'Doz belirtilmedi'}</Text>
                
                {!isTaken && (
                  <TouchableOpacity 
                    onPress={() => handleEditTime(item)} 
                    style={styles.editTimeBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="time" size={14} color="#3b82f6" />
                    <Text style={styles.editTimeText}>Saati Düzenle</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity 
                style={[styles.checkBtn, isTaken && styles.checkBtnTaken]}
                onPress={() => toggleTaken(item.id)}
              >
                <Ionicons 
                  name={isTaken ? "checkmark-circle" : "ellipse-outline"} 
                  size={28} 
                  color={isTaken ? "#10b981" : "#cbd5e1"} 
                />
              </TouchableOpacity>
            </View>

            {item.usage_instructions && !isTaken && (
              <View style={styles.cardFooter}>
                <Ionicons name="information-circle-outline" size={16} color="#64748b" />
                <Text style={styles.instructionText} numberOfLines={1}>
                  {item.usage_instructions}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyComponent = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <MaterialCommunityIcons name="calendar-check" size={80} color="#3b82f6" />
        </View>
        <Text style={styles.emptyTitle}>Harika Bir Gün!</Text>
        <Text style={styles.emptySubtitle}>Bugün için planlanmış bir ilacınız yok. Keyfini çıkarın!</Text>
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddMedicine')}
        >
          <Text style={styles.addBtnText}>Yeni İlaç Ekle</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Takvim</Text>
          <Text style={styles.headerSubtitle}>İlaç Takip Çizelgeniz</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn}>
          <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Horizontal Date Strip */}
      <View style={styles.dateStripContainer}>
        <FlatList
          horizontal
          data={weekDates}
          renderItem={renderDateItem}
          keyExtractor={(item) => item.toDateString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateStripContent}
        />
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ marginTop: 10, color: theme.colors.textSecondary }}>Yükleniyor...</Text>
          </View>
        ) : (
          <FlatList
            data={medicines}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderTimelineItem}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={renderEmptyComponent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
              />
            }
          />
        )}
      </View>

      {/* Medicine Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalDragHandle} />
                {selectedMedicine && (
                  <>
                    <View style={styles.modalHeader}>
                      <View style={styles.modalIconBox}>
                        <MaterialCommunityIcons name="pill" size={32} color="#3b82f6" />
                      </View>
                      <View>
                        <Text style={styles.modalMedicineName}>{selectedMedicine.name}</Text>
                        <Text style={styles.modalMedicineDosage}>{selectedMedicine.dosage || 'Doz belirtilmedi'}</Text>
                      </View>
                    </View>

                    <View style={styles.modalInfoGrid}>
                      <View style={styles.modalInfoItem}>
                        <Ionicons name="time-outline" size={20} color="#64748b" />
                        <Text style={styles.modalInfoLabel}>SAAT</Text>
                        <Text style={styles.modalInfoValue}>{selectedMedicine.time}</Text>
                      </View>
                      <View style={styles.modalInfoItem}>
                        <Ionicons name="repeat-outline" size={20} color="#64748b" />
                        <Text style={styles.modalInfoLabel}>SIKLIK</Text>
                        <Text style={styles.modalInfoValue}>{selectedMedicine.frequency || 'Belirtilmedi'}</Text>
                      </View>
                    </View>

                    {selectedMedicine.usage_instructions && (
                      <View style={styles.nurseCard}>
                        <View style={styles.nurseCardHeader}>
                          <MaterialCommunityIcons name="robot-outline" size={24} color="#2563eb" />
                          <Text style={styles.nurseCardTitle}>Yapay Zeka Tavsiyesi</Text>
                        </View>
                        <Text style={styles.nurseCardText}>{selectedMedicine.usage_instructions}</Text>
                      </View>
                    )}

                    <TouchableOpacity 
                      style={styles.modalCloseBtn} 
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.modalCloseBtnText}>Kapat</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

          {showTimePicker && (
            <DateTimePicker
              value={tempTime}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={handleTimeChange}
            />
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 15,
      backgroundColor: theme.colors.surface,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '900',
      color: theme.colors.text,
      letterSpacing: -0.5,
    },
    headerSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    profileBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.isDarkMode ? theme.colors.border : '#f1f5f9',
      justifyContent: 'center',
      alignItems: 'center',
    },
    dateStripContainer: {
      backgroundColor: theme.colors.surface,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    dateStripContent: {
      paddingHorizontal: 15,
      gap: 12,
    },
    dateItem: {
      width: 60,
      height: 80,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.isDarkMode ? theme.colors.background : '#f8fafc',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    dateItemSelected: {
      backgroundColor: '#1e3a8a',
      borderColor: '#1e3a8a',
      elevation: 4,
      shadowColor: '#1e3a8a',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
    },
    dateDayName: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    dateNumber: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.text,
    },
    dateTextSelected: {
      color: '#ffffff',
    },
    dateIndicator: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#ffffff',
      marginTop: 6,
    },
    mainContent: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContainer: {
      paddingHorizontal: 20,
      paddingTop: 25,
      paddingBottom: 40,
    },
    timelineRow: {
      flexDirection: 'row',
      minHeight: 110,
    },
    timelineLeft: {
      width: 70,
      alignItems: 'center',
    },
    timeLabel: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.colors.text,
      marginBottom: 10,
    },
    verticalLineContainer: {
      flex: 1,
      alignItems: 'center',
      width: '100%',
    },
    verticalLine: {
      width: 2,
      flex: 1,
      backgroundColor: theme.colors.border,
    },
    timelineDot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#3b82f6',
      borderWidth: 4,
      borderColor: theme.colors.background,
      position: 'absolute',
      top: 0,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2,
    },
    timelineDotTaken: {
      backgroundColor: '#10b981',
      borderColor: theme.colors.background,
    },
    timelineRight: {
      flex: 1,
      paddingBottom: 25,
    },
    cardContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    cardContainerTaken: {
      opacity: 0.7,
      backgroundColor: theme.isDarkMode ? 'rgba(0,0,0,0.2)' : '#f8fafc',
      borderColor: 'transparent',
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    pillIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    cardInfo: {
      flex: 1,
    },
    medicineName: {
      fontSize: 17,
      fontWeight: '800',
      color: theme.colors.text,
    },
    medicineDosage: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      fontWeight: '600',
      marginTop: 2,
    },
    editTimeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#eff6ff',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      marginTop: 10,
      alignSelf: 'flex-start',
    },
    editTimeText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#3b82f6',
      marginLeft: 4,
    },
    checkBtn: {
      padding: 4,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      gap: 6,
    },
    instructionText: {
      fontSize: 12,
      color: '#64748b',
      fontWeight: '500',
      flex: 1,
    },
    textMuted: {
      textDecorationLine: 'line-through',
      color: '#94a3b8',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 60,
      paddingHorizontal: 40,
    },
    emptyIconCircle: {
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: '#eff6ff',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    emptyTitle: {
      fontSize: 24,
      fontWeight: '900',
      color: theme.colors.text,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 15,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 30,
    },
    addBtn: {
      backgroundColor: '#2563eb',
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 16,
    },
    addBtnText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      padding: 24,
      paddingBottom: 40,
    },
    modalDragHandle: {
      width: 40,
      height: 5,
      backgroundColor: '#e2e8f0',
      borderRadius: 3,
      alignSelf: 'center',
      marginBottom: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 25,
    },
    modalIconBox: {
      width: 60,
      height: 60,
      borderRadius: 18,
      backgroundColor: '#eff6ff',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
    },
    modalMedicineName: {
      fontSize: 22,
      fontWeight: '900',
      color: theme.colors.text,
    },
    modalMedicineDosage: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    modalInfoGrid: {
      flexDirection: 'row',
      backgroundColor: theme.isDarkMode ? theme.colors.background : '#f8fafc',
      borderRadius: 20,
      padding: 20,
      marginBottom: 25,
    },
    modalInfoItem: {
      flex: 1,
      alignItems: 'center',
    },
    modalInfoLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: '#64748b',
      marginTop: 4,
      marginBottom: 2,
    },
    modalInfoValue: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
    },
    nurseCard: {
      backgroundColor: '#f0f7ff',
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: '#dbeafe',
      marginBottom: 25,
    },
    nurseCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      gap: 8,
    },
    nurseCardTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: '#1e40af',
    },
    nurseCardText: {
      fontSize: 15,
      color: '#1e3a8a',
      lineHeight: 22,
      fontWeight: '500',
    },
    modalCloseBtn: {
      backgroundColor: theme.isDarkMode ? theme.colors.border : '#1e293b',
      height: 56,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalCloseBtnText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
  });
}

export default CalendarScreen;
