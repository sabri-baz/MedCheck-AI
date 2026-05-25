import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure how notifications should be handled when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions from the user for Local Notifications
 */
export async function requestLocalNotificationPermissionsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      enableVibrate: true,
      sound: 'default',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Failed to get permissions for local notifications!');
    return false;
  }

  return true;
}

/**
 * Schedule a medicine alarm
 * @param {string} medicineName - Name of the medicine
 * @param {string} dosage - Dosage information
 * @param {string} time - Time string (e.g. "09:00" or "09:00, 21:00")
 */
export async function scheduleMedicineAlarm(medicineName, dosage, time) {
  if (!time) return;

  // Split time if multiple times are provided (e.g. "09:00, 21:00")
  const times = time.split(',').map(t => t.trim());

  for (const t of times) {
    const [hours, minutes] = t.split(':').map(Number);

    if (isNaN(hours) || isNaN(minutes)) continue;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 İlaç Vakti!',
        body: `${medicineName} (${dosage}) vaktiniz geldi. Lütfen ilacınızı almayı unutmayın.`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority?.MAX || 'max',
        vibrate: [0, 250, 250, 250],
        data: { medicineName, dosage, time: t },
      },
      trigger: {
        type: 'daily',
        channelId: 'default',
        hour: hours,
        minute: minutes,
      },
    });

    console.log(`Notification scheduled for ${medicineName} at ${t}. ID: ${id}`);
  }
}

/**
 * Update a scheduled medicine alarm
 * Cancels old alarms for this medicine and schedules new ones.
 */
export async function updateMedicineNotification(medicineName, dosage, oldTime, newTime) {
  if (!newTime) return;

  // Find and cancel old notifications for this medicine
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduledNotifications) {
    const data = notification.content.data;
    if (data && data.medicineName === medicineName) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      console.log(`Cancelled old notification for ${medicineName}`);
    }
  }

  // Schedule the new ones
  await scheduleMedicineAlarm(medicineName, dosage, newTime);
}
