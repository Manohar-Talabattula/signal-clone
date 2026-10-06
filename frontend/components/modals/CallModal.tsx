'use client';

import React, { useState, useEffect } from 'react';
import { Phone, Video, Mic, MicOff, VideoOff, PhoneOff, Shield } from 'lucide-react';
import { Conversation } from '../../lib/types';
import { useAuth } from '../../context/AuthContext';

interface CallModalProps {
  conversation: Conversation | null;
  callType: 'audio' | 'video' | null;
  onClose: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({ conversation, callType, onClose }) => {
  const { user } = useAuth();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (!callType) return;
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [callType]);

  if (!callType || !conversation) return null;

  const targetName =
    conversation.type === 'group'
      ? conversation.name
      : conversation.participants.find((p) => p.user_id !== user?.id)?.user.display_name || 'Contact';

  const targetAvatar =
    conversation.type === 'group'
      ? conversation.avatar_url
      : conversation.participants.find((p) => p.user_id !== user?.id)?.user.avatar_url;

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-lg bg-[#181c20] rounded-3xl border border-gray-800 shadow-2xl overflow-hidden text-white flex flex-col items-center p-8 relative">
        {/* Encrypted indicator badge */}
        <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[11px] font-semibold text-blue-300">
          <Shield size={12} />
          <span>Signal Encrypted Call (Simulated)</span>
        </div>

        <div className="mt-8 text-center space-y-4">
          <div className="relative inline-block">
            <img
              src={targetAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${targetName}`}
              alt={targetName}
              className="w-28 h-28 rounded-full border-4 border-[#2c6bed] object-cover shadow-xl mx-auto"
            />
            <span className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-[#181c20] rounded-full"></span>
          </div>

          <div>
            <h2 className="text-xl font-bold">{targetName}</h2>
            <p className="text-xs text-blue-400 font-mono mt-1">
              {callDuration > 0 ? formatDuration(callDuration) : 'Connecting call...'}
            </p>
          </div>
        </div>

        {/* Video stream placeholder */}
        {callType === 'video' && !isVideoOff && (
          <div className="w-full h-44 bg-gray-900 rounded-2xl my-6 flex items-center justify-center border border-gray-800 relative overflow-hidden">
            <div className="absolute top-2 right-2 w-20 h-16 bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center text-[10px] text-gray-400">
              You
            </div>
            <p className="text-xs text-gray-500 animate-pulse">Camera feed active (HD Encrypted)</p>
          </div>
        )}

        {/* Call Controls Bar */}
        <div className="flex items-center gap-6 mt-8">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-4 rounded-full transition ${
              isMuted ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>

          <button
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`p-4 rounded-full transition ${
              isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
          </button>

          <button
            onClick={onClose}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition"
            title="End Call"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};
