'use client';

import React, { useState, useEffect } from 'react';
import { Conversation, Contact } from '../../lib/types';
import { addGroupMemberApi, removeGroupMemberApi, getContactsApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Users, UserPlus, Trash2, Shield, X, Check } from 'lucide-react';

interface GroupInfoModalProps {
  conversation: Conversation | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateConversation: (updated: Conversation) => void;
}

export const GroupInfoModal: React.FC<GroupInfoModalProps> = ({
  conversation,
  isOpen,
  onClose,
  onUpdateConversation,
}) => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getContactsApi().then(setContacts);
    }
  }, [isOpen]);

  if (!isOpen || !conversation || conversation.type !== 'group') return null;

  const myParticipant = conversation.participants.find((p) => p.user_id === user?.id);
  const isAdmin = myParticipant?.role === 'admin';

  const memberUserIds = conversation.participants.map((p) => p.user_id);
  const contactsNotJoined = contacts.filter((c) => !memberUserIds.includes(c.contact_user.id));

  const handleAddMember = async () => {
    if (!selectedToAdd) return;
    setLoading(true);
    try {
      const updated = await addGroupMemberApi(conversation.id, selectedToAdd);
      onUpdateConversation(updated);
      setSelectedToAdd(null);
      setIsAdding(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (targetUserId: number) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    setLoading(true);
    try {
      const updated = await removeGroupMemberApi(conversation.id, targetUserId);
      onUpdateConversation(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1b1f23] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden text-gray-900 dark:text-gray-100 flex flex-col max-h-[85vh]">
        {/* Header Banner */}
        <div className="p-6 bg-gradient-to-b from-blue-50 to-white dark:from-[#20252b] dark:to-[#1b1f23] text-center relative border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500"
          >
            <X size={20} />
          </button>
          <img
            src={conversation.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${conversation.name}`}
            alt={conversation.name || 'Group'}
            className="w-20 h-20 rounded-full mx-auto mb-3 border-4 border-white dark:border-[#1b1f23] shadow-md object-cover"
          />
          <h2 className="text-lg font-bold">{conversation.name}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Group • {conversation.participants.length} members
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Members ({conversation.participants.length})
            </h3>
            {isAdmin && !isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="text-xs text-[#2c6bed] hover:underline font-semibold flex items-center gap-1"
              >
                <UserPlus size={14} /> Add Member
              </button>
            )}
          </div>

          {/* Add member section */}
          {isAdding && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#2c6bed]">
                <span>Select Contact to Add</span>
                <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600">
                  Cancel
                </button>
              </div>
              {contactsNotJoined.length === 0 ? (
                <p className="text-xs text-gray-400">All your contacts are already in this group.</p>
              ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {contactsNotJoined.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedToAdd(c.contact_user.id)}
                      className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer ${
                        selectedToAdd === c.contact_user.id
                          ? 'bg-[#2c6bed] text-white'
                          : 'hover:bg-white dark:hover:bg-[#282c31]'
                      }`}
                    >
                      <span className="font-semibold">{c.nickname || c.contact_user.display_name}</span>
                      {selectedToAdd === c.contact_user.id && <Check size={14} />}
                    </div>
                  ))}
                </div>
              )}
              {selectedToAdd && (
                <button
                  onClick={handleAddMember}
                  disabled={loading}
                  className="w-full py-2 bg-[#2c6bed] hover:bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  Confirm Add Member
                </button>
              )}
            </div>
          )}

          {/* Member List */}
          <div className="space-y-1">
            {conversation.participants.map((p) => (
              <div
                key={p.id}
                className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#282c31] flex items-center justify-between transition"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={p.user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.user.username}`}
                      alt={p.user.display_name}
                      className="w-9 h-9 rounded-full bg-gray-200 object-cover"
                    />
                    {p.user.is_online && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-[#1b1f23]"></span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold flex items-center gap-1.5">
                      {p.user.display_name} {p.user_id === user?.id && '(You)'}
                      {p.role === 'admin' && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-900/60 text-[#2c6bed] dark:text-blue-300 rounded">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400">@{p.user.username}</div>
                  </div>
                </div>

                {isAdmin && p.user_id !== user?.id && (
                  <button
                    onClick={() => handleRemoveMember(p.user_id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                    title="Remove member"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => handleRemoveMember(user!.id)}
            className="w-full py-2.5 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold rounded-xl transition"
          >
            Leave Group
          </button>
        </div>
      </div>
    </div>
  );
};
