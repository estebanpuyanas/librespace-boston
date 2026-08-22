import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ResolvedLocation } from 'shared';
import type { SearchLocation } from '../types/app';

const neighborhoods: SearchLocation[] = [
  { label: 'Downtown Boston', lat: 42.3554, lon: -71.0657, source: 'manual' },
  { label: 'Allston', lat: 42.3537, lon: -71.1323, source: 'manual' },
  { label: 'Dorchester', lat: 42.3016, lon: -71.0676, source: 'manual' },
  { label: 'East Boston', lat: 42.3751, lon: -71.0392, source: 'manual' },
  { label: 'Jamaica Plain', lat: 42.3098, lon: -71.1151, source: 'manual' },
];

interface NeighborhoodPickerProps {
  ipSuggestion: ResolvedLocation | null;
  loadingSuggestion: boolean;
  onClose: () => void;
  onSelect: (location: SearchLocation) => void;
  visible: boolean;
}

export const NeighborhoodPicker = ({
  ipSuggestion,
  loadingSuggestion,
  onClose,
  onSelect,
  visible,
}: NeighborhoodPickerProps) => (
  <Modal visible={visible} transparent animationType='slide' onRequestClose={onClose}>
    <View style={styles.backdrop}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityLabel='Close location picker'
      />
      <View style={styles.sheet} accessibilityViewIsModal>
        <View style={styles.handle} />
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Choose your area</Text>
            <Text style={styles.subtitle}>Used only to find nearby places.</Text>
          </View>
          <Pressable style={styles.close} onPress={onClose} accessibilityRole='button'>
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>
        {loadingSuggestion && <Text style={styles.hint}>Finding a nearby area…</Text>}
        {ipSuggestion && (
          <Pressable
            style={styles.suggestion}
            onPress={() =>
              onSelect({
                label: ipSuggestion.label.replace(' (approximate)', ''),
                lat: ipSuggestion.lat,
                lon: ipSuggestion.lon,
                source: 'manual',
              })
            }
            accessibilityRole='button'
          >
            <Text style={styles.suggestionTitle}>Suggested from your approximate area</Text>
            <Text style={styles.suggestionName}>{ipSuggestion.label}</Text>
          </Pressable>
        )}
        {neighborhoods.map(location => (
          <Pressable
            key={location.label}
            style={styles.row}
            onPress={() => onSelect(location)}
            accessibilityRole='button'
            accessibilityLabel={`Search near ${location.label}`}
          >
            <Text style={styles.pin}>●</Text>
            <Text style={styles.rowText}>{location.label}</Text>
            <Text style={styles.arrow}>→</Text>
          </Pressable>
        ))}
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
  hint: { color: '#6B796E', fontSize: 12, marginTop: 18 },
  suggestion: { backgroundColor: '#E1ECDF', borderRadius: 13, marginTop: 18, padding: 13 },
  suggestionTitle: { color: '#5B7160', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  suggestionName: { color: '#28553B', fontSize: 14, fontWeight: '800', marginTop: 4 },
  row: {
    alignItems: 'center',
    borderBottomColor: '#D9DDD4',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 58,
  },
  pin: { color: '#C45E3D', fontSize: 11, marginRight: 10 },
  rowText: { color: '#264934', flex: 1, fontSize: 15, fontWeight: '800' },
  arrow: { color: '#52725A', fontSize: 20 },
});
