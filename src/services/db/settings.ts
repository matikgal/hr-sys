import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { UserSettings } from '@/types';

const COLLECTION = 'user_settings';

const DEFAULT_SETTINGS = (uid: string): UserSettings => ({
  uid,
  displayName: '',
  theme: 'system',
  language: 'pl',
  notifications: {
    email: true,
    push: true,
    leaveRequests: true,
    attendance: false,
  },
  companyName: 'Nexus Corp',
});

export async function getUserSettings(uid: string): Promise<UserSettings> {
  const snap = await getDoc(doc(db, COLLECTION, uid));
  if (!snap.exists()) return DEFAULT_SETTINGS(uid);
  return snap.data() as UserSettings;
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  await setDoc(doc(db, COLLECTION, settings.uid), settings, { merge: true });
}
