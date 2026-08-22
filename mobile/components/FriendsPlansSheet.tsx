import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Friend {
  email?: string;
  id: string;
  name: string;
}

interface SharedPlan {
  destination: string;
  friendIds: string[];
  friendStatuses: Record<string, 'invited' | 'joined'>;
  id: string;
  sharesLocation: boolean;
}

interface FriendsPlansSheetProps {
  onClose: () => void;
  suggestedDestinations: string[];
  visible: boolean;
}

const initialsFor = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || 'F';

const demoFriends: Friend[] = [
  { email: 'maya@example.com', id: 'maya', name: 'Maya Chen' },
  { email: 'jordan@example.com', id: 'jordan', name: 'Jordan Lee' },
];

export const FriendsPlansSheet = ({
  onClose,
  suggestedDestinations,
  visible,
}: FriendsPlansSheetProps) => {
  const [friendInput, setFriendInput] = useState('');
  const [friends, setFriends] = useState<Friend[]>(demoFriends);
  const [destination, setDestination] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [sharesLocation, setSharesLocation] = useState(false);
  const [plans, setPlans] = useState<SharedPlan[]>([]);

  const addFriend = () => {
    const name = friendInput.trim();
    if (!name) return;
    if (friends.some(friend => friend.name.toLowerCase() === name.toLowerCase())) {
      Alert.alert('Already added', `${name} is already in your friends list.`);
      return;
    }
    setFriends(current => [...current, { id: `friend-${Date.now()}`, name }]);
    setFriendInput('');
  };

  const toggleFriend = (friendId: string) => {
    setSelectedFriendIds(current =>
      current.includes(friendId) ? current.filter(id => id !== friendId) : [...current, friendId],
    );
  };

  const createPlan = () => {
    const trimmedDestination = destination.trim();
    if (!trimmedDestination) {
      Alert.alert('Choose a destination', 'Add the place or neighborhood you are heading to.');
      return;
    }
    if (selectedFriendIds.length === 0) {
      Alert.alert('Invite someone', 'Add a friend, then choose at least one person to invite.');
      return;
    }
    setPlans(current => [
      {
        destination: trimmedDestination,
        friendIds: selectedFriendIds,
        friendStatuses: Object.fromEntries(
          selectedFriendIds.map(friendId => [friendId, 'invited']),
        ),
        id: `plan-${Date.now()}`,
        sharesLocation,
      },
      ...current,
    ]);
    setDestination('');
    setSelectedFriendIds([]);
    setSharesLocation(false);
    Alert.alert(
      'Plan created',
      'Your invitations are ready. In this demo, use “Show a friend joining” on the plan card to preview the next step.',
    );
  };

  const showFriendJoining = (planId: string) => {
    setPlans(current =>
      current.map(plan => {
        if (plan.id !== planId) return plan;
        const nextFriendId = plan.friendIds.find(
          friendId => plan.friendStatuses[friendId] === 'invited',
        );
        if (!nextFriendId) return plan;
        return {
          ...plan,
          friendStatuses: { ...plan.friendStatuses, [nextFriendId]: 'joined' },
        };
      }),
    );
  };

  return (
    <Modal visible={visible} animationType='slide' onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Pressable style={styles.close} onPress={onClose} accessibilityRole='button'>
            <Text style={styles.closeText}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Friends & plans</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps='handled'>
          <View style={styles.intro}>
            <Text style={styles.introTitle}>Meet up with care.</Text>
            <Text style={styles.introText}>
              Create a plan, invite friends, and share location only for the plan you choose.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>ADD A FRIEND</Text>
          <View style={styles.addFriendRow}>
            <TextInput
              value={friendInput}
              onChangeText={setFriendInput}
              placeholder='Name or email address'
              placeholderTextColor='#8B968C'
              style={styles.friendInput}
              autoCapitalize='words'
              accessibilityLabel='Friend name or email address'
              onSubmitEditing={addFriend}
            />
            <Pressable style={styles.addButton} onPress={addFriend} accessibilityRole='button'>
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          </View>
          <Text style={styles.helper}>
            For this demo, Maya and Jordan are already connected. New friends are saved on this
            device.
          </Text>

          <Text style={styles.sectionTitle}>START A SHARED PLAN</Text>
          <View style={styles.card}>
            <Text style={[styles.fieldLabel, styles.destinationLabel]}>WHERE ARE YOU HEADING?</Text>
            <TextInput
              value={destination}
              onChangeText={setDestination}
              placeholder='e.g. Boston Common'
              placeholderTextColor='#8B968C'
              style={styles.destinationInput}
              accessibilityLabel='Plan destination'
              autoCapitalize='words'
            />
            {suggestedDestinations.length > 0 && (
              <View style={styles.suggestions}>
                <Text style={styles.suggestionsLabel}>SUGGESTED FOR YOU</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.suggestionList}
                >
                  {suggestedDestinations.map(suggestion => (
                    <Pressable
                      key={suggestion}
                      style={styles.suggestionChip}
                      onPress={() => setDestination(suggestion)}
                      accessibilityRole='button'
                      accessibilityLabel={`Use ${suggestion} as the plan destination`}
                    >
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.locationRow}>
              <View style={styles.settingCopy}>
                <Text style={styles.settingTitle}>Share my live location</Text>
                <Text style={styles.settingDescription}>
                  Only for this plan. Ends when you end the plan.
                </Text>
              </View>
              <Switch
                value={sharesLocation}
                onValueChange={setSharesLocation}
                trackColor={{ false: '#CDD4C9', true: '#6AA67B' }}
                thumbColor={sharesLocation ? '#246A48' : '#F6F6ED'}
                accessibilityLabel='Share my live location for this plan'
              />
            </View>
          </View>

          <View style={styles.inviteHeading}>
            <Text style={styles.fieldLabel}>INVITE FRIENDS</Text>
            <Text style={styles.connectedCount}>{friends.length} CONNECTED</Text>
          </View>
          {friends.length === 0 ? (
            <View style={styles.emptyInvite}>
              <Text style={styles.emptyInviteText}>
                Add a friend above to invite them to this plan.
              </Text>
            </View>
          ) : (
            <View style={styles.card}>
              {friends.map((friend, index) => {
                const selected = selectedFriendIds.includes(friend.id);
                return (
                  <View key={friend.id}>
                    {index > 0 && <View style={styles.divider} />}
                    <Pressable
                      style={styles.friendRow}
                      onPress={() => toggleFriend(friend.id)}
                      accessibilityRole='checkbox'
                      accessibilityState={{ checked: selected }}
                    >
                      <View style={styles.friendAvatar}>
                        <Text style={styles.friendInitials}>{initialsFor(friend.name)}</Text>
                      </View>
                      <Text style={styles.friendName}>{friend.name}</Text>
                      <View style={[styles.check, selected && styles.checkSelected]}>
                        <Text style={styles.checkText}>{selected ? '✓' : ''}</Text>
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
          <Pressable style={styles.createButton} onPress={createPlan} accessibilityRole='button'>
            <Text style={styles.createButtonText}>Create shared plan</Text>
          </Pressable>

          <Text style={styles.sectionTitle}>YOUR PLANS · {plans.length}</Text>
          {plans.length === 0 ? (
            <View style={styles.emptyPlans}>
              <Text style={styles.emptyPlansTitle}>No shared plans yet</Text>
              <Text style={styles.emptyPlansText}>
                Your friends’ location only appears here after everyone agrees to share it for a
                plan.
              </Text>
            </View>
          ) : (
            plans.map(plan => {
              const invitedNames = friends
                .filter(friend => plan.friendIds.includes(friend.id))
                .map(friend => friend.name)
                .join(', ');
              const joinedFriends = plan.friendIds.filter(
                friendId => plan.friendStatuses[friendId] === 'joined',
              );
              const pendingFriends = plan.friendIds.filter(
                friendId => plan.friendStatuses[friendId] === 'invited',
              );
              return (
                <View key={plan.id} style={styles.planCard}>
                  <View style={styles.planHeading}>
                    <View style={styles.planDot} />
                    <Text style={styles.planEyebrow}>YOU’RE HEADING TO</Text>
                  </View>
                  <Text style={styles.planDestination}>{plan.destination}</Text>
                  <Text style={styles.planMeta}>Invited: {invitedNames}</Text>
                  <Text style={styles.planMeta}>
                    {plan.sharesLocation
                      ? 'Your live location is shared for this plan.'
                      : 'Location sharing is off.'}
                  </Text>
                  <View style={styles.planDivider} />
                  <Text style={styles.planStatus}>
                    {joinedFriends.length > 0
                      ? `${joinedFriends.length} friend${joinedFriends.length === 1 ? '' : 's'} joined`
                      : 'Invites sent'}
                    {pendingFriends.length > 0
                      ? ` · ${pendingFriends.length} pending`
                      : ' · everyone has responded'}
                  </Text>
                  {pendingFriends.length > 0 && (
                    <Pressable
                      style={styles.demoButton}
                      onPress={() => showFriendJoining(plan.id)}
                      accessibilityRole='button'
                    >
                      <Text style={styles.demoButtonText}>Demo: show a friend joining</Text>
                    </Pressable>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

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
  content: { paddingBottom: 52, paddingHorizontal: 20, paddingTop: 25 },
  intro: { backgroundColor: '#E2EDDF', borderRadius: 20, padding: 20 },
  introTitle: { color: '#1F5438', fontFamily: 'Georgia', fontSize: 22, fontWeight: '700' },
  introText: { color: '#4A6956', fontSize: 12, lineHeight: 18, marginTop: 5 },
  sectionTitle: {
    color: '#78857A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.25,
    marginBottom: 9,
    marginTop: 30,
  },
  addFriendRow: { flexDirection: 'row', gap: 10 },
  friendInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE1D8',
    borderRadius: 16,
    borderWidth: 1,
    color: '#1F4531',
    flex: 1,
    fontSize: 15,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: '#E2EDDF',
    borderRadius: 16,
    justifyContent: 'center',
    paddingHorizontal: 17,
  },
  addButtonText: { color: '#246A48', fontSize: 14, fontWeight: '800' },
  helper: { color: '#6A786D', fontSize: 11, lineHeight: 16, marginHorizontal: 3, marginTop: 9 },
  card: { backgroundColor: '#FFFFFF', borderColor: '#DDE1D8', borderRadius: 18, borderWidth: 1 },
  fieldLabel: {
    color: '#768276',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 7,
    marginHorizontal: 3,
  },
  destinationLabel: { marginLeft: 17, marginRight: 17, marginTop: 15 },
  destinationInput: {
    color: '#1F4531',
    fontSize: 16,
    minHeight: 43,
    paddingHorizontal: 15,
    paddingVertical: 4,
  },
  suggestions: { marginTop: 2 },
  suggestionsLabel: {
    color: '#7D897E',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.9,
    marginBottom: 7,
    marginLeft: 17,
  },
  suggestionList: { gap: 7, paddingHorizontal: 17, paddingRight: 20 },
  suggestionChip: {
    backgroundColor: '#E2EDDF',
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  suggestionText: { color: '#2A6445', fontSize: 12, fontWeight: '800' },
  divider: { backgroundColor: '#E0E4DD', height: 1, marginHorizontal: 15 },
  locationRow: { alignItems: 'center', flexDirection: 'row', minHeight: 80, paddingHorizontal: 17 },
  settingCopy: { flex: 1, paddingRight: 12 },
  settingTitle: { color: '#234833', fontSize: 15, fontWeight: '800' },
  settingDescription: { color: '#6A786D', fontSize: 11, lineHeight: 16, marginTop: 3 },
  inviteHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 23,
  },
  connectedCount: { color: '#5E8769', fontSize: 10, fontWeight: '800', letterSpacing: 0.9 },
  emptyInvite: { backgroundColor: '#EDEFE9', borderRadius: 18, padding: 17 },
  emptyInviteText: { color: '#647368', fontSize: 12, lineHeight: 18 },
  friendRow: { alignItems: 'center', flexDirection: 'row', minHeight: 62, paddingHorizontal: 15 },
  friendAvatar: {
    alignItems: 'center',
    backgroundColor: '#DDEBDD',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    marginRight: 10,
    width: 34,
  },
  friendInitials: { color: '#276044', fontSize: 12, fontWeight: '800' },
  friendName: { color: '#244633', flex: 1, fontSize: 14, fontWeight: '800' },
  check: {
    alignItems: 'center',
    borderColor: '#AEB9AE',
    borderRadius: 10,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  checkSelected: { backgroundColor: '#246A48', borderColor: '#246A48' },
  checkText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', lineHeight: 15 },
  createButton: {
    alignItems: 'center',
    backgroundColor: '#246A48',
    borderRadius: 16,
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 52,
  },
  createButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  emptyPlans: { backgroundColor: '#EDEFE9', borderRadius: 18, padding: 18 },
  emptyPlansTitle: { color: '#355947', fontSize: 14, fontWeight: '800' },
  emptyPlansText: { color: '#647368', fontSize: 12, lineHeight: 18, marginTop: 4 },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE1D8',
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    padding: 18,
  },
  planHeading: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  planDot: { backgroundColor: '#C45E3D', borderRadius: 4, height: 8, width: 8 },
  planEyebrow: { color: '#77857A', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  planDestination: {
    color: '#1E4A33',
    fontFamily: 'Georgia',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 6,
  },
  planMeta: { color: '#627166', fontSize: 12, lineHeight: 18, marginTop: 4 },
  planDivider: { backgroundColor: '#E2E6DF', height: 1, marginTop: 13 },
  planStatus: { color: '#356D4D', fontSize: 12, fontWeight: '800', marginTop: 11 },
  demoButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#E2EDDF',
    borderRadius: 10,
    marginTop: 12,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  demoButtonText: { color: '#246A48', fontSize: 11, fontWeight: '800' },
});
