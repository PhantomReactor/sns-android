import messaging from '@react-native-firebase/messaging';
import AsyncStorageLib from '@react-native-async-storage/async-storage';

export async function requestUserPermission() {
    const authStatus = await messaging().requestPermission();
    const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
        console.log('Authorization status:', authStatus);
        let token = await getFcmToken();
        return token;
    }
}

let getFcmToken = async () => {
    let fcmToken = await AsyncStorageLib.getItem('fcmToken');
    //if (!fcmToken) {
    try {
        fcmToken = await messaging().getToken();
        await AsyncStorageLib.setItem('fcmToken', fcmToken);
    } catch (err) {
        console.log(err.message);
    }
    // }
    return fcmToken;
};

export const getNotification = async () => {
    messaging().onNotificationOpenedApp(remoteMessage => {
        console.log(
            'Notification caused app to open from background state:',
            remoteMessage.notification,
        );
    });

    messaging().onMessage(remoteMessage => {
        console.log(
            'Notification caused app to open from background state:',
            remoteMessage.notification,
        );
    });

    messaging()
        .getInitialNotification()
        .then(remoteMessage => {
            if (remoteMessage) {
                console.log(
                    'Notification caused app to open from quit state:',
                    remoteMessage.notification,
                );
            }
        });
};
