import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { Spot } from 'shared';

export interface ProfileDetails {
  email: string;
  name: string;
}

interface ProfileSheetProps {
  liveLocationEnabled: boolean;
  onOpenFriends: () => void;
  onChooseArea: () => void;
  onClose: () => void;
  onOpenDirections: (spot: Spot) => void;
  onSaveProfile: (profile: ProfileDetails) => void;
  onToggleLiveLocation: (enabled: boolean) => void;
  profile: ProfileDetails;
  savedSpots: Spot[];
  visible: boolean;
}

const initialsFor = (name: string) => {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('');
  return initials ? initials.toUpperCase() : 'FS';
};

export const ProfileSheet = ({
  liveLocationEnabled,
  onChooseArea,
  onClose,
  onOpenFriends,
  onOpenDirections,
  onSaveProfile,
  onToggleLiveLocation,
  profile,
  savedSpots,
  visible,
}: ProfileSheetProps) => {
  const [draftName, setDraftName] = useState(profile.name);
  const [draftEmail, setDraftEmail] = useState(profile.email);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDraftName(profile.name);
    setDraftEmail(profile.email);
  }, [profile.email, profile.name, visible]);

  const saveProfile = () => {
    const name = draftName.trim();
    const email = draftEmail.trim();
    if (!name) {
      Alert.alert('Add your name', 'Enter a name so your profile feels like yours.');
      return;
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      Alert.alert(
        'Check your email',
        'Enter an email address in the usual name@example.com format.',
      );
      return;
    }
    onSaveProfile({ email, name });
  };

  const requestPasswordReset = () => {
    Alert.alert(
      'Password reset',
      'Password reset will be available when account sign-in is connected. Your profile is currently stored only on this device.',
    );
  };

  return (
    <Modal visible={visible} animationType='slide' onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Pressable style={styles.close} onPress={onClose} accessibilityRole='button'>
            <Text style={styles.closeText}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps='handled'>
          <View style={styles.identity}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initialsFor(draftName)}</Text>
            </View>
            <Text style={styles.identityTitle}>{draftName.trim() || 'Your profile'}</Text>
            <Text style={styles.identitySubtitle}>
              {draftEmail.trim() || 'Your details stay on this device'}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>YOUR DETAILS</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>NAME</Text>
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              placeholder='Your name'
              placeholderTextColor='#8B968C'
              style={styles.input}
              accessibilityLabel='Your name'
              autoCapitalize='words'
            />
            <View style={styles.divider} />
            <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
            <TextInput
              value={draftEmail}
              onChangeText={setDraftEmail}
              placeholder='you@example.com'
              placeholderTextColor='#8B968C'
              style={styles.input}
              accessibilityLabel='Email address'
              autoCapitalize='none'
              autoCorrect={false}
              keyboardType='email-address'
            />
          </View>
          <Pressable style={styles.saveButton} onPress={saveProfile} accessibilityRole='button'>
            <Text style={styles.saveButtonText}>Save profile</Text>
          </Pressable>

          <Text style={styles.sectionTitle}>PRIVACY & LOCATION</Text>
          <View style={styles.card}>
            <SettingSwitch
              title='Use live location'
              description='Show places, weather, and Wi-Fi near you.'
              value={liveLocationEnabled}
              onValueChange={onToggleLiveLocation}
            />
            <View style={styles.divider} />
            <Pressable style={styles.settingRow} onPress={onChooseArea} accessibilityRole='button'>
              <View style={styles.settingCopy}>
                <Text style={styles.settingTitle}>Choose a neighborhood</Text>
                <Text style={styles.settingDescription}>
                  Use an area instead of your live location.
                </Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </Pressable>
          </View>
          <Text style={styles.privacyNote}>
            Your location is used to find nearby public places. It is not used for ads.
          </Text>

          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          <View style={styles.card}>
            <SettingSwitch
              title='Helpful updates'
              description='Get occasional reminders about saved places.'
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
            />
          </View>

          <Text style={styles.sectionTitle}>FRIENDS & PLANS</Text>
          <View style={styles.card}>
            <Pressable style={styles.settingRow} onPress={onOpenFriends} accessibilityRole='button'>
              <View style={styles.settingCopy}>
                <Text style={styles.settingTitle}>Friends & shared plans</Text>
                <Text style={styles.settingDescription}>
                  Invite friends to a place and share location only when you choose.
                </Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.card}>
            <Pressable
              style={styles.settingRow}
              onPress={requestPasswordReset}
              accessibilityRole='button'
            >
              <View style={styles.settingCopy}>
                <Text style={styles.settingTitle}>Reset password</Text>
                <Text style={styles.settingDescription}>
                  Available after secure account sign-in is connected.
                </Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>SAVED PLACES · {savedSpots.length}</Text>
          <View style={styles.card}>
            {savedSpots.length === 0 ? (
              <Text style={styles.empty}>Save a recommendation to keep it handy here.</Text>
            ) : (
              savedSpots.map((spot, index) => (
                <View key={spot.spot_id}>
                  {index > 0 && <View style={styles.divider} />}
                  <Pressable
                    style={styles.savedRow}
                    onPress={() => onOpenDirections(spot)}
                    accessibilityRole='button'
                    accessibilityLabel={`Directions to ${spot.name}`}
                  >
                    <View style={styles.savedIcon}>
                      <Text style={styles.savedHeart}>♥</Text>
                    </View>
                    <View style={styles.savedCopy}>
                      <Text style={styles.savedName}>{spot.name}</Text>
                      <Text style={styles.savedMeta}>
                        {(spot.distance_meters / 1609.34).toFixed(1)} mi away
                      </Text>
                    </View>
                    <Text style={styles.arrow}>›</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const SettingSwitch = ({
  description,
  onValueChange,
  title,
  value,
}: {
  description: string;
  onValueChange: (enabled: boolean) => void;
  title: string;
  value: boolean;
}) => (
  <View style={styles.settingRow}>
    <View style={styles.settingCopy}>
      <Text style={styles.settingTitle}>{title}</Text>
      <Text style={styles.settingDescription}>{description}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#CDD4C9', true: '#6AA67B' }}
      thumbColor={value ? '#246A48' : '#F6F6ED'}
      accessibilityLabel={title}
    />
  </View>
);

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F5F4ED', flex: 1 },
  header: {
    alignItems: 'center',
    borderBottomColor: '#DEE2D9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 62,
    paddingHorizontal: 18,
  },
  close: { alignItems: 'center', height: 42, justifyContent: 'center', width: 42 },
  closeText: { color: '#234833', fontSize: 36, fontWeight: '300', lineHeight: 38 },
  headerTitle: { color: '#183D2B', fontFamily: 'Georgia', fontSize: 21, fontWeight: '700' },
  headerSpacer: { width: 42 },
  content: { padding: 22, paddingBottom: 48 },
  identity: { alignItems: 'center', marginBottom: 29, marginTop: 5 },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#246A48',
    borderColor: '#D6E6D5',
    borderRadius: 39,
    borderWidth: 5,
    height: 78,
    justifyContent: 'center',
    width: 78,
  },
  avatarText: { color: '#F8F7ED', fontSize: 22, fontWeight: '800', letterSpacing: 0.5 },
  identityTitle: {
    color: '#1B4630',
    fontFamily: 'Georgia',
    fontSize: 23,
    fontWeight: '700',
    marginTop: 10,
  },
  identitySubtitle: { color: '#6A786D', fontSize: 12, marginTop: 3 },
  sectionTitle: {
    color: '#78857A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.25,
    marginBottom: 9,
    marginTop: 24,
  },
  card: { backgroundColor: '#FFFFFF', borderColor: '#DDE1D8', borderRadius: 15, borderWidth: 1 },
  fieldLabel: {
    color: '#768276',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginHorizontal: 15,
    marginTop: 14,
  },
  input: {
    color: '#1F4531',
    fontSize: 16,
    minHeight: 43,
    paddingHorizontal: 15,
    paddingVertical: 7,
  },
  divider: { backgroundColor: '#E0E4DD', height: 1, marginHorizontal: 15 },
  saveButton: {
    alignItems: 'center',
    backgroundColor: '#246A48',
    borderRadius: 14,
    marginTop: 12,
    minHeight: 50,
    justifyContent: 'center',
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  settingRow: { alignItems: 'center', flexDirection: 'row', minHeight: 72, paddingHorizontal: 15 },
  settingCopy: { flex: 1, paddingRight: 12 },
  settingTitle: { color: '#234833', fontSize: 15, fontWeight: '800' },
  settingDescription: { color: '#6A786D', fontSize: 11, lineHeight: 16, marginTop: 3 },
  arrow: { color: '#53725D', fontSize: 28, fontWeight: '300', marginBottom: 2 },
  privacyNote: {
    color: '#6A786D',
    fontSize: 11,
    lineHeight: 16,
    marginHorizontal: 3,
    marginTop: 8,
  },
  empty: { color: '#66756A', fontSize: 13, lineHeight: 19, padding: 15 },
  savedRow: { alignItems: 'center', flexDirection: 'row', minHeight: 66, paddingHorizontal: 15 },
  savedIcon: {
    alignItems: 'center',
    backgroundColor: '#DDEBDD',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    marginRight: 11,
    width: 32,
  },
  savedHeart: { color: '#2E7049', fontSize: 15 },
  savedCopy: { flex: 1 },
  savedName: { color: '#244633', fontSize: 14, fontWeight: '800' },
  savedMeta: { color: '#6F7C71', fontSize: 11, marginTop: 2 },
});
