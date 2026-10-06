import { User, Contact, Conversation, Message, TokenResponse } from './types';

const API_BASE = 'http://localhost:8000';

function getAuthHeader(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('signal_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function loginApi(identifier: string, otp: string = '123456'): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, otp }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Login failed');
  }
  return res.json();
}

export async function registerApi(
  username: string,
  phone: string,
  display_name: string,
  avatar_url?: string
): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, phone, display_name, avatar_url, otp: '123456' }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Registration failed');
  }
  return res.json();
}

export async function getMeApi(): Promise<User> {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
}

export async function updateProfileApi(updateData: { display_name?: string; avatar_url?: string; about?: string }): Promise<User> {
  const res = await fetch(`${API_BASE}/api/auth/update-profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(updateData),
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
}

export async function searchUsersApi(q: string): Promise<User[]> {
  const res = await fetch(`${API_BASE}/api/users/search?q=${encodeURIComponent(q)}`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) return [];
  return res.json();
}

export async function getContactsApi(): Promise<Contact[]> {
  const res = await fetch(`${API_BASE}/api/contacts`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) return [];
  return res.json();
}

export async function addContactApi(identifier: string, nickname?: string): Promise<Contact> {
  const res = await fetch(`${API_BASE}/api/contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ identifier, nickname }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to add contact');
  }
  return res.json();
}

export async function getConversationsApi(): Promise<Conversation[]> {
  const res = await fetch(`${API_BASE}/api/conversations`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) return [];
  return res.json();
}

export async function createDirectChatApi(target_user_id: number): Promise<Conversation> {
  const res = await fetch(`${API_BASE}/api/conversations/direct`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ target_user_id }),
  });
  if (!res.ok) throw new Error('Failed to start chat');
  return res.json();
}

export async function createGroupChatApi(name: string, participant_ids: number[], avatar_url?: string): Promise<Conversation> {
  const res = await fetch(`${API_BASE}/api/conversations/group`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ name, participant_ids, avatar_url }),
  });
  if (!res.ok) throw new Error('Failed to create group');
  return res.json();
}

export async function updateDisappearingTimerApi(convId: number, timerSeconds: number): Promise<Conversation> {
  const res = await fetch(`${API_BASE}/api/conversations/${convId}/timer`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ disappearing_timer: timerSeconds }),
  });
  if (!res.ok) throw new Error('Failed to update timer');
  return res.json();
}

export async function addGroupMemberApi(convId: number, userId: number): Promise<Conversation> {
  const res = await fetch(`${API_BASE}/api/conversations/${convId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) throw new Error('Failed to add member');
  return res.json();
}

export async function removeGroupMemberApi(convId: number, userId: number): Promise<Conversation> {
  const res = await fetch(`${API_BASE}/api/conversations/${convId}/members/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error('Failed to remove member');
  return res.json();
}

export async function getMessagesApi(convId: number): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/api/conversations/${convId}/messages`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) return [];
  return res.json();
}

export async function sendMessageApi(
  convId: number,
  content: string,
  messageType: 'text' | 'image' | 'file' = 'text',
  mediaUrl?: string,
  mediaFilename?: string,
  replyToId?: number
): Promise<Message> {
  const res = await fetch(`${API_BASE}/api/conversations/${convId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({
      conversation_id: convId,
      content,
      message_type: messageType,
      media_url: mediaUrl,
      media_filename: mediaFilename,
      reply_to_id: replyToId,
    }),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}

export async function toggleReactionApi(msgId: number, emoji: string) {
  const res = await fetch(`${API_BASE}/api/messages/${msgId}/reactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ emoji }),
  });
  if (!res.ok) throw new Error('Failed to reaction');
  return res.json();
}

export async function markMessageReadApi(msgId: number) {
  const res = await fetch(`${API_BASE}/api/messages/${msgId}/read`, {
    method: 'POST',
    headers: getAuthHeader(),
  });
  return res.json();
}

export async function uploadFileApi(file: File): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const token = localStorage.getItem('signal_token');
  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return { url: `${API_BASE}${data.url}`, filename: data.filename };
}
