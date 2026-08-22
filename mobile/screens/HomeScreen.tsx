import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { Spot } from 'shared';
import { AlternativeSpotRow } from '../components/AlternativeSpotRow';
import { AppHeader } from '../components/AppHeader';
import { AppTabBar } from '../components/AppTabBar';
import { FriendsPlansSheet } from '../components/FriendsPlansSheet';
import { LocalSnapshot } from '../components/LocalSnapshot';
import { NeighborhoodPicker } from '../components/NeighborhoodPicker';
import { ProfileSheet } from '../components/ProfileSheet';
import type { ProfileDetails } from '../components/ProfileSheet';
import { PromptList } from '../components/PromptList';
import { QueryComposer } from '../components/QueryComposer';
import { ResultViewToggle } from '../components/ResultViewToggle';
import type { ResultView } from '../components/ResultViewToggle';
import { SpotCard } from '../components/SpotCard';
import { SpotMap } from '../components/SpotMap';
import { getMobileCopy } from '../content';
import { useFreeSpaceSearch } from '../hooks/useFreeSpaceSearch';
import { useCurrentWeather } from '../hooks/useCurrentWeather';
import { useIpLocation } from '../hooks/useIpLocation';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { useNearbyWifi } from '../hooks/useNearbyWifi';
import type { AmenityLabel, AppLanguage, QuickPrompt, SearchLocation } from '../types/app';

const initialQuery = 'I need a free place near Downtown where I can sit and use Wi-Fi.';

