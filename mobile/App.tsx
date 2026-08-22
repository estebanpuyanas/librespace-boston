import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LanguagePicker } from './components/LanguagePicker';
import './services/api';

export default function App() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style='dark' />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Text style={styles.brandDot}>●</Text>
          </View>
          <Text style={styles.brand}>FreeSpace</Text>
          <Text style={styles.city}>BOSTON</Text>
        </View>
        <Text style={styles.headline}>{t('home.headline')}</Text>
        <Text style={styles.description}>{t('home.description')}</Text>
        <View style={styles.translationNote}>
          <Text style={styles.translationNoteText}>{t('translation.disclaimer')}</Text>
        </View>
        <LanguagePicker />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F4ED' },
  content: { padding: 22, paddingBottom: 44 },
  brandRow: { alignItems: 'center', flexDirection: 'row' },
  brandMark: {
    alignItems: 'center',
    backgroundColor: '#246A48',
    borderRadius: 11,
    height: 23,
    justifyContent: 'center',
    marginRight: 7,
    width: 23,
  },
  brandDot: { color: '#F4EEDC', fontSize: 14, lineHeight: 16 },
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
  headline: {
    color: '#153A29',
    fontFamily: 'Georgia',
    fontSize: 39,
    fontWeight: '700',
    letterSpacing: -1.4,
    lineHeight: 44,
    marginTop: 54,
  },
  description: { color: '#5E6C61', fontSize: 16, lineHeight: 23, marginTop: 16 },
  translationNote: { backgroundColor: '#E6EEE2', borderRadius: 10, marginTop: 22, padding: 12 },
  translationNoteText: { color: '#456049', fontSize: 12, lineHeight: 18 },
});
