"use client";

import { Plus, MessageCircle, Trash2 } from "lucide-react";
import { Chat } from "@/types";

interface SidebarProps {
  readonly chats: Chat[];
  readonly currentChatId: string | null;
  readonly onSelectChat: (chatId: string) => void;
  readonly onNewChat: () => void;
  readonly onDeleteChat: (chatId: string) => void;
}

export default function Sidebar({
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
}: SidebarProps) {
  const formatTitle = (title: string) => {
    return title.length > 20 ? title.substring(0, 20) + "..." : title;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return "방금 전";
    if (hours < 24) return `${hours}시간 전`;
    if (hours < 24 * 7) return `${Math.floor(hours / 24)}일 전`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-full">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold mb-4">Gemini Desktop</h1>
        <button
          onClick={onNewChat}
          className="w-full flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>새 채팅</span>
        </button>
      </div>

      {/* 채팅 목록 */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="p-4 text-gray-400 text-center">
            <MessageCircle size={48} className="mx-auto mb-2 opacity-50" />
            <p>아직 채팅이 없습니다</p>
            <p className="text-sm">새 채팅을 시작해보세요!</p>
          </div>
        ) : (
          <div className="p-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`group flex items-center justify-between p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                  currentChatId === chat.id
                    ? "bg-blue-600"
                    : "hover:bg-gray-800"
                }`}
                onClick={() => onSelectChat(chat.id)}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">
                    {formatTitle(chat.title)}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(chat.updatedAt)}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">
                      {chat.messages.length}개 메시지
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600 rounded transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 푸터 */}
      <div className="p-4 border-t border-gray-700">
        <div className="text-xs text-gray-400">
          <p>총 {chats.length}개 채팅</p>
        </div>
      </div>
    </div>
  );
}