export const HomeScreen = () => {
  const [query, setQuery] = useState(initialQuery);
  const [language, setLanguage] = useState<AppLanguage>('en');
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [manualLocation, setManualLocation] = useState<SearchLocation | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [friendsPlansOpen, setFriendsPlansOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileDetails>({ email: '', name: '' });
  const [liveLocationEnabled, setLiveLocationEnabled] = useState(true);
  const [savedSpots, setSavedSpots] = useState<Spot[]>([]);
  const [view, setView] = useState<ResultView>('list');
  const { isLive, location: liveLocation } = useLiveLocation(liveLocationEnabled);
  const locationForSearch = liveLocation ?? manualLocation;
  const { loading, response, search, usingDemoData } = useFreeSpaceSearch(locationForSearch);
  const copy = getMobileCopy(language);
  const { loading: ipLocationLoading, location: ipSuggestion } = useIpLocation(
    locationPickerOpen && locationForSearch === null,
  );
  const contextLocation = locationForSearch;
  const {
    data: weather,
    failed: weatherFailed,
    loading: weatherLoading,
  } = useCurrentWeather(contextLocation);
  const { loading: wifiLoading, spot: wifiSpot } = useNearbyWifi(contextLocation);

  const searchWithLocationFallback = async (
    nextQuery: string,
    amenities: AmenityLabel[],
    overrideLocation?: SearchLocation | null,
  ) => {
    const searchLocation = overrideLocation === undefined ? locationForSearch : overrideLocation;
    if (!searchLocation) {
      setLocationPickerOpen(true);
      return;
    }
    const needsManualLocation = await search(nextQuery, amenities, searchLocation);
    if (needsManualLocation) setLocationPickerOpen(true);
  };

  const handlePrompt = (prompt: QuickPrompt) => {
    setQuery(prompt.query);
    void searchWithLocationFallback(prompt.query, prompt.amenities);
  };

  const submitSearch = () => {
    Keyboard.dismiss();
    void searchWithLocationFallback(query.trim() || initialQuery, []);
  };
  const toggleLanguage = () => setLanguage(current => (current === 'en' ? 'es' : 'en'));
  const openDirections = async (lat: number, lon: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=walking`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(copy.directionsUnavailable);
    }
  };
  const chooseNeighborhood = (nextLocation: SearchLocation) => {
    setManualLocation(nextLocation);
    setLocationPickerOpen(false);
    void searchWithLocationFallback(query.trim() || initialQuery, [], liveLocation ?? nextLocation);
  };
  const spots = response?.spots ?? [];
  const planDestinationSuggestions = Array.from(
    new Set(
      [
        ...spots.slice(0, 2).map(spot => spot.name),
        ...savedSpots.map(spot => spot.name),
        contextLocation?.label,
      ].filter((place): place is string => Boolean(place)),
    ),
  ).slice(0, 4);
  const mapLocation = contextLocation;
  const toggleSavedSpot = (spot: Spot) => {
    setSavedSpots(current =>
      current.some(savedSpot => savedSpot.spot_id === spot.spot_id)
        ? current.filter(savedSpot => savedSpot.spot_id !== spot.spot_id)
        : [...current, spot],
    );
  };
  const openSpotDirections = (spot: Spot) => openDirections(spot.lat, spot.lon);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.select({ ios: 'padding', default: undefined })}
    >
      <StatusBar style='dark' />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps='handled'
      >
        <AppHeader
          copy={copy}
          language={language}
          location={isLive ? 'Your live location' : (contextLocation?.label ?? copy.location)}
          locationIsActive={contextLocation !== null}
          onLanguageToggle={toggleLanguage}
          onLocationPress={() => setLocationPickerOpen(true)}
        />
        <View style={styles.hero}>
          <Text style={styles.headline}>{copy.headline}</Text>
          <Text style={styles.subhead}>{copy.subhead}</Text>
        </View>
        <LocalSnapshot
          copy={copy}
          hasLocation={contextLocation !== null}
          onAreaPress={() => setLocationPickerOpen(true)}
          weather={weather}
          weatherFailed={weatherFailed}
          weatherLoading={weatherLoading}
          wifiLoading={wifiLoading}
          wifiSpot={wifiSpot}
          onWifiPress={() => wifiSpot && openSpotDirections(wifiSpot)}
        />
        <QueryComposer
          copy={copy}
          loading={loading}
          query={query}
          setQuery={setQuery}
          onSubmit={submitSearch}
        />

        {!response && !loading && <PromptList language={language} onChoose={handlePrompt} />}
        {loading && (
          <View style={styles.loading}>
            <ActivityIndicator color='#246A48' />
            <Text style={styles.loadingText}>{copy.loading}</Text>
          </View>
        )}
        {response && !loading && (
          <View style={styles.results}>
            <View style={styles.resultHeader}>
              <View>
                <Text style={styles.eyebrow}>{copy.bestMatch}</Text>
                <Text style={styles.resultCount}>{copy.nearestCount(spots.length)}</Text>
              </View>
              <Text style={styles.sortedLabel}>{copy.sortedByFit}</Text>
            </View>
            {usingDemoData && <Text style={styles.demoBanner}>{copy.demoNotice}</Text>}
            <ResultViewToggle view={view} onChange={setView} />
            {spots.length > 0 ? (
              view === 'map' && mapLocation ? (
                <SpotMap location={mapLocation} spots={spots} onDirections={openSpotDirections} />
              ) : (
                <>
                  <SpotCard
                    copy={copy}
                    spot={spots[0]}
                    saved={savedSpots.some(savedSpot => savedSpot.spot_id === spots[0].spot_id)}
                    onToggleSave={() => toggleSavedSpot(spots[0])}
                  />
                  {spots.length > 1 && (
                    <Text style={styles.alternativesTitle}>{copy.alternativesTitle}</Text>
                  )}
                  {spots.slice(1).map((spot, index) => (
                    <AlternativeSpotRow
                      copy={copy}
                      key={spot.spot_id}
                      spot={spot}
                      index={index + 2}
                      onPress={() => openDirections(spot.lat, spot.lon)}
                    />
                  ))}
                </>
              )
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>{copy.emptyTitle}</Text>
                <Text style={styles.emptyText}>{copy.emptyText}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
      <AppTabBar
        onOpenPlans={() => setFriendsPlansOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />
      <ProfileSheet
        visible={profileOpen}
        onClose={() => setProfileOpen(false)}
        savedSpots={savedSpots}
        onOpenDirections={openSpotDirections}
        profile={profile}
        onSaveProfile={setProfile}
        liveLocationEnabled={liveLocationEnabled}
        onToggleLiveLocation={setLiveLocationEnabled}
        onChooseArea={() => {
          setProfileOpen(false);
          setLocationPickerOpen(true);
        }}
        onOpenFriends={() => {
          setProfileOpen(false);
          setFriendsPlansOpen(true);
        }}
      />
      <FriendsPlansSheet
        visible={friendsPlansOpen}
        suggestedDestinations={planDestinationSuggestions}
        onClose={() => setFriendsPlansOpen(false)}
      />
      <NeighborhoodPicker
        visible={locationPickerOpen}
        ipSuggestion={ipSuggestion}
        loadingSuggestion={ipLocationLoading}
        onClose={() => setLocationPickerOpen(false)}
        onSelect={chooseNeighborhood}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F4ED' },
  scrollView: { flex: 1 },
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
  locationBanner: {
    backgroundColor: '#F1E7D5',
    borderRadius: 10,
    color: '#71562E',
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
