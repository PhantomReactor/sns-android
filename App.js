import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
} from 'react-native';
import {
    getNotification,
    requestUserPermission,
} from './utils/notificationsListener';
import axios from 'axios';
import {subscribeUser} from './utils/solanaClient';

const App = () => {
    const [address, setAddress] = useState('');

    const saveAddress = async () => {
        try {
            if (address === '') {
                alert('Address is required');
            } else {
                const token = await requestUserPermission();
                const response = await subscribeUser({address, token});
                alert(response);
            }
        } catch (err) {
            console.log(err);
            alert(err);
            //alert('subscription failed');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                Enter a valid solana address to subscribe for notifications
            </Text>
            <Text style={styles.title}>
                Close the app after subscribing to receive notifications as the
                app currently can only receive notifications when it is closed
            </Text>
            <Text style={styles.title}>
                Please wait until you get a subscription success alert after
                clicking submit
            </Text>
            <TextInput
                style={styles.input}
                placeholder="Solana address"
                onChangeText={input => setAddress(input)}
            />
            <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText} onPress={saveAddress}>
                    Submit
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    input: {
        width: 300,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        marginVertical: 10,
        borderRadius: 25,
        paddingHorizontal: 30,
    },

    button: {
        width: 200,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 25,
    },

    buttonText: {
        textAlign: 'center',
        fontSize: 15,
        padding: 5,
    },

    title: {
        padding: 20,
        fontSize: 12,
    },
});

export default App;
