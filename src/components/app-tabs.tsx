import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBarItem, tabBarStyles } from '@/components/custom-tab-bar';

export default function AppTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs>
      <TabSlot />
      <TabList style={[tabBarStyles.bar, { paddingBottom: Math.max(insets.bottom, 12) + 10 }]}>
        <TabTrigger name="home" href="/" asChild>
          <TabBarItem tabName="home" />
        </TabTrigger>
        <TabTrigger name="practice" href="/practice" asChild>
          <TabBarItem tabName="practice" />
        </TabTrigger>
        <TabTrigger name="journey" href="/journey" asChild>
          <TabBarItem tabName="journey" />
        </TabTrigger>
        <TabTrigger name="progress" href="/progress" asChild>
          <TabBarItem tabName="progress" />
        </TabTrigger>
        <TabTrigger name="profile" href="/profile" asChild>
          <TabBarItem tabName="profile" />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}
