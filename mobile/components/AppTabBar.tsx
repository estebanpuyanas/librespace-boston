import { Pressable, StyleSheet, Text, View } from 'react-native';

interface AppTabBarProps {
  onOpenPlans: () => void;
  onOpenProfile: () => void;
}

export const AppTabBar = ({ onOpenPlans, onOpenProfile }: AppTabBarProps) => (
  <View style={styles.shell} accessibilityRole='tablist'>
    <View style={styles.tab} accessibilityRole='tab' accessibilityState={{ selected: true }}>
      <Text style={styles.icon}>⌂</Text>
      <Text style={styles.labelSelected}>Home</Text>
    </View>
    <Pressable
      style={styles.tab}
      onPress={onOpenPlans}
      accessibilityRole='tab'
      accessibilityLabel='Open friends and shared plans'
    >
      <PlanIcon />
      <Text style={styles.label}>Plans</Text>
    </Pressable>
    <Pressable
      style={styles.tab}
      onPress={onOpenProfile}
      accessibilityRole='tab'
      accessibilityLabel='Open profile'
    >
      <ProfileIcon />
      <Text style={styles.label}>Profile</Text>
    </Pressable>
  </View>
);

const PlanIcon = () => (
  <View style={styles.calendarIcon}>
    <View style={styles.calendarTop} />
    <View style={styles.calendarDot} />
  </View>
);

const ProfileIcon = () => (
  <View style={styles.profileIcon}>
    <View style={styles.profileHead} />
    <View style={styles.profileBody} />
  </View>
);

const styles = StyleSheet.create({
  shell: {
    alignItems: 'center',
    backgroundColor: '#FFFEF8',
    borderTopColor: '#DCE1D7',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    minHeight: 68,
    paddingBottom: 7,
    paddingTop: 8,
  },
  tab: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 46 },
  icon: { color: '#52705D', fontSize: 20, lineHeight: 22 },
  calendarIcon: {
    borderColor: '#52705D',
    borderRadius: 4,
    borderWidth: 1.7,
    height: 18,
    overflow: 'hidden',
    width: 19,
  },
  calendarTop: { backgroundColor: '#52705D', height: 4 },
  calendarDot: {
    alignSelf: 'center',
    backgroundColor: '#52705D',
    borderRadius: 2,
    height: 4,
    marginTop: 4,
    width: 4,
  },
  profileIcon: { alignItems: 'center', height: 20, justifyContent: 'flex-end', width: 20 },
  profileHead: { backgroundColor: '#52705D', borderRadius: 4, height: 8, width: 8 },
  profileBody: {
    backgroundColor: '#52705D',
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    height: 7,
    marginTop: 2,
    width: 16,
  },
  label: { color: '#617167', fontSize: 10, fontWeight: '700', marginTop: 2 },
  labelSelected: { color: '#246A48', fontSize: 10, fontWeight: '800', marginTop: 2 },
});
