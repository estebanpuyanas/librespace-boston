import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MobileCopy } from '../content';
import type { AppLanguage } from '../types/app';

interface AppHeaderProps {
  copy: MobileCopy;
  language: AppLanguage;
  location: string;
  locationIsActive: boolean;
  onLanguageToggle: () => void;
  onLocationPress: () => void;
  onProfilePress: () => void;
}

export const AppHeader = ({
  copy,
  language,
  location,
  locationIsActive,
  onLanguageToggle,
  onLocationPress,
  onProfilePress,
}: AppHeaderProps) => (
  <>
    <View style={styles.topbar}>
      <View style={styles.wordmark}>
        <View style={styles.logoMark}>
          <Text style={styles.logoDot}>●</Text>
        </View>
        <Text style={styles.brand}>FreeSpace</Text>
        <Text style={styles.city}>BOSTON</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          style={styles.languageButton}
          onPress={onLanguageToggle}
          accessibilityRole='button'
          accessibilityLabel={copy.languageLabel}
          hitSlop={6}
        >
          <Text style={styles.languageText}>{language.toUpperCase()} ↔</Text>
        </Pressable>
        <Pressable
          style={styles.profileButton}
          onPress={onProfilePress}
          accessibilityRole='button'
          accessibilityLabel='Open your profile'
          hitSlop={6}
        >
          <Text style={styles.profileIcon}>◉</Text>
        </Pressable>
      </View>
    </View>
    <Pressable
      style={styles.locationLine}
      onPress={onLocationPress}
      accessibilityRole='button'
      accessibilityLabel='Choose your search area'
    >
      <Text style={styles.locationPin}>●</Text>
      <Text style={styles.locationText}>{location}</Text>
      <Text
        style={[styles.liveDot, !locationIsActive && styles.locationChevron]}
        accessibilityLabel={locationIsActive ? copy.liveLocation : 'Choose your area'}
      >
        {locationIsActive ? '●' : '⌄'}
      </Text>
    </Pressable>
  </>
);

const styles = StyleSheet.create({
  topbar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  wordmark: { alignItems: 'center', flexDirection: 'row' },
  logoMark: {
    alignItems: 'center',
    backgroundColor: '#246A48',
    borderRadius: 11,
    height: 23,
    justifyContent: 'center',
    marginRight: 7,
    width: 23,
  },
  logoDot: { color: '#F4EEDC', fontSize: 14, lineHeight: 16 },
  brand: {
    color: '#153A29',
    fontFamily: 'Georgia',
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  city: {
    color: '#6C776B',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.3,
    marginLeft: 7,
    marginTop: 3,
  },
  languageButton: {
    backgroundColor: '#E8E9DD',
    borderRadius: 18,
    minHeight: 44,
    minWidth: 52,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  languageText: { color: '#3E5546', fontSize: 12, fontWeight: '700' },
  actions: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  profileButton: {
    alignItems: 'center',
    backgroundColor: '#246A48',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  profileIcon: { color: '#F6F6ED', fontSize: 20 },
  locationLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
    marginTop: 39,
    paddingHorizontal: 22,
  },
  locationPin: { color: '#C45E3D', fontSize: 10 },
  locationText: { color: '#4F6256', fontSize: 13, fontWeight: '600' },
  liveDot: { color: '#3D9566', fontSize: 9, marginLeft: 2 },
  locationChevron: { color: '#5E7162', fontSize: 16, lineHeight: 16 },
});
