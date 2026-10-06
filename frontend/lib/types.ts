export interface User {
  id: number;
  username: string;
  phone: string;
  display_name: string;
  avatar_url?: string;
  about?: string;
  is_online: boolean;
  last_seen: string;
  created_at: string;
}

export interface Contact {
  id: number;
  contact_user: User;
  nickname?: string;
  created_at: string;
}

export interface Reaction {
  id: number;
  message_id: number;
  user_id: number;
  emoji: string;
  user_name: string;
  created_at: string;
}

export interface QuotedMessage {
  id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  message_type: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender: User;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  media_url?: string;
  media_filename?: string;
  reply_to_id?: number;
  reply_to?: QuotedMessage;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  is_encrypted: boolean;
  expires_at?: string;
  reactions: Reaction[];
  created_at: string;
}

export interface Participant {
  id: number;
  user_id: number;
  role: 'admin' | 'member';
  user: User;
  joined_at: string;
}

export interface Conversation {
  id: number;
  type: 'direct' | 'group';
  name?: string;
  avatar_url?: string;
  disappearing_timer: number;
  created_by_id?: number;
  participants: Participant[];
  last_message?: Message;
  unread_count: number;
  updated_at: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}
