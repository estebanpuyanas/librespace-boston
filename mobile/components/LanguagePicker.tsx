import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { AppLanguage } from '../types/app';

const languageOptions: { code: AppLanguage; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'vi', label: 'Vietnamese', nativeLabel: 'Tiếng Việt' },
  { code: 'zh-Hans', label: 'Simplified Chinese', nativeLabel: '中文（简体）' },
];

interface LanguagePickerProps {
  language: AppLanguage;
  onClose: () => void;
  onSelect: (language: AppLanguage) => void;
  visible: boolean;
}

export const LanguagePicker = ({
  language: selectedLanguage,
  onClose,
  onSelect,
  visible,
}: LanguagePickerProps) => {
  const chooseLanguage = (language: AppLanguage) => {
    onSelect(language);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType='slide' onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel='Close language chooser'
        />
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Choose your language</Text>
              <Text style={styles.description}>This updates the app and suggested searches.</Text>
            </View>
            <Pressable
              style={styles.close}
              onPress={onClose}
              accessibilityRole='button'
              accessibilityLabel='Close'
            >
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          <View style={styles.options}>
            {languageOptions.map(language => {
              const selected = selectedLanguage === language.code;
              return (
                <Pressable
                  key={language.code}
                  onPress={() => chooseLanguage(language.code)}
                  style={[styles.option, selected && styles.optionSelected]}
                  accessibilityRole='button'
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${language.label}${selected ? ', selected' : ''}`}
                >
                  <Text style={[styles.nativeLabel, selected && styles.nativeLabelSelected]}>
                    {language.nativeLabel}
                  </Text>
                  <Text style={[styles.languageLabel, selected && styles.languageLabelSelected]}>
                    {language.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(16, 37, 27, 0.42)', flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#F5F4ED',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 22,
    paddingBottom: 34,
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
  title: { color: '#153A29', fontSize: 24, fontWeight: '800' },
  description: { color: '#5E6C61', fontSize: 14, lineHeight: 20, marginTop: 5 },
  close: {
    alignItems: 'center',
    backgroundColor: '#E3E8DF',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  closeText: { color: '#315743', fontSize: 27, fontWeight: '300', lineHeight: 30 },
  options: { gap: 10, marginTop: 18 },
  option: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8D9CD',
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  optionSelected: { backgroundColor: '#DCEADD', borderColor: '#246A48', borderWidth: 2 },
  nativeLabel: { color: '#153A29', fontSize: 17, fontWeight: '800' },
  nativeLabelSelected: { color: '#246A48' },
  languageLabel: { color: '#718076', fontSize: 12, marginTop: 2 },
  languageLabelSelected: { color: '#3E704E' },
});
