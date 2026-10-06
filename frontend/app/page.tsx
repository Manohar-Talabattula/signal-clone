'use client';

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { WebSocketProvider, useWebSocket } from '../context/WebSocketContext';
import { Conversation } from '../lib/types';
import { getConversationsApi } from '../lib/api';
import { Sidebar } from '../components/Sidebar';
import { ChatPane } from '../components/ChatPane';
import { AuthModal } from '../components/modals/AuthModal';
import { NewChatModal } from '../components/modals/NewChatModal';
import { CreateGroupModal } from '../components/modals/CreateGroupModal';
import { GroupInfoModal } from '../components/modals/GroupInfoModal';
import { SettingsModal } from '../components/modals/SettingsModal';
import { CallModal } from '../components/modals/CallModal';

function MainApp() {
  const { user, loading } = useAuth();
  const { subscribe } = useWebSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);

  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeCallType, setActiveCallType] = useState<'audio' | 'video' | null>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    try {
      const data = await getConversationsApi();
      setConversations(data);
      if (data.length > 0 && !activeConvId) {
        setActiveConvId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Subscribe to live WebSocket events to update conversation list
  useEffect(() => {
    const unsubscribe = subscribe((data: any) => {
      if (
        data.type === 'new_message' ||
        data.type === 'conversation_created' ||
        data.type === 'conversation_update' ||
        data.type === 'participant_change'
      ) {
        loadConversations();
      }
    });
    return () => unsubscribe();
  }, [subscribe]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121418] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#2c6bed] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-gray-400">Loading Signal...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  const activeConversation = conversations.find((c) => c.id === activeConvId) || null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100 dark:bg-[#121418] text-gray-900 dark:text-gray-100">
      {/* Signal Left Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConvId={activeConvId}
        onSelectConversation={(id) => setActiveConvId(id)}
        onOpenNewChat={() => setShowNewChatModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* Signal Main Chat View Pane */}
      <ChatPane
        conversation={activeConversation}
        onOpenCall={(type) => setActiveCallType(type)}
        onOpenGroupInfo={() => setShowGroupInfoModal(true)}
        onUpdateConversation={(updated) => {
          setConversations((prev) =>
            prev.map((c) => (c.id === updated.id ? updated : c))
          );
        }}
      />

      {/* Modals */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onSelectConversation={(id) => setActiveConvId(id)}
        onOpenCreateGroup={() => setShowCreateGroupModal(true)}
      />

      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onSelectConversation={(id) => setActiveConvId(id)}
      />

      <GroupInfoModal
        conversation={activeConversation}
        isOpen={showGroupInfoModal}
        onClose={() => setShowGroupInfoModal(false)}
        onUpdateConversation={(updated) => {
          setConversations((prev) =>
            prev.map((c) => (c.id === updated.id ? updated : c))
          );
        }}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      <CallModal
        conversation={activeConversation}
        callType={activeCallType}
        onClose={() => setActiveCallType(null)}
      />
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <MainApp />
      </WebSocketProvider>
    </AuthProvider>
  );
}
