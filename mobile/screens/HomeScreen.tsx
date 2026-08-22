import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AlternativeSpotRow } from '../components/AlternativeSpotRow';
import { AmenityFilters } from '../components/AmenityFilters';
import { AppHeader } from '../components/AppHeader';
import { PromptList } from '../components/PromptList';
import { QueryComposer } from '../components/QueryComposer';
import { SpotCard } from '../components/SpotCard';
import { useFreeSpaceSearch } from '../hooks/useFreeSpaceSearch';
import type { AmenityLabel, QuickPrompt } from '../types/app';

const demoLocation = { label: 'Near Downtown Boston', lat: 42.3554, lon: -71.0657 };
const initialQuery = 'I need a free place near Downtown where I can sit and use Wi-Fi.';

export const HomeScreen = () => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedAmenities, setSelectedAmenities] = useState<AmenityLabel[]>(['Wi-Fi', 'Seating']);
  const { error, loading, response, search, usingDemoData } = useFreeSpaceSearch(demoLocation);

  const toggleAmenity = (amenity: AmenityLabel) => {
    setSelectedAmenities(current =>
      current.includes(amenity) ? current.filter(item => item !== amenity) : [...current, amenity],
    );
  };

  const handlePrompt = (prompt: QuickPrompt) => {
    setQuery(prompt.query);
    setSelectedAmenities(prompt.amenities);
    search(prompt.query, prompt.amenities);
  };

  const submitSearch = () => search(query, selectedAmenities);
  const spots = response?.spots ?? [];

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.select({ ios: 'padding', default: undefined })}
    >
      <StatusBar style='dark' />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps='handled'>
        <AppHeader location={demoLocation.label} />
        <View style={styles.hero}>
          <Text style={styles.headline}>A place to be.{`\n`}No purchase needed.</Text>
          <Text style={styles.subhead}>
            Find public places to sit, recharge, cool off, and spend time — for free.
          </Text>
        </View>
        <QueryComposer query={query} setQuery={setQuery} onSubmit={submitSearch} />
        <AmenityFilters selected={selectedAmenities} onToggle={toggleAmenity} />

        {!response && !loading && <PromptList onChoose={handlePrompt} />}
        {loading && (
          <View style={styles.loading}>
            <ActivityIndicator color='#246A48' />
            <Text style={styles.loadingText}>Finding your best free options…</Text>
          </View>
        )}
        {response && !loading && (
          <View style={styles.results}>
            <View style={styles.resultHeader}>
              <View>
                <Text style={styles.eyebrow}>BEST MATCH</Text>
                <Text style={styles.resultCount}>{spots.length} free places nearby</Text>
              </View>
              <Text style={styles.sortedLabel}>Sorted by fit</Text>
            </View>
            {usingDemoData && <Text style={styles.demoBanner}>{error}</Text>}
            {spots.length > 0 ? (
              <>
                <SpotCard spot={spots[0]} />
                {spots.length > 1 && (
                  <Text style={styles.alternativesTitle}>Also worth considering</Text>
                )}
                {spots.slice(1).map((spot, index) => (
                  <AlternativeSpotRow key={spot.spot_id} spot={spot} index={index + 2} />
                ))}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No exact matches nearby yet.</Text>
                <Text style={styles.emptyText}>
                  Try removing one filter or widening your search.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F4ED' },
  content: { paddingBottom: 42 },
  hero: { paddingHorizontal: 22 },
  headline: {
    color: '#153A29',
    fontFamily: 'Georgia',
    fontSize: 39,
    fontWeight: '700',
    letterSpacing: -1.4,
    lineHeight: 43,
  },
  subhead: { color: '#5E6C61', fontSize: 15, lineHeight: 22, marginTop: 15, maxWidth: 330 },
  loading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginTop: 42,
  },
  loadingText: { color: '#526458', fontSize: 13, fontWeight: '600' },
  results: { marginTop: 33 },
  resultHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
  },
  eyebrow: { color: '#7A887B', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  resultCount: {
    color: '#193D2B',
    fontFamily: 'Georgia',
    fontSize: 21,
    fontWeight: '700',
    marginTop: 3,
  },
  sortedLabel: { color: '#7A887B', fontSize: 11, fontWeight: '600', marginBottom: 2 },
  demoBanner: {
    backgroundColor: '#E6EEE2',
    borderRadius: 10,
    color: '#456049',
    fontSize: 11,
    lineHeight: 16,
    marginHorizontal: 22,
    marginTop: 14,
    padding: 10,
  },
  alternativesTitle: {
    color: '#3E5546',
    fontFamily: 'Georgia',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 22,
    marginTop: 25,
  },
  emptyState: {
    backgroundColor: '#E6EEE2',
    borderRadius: 14,
    marginHorizontal: 22,
    marginTop: 16,
    padding: 18,
  },
  emptyTitle: { color: '#234C36', fontSize: 16, fontWeight: '800' },
  emptyText: { color: '#5F7264', fontSize: 13, lineHeight: 19, marginTop: 4 },
});
