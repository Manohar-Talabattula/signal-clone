'use client';

import React, { useState, useEffect } from 'react';
import { Contact } from '../../lib/types';
import { getContactsApi, createGroupChatApi } from '../../lib/api';
import { Users, X, Check, Search } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (convId: number) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onSelectConversation,
}) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      getContactsApi().then(setContacts);
    }
  }, [isOpen]);

  const toggleUser = (userId: number) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }
    if (selectedUserIds.length === 0) {
      setError('Select at least one group member');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const conv = await createGroupChatApi(groupName.trim(), selectedUserIds);
      onSelectConversation(conv.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredContacts = contacts.filter((c) =>
    (c.nickname || c.contact_user.display_name).toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1b1f23] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden text-gray-900 dark:text-gray-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="text-[#2c6bed]" size={20} />
            <h2 className="text-lg font-bold">New Group</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleCreateGroup} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 space-y-4 border-b border-gray-200 dark:border-gray-800">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                Group Name
              </label>
              <input
                type="text"
                placeholder="e.g. Signal Dev Squad, Weekend Trip..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#282c31] border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2c6bed]"
                required
              />
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Filter contacts..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-[#282c31] border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2c6bed]"
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Select Members ({selectedUserIds.length} selected)
            </div>

            {filteredContacts.map((c) => {
              const isSelected = selectedUserIds.includes(c.contact_user.id);
              return (
                <div
                  key={c.id}
                  onClick={() => toggleUser(c.contact_user.id)}
                  className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer border transition ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800'
                      : 'hover:bg-gray-100 dark:hover:bg-[#282c31] border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={c.contact_user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${c.contact_user.username}`}
                      alt={c.contact_user.display_name}
                      className="w-9 h-9 rounded-full bg-gray-200 object-cover"
                    />
                    <div>
                      <div className="text-xs font-semibold">{c.nickname || c.contact_user.display_name}</div>
                      <div className="text-[11px] text-gray-400">@{c.contact_user.username}</div>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                      isSelected ? 'bg-[#2c6bed] border-[#2c6bed] text-white' : 'border-gray-400'
                    }`}
                  >
                    {isSelected && <Check size={12} />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#2c6bed] hover:bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-md transition disabled:opacity-50"
            >
              {loading ? 'Creating Group...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
