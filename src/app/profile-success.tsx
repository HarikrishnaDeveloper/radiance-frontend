import { router } from 'expo-router';

import { ProfileSuccessScreen } from '@/components/login/profile-success-screen';

export default function ProfileSuccessPage() {
  return <ProfileSuccessScreen onContinue={() => router.replace('/')} />;
}
