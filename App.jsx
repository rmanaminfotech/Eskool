/**
 * School App
 * @format
 */

import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initializeNotificationListeners } from './src/services/notificationListener';

function Root() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        // paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FF9800" translucent={false} />
            <View style={{ height: insets.top, backgroundColor: '#FF9800' }} />

      <View style={{ flex: 1, backgroundColor: '#f5f6f8' }}>
        <AppNavigator />
      </View>
    </View>
  );
}

function App() {
  useEffect(() => {
    let unsubscribe = () => {};

    initializeNotificationListeners().then((listenerUnsubscribe) => {
      if (typeof listenerUnsubscribe === 'function') {
        unsubscribe = listenerUnsubscribe;
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Root />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;