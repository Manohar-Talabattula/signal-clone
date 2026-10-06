'use client';

import React, { useState, useEffect } from 'react';
import { Contact, User } from '../../lib/types';
import { getContactsApi, addContactApi, createDirectChatApi, searchUsersApi } from '../../lib/api';
import { Search, UserPlus, Users, X, MessageSquare, Phone } from 'lucide-react';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (convId: number) => void;
  onOpenCreateGroup: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onSelectConversation,
  onOpenCreateGroup,
}) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [newContactInput, setNewContactInput] = useState('');
  const [addError, setAddError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen]);

  const loadContacts = async () => {
    try {
      const data = await getContactsApi();
      setContacts(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      setIsSearchingGlobal(true);
      searchUsersApi(searchQuery).then((res) => {
        setSearchResults(res);
        setIsSearchingGlobal(false);
      });
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactInput.trim()) return;
    setAddError('');
    setLoading(true);
    try {
      await addContactApi(newContactInput.trim());
      setNewContactInput('');
      loadContacts();
    } catch (err: any) {
      setAddError(err.message || 'Failed to add contact');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (userId: number) => {
    try {
      const conv = await createDirectChatApi(userId);
      onSelectConversation(conv.id);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1b1f23] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden text-gray-900 dark:text-gray-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-bold">New Chat</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
          {/* Create Group Button */}
          <button
            onClick={() => {
              onClose();
              onOpenCreateGroup();
            }}
            className="w-full p-3 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl border border-blue-200 dark:border-blue-900 flex items-center gap-3 text-left transition"
          >
            <div className="p-2.5 bg-[#2c6bed] text-white rounded-full">
              <Users size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#2c6bed] dark:text-blue-400">New Group</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Create a conversation with multiple people</div>
            </div>
          </button>

          {/* Add Contact Form */}
          <form onSubmit={handleAddContact} className="flex gap-2">
            <input
              type="text"
              placeholder="Add contact by phone/username"
              value={newContactInput}
              onChange={(e) => setNewContactInput(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-gray-50 dark:bg-[#282c31] border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2c6bed]"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-2 bg-[#2c6bed] hover:bg-blue-600 text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition"
            >
              <UserPlus size={14} /> Add
            </button>
          </form>
          {addError && <p className="text-[11px] text-red-500 mt-1">{addError}</p>}

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search contacts & registered users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-[#282c31] border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2c6bed]"
            />
          </div>
        </div>

        {/* Contacts & Search List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {searchQuery ? (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Search Results</h3>
              {isSearchingGlobal ? (
                <p className="text-xs text-gray-400">Searching...</p>
              ) : searchResults.length === 0 ? (
                <p className="text-xs text-gray-400">No users found</p>
              ) : (
                <div className="space-y-1">
                  {searchResults.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => handleStartChat(u.id)}
                      className="p-2.5 hover:bg-gray-100 dark:hover:bg-[#282c31] rounded-xl flex items-center justify-between cursor-pointer transition"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                          alt={u.display_name}
                          className="w-9 h-9 rounded-full bg-gray-200 object-cover"
                        />
                        <div>
                          <div className="text-xs font-semibold">{u.display_name}</div>
                          <div className="text-[11px] text-gray-400">@{u.username} • {u.phone}</div>
                        </div>
                      </div>
                      <MessageSquare size={16} className="text-[#2c6bed]" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Contacts</h3>
              {contacts.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400">No contacts yet. Add someone above!</div>
              ) : (
                <div className="space-y-1">
                  {contacts.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleStartChat(c.contact_user.id)}
                      className="p-2.5 hover:bg-gray-100 dark:hover:bg-[#282c31] rounded-xl flex items-center justify-between cursor-pointer transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={c.contact_user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${c.contact_user.username}`}
                            alt={c.contact_user.display_name}
                            className="w-10 h-10 rounded-full bg-gray-200 object-cover"
                          />
                          {c.contact_user.is_online && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#1b1f23]"></span>
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-semibold">{c.nickname || c.contact_user.display_name}</div>
                          <div className="text-[11px] text-gray-400">@{c.contact_user.username}</div>
                        </div>
                      </div>
                      <MessageSquare size={16} className="text-[#2c6bed]" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
