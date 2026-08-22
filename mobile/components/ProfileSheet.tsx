import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Spot } from 'shared';

interface ProfileSheetProps {
  onClose: () => void;
  onOpenDirections: (spot: Spot) => void;
  savedSpots: Spot[];
  visible: boolean;
}

export const ProfileSheet = ({
  onClose,
  onOpenDirections,
  savedSpots,
  visible,
}: ProfileSheetProps) => (
  <Modal visible={visible} transparent animationType='slide' onRequestClose={onClose}>
    <View style={styles.backdrop}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityLabel='Close profile'
      />
      <View style={styles.sheet} accessibilityViewIsModal>
        <View style={styles.handle} />
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Your profile</Text>
            <Text style={styles.subtitle}>A private, account-free space</Text>
          </View>
          <Pressable style={styles.close} onPress={onClose} accessibilityRole='button'>
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>

        <View style={styles.guestCard}>
          <Text style={styles.guestTitle}>Browsing as a guest</Text>
          <Text style={styles.guestText}>
            Your saved places stay on this device while you explore. No sign-in is required.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>SAVED PLACES · {savedSpots.length}</Text>
        {savedSpots.length === 0 ? (
          <Text style={styles.empty}>Tap the heart on a recommendation to keep it handy here.</Text>
        ) : (
          savedSpots.map(spot => (
            <Pressable
              key={spot.spot_id}
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
              <Text style={styles.arrow}>→</Text>
            </Pressable>
          ))
        )}
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(16, 37, 27, 0.42)', flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#F5F4ED',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    minHeight: 430,
    padding: 22,
    paddingTop: 11,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#C5CBC1',
    borderRadius: 3,
    height: 5,
    width: 42,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  title: { color: '#173D2A', fontFamily: 'Georgia', fontSize: 25, fontWeight: '700' },
  subtitle: { color: '#69766B', fontSize: 12, marginTop: 3 },
  close: {
    alignItems: 'center',
    backgroundColor: '#E3E8DF',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  closeText: { color: '#315743', fontSize: 27, fontWeight: '300', lineHeight: 30 },
  guestCard: { backgroundColor: '#E3EDE0', borderRadius: 14, marginTop: 23, padding: 15 },
  guestTitle: { color: '#28573E', fontSize: 14, fontWeight: '800' },
  guestText: { color: '#4E6C58', fontSize: 12, lineHeight: 18, marginTop: 4 },
  sectionTitle: {
    color: '#78857A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 27,
  },
  empty: { color: '#617064', fontSize: 13, lineHeight: 19, marginTop: 13 },
  savedRow: {
    alignItems: 'center',
    borderBottomColor: '#D9DDD4',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 68,
  },
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
  arrow: { color: '#53725D', fontSize: 19 },
});
