import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import type { AmenityLabel } from '../types/app';

const amenities: AmenityLabel[] = ['Wi-Fi', 'Seating', 'Shade', 'Accessible', 'Playground'];

interface AmenityFiltersProps {
  onToggle: (amenity: AmenityLabel) => void;
  selected: AmenityLabel[];
}

export const AmenityFilters = ({ onToggle, selected }: AmenityFiltersProps) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
    {amenities.map(amenity => {
      const isSelected = selected.includes(amenity);
      return (
        <Pressable
          key={amenity}
          onPress={() => onToggle(amenity)}
          style={[styles.chip, isSelected && styles.chipSelected]}
          accessibilityRole='button'
          accessibilityState={{ selected: isSelected }}
        >
          <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
            {isSelected ? '✓  ' : ''}
            {amenity}
          </Text>
        </Pressable>
      );
    })}
  </ScrollView>
);

const styles = StyleSheet.create({
  list: { gap: 8, paddingHorizontal: 22, paddingTop: 14 },
  chip: {
    backgroundColor: '#ECEDE6',
    borderColor: '#DFE0D5',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  chipSelected: { backgroundColor: '#DCEADD', borderColor: '#246A48' },
  chipText: { color: '#526458', fontSize: 12, fontWeight: '700' },
  chipTextSelected: { color: '#246A48' },
});
