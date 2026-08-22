import { StyleSheet, Text, View } from 'react-native';
import type { MobileCopy } from '../content';

interface RagAnswerProps {
  answer: string | null | undefined;
  copy: MobileCopy;
  disclaimers: string[];
}

export const RagAnswer = ({ answer, copy, disclaimers }: RagAnswerProps) => {
  if (!answer && disclaimers.length === 0) return null;

  return (
    <View style={styles.card} accessibilityLiveRegion='polite'>
      {answer && (
        <>
          <Text style={styles.label}>{copy.answerFromData}</Text>
          <Text style={styles.answer}>{answer}</Text>
        </>
      )}
      {disclaimers.map(disclaimer => (
        <Text key={disclaimer} style={styles.disclaimer}>
          {disclaimer}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#E6EEE2',
    borderColor: '#C6D8C4',
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 22,
    marginTop: 15,
    padding: 14,
  },
  label: { color: '#42654B', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  answer: { color: '#214E37', fontSize: 15, lineHeight: 22, marginTop: 6 },
  disclaimer: { color: '#526458', fontSize: 11, lineHeight: 16, marginTop: 8 },
});
