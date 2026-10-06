'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, QuotedMessage } from '../lib/types';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import {
  getMessagesApi,
  sendMessageApi,
  toggleReactionApi,
  markMessageReadApi,
  updateDisappearingTimerApi,
  uploadFileApi,
} from '../lib/api';
import {
  Phone,
  Video,
  Search,
  MoreVertical,
  Paperclip,
  Smile,
  Send,
  Lock,
  Clock,
  Check,
  CheckCheck,
  CornerUpLeft,
  X,
  Users,
  Image as ImageIcon,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

interface ChatPaneProps {
  conversation: Conversation | null;
  onOpenCall: (type: 'audio' | 'video') => void;
  onOpenGroupInfo: () => void;
  onUpdateConversation: (conv: Conversation) => void;
}

export const ChatPane: React.FC<ChatPaneProps> = ({
  conversation,
  onOpenCall,
  onOpenGroupInfo,
  onUpdateConversation,
}) => {
  const { user } = useAuth();
  const { sendTyping, subscribe } = useWebSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [typingUsers, setTypingUsers] = useState<{ [userId: number]: string }>({});
  const [replyTo, setReplyTo] = useState<QuotedMessage | null>(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [uploading, setUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (conversation) {
      loadMessages(conversation.id);
      setReplyTo(null);
    }
  }, [conversation?.id]);

  const loadMessages = async (convId: number) => {
    try {
      const data = await getMessagesApi(convId);
      setMessages(data);
      scrollToBottom();

      // Mark unread messages as read
      data.forEach((m) => {
        if (m.sender_id !== user?.id && m.status !== 'read') {
          markMessageReadApi(m.id);
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Subscribe to live WebSocket events
  useEffect(() => {
    const unsubscribe = subscribe((data: any) => {
      if (!conversation) return;

      if (data.type === 'new_message' && data.message.conversation_id === conversation.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        scrollToBottom();

        if (data.message.sender_id !== user?.id) {
          markMessageReadApi(data.message.id);
        }
      } else if (data.type === 'typing' && data.conversation_id === conversation.id) {
        if (data.is_typing) {
          setTypingUsers((prev) => ({ ...prev, [data.user_id]: data.user_name }));
        } else {
          setTypingUsers((prev) => {
            const copy = { ...prev };
            delete copy[data.user_id];
            return copy;
          });
        }
      } else if (data.type === 'receipt' && data.conversation_id === conversation.id) {
        setMessages((prev) =>
          prev.map((m) => (m.id === data.message_id ? { ...m, status: data.status } : m))
        );
      } else if (data.type === 'reaction' && data.conversation_id === conversation.id) {
        loadMessages(conversation.id);
      } else if (data.type === 'conversation_update' && data.conversation_id === conversation.id) {
        onUpdateConversation({ ...conversation, disappearing_timer: data.disappearing_timer });
      }
    });

    return () => unsubscribe();
  }, [conversation?.id, subscribe]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!conversation) return;

    sendTyping(conversation.id, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(conversation.id, false);
    }, 2000);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !conversation) return;

    const content = inputText.trim();
    setInputText('');
    sendTyping(conversation.id, false);

    try {
      const newMsg = await sendMessageApi(
        conversation.id,
        content,
        'text',
        undefined,
        undefined,
        replyTo?.id
      );
      setMessages((prev) => [...prev, newMsg]);
      setReplyTo(null);
      scrollToBottom();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversation) return;

    setUploading(true);
    try {
      const uploaded = await uploadFileApi(file);
      const isImg = file.type.startsWith('image/');
      const newMsg = await sendMessageApi(
        conversation.id,
        isImg ? 'Photo' : file.filename,
        isImg ? 'image' : 'file',
        uploaded.url,
        uploaded.filename
      );
      setMessages((prev) => [...prev, newMsg]);
      scrollToBottom();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleToggleReaction = async (msgId: number, emoji: string) => {
    try {
      await toggleReactionApi(msgId, emoji);
      loadMessages(conversation!.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetTimer = async (seconds: number) => {
    if (!conversation) return;
    setShowTimerMenu(false);
    try {
      const updated = await updateDisappearingTimerApi(conversation.id, seconds);
      onUpdateConversation(updated);
    } catch (err) {
      console.error(err);
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 bg-gray-50 dark:bg-[#121418] flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-20 h-20 bg-blue-100 dark:bg-[#1f232a] text-[#2c6bed] rounded-full flex items-center justify-center mb-4 shadow-lg">
          <Lock size={40} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Signal for Desktop</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
          Send end-to-end encrypted messages, high quality audio/video calls, and media in real time.
        </p>
      </div>
    );
  }

  const targetName =
    conversation.type === 'group'
      ? conversation.name
      : conversation.participants.find((p) => p.user_id !== user?.id)?.user.display_name || 'Contact';

  const targetAvatar =
    conversation.type === 'group'
      ? conversation.avatar_url
      : conversation.participants.find((p) => p.user_id !== user?.id)?.user.avatar_url;

  const otherParticipant = conversation.participants.find((p) => p.user_id !== user?.id);

  const formatMessageTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'h:mm a');
    } catch {
      return '';
    }
  };

  const typingUserNames = Object.values(typingUsers);

  return (
    <div className="flex-1 bg-[#f4f6f8] dark:bg-[#121418] flex flex-col h-full overflow-hidden text-gray-900 dark:text-gray-100">
      {/* Top Chat Header */}
      <div className="p-3 bg-white dark:bg-[#1f232a] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => conversation.type === 'group' && onOpenGroupInfo()}
        >
          <div className="relative">
            <img
              src={targetAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${targetName}`}
              alt={targetName}
              className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 object-cover"
            />
            {otherParticipant?.user.is_online && conversation.type === 'direct' && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#1f232a]"></span>
            )}
          </div>

          <div>
            <h2 className="text-sm font-bold flex items-center gap-1.5">
              {targetName}
              {conversation.type === 'group' && <Users size={14} className="text-[#2c6bed]" />}
            </h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {conversation.type === 'group'
                ? `${conversation.participants.length} members`
                : otherParticipant?.user.is_online
                ? 'Online'
                : 'Offline'}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
          <button
            onClick={() => onOpenCall('audio')}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#282c31] transition"
            title="Audio Call"
          >
            <Phone size={18} />
          </button>
          <button
            onClick={() => onOpenCall('video')}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#282c31] transition"
            title="Video Call"
          >
            <Video size={18} />
          </button>

          {/* Disappearing Timer Selector */}
          <div className="relative">
            <button
              onClick={() => setShowTimerMenu(!showTimerMenu)}
              className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#282c31] transition ${
                conversation.disappearing_timer > 0 ? 'text-blue-500 font-bold' : ''
              }`}
              title="Disappearing Messages"
            >
              <Clock size={18} />
            </button>

            {showTimerMenu && (
              <div className="absolute right-0 top-10 w-48 bg-white dark:bg-[#1b1f23] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-2 z-50 text-xs space-y-1">
                <div className="px-2 py-1 font-bold text-gray-400 uppercase text-[10px]">
                  Disappearing Messages
                </div>
                {[
                  { label: 'Off', val: 0 },
                  { label: '5 Seconds (Fast Test)', val: 5 },
                  { label: '30 Seconds', val: 30 },
                  { label: '1 Day', val: 86400 },
                  { label: '1 Week', val: 604800 },
                ].map((item) => (
                  <button
                    key={item.val}
                    onClick={() => handleSetTimer(item.val)}
                    className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between ${
                      conversation.disappearing_timer === item.val
                        ? 'bg-[#2c6bed] text-white font-bold'
                        : 'hover:bg-gray-100 dark:hover:bg-[#282c31]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {conversation.disappearing_timer === item.val && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {conversation.type === 'group' && (
            <button
              onClick={onOpenGroupInfo}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#282c31] transition"
              title="Group Details"
            >
              <MoreVertical size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Encrypted Trust Banner */}
      <div className="py-2 px-4 bg-blue-50/50 dark:bg-[#1b1f23]/80 border-b border-blue-100 dark:border-gray-800 flex items-center justify-center gap-2 text-[11px] text-blue-600 dark:text-blue-400 font-medium shrink-0">
        <Lock size={12} />
        <span>End-to-End Encrypted (Simulated Signal Protocol v3)</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, index) => {
          const isMe = m.sender_id === user?.id;

          if (m.message_type === 'system') {
            return (
              <div key={m.id} className="flex justify-center my-2">
                <span className="px-3 py-1 bg-gray-200 dark:bg-[#242930] text-gray-600 dark:text-gray-300 text-[11px] font-medium rounded-full shadow-sm text-center">
                  {m.content}
                </span>
              </div>
            );
          }

          return (
            <div
              key={m.id}
              className={`flex flex-col group relative ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2 shadow-sm text-xs relative ${
                  isMe
                    ? 'bg-[#2c6bed] text-white rounded-br-none'
                    : 'bg-white dark:bg-[#282c35] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-bl-none'
                }`}
              >
                {/* Group Sender Name */}
                {!isMe && conversation.type === 'group' && (
                  <div className="font-bold text-[11px] text-[#2c6bed] dark:text-blue-400 mb-1">
                    {m.sender.display_name}
                  </div>
                )}

                {/* Quoted Reply Box */}
                {m.reply_to && (
                  <div className="mb-2 p-2 bg-black/10 dark:bg-black/30 rounded-lg border-l-4 border-white/60 text-[11px]">
                    <div className="font-bold">{m.reply_to.sender_name}</div>
                    <div className="truncate opacity-80">{m.reply_to.content}</div>
                  </div>
                )}

                {/* Image Media Attachment */}
                {m.message_type === 'image' && m.media_url && (
                  <div className="mb-2 rounded-lg overflow-hidden border border-black/10 max-w-sm">
                    <img src={m.media_url} alt="Attachment" className="w-full object-cover max-h-60" />
                  </div>
                )}

                {/* File Attachment */}
                {m.message_type === 'file' && m.media_url && (
                  <a
                    href={m.media_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 mb-2 p-2 bg-black/10 rounded-lg text-xs underline font-medium"
                  >
                    <FileText size={16} />
                    <span>{m.media_filename || 'Download File'}</span>
                  </a>
                )}

                {/* Content */}
                <div className="whitespace-pre-wrap break-words">{m.content}</div>

                {/* Disappearing Timer & Timestamp Footer */}
                <div
                  className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                    isMe ? 'text-blue-100' : 'text-gray-400'
                  }`}
                >
                  {m.expires_at && <Clock size={10} className="animate-spin" />}
                  <span>{formatMessageTime(m.created_at)}</span>

                  {/* Delivery Receipts */}
                  {isMe && (
                    <span className="ml-1">
                      {m.status === 'read' ? (
                        <CheckCheck size={14} className="text-white font-bold" />
                      ) : m.status === 'delivered' ? (
                        <CheckCheck size={14} className="text-blue-200" />
                      ) : (
                        <Check size={14} className="text-blue-200" />
                      )}
                    </span>
                  )}
                </div>

                {/* Hover Quick Action Bar */}
                <div
                  className={`absolute top-0 -translate-y-1/2 hidden group-hover:flex items-center bg-white dark:bg-[#1b1f23] rounded-full shadow-md border border-gray-200 dark:border-gray-700 px-2 py-1 gap-1 z-20 ${
                    isMe ? 'right-0' : 'left-0'
                  }`}
                >
                  {['❤️', '👍', '😂', '😮', '😢'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleToggleReaction(m.id, emoji)}
                      className="hover:scale-125 transition text-xs p-0.5"
                    >
                      {emoji}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      setReplyTo({
                        id: m.id,
                        sender_id: m.sender_id,
                        sender_name: m.sender.display_name,
                        content: m.content,
                        message_type: m.message_type,
                      })
                    }
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500"
                    title="Reply"
                  >
                    <CornerUpLeft size={12} />
                  </button>
                </div>

                {/* Reactions Badge Pill */}
                {m.reactions && m.reactions.length > 0 && (
                  <div
                    className={`absolute -bottom-2.5 flex gap-1 ${
                      isMe ? 'right-2' : 'left-2'
                    }`}
                  >
                    {m.reactions.map((r) => (
                      <span
                        key={r.id}
                        className="bg-white dark:bg-[#1b1f23] border border-gray-200 dark:border-gray-700 rounded-full px-1.5 py-0.5 text-[10px] shadow-sm flex items-center gap-0.5 text-gray-800 dark:text-gray-200"
                      >
                        {r.emoji}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator Line */}
      {typingUserNames.length > 0 && (
        <div className="px-4 py-1 text-[11px] text-gray-500 dark:text-gray-400 italic animate-pulse bg-white/50 dark:bg-[#16191e]">
          {typingUserNames.join(', ')} {typingUserNames.length > 1 ? 'are' : 'is'} typing...
        </div>
      )}

      {/* Message Input Footer */}
      <div className="p-3 bg-white dark:bg-[#1f232a] border-t border-gray-200 dark:border-gray-800 shrink-0">
        {/* Reply Preview Bar */}
        {replyTo && (
          <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-[#2c6bed]">Replying to {replyTo.sender_name}</span>
              <p className="text-gray-600 dark:text-gray-300 truncate max-w-md">{replyTo.content}</p>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="p-1 hover:bg-blue-100 rounded-full text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-2">
          {/* File Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#282c31] text-gray-500 hover:text-gray-900 dark:hover:text-white transition"
            title="Attach file or photo"
          >
            <Paperclip size={18} />
          </button>

          {/* Text Input */}
          <input
            type="text"
            placeholder={`Signal message to ${targetName}...`}
            value={inputText}
            onChange={handleInputChange}
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-[#282c31] text-gray-900 dark:text-white text-xs rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2c6bed]"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 bg-[#2c6bed] hover:bg-blue-600 text-white rounded-full shadow-md transition disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
