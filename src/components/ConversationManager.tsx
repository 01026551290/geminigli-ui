"use client";

import { useState } from "react";
import { MessageCircle, History, RotateCcw } from "lucide-react";

export interface ConversationMode {
  enabled: boolean;
  sessionId: string | null;
  messageHistory: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: number;
  }>;
}

interface ConversationManagerProps {
  readonly conversationMode: ConversationMode;
  readonly onConversationModeChange: (mode: ConversationMode) => void;
}

export default function ConversationManager({
  conversationMode,
  onConversationModeChange,
}: ConversationManagerProps) {
  const [isVisible, setIsVisible] = useState(false);

  const startNewConversation = () => {
    const newMode: ConversationMode = {
      enabled: true,
      sessionId: `session_${Date.now()}`,
      messageHistory: [],
    };
    onConversationModeChange(newMode);
  };

  const stopConversation = () => {
    const newMode: ConversationMode = {
      enabled: false,
      sessionId: null,
      messageHistory: [],
    };
    onConversationModeChange(newMode);
  };

  const clearHistory = () => {
    if (conversationMode.enabled) {
      const newMode: ConversationMode = {
        ...conversationMode,
        messageHistory: [],
      };
      onConversationModeChange(newMode);
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className={`fixed top-4 left-4 rounded-lg p-2 shadow-lg transition-all z-50 ${
          conversationMode.enabled
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-white hover:bg-gray-50 text-gray-600 border"
        }`}
        title="대화 히스토리 관리"
      >
        <MessageCircle size={20} />
        {conversationMode.enabled && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
        )}
      </button>
    );
  }

  return (
    <div className="fixed top-4 left-4 bg-white shadow-xl rounded-lg p-4 w-80 z-50 border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <MessageCircle size={18} className="text-gray-700" />
          <h3 className="font-semibold text-gray-800">대화 히스토리</h3>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 text-xl"
        >
          ×
        </button>
      </div>

      <div className="space-y-4">
        {/* 현재 상태 */}
        <div
          className={`rounded-lg p-3 border ${
            conversationMode.enabled
              ? "bg-green-50 border-green-200"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <div className="flex items-center space-x-2 mb-2">
            <div
              className={`w-2 h-2 rounded-full ${
                conversationMode.enabled ? "bg-green-500" : "bg-gray-400"
              }`}
            />
            <span className="text-sm font-medium">
              {conversationMode.enabled ? "대화형 모드 활성" : "일반 모드"}
            </span>
          </div>

          {conversationMode.enabled && (
            <div className="text-xs text-gray-600">
              <p>세션 ID: {conversationMode.sessionId?.slice(-8)}</p>
              <p>메시지 수: {conversationMode.messageHistory.length}</p>
            </div>
          )}
        </div>

        {/* 컨트롤 버튼들 */}
        <div className="space-y-2">
          {!conversationMode.enabled ? (
            <button
              onClick={startNewConversation}
              className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white rounded-lg py-2 px-3 hover:bg-green-700 transition-colors"
            >
              <MessageCircle size={16} />
              <span>대화형 모드 시작</span>
            </button>
          ) : (
            <div className="space-y-2">
              <button
                onClick={clearHistory}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white rounded-lg py-2 px-3 hover:bg-blue-700 transition-colors"
              >
                <RotateCcw size={16} />
                <span>히스토리 초기화</span>
              </button>

              <button
                onClick={stopConversation}
                className="w-full flex items-center justify-center space-x-2 bg-red-600 text-white rounded-lg py-2 px-3 hover:bg-red-700 transition-colors"
              >
                <MessageCircle size={16} />
                <span>대화형 모드 종료</span>
              </button>
            </div>
          )}
        </div>

        {/* 히스토리 미리보기 */}
        {conversationMode.enabled &&
          conversationMode.messageHistory.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <History size={14} className="mr-1" />
                최근 대화
              </h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {conversationMode.messageHistory.slice(-3).map((msg) => (
                  <div
                    key={`${msg.timestamp}-${msg.role}`}
                    className={`text-xs p-2 rounded ${
                      msg.role === "user"
                        ? "bg-blue-50 text-blue-800"
                        : "bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className="font-medium mb-1">
                      {msg.role === "user" ? "👤 사용자" : "🤖 Gemini"}
                    </div>
                    <div className="truncate">
                      {msg.content.length > 50
                        ? `${msg.content.slice(0, 50)}...`
                        : msg.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* 설명 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">
            대화형 모드란?
          </h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• 이전 메시지들을 기억하는 연속 대화</li>
            <li>
              • Gemini CLI의 <code>-i</code> 옵션 사용
            </li>
            <li>• 컨텍스트가 유지되어 더 정확한 답변</li>
            <li>• 토큰 사용량이 증가할 수 있음</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
