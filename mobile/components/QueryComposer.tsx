import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { MobileCopy } from '../content';

interface QueryComposerProps {
  copy: MobileCopy;
  loading: boolean;
  onSubmit: () => void;
  query: string;
  setQuery: (query: string) => void;
}

export const QueryComposer = ({ copy, loading, onSubmit, query, setQuery }: QueryComposerProps) => (
  <View style={styles.shell}>
    <TextInput
      value={query}
      onChangeText={setQuery}
      multiline
      placeholder={copy.describePlace}
      placeholderTextColor='#7E857D'
      style={styles.input}
      accessibilityLabel={copy.describePlace}
    />
    <View style={styles.footer}>
      <Text style={styles.freeNote}>{copy.freeNote}</Text>
      <Pressable
        style={[styles.submitButton, loading && styles.submitButtonLoading]}
        onPress={onSubmit}
        disabled={loading}
        accessibilityRole='button'
        accessibilityLabel={copy.search}
        accessibilityState={{ disabled: loading }}
      >
        <Text style={styles.submitIcon}>{loading ? '…' : '→'}</Text>
      </Pressable>
    </View>
  </View>
);

const styles = StyleSheet.create({
  shell: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8D9CD',
    borderRadius: 18,
    borderWidth: 1,
    marginHorizontal: 22,
    marginTop: 28,
    padding: 14,
    shadowColor: '#2A3E30',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
  },
  input: {
    color: '#203E2D',
    fontSize: 16,
    lineHeight: 22,
    minHeight: 67,
    padding: 0,
    textAlignVertical: 'top',
  },
  footer: {
    alignItems: 'center',
    borderTopColor: '#ECECE5',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  freeNote: { color: '#718076', fontSize: 11, fontWeight: '600' },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#246A48',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  submitButtonLoading: { opacity: 0.65 },
  submitIcon: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', lineHeight: 24 },
});
