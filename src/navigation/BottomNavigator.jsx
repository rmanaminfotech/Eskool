import React from 'react';
import { View, TouchableOpacity, Image, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../utils/colors';

const homeIcon = require('../assets/icons/home.png');
const profileIcon = require('../assets/icons/graduated.png');
const feeIcon = require('../assets/icons/rupee-symbol.png');
const noticeIcon = require('../assets/icons/cork-board.png');
const sidebarIcon = require('../assets/icons/menu-button.png');

export function BottomNavigator() {
  const navigation = useNavigation();
  const route = useRoute();

  const currentRoute = route.name;

  return (
    <View style={styles.container}>
      <TabButton
        icon={homeIcon}
        title="Home"
        isActive={currentRoute === 'HomeScreen'}
        onPress={() => navigation.navigate('HomeScreen')}
      />

      <TabButton
        icon={profileIcon}
        title="Profile"
        isActive={currentRoute === 'StudentProfile'}
        onPress={() => navigation.navigate('StudentProfile')}
      />

      <TabButton
        icon={feeIcon}
        title="Fees"
        isActive={currentRoute === 'TutionFee'}
        onPress={() => navigation.navigate('TutionFee')}
      />

      <TabButton
        icon={noticeIcon}
        title="Notice"
        isActive={currentRoute === 'Notice'}
        onPress={() => navigation.navigate('Notice')}
      />

      <TabButton
        icon={sidebarIcon}
        title="SideBar"
        isActive={currentRoute === 'Sidebar'}
        onPress={() => navigation.navigate('Sidebar')}
      />
    </View>
  );
}

function TabButton({ icon, title, onPress, isActive }) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Image
        source={icon}
        style={[
          styles.icon,
          { tintColor: isActive ? colors.orange : colors.gray2 }
        ]}
      />
      <Text
        style={[
          styles.label,
          { color: isActive ? colors.orange : colors.gray2 }
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 55,
    backgroundColor: colors.white,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  label: {
    fontSize: 11,
    marginTop: 4,
    color: colors.gray2,
    fontWeight: '600',
  },
});