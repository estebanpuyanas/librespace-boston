import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { languageOptions } from '../localization/types';
import { setAppLanguage } from '../localization/i18n';

export const LanguagePicker = () => {
  const { i18n, t } = useTranslation();

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{t('language.title')}</Text>
      <Text style={styles.description}>{t('language.description')}</Text>
      <View style={styles.options}>
        {languageOptions.map(language => {
          const selected = i18n.language === language.code;
          return (
            <Pressable
              key={language.code}
              onPress={() => setAppLanguage(language.code)}
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
  );
};

const styles = StyleSheet.create({
  section: { marginTop: 38, width: '100%' },
  title: { color: '#153A29', fontSize: 24, fontWeight: '800' },
  description: { color: '#5E6C61', fontSize: 15, lineHeight: 22, marginTop: 8 },
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
