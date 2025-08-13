"use client";

import { useState, useRef, useEffect } from "react";
import { quickCallTest } from "../utils/gemini-test";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function GeminiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // 실제 Gemini CLI 호출
      const result = await quickCallTest(userMessage.content);

      let assistantMessage: Message;

      if (result.ok) {
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: result.stdout,
          timestamp: new Date(),
        };
      } else {
        let errorContent = "죄송합니다. 오류가 발생했습니다.";

        if (result.reason === "AUTH") {
          errorContent =
            "API 키 인증에 문제가 있습니다. 설정을 다시 확인해주세요.";
        } else if (result.reason === "NO_CLI") {
          errorContent =
            "Gemini CLI에 접근할 수 없습니다. 설치 상태를 확인해주세요.";
        } else if (result.detail) {
          errorContent = `오류: ${result.detail}`;
        }

        assistantMessage = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: errorContent,
          timestamp: new Date(),
        };
      }

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("메시지 전송 실패:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content:
          "죄송합니다. 예상치 못한 오류가 발생했습니다. 다시 시도해 주세요.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Gemini Desktop
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Google Gemini AI 어시스턴트
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={clearChat}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition duration-200"
            >
              대화 초기화
            </button>
            <div
              className="w-3 h-3 bg-green-500 rounded-full"
              title="연결됨"
            ></div>
          </div>
        </div>
      </header>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Gemini와 대화를 시작하세요
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                질문이나 요청사항을 입력하면 Gemini가 도움을 드립니다.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mt-8">
                <button
                  onClick={() =>
                    setInputMessage("안녕하세요! 자기소개를 해주세요.")
                  }
                  className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition duration-200 text-left"
                >
                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                    인사하기
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Gemini에게 인사하고 소개받기
                  </div>
                </button>
                <button
                  onClick={() => setInputMessage("오늘 날씨는 어때요?")}
                  className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition duration-200 text-left"
                >
                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                    날씨 문의
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    현재 날씨 정보 확인하기
                  </div>
                </button>
                <button
                  onClick={() =>
                    setInputMessage("Python 코드 작성을 도와주세요")
                  }
                  className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition duration-200 text-left"
                >
                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                    코딩 도움
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    프로그래밍 관련 질문하기
                  </div>
                </button>
                <button
                  onClick={() =>
                    setInputMessage("창의적인 글쓰기를 도와주세요")
                  }
                  className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition duration-200 text-left"
                >
                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                    글쓰기 도움
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    창의적인 콘텐츠 작성 요청하기
                  </div>
                </button>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex max-w-3xl ${
                    message.type === "user" ? "flex-row-reverse" : "flex-row"
                  } space-x-3`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === "user"
                        ? "bg-blue-600"
                        : "bg-gradient-to-r from-purple-500 to-pink-500"
                    }`}
                  >
                    {message.type === "user" ? (
                      <svg
                        className="w-5 h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    )}
                  </div>
                  <div
                    className={`flex-1 px-4 py-3 rounded-2xl ${
                      message.type === "user"
                        ? "bg-blue-600 text-white ml-3"
                        : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 mr-3"
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                    <div
                      className={`text-xs mt-2 ${
                        message.type === "user"
                          ? "text-blue-100"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-2xl mr-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[52px] max-h-32 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                rows={1}
                style={{
                  height: "auto",
                  minHeight: "52px",
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = `${Math.min(
                    target.scrollHeight,
                    128
                  )}px`;
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg flex items-center justify-center transition duration-200"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className="flex justify-center mt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Gemini는 실수를 할 수 있습니다. 중요한 정보는 확인해 주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
