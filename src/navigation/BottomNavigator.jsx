import React from 'react';
import { View, TouchableOpacity, Image, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../utils/colors';

const homeIcon = require('../assets/icons/home.png');
const profileIcon = require('../assets/icons/graduated.png');
const feeIcon = require('../assets/icons/rupee-symbol.png');
const noticeIcon = require('../assets/icons/cork-board.png');
const sidebarIcon = require('../assets/icons/menu-button.png');

export function BottomNavigator({ variant = 'default' }) {
  const navigation = useNavigation();
  const route = useRoute();

  const currentRoute = route.name;

  return (
    <View style={[styles.container, variant === 'messages' && styles.messagesContainer]}>
      <TabButton
        icon={homeIcon}
        title="Home"
        isActive={currentRoute === 'HomeScreen'} variant={variant}
        onPress={() => navigation.navigate('HomeScreen')}
      />

      <TabButton
        icon={profileIcon}
        title="Profile"
        isActive={currentRoute === 'StudentProfile'} variant={variant}
        onPress={() => navigation.navigate('StudentProfile')}
      />

      <TabButton
        icon={feeIcon}
        title="Fees"
        isActive={currentRoute === 'TutionFee'} variant={variant}
        onPress={() => navigation.navigate('TutionFee')}
      />

      <TabButton
        icon={noticeIcon}
        title="Notice"
        isActive={currentRoute === 'Notice'} variant={variant}
        onPress={() => navigation.navigate('Notice')}
      />

      <TabButton
        icon={sidebarIcon}
        title="More"
        isActive={currentRoute === 'Sidebar'} variant={variant}
        onPress={() => navigation.navigate('Sidebar')}
      />
    </View>
  );
}

function TabButton({ icon, title, onPress, isActive, variant }) {
  return (
    <TouchableOpacity style={[styles.button, variant === 'messages' && styles.messagesButton]} onPress={onPress}>
      <Image
        source={icon}
        style={[
          styles.icon, variant === 'messages' && styles.messagesIcon,
          { tintColor: isActive ? colors.orange : colors.gray2 }
        ]}
      />
      <Text
        style={[
          styles.label,
          variant === 'messages' && styles.messagesLabel,
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  messagesContainer: {
    height: 63,
    paddingTop: 8,
    paddingBottom: 9,
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesButton: { justifyContent: 'flex-start' },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  messagesIcon: { width: 20, height: 20 },
  label: {
    fontSize: 11,
    marginTop: 3,
    color: colors.gray2,
    fontWeight: '600',
  },
  messagesLabel: { fontSize: 9, marginTop: 4, fontWeight: '600' },
});
