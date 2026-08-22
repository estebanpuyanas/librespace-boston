import { Pressable, StyleSheet, Text, View } from 'react-native';
import { quickPrompts } from '../data/demo-spots';
import type { QuickPrompt } from '../types/app';

interface PromptListProps {
  onChoose: (prompt: QuickPrompt) => void;
}

export const PromptList = ({ onChoose }: PromptListProps) => (
  <View style={styles.container}>
    <Text style={styles.eyebrow}>TRY ASKING</Text>
    {quickPrompts.map(prompt => (
      <Pressable key={prompt.label} style={styles.prompt} onPress={() => onChoose(prompt)}>
        <Text style={styles.promptText}>“{prompt.label}”</Text>
        <Text style={styles.promptArrow}>↗</Text>
      </Pressable>
    ))}
    <View style={styles.promise}>
      <Text style={styles.promiseIcon}>✦</Text>
      <Text style={styles.promiseText}>
        Built from Boston’s public data — not sponsored listings.
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { marginHorizontal: 22, marginTop: 36 },
  eyebrow: { color: '#7A887B', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  prompt: {
    alignItems: 'center',
    borderBottomColor: '#DBDDD4',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 17,
  },
  promptText: {
    color: '#314938',
    flex: 1,
    fontFamily: 'Georgia',
    fontSize: 16,
    lineHeight: 22,
    paddingRight: 12,
  },
  promptArrow: { color: '#4D775D', fontSize: 19 },
  promise: {
    alignItems: 'flex-start',
    backgroundColor: '#E6EEE2',
    borderRadius: 13,
    flexDirection: 'row',
    gap: 10,
    marginTop: 26,
    padding: 14,
  },
  promiseIcon: { color: '#2F724B', fontSize: 18 },
  promiseText: { color: '#456049', flex: 1, fontSize: 12, lineHeight: 18 },
});
