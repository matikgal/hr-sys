import { db } from "@/lib/firebase";
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp,
} from "firebase/firestore";
import { Conversation, ChatMessage } from "@/types";

const CONV = "conversations";
const MSGS = "messages";

export const getOrCreateConversation = async (
  myUid: string,
  myName: string,
  theirUid: string,
  theirName: string,
): Promise<string> => {
  const q = query(collection(db, CONV), where("participants", "array-contains", myUid));
  const snap = await getDocs(q);
  const existing = snap.docs.find(d => (d.data().participants as string[]).includes(theirUid));
  if (existing) return existing.id;

  const ref = await addDoc(collection(db, CONV), {
    participants: [myUid, theirUid],
    participantNames: { [myUid]: myName, [theirUid]: theirName },
    participantAvatars: {},
    lastMessage: null,
    lastMessageAt: null,
    lastMessageSenderId: null,
    unreadCounts: { [myUid]: 0, [theirUid]: 0 },
  });
  return ref.id;
};

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  senderName: string,
  text: string,
): Promise<void> => {
  const convRef = doc(db, CONV, conversationId);
  const convSnap = await getDoc(convRef);
  if (!convSnap.exists()) throw new Error("Conversation not found");
  const conv = convSnap.data() as Conversation;

  await addDoc(collection(db, CONV, conversationId, MSGS), {
    senderId,
    senderName,
    text: text.trim(),
    createdAt: serverTimestamp(),
  });

  const unreadCounts: Record<string, number> = { ...conv.unreadCounts };
  for (const uid of conv.participants) {
    if (uid !== senderId) {
      unreadCounts[uid] = (unreadCounts[uid] || 0) + 1;
    }
  }

  await updateDoc(convRef, {
    lastMessage: text.trim(),
    lastMessageAt: new Date().toISOString(),
    lastMessageSenderId: senderId,
    unreadCounts,
  });
};

export const markConversationRead = async (
  conversationId: string,
  uid: string,
): Promise<void> => {
  await updateDoc(doc(db, CONV, conversationId), {
    [`unreadCounts.${uid}`]: 0,
  });
};

export const getTotalUnread = async (uid: string): Promise<number> => {
  const q = query(collection(db, CONV), where("participants", "array-contains", uid));
  const snap = await getDocs(q);
  return snap.docs.reduce((sum, d) => sum + ((d.data().unreadCounts ?? {})[uid] ?? 0), 0);
};

export const subscribeToConversations = (
  uid: string,
  callback: (conversations: Conversation[]) => void,
): (() => void) => {
  const q = query(collection(db, CONV), where("participants", "array-contains", uid));
  return onSnapshot(q, (snap) => {
    const convs = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Conversation))
      .sort((a, b) => (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? ''));
    callback(convs);
  });
};

export const subscribeToMessages = (
  conversationId: string,
  callback: (messages: ChatMessage[]) => void,
): (() => void) => {
  const q = query(
    collection(db, CONV, conversationId, MSGS),
    orderBy("createdAt", "asc"),
    limit(200),
  );
  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() ?? null,
    } as ChatMessage));
    callback(msgs);
  });
};
