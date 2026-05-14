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
 * Request notification permissions from the user
 */
export async function registerForPushNotificationsAsync() {
  let token;

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

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    // Learn more about Expo Push Token: https://docs.expo.dev/push-notifications/push-notifications-setup/
    // token = (await Notifications.getExpoPushTokenAsync()).data;
    // console.log(token);
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
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
        priority: Notifications.AndroidImportance.MAX,
        vibrate: [0, 250, 250, 250],
        data: { medicineName, dosage, time: t },
      },
      trigger: {
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });

    console.log(`Notification scheduled for ${medicineName} at ${t}. ID: ${id}`);
  }
}
