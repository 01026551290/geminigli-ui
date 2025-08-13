"use client";

import { useState, useEffect } from "react";
import SetupPage from "../components/SetupPage";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import UsageTracker from "../components/UsageTracker";
import AdvancedSettings, {
  GeminiSettings,
} from "../components/AdvancedSettings";
import ConversationManager, {
  ConversationMode,
} from "../components/ConversationManager";
import { Chat, Message } from "../types";

export default function Home() {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [geminiSettings, setGeminiSettings] = useState<GeminiSettings>({
    sandbox: false,
    allFiles: false,
    showMemoryUsage: false,
    debug: false,
    model: "gemini-2.5-flash",
    mcpServers: [],
    extensions: [],
  });
  const [conversationMode, setConversationMode] = useState<ConversationMode>({
    enabled: false,
    sessionId: null,
    messageHistory: [],
  });

  console.log("App rendering successfully");

  // 고급 설정 로드
  const loadGeminiSettings = async () => {
    try {
      if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
        const { Store } = await import("@tauri-apps/plugin-store");
        const store = await Store.load("gemini-settings.json");
        const savedSettings = await store.get("settings");

        if (savedSettings) {
          setGeminiSettings(savedSettings as GeminiSettings);
        }
      }
    } catch (error) {
      console.error("고급 설정 로드 오류:", error);
    }
  };

  // 고급 설정 저장
  const saveGeminiSettings = async (settings: GeminiSettings) => {
    try {
      if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
        const { Store } = await import("@tauri-apps/plugin-store");
        const store = await Store.load("gemini-settings.json");
        await store.set("settings", settings);
        await store.save();
      }
    } catch (error) {
      console.error("고급 설정 저장 오류:", error);
    }
  };

  // 고급 설정 변경 핸들러
  const handleSettingsChange = async (newSettings: GeminiSettings) => {
    setGeminiSettings(newSettings);
    await saveGeminiSettings(newSettings);
  };

  // 앱 초기화
  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
          const { Store } = await import("@tauri-apps/plugin-store");
          const store = await Store.load("config.json");

          // 설정 상태 확인
          const apiKey = await store.get("apiKey");
          if (apiKey) {
            setIsSetupComplete(true);
            await loadChats();
          }

          // 고급 설정 로드
          await loadGeminiSettings();
        } else {
          // 웹 환경에서는 설정 완료로 간주
          setIsSetupComplete(true);
        }
      } catch (error) {
        console.error("앱 초기화 오류:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const loadChats = async () => {
    try {
      if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
        const { Store } = await import("@tauri-apps/plugin-store");
        const store = await Store.load("chats.json");
        const savedChats = await store.get("chats");

        if (savedChats && Array.isArray(savedChats)) {
          setChats(savedChats as Chat[]);
          // 가장 최근 채팅을 현재 채팅으로 설정
          const sortedChats = (savedChats as Chat[]).sort(
            (a, b) => b.updatedAt - a.updatedAt
          );
          if (sortedChats.length > 0) {
            setCurrentChatId(sortedChats[0].id);
          }
        }
      }
    } catch (error) {
      console.error("채팅 로드 오류:", error);
    }
  };

  const saveChats = async (updatedChats: Chat[]) => {
    try {
      if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
        const { Store } = await import("@tauri-apps/plugin-store");
        const store = await Store.load("chats.json");
        await store.set("chats", updatedChats);
        await store.save();
      }
    } catch (error) {
      console.error("채팅 저장 오류:", error);
    }
  };

  const generateChatTitle = (firstMessage: string): string => {
    const words = firstMessage.trim().split(" ");
    if (words.length <= 6) {
      return firstMessage;
    }
    return words.slice(0, 6).join(" ") + "...";
  };

  const createNewChat = async () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "새 채팅",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: "gemini", // 간단하게 변경
    };

    const updatedChats = [newChat, ...chats];
    setChats(updatedChats);
    setCurrentChatId(newChat.id);
    saveChats(updatedChats);
  };

  const selectChat = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  const deleteChat = (chatId: string) => {
    const updatedChats = chats.filter((chat) => chat.id !== chatId);
    setChats(updatedChats);
    saveChats(updatedChats);

    // 삭제된 채팅이 현재 선택된 채팅이면 다른 채팅 선택
    if (currentChatId === chatId) {
      if (updatedChats.length > 0) {
        setCurrentChatId(updatedChats[0].id);
      } else {
        setCurrentChatId(null);
      }
    }
  };

  const handleSendMessage = (userContent: string, assistantContent: string) => {
    if (!currentChatId) {
      createNewChat();
      return;
    }

    const currentChat = chats.find((chat) => chat.id === currentChatId);
    if (!currentChat) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: userContent,
      role: "user",
      timestamp: Date.now(),
    };

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: assistantContent,
      role: "assistant",
      timestamp: Date.now() + 1,
    };

    const updatedMessages = [
      ...currentChat.messages,
      userMessage,
      assistantMessage,
    ];

    // 첫 메시지면 제목 업데이트
    const updatedTitle =
      currentChat.messages.length === 0
        ? generateChatTitle(userContent)
        : currentChat.title;

    const updatedChat: Chat = {
      ...currentChat,
      title: updatedTitle,
      messages: updatedMessages,
      updatedAt: Date.now(),
    };

    const updatedChats = chats.map((chat) =>
      chat.id === currentChatId ? updatedChat : chat
    );

    setChats(updatedChats);
    saveChats(updatedChats);
  };

  const getCurrentChat = (): Chat | null => {
    return chats.find((chat) => chat.id === currentChatId) || null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isSetupComplete) {
    return <SetupPage onSetupComplete={() => setIsSetupComplete(true)} />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={selectChat}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
      />
      <div className="flex-1 flex flex-col">
        {currentChatId && getCurrentChat() ? (
          <ChatArea
            messages={getCurrentChat()!.messages}
            onSendMessage={handleSendMessage}
            geminiSettings={geminiSettings}
            conversationMode={conversationMode}
            onConversationUpdate={setConversationMode}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <h2 className="text-2xl font-bold mb-4">
                채팅을 선택하거나 새로 만들어보세요
              </h2>
              <p>왼쪽 사이드바에서 &ldquo;새 채팅&rdquo; 버튼을 클릭하세요</p>
            </div>
          </div>
        )}
      </div>
      <UsageTracker />
      <ConversationManager
        conversationMode={conversationMode}
        onConversationModeChange={setConversationMode}
      />
      <AdvancedSettings
        settings={geminiSettings}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  );
}
