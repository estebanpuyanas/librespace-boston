import { Pressable, StyleSheet, Text, View } from 'react-native';

export type ResultView = 'list' | 'map';

interface ResultViewToggleProps {
  onChange: (view: ResultView) => void;
  view: ResultView;
}

export const ResultViewToggle = ({ onChange, view }: ResultViewToggleProps) => (
  <View style={styles.toggle} accessibilityRole='tablist'>
    <Pressable
      style={[styles.option, view === 'list' && styles.optionSelected]}
      onPress={() => onChange('list')}
      accessibilityRole='tab'
      accessibilityState={{ selected: view === 'list' }}
    >
      <Text style={[styles.optionText, view === 'list' && styles.optionTextSelected]}>☷ List</Text>
    </Pressable>
    <Pressable
      style={[styles.option, view === 'map' && styles.optionSelected]}
      onPress={() => onChange('map')}
      accessibilityRole='tab'
      accessibilityState={{ selected: view === 'map' }}
    >
      <Text style={[styles.optionText, view === 'map' && styles.optionTextSelected]}>⌖ Map</Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  toggle: {
    backgroundColor: '#E7E9E1',
    borderRadius: 14,
    flexDirection: 'row',
    marginHorizontal: 22,
    marginTop: 18,
    padding: 3,
  },
  option: {
    alignItems: 'center',
    borderRadius: 11,
    flex: 1,
    minHeight: 38,
    justifyContent: 'center',
  },
  optionSelected: { backgroundColor: '#FFFFFF' },
  optionText: { color: '#637066', fontSize: 12, fontWeight: '800' },
  optionTextSelected: { color: '#1D5138' },
});
