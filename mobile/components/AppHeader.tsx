import { Pressable, StyleSheet, Text, View } from 'react-native';

interface AppHeaderProps {
  location: string;
}

export const AppHeader = ({ location }: AppHeaderProps) => (
  <>
    <View style={styles.topbar}>
      <View style={styles.wordmark}>
        <View style={styles.logoMark}>
          <Text style={styles.logoDot}>●</Text>
        </View>
        <Text style={styles.brand}>FreeSpace</Text>
        <Text style={styles.city}>BOSTON</Text>
      </View>
      <Pressable
        style={styles.languageButton}
        accessibilityRole='button'
        accessibilityLabel='Language: English'
      >
        <Text style={styles.languageText}>EN⌄</Text>
      </Pressable>
    </View>
    <View style={styles.locationLine}>
      <Text style={styles.locationPin}>●</Text>
      <Text style={styles.locationText}>{location}</Text>
      <Text style={styles.liveDot}>●</Text>
    </View>
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
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  languageText: { color: '#3E5546', fontSize: 12, fontWeight: '700' },
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
});
