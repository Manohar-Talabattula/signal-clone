'use client';

import React, { useState } from 'react';
import { Conversation, User } from '../lib/types';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Settings, Users, MessageSquare, Clock, Shield, Sparkles, LogOut } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

interface SidebarProps {
  conversations: Conversation[];
  activeConvId: number | null;
  onSelectConversation: (id: number) => void;
  onOpenNewChat: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConvId,
  onSelectConversation,
  onOpenNewChat,
  onOpenSettings,
}) => {
  const { user, theme } = useAuth();
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'groups'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const formatTimestamp = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isToday(date)) return format(date, 'h:mm a');
      if (isYesterday(date)) return 'Yesterday';
      return format(date, 'MMM d');
    } catch {
      return '';
    }
  };

  const getConvTitle = (conv: Conversation) => {
    if (conv.type === 'group') return conv.name || 'Group';
    const other = conv.participants.find((p) => p.user_id !== user?.id);
    return other?.user.display_name || 'Contact';
  };

  const getConvAvatar = (conv: Conversation) => {
    if (conv.type === 'group') {
      return conv.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${conv.name}`;
    }
    const other = conv.participants.find((p) => p.user_id !== user?.id);
    return other?.user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${other?.user.username}`;
  };

  const isUserOnline = (conv: Conversation) => {
    if (conv.type === 'group') return false;
    const other = conv.participants.find((p) => p.user_id !== user?.id);
    return other?.user.is_online || false;
  };

  const filteredConversations = conversations.filter((c) => {
    const title = getConvTitle(c).toLowerCase();
    const matchesSearch = title.includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterTab === 'unread') return c.unread_count > 0;
    if (filterTab === 'groups') return c.type === 'group';
    return true;
  });

  return (
    <aside className="w-full md:w-[340px] lg:w-[380px] bg-white dark:bg-[#1b1f23] border-r border-gray-200 dark:border-gray-800 flex flex-col h-full shrink-0 select-none">
      {/* User Header */}
      <div className="p-3.5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative cursor-pointer" onClick={onOpenSettings}>
            <img
              src={user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username}`}
              alt={user?.display_name}
              className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 object-cover border border-gray-300 dark:border-gray-700"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#1b1f23]"></span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
              {user?.display_name}
            </h1>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">@{user?.username}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
          <button
            onClick={onOpenNewChat}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#282c31] transition text-[#2c6bed]"
            title="New Chat or Group"
          >
            <Plus size={20} />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#282c31] transition"
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="p-3 space-y-2.5 border-b border-gray-200 dark:border-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search Signal chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-100 dark:bg-[#282c31] text-gray-900 dark:text-white placeholder-gray-400 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2c6bed]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition ${
              filterTab === 'all'
                ? 'bg-[#2c6bed] text-white'
                : 'bg-gray-100 dark:bg-[#282c31] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#343a42]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterTab('unread')}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition ${
              filterTab === 'unread'
                ? 'bg-[#2c6bed] text-white'
                : 'bg-gray-100 dark:bg-[#282c31] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#343a42]'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilterTab('groups')}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition ${
              filterTab === 'groups'
                ? 'bg-[#2c6bed] text-white'
                : 'bg-gray-100 dark:bg-[#282c31] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#343a42]'
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/50">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
            <MessageSquare size={32} className="opacity-40" />
            <p>No conversations found</p>
            <button
              onClick={onOpenNewChat}
              className="mt-2 text-[#2c6bed] font-semibold hover:underline"
            >
              Start a new chat
            </button>
          </div>
        ) : (
          filteredConversations.map((c) => {
            const isActive = c.id === activeConvId;
            const title = getConvTitle(c);
            const avatar = getConvAvatar(c);
            const online = isUserOnline(c);

            return (
              <div
                key={c.id}
                onClick={() => onSelectConversation(c.id)}
                className={`p-3 flex items-center gap-3 cursor-pointer transition relative ${
                  isActive
                    ? 'bg-blue-50 dark:bg-[#2b303b]'
                    : 'hover:bg-gray-50 dark:hover:bg-[#20242a]'
                }`}
              >
                {/* Avatar with status */}
                <div className="relative shrink-0">
                  <img
                    src={avatar}
                    alt={title}
                    className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 object-cover"
                  />
                  {online && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-[#1b1f23]"></span>
                  )}
                  {c.type === 'group' && (
                    <span className="absolute -bottom-1 -right-1 p-0.5 bg-[#2c6bed] text-white rounded-full">
                      <Users size={10} />
                    </span>
                  )}
                </div>

                {/* Info & Last Message */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white truncate flex items-center gap-1">
                      {title}
                      {c.disappearing_timer > 0 && (
                        <span title="Disappearing messages enabled">
                          <Clock size={12} className="text-blue-500 shrink-0" />
                        </span>
                      )}
                    </h3>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {formatTimestamp(c.last_message?.created_at || c.updated_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate pr-2">
                      {c.last_message ? (
                        c.last_message.message_type === 'system' ? (
                          <span className="italic text-gray-400">{c.last_message.content}</span>
                        ) : c.last_message.message_type === 'image' ? (
                          <span className="flex items-center gap-1">📷 Photo attachment</span>
                        ) : (
                          c.last_message.content
                        )
                      ) : (
                        <span className="italic text-gray-400">No messages yet</span>
                      )}
                    </p>

                    {c.unread_count > 0 && (
                      <span className="px-1.5 py-0.5 bg-[#2c6bed] text-white text-[10px] font-bold rounded-full min-w-[18px] text-center">
                        {c.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
