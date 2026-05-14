import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  SafeAreaView 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';

const ReminderModal = ({ visible, medicine, onClose, onRefresh }) => {
  if (!medicine) return null;

  const handleTakeMedicine = async () => {
    try {
      await api.post(`/medicines/${medicine.id}/take`);
      if (onRefresh) onRefresh();
      onClose();
    } catch (error) {
      console.error('Error taking medicine:', error);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleSnooze = () => {
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#64748B" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="pill" size={80} color="#1e5c8a" />
          </View>

          <Text style={styles.timeText}>{medicine.nextTime || 'Zamanı Geldi'}</Text>
          <Text style={styles.medicineName}>{medicine.name}</Text>
          <Text style={styles.medicineDose}>{medicine.dosage} • {medicine.usage_instructions || 'Talimat Yok'}</Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.takeButton} onPress={handleTakeMedicine}>
            <Ionicons name="checkmark-circle" size={24} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.takeButtonText}>İlacımı Aldım</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.snoozeButton} onPress={handleSnooze}>
              <Ionicons name="alarm-outline" size={20} color="#1e5c8a" style={{ marginRight: 6 }} />
              <Text style={styles.snoozeText}>Ertele</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Ionicons name="play-skip-forward-outline" size={20} color="#64748b" style={{ marginRight: 6 }} />
              <Text style={styles.skipText}>Atla</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    alignItems: 'flex-end',
    padding: 16,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: -40,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 4,
    borderColor: '#BAE6FD',
  },
  timeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e5c8a',
    marginBottom: 12,
    letterSpacing: 1,
  },
  medicineName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  medicineDose: {
    fontSize: 18,
    color: '#64748B',
    textAlign: 'center',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  takeButton: {
    backgroundColor: '#1e5c8a',
    borderRadius: 16,
    height: 64,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#1e5c8a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  takeButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  snoozeButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#E0F2FE',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  snoozeText: {
    color: '#1e5c8a',
    fontSize: 16,
    fontWeight: '700',
  },
  skipButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ReminderModal;
