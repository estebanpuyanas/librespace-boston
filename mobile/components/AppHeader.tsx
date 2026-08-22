import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { MobileCopy } from '../content';
import type { AppLanguage } from '../types/app';
import logo from '../assets/librespace-logo.png';

interface AppHeaderProps {
  copy: MobileCopy;
  language: AppLanguage;
  location: string;
  locationIsActive: boolean;
  locationIsLive: boolean;
  onLanguageToggle: () => void;
  onLocationPress: () => void;
}

export const AppHeader = ({
  copy,
  language,
  location,
  locationIsActive,
  locationIsLive,
  onLanguageToggle,
  onLocationPress,
}: AppHeaderProps) => (
  <>
    <View style={styles.topbar}>
      <View style={styles.wordmark}>
        <View style={styles.logoMark}>
          <Image source={logo} style={styles.logoImage} />
        </View>
        <Text style={styles.brand}>LibreSpace</Text>
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
          <Text style={styles.languageText}>{language.toUpperCase()} ▾</Text>
        </Pressable>
      </View>
    </View>
    <Pressable
      style={styles.locationLine}
      onPress={onLocationPress}
      accessibilityRole='button'
      accessibilityLabel='Choose your search area'
    >
      <View style={styles.locationPin}>
        <View style={styles.locationPinCenter} />
      </View>
      <Text style={styles.locationText}>{location}</Text>
      {locationIsLive ? (
        <View style={styles.liveTag} accessibilityLabel={copy.liveLocation}>
          <View style={styles.liveTagDot} />
          <Text style={styles.liveTagText}>LIVE</Text>
        </View>
      ) : (
        <Text
          style={[styles.liveDot, !locationIsActive && styles.locationChevron]}
          accessibilityLabel={locationIsActive ? 'Selected area' : 'Choose your area'}
        >
          {locationIsActive ? '●' : '›'}
        </Text>
      )}
    </Pressable>
  </>
);

const styles = StyleSheet.create({
  topbar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 28,
  },
  wordmark: { alignItems: 'center', flexDirection: 'row' },
  logoMark: {
    alignItems: 'center',
    height: 31,
    justifyContent: 'center',
    marginRight: 8,
    width: 31,
  },
  logoImage: { height: 31, width: 31 },
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
    alignItems: 'center',
    backgroundColor: '#E8E9DD',
    borderRadius: 16,
    height: 44,
    justifyContent: 'center',
    width: 56,
  },
  languageText: { color: '#3E5546', fontSize: 12, fontWeight: '800', lineHeight: 16 },
  actions: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  locationLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
    marginTop: 39,
    paddingHorizontal: 22,
  },
  locationPin: {
    alignItems: 'center',
    backgroundColor: '#C45E3D',
    borderRadius: 8,
    height: 14,
    justifyContent: 'center',
    transform: [{ rotate: '-45deg' }],
    width: 14,
  },
  locationPinCenter: {
    backgroundColor: '#F5F4ED',
    borderRadius: 3,
    height: 5,
    transform: [{ rotate: '45deg' }],
    width: 5,
  },
  locationText: { color: '#4F6256', fontSize: 13, fontWeight: '600' },
  liveTag: {
    alignItems: 'center',
    backgroundColor: '#DFEDE1',
    borderRadius: 9,
    flexDirection: 'row',
    gap: 4,
    marginLeft: 2,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  liveTagDot: { backgroundColor: '#218453', borderRadius: 3, height: 6, width: 6 },
  liveTagText: { color: '#216340', fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  liveDot: { color: '#3D9566', fontSize: 9, marginLeft: 2 },
  locationChevron: { color: '#5E7162', fontSize: 20, lineHeight: 18, marginLeft: 1 },
});
