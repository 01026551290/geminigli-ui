"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Paperclip } from "lucide-react";
import { Command } from "@tauri-apps/plugin-shell";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Message } from "../types";
import { GeminiSettings } from "./AdvancedSettings";
import { ConversationMode } from "./ConversationManager";
import FileDropZone from "./FileDropZone";

interface FileInfo {
  name: string;
  content: string;
  type: string;
  size: number;
}

interface ChatAreaProps {
  readonly messages: Message[];
  readonly onSendMessage: (content: string, response: string) => void;
  readonly geminiSettings?: GeminiSettings;
  readonly conversationMode?: ConversationMode;
  readonly onConversationUpdate?: (mode: ConversationMode) => void;
}

interface WindowWithApiUsage extends Window {
  incrementApiUsage?: () => Promise<void>;
  setUsageToLimit?: () => Promise<void>;
}

export default function ChatArea({
  messages,
  onSendMessage,
  geminiSettings,
  conversationMode,
  onConversationUpdate,
}: ChatAreaProps) {
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<FileInfo[]>([]);
  const [showFileDropZone, setShowFileDropZone] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Gemini CLI 명령어 옵션 구성
  const buildGeminiCommand = (
    userMessage: string
  ): { command: string; isInteractive: boolean } => {
    const options: string[] = [];
    const isInteractive = conversationMode?.enabled || false;

    if (geminiSettings) {
      // 모델 설정
      if (geminiSettings.model) {
        options.push(`--model "${geminiSettings.model}"`);
      }

      // 기본 플래그들
      if (geminiSettings.sandbox) {
        options.push("--sandbox");
      }

      if (geminiSettings.allFiles) {
        options.push("--all-files");
      }

      if (geminiSettings.showMemoryUsage) {
        options.push("--show-memory-usage");
      }

      if (geminiSettings.debug) {
        options.push("--debug");
      }

      // MCP 서버들
      if (geminiSettings.mcpServers.length > 0) {
        const mcpServersStr = geminiSettings.mcpServers
          .map((s) => `"${s}"`)
          .join(" ");
        options.push(`--allowed-mcp-server-names ${mcpServersStr}`);
      }

      // 확장 프로그램들
      if (geminiSettings.extensions.length > 0) {
        const extensionsStr = geminiSettings.extensions
          .map((e) => `"${e}"`)
          .join(" ");
        options.push(`--extensions ${extensionsStr}`);
      }
    }

    const optionsStr = options.length > 0 ? ` ${options.join(" ")}` : "";

    // 첨부된 파일들을 메시지에 포함
    let fullMessage = userMessage;
    if (attachedFiles.length > 0) {
      const fileContents = attachedFiles
        .map(
          (file) =>
            `\n\n--- 파일: ${file.name} ---\n${file.content}\n--- 파일 끝 ---`
        )
        .join("");
      fullMessage = `${userMessage}\n\n첨부된 파일들:${fileContents}`;
    }

    // 대화형 모드일 때는 히스토리 포함
    if (
      isInteractive &&
      conversationMode?.messageHistory &&
      conversationMode.messageHistory.length > 0
    ) {
      const historyContext = conversationMode.messageHistory
        .map(
          (msg) =>
            `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
        )
        .join("\n\n");
      fullMessage = `이전 대화 내용:\n\n${historyContext}\n\n현재 질문: ${fullMessage}`;
    }

    const escapedMessage = fullMessage.replace(/"/g, '\\"');

    if (isInteractive) {
      // 대화형 모드: -i 옵션 사용
      return {
        command: `echo "${escapedMessage}" | /opt/homebrew/bin/gemini -i${optionsStr} 2>/dev/null`,
        isInteractive: true,
      };
    } else {
      // 일반 모드: -p 옵션 사용
      return {
        command: `echo "${escapedMessage}" | /opt/homebrew/bin/gemini${optionsStr} 2>/dev/null`,
        isInteractive: false,
      };
    }
  };

  // 파일 첨부 핸들러
  const handleFilesAdded = (files: FileInfo[]) => {
    setAttachedFiles((prev) => [...prev, ...files]);
    setShowFileDropZone(false);
  };

  const handleFileRemove = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAttachedFiles = () => {
    setAttachedFiles([]);
  };

  // 메시지 추가시 스크롤 맨 아래로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 컴포넌트 마운트시 포커스
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setIsLoading(true);

    try {
      // API 사용량 증가
      if (typeof window !== "undefined") {
        const windowWithUsage = window as WindowWithApiUsage;
        if (windowWithUsage.incrementApiUsage) {
          await windowWithUsage.incrementApiUsage();
        }
      }

      // Gemini CLI 실행 (고급 설정 적용)
      const { command, isInteractive } = buildGeminiCommand(userMessage);
      const result = await Command.create("sh", ["-c", command]).execute();

      if (result.code === 0 && result.stdout) {
        // debug 메시지와 기타 로그 제거
        let cleanOutput = result.stdout.trim();

        // "Loaded cached credentials." 제거
        cleanOutput = cleanOutput.replace(
          /^Loaded cached credentials\.\s*/gm,
          ""
        );

        // [DEBUG] 메시지들 제거
        cleanOutput = cleanOutput.replace(/\[DEBUG\].*$/gm, "");

        // JSON 오류 객체 제거 (429 에러 등)
        cleanOutput = cleanOutput.replace(
          /{\s*"config":\s*{[\s\S]*?}\s*}\s*/g,
          ""
        );

        // 빈 줄들 정리
        cleanOutput = cleanOutput.replace(/\n\s*\n/g, "\n").trim();

        if (cleanOutput) {
          onSendMessage(userMessage, cleanOutput);

          // 대화형 모드일 때 히스토리 업데이트
          if (isInteractive && conversationMode && onConversationUpdate) {
            const updatedHistory = [
              ...conversationMode.messageHistory,
              {
                role: "user" as const,
                content: userMessage,
                timestamp: Date.now(),
              },
              {
                role: "assistant" as const,
                content: cleanOutput,
                timestamp: Date.now(),
              },
            ];

            onConversationUpdate({
              ...conversationMode,
              messageHistory: updatedHistory,
            });
          }
        } else {
          // stdout이 있지만 정리 후 빈 내용이면 stderr 확인
          const errorInfo = result.stderr || "응답을 처리할 수 없습니다.";
          onSendMessage(userMessage, `오류: ${errorInfo}`);
        }
      } else {
        // 429 오류나 기타 오류 처리
        let errorMessage =
          result.stderr || result.stdout || "알 수 없는 오류가 발생했습니다.";

        // 429 Rate Limit 오류 감지
        if (
          errorMessage.includes("429") ||
          errorMessage.includes("rateLimitExceeded")
        ) {
          // 429 에러 발생시 사용량을 한도 근처로 설정
          if (typeof window !== "undefined") {
            const windowWithUsage = window as WindowWithApiUsage;
            if (windowWithUsage.setUsageToLimit) {
              await windowWithUsage.setUsageToLimit();
            }
          }
          onSendMessage(
            userMessage,
            "⏰ API 사용량 한도에 도달했습니다. 잠시 후 다시 시도해주세요."
          );
        } else if (
          errorMessage.includes("404") ||
          errorMessage.includes("notFound")
        ) {
          onSendMessage(
            userMessage,
            "❌ 요청한 리소스를 찾을 수 없습니다. API 키를 확인해주세요."
          );
        } else {
          // debug 로그 제거
          errorMessage = errorMessage.replace(/\[DEBUG\].*$/gm, "");
          errorMessage = errorMessage.replace(
            /{\s*"config":\s*{[\s\S]*?}\s*}\s*/g,
            ""
          );
          errorMessage = errorMessage.replace(
            /^Loaded cached credentials\.\s*/gm,
            ""
          );
          errorMessage = errorMessage.trim();

          onSendMessage(userMessage, `오류: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error("Gemini API 오류:", error);
      onSendMessage(userMessage, `오류: ${error}`);
    } finally {
      setIsLoading(false);
      clearAttachedFiles(); // 메시지 전송 후 첨부파일 초기화
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 마크다운 렌더러 설정
  const MarkdownRenderer = ({ content }: { content: string }) => {
    return (
      <ReactMarkdown
        components={{
          code: ({ children, className }) => {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";

            // 코드 블록인 경우 (```로 감싸진 경우)
            if (language) {
              return (
                <SyntaxHighlighter
                  style={oneDark}
                  language={language}
                  PreTag="div"
                  customStyle={{
                    margin: "8px 0",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              );
            }

            // 인라인 코드인 경우 (`로 감싸진 경우)
            return (
              <code className="bg-gray-800 text-green-300 px-1.5 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            );
          },
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc pl-4 mb-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-4 mb-2">{children}</ol>
          ),
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold mb-2">{children}</h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-2">
              {children}
            </blockquote>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 간단한 헤더 */}
      <div className="border-b border-gray-200 p-4 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">Gemini Chat</h2>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Bot size={64} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg">Gemini와 대화를 시작해보세요!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-white" />
                </div>
              )}

              <div
                className={`max-w-[70%] ${
                  message.role === "user" ? "order-first" : ""
                }`}
              >
                <div
                  className={`rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div className="text-gray-800">
                      <MarkdownRenderer content={message.content} />
                    </div>
                  ) : (
                    <div>{message.content}</div>
                  )}
                </div>
                <div
                  className={`text-xs text-gray-400 mt-1 flex items-center space-x-2 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <span>{formatTime(message.timestamp)}</span>
                </div>
              </div>

              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-white" />
                </div>
              )}
            </div>
          ))
        )}

        {/* 로딩 표시 */}
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex items-center space-x-2">
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
                <span className="text-xs text-gray-500 ml-2">Gemini</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="border-t border-gray-200 p-4">
        {/* 파일 첨부 존 */}
        {showFileDropZone && (
          <div className="mb-4">
            <FileDropZone
              onFilesAdded={handleFilesAdded}
              attachedFiles={attachedFiles}
              onFileRemove={handleFileRemove}
            />
          </div>
        )}

        {/* 첨부된 파일 미리보기 */}
        {attachedFiles.length > 0 && !showFileDropZone && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                📎 {attachedFiles.length}개 파일 첨부됨
              </span>
              <button
                onClick={clearAttachedFiles}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                모두 제거
              </button>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          {/* 파일 첨부 버튼 */}
          <button
            onClick={() => setShowFileDropZone(!showFileDropZone)}
            className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
              showFileDropZone
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            title="파일 첨부"
          >
            <Paperclip size={16} />
          </button>

          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Gemini에게 메시지를 보내세요... (Shift+Enter로 줄바꿈)"
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
