"use client";

import { useState } from "react";
import {
  Settings,
  Code,
  FileText,
  Monitor,
  Server,
  Layers,
} from "lucide-react";

export interface GeminiSettings {
  sandbox: boolean;
  allFiles: boolean;
  showMemoryUsage: boolean;
  debug: boolean;
  model: string;
  mcpServers: string[];
  extensions: string[];
}

interface AdvancedSettingsProps {
  settings: GeminiSettings;
  onSettingsChange: (settings: GeminiSettings) => void;
}

export default function AdvancedSettings({
  settings,
  onSettingsChange,
}: AdvancedSettingsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [mcpServerInput, setMcpServerInput] = useState("");
  const [extensionInput, setExtensionInput] = useState("");

  const availableModels = [
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
  ];

  const updateSetting = <K extends keyof GeminiSettings>(
    key: K,
    value: GeminiSettings[K]
  ) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const addMcpServer = () => {
    if (
      mcpServerInput.trim() &&
      !settings.mcpServers.includes(mcpServerInput.trim())
    ) {
      updateSetting("mcpServers", [
        ...settings.mcpServers,
        mcpServerInput.trim(),
      ]);
      setMcpServerInput("");
    }
  };

  const removeMcpServer = (server: string) => {
    updateSetting(
      "mcpServers",
      settings.mcpServers.filter((s) => s !== server)
    );
  };

  const addExtension = () => {
    if (
      extensionInput.trim() &&
      !settings.extensions.includes(extensionInput.trim())
    ) {
      updateSetting("extensions", [
        ...settings.extensions,
        extensionInput.trim(),
      ]);
      setExtensionInput("");
    }
  };

  const removeExtension = (extension: string) => {
    updateSetting(
      "extensions",
      settings.extensions.filter((e) => e !== extension)
    );
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-colors z-50"
        title="고급 설정"
      >
        <Settings size={20} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
            <Settings size={24} />
            <span>Gemini 고급 설정</span>
          </h2>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* 모델 선택 */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Layers size={16} />
              <span>모델 선택</span>
            </label>
            <select
              value={settings.model}
              onChange={(e) => updateSetting("model", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {availableModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>

          {/* 기본 토글 옵션들 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="sandbox"
                checked={settings.sandbox}
                onChange={(e) => updateSetting("sandbox", e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="sandbox"
                className="flex items-center space-x-2 text-sm text-gray-700"
              >
                <Code size={16} />
                <span>샌드박스 모드</span>
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="allFiles"
                checked={settings.allFiles}
                onChange={(e) => updateSetting("allFiles", e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="allFiles"
                className="flex items-center space-x-2 text-sm text-gray-700"
              >
                <FileText size={16} />
                <span>모든 파일 포함</span>
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="showMemoryUsage"
                checked={settings.showMemoryUsage}
                onChange={(e) =>
                  updateSetting("showMemoryUsage", e.target.checked)
                }
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="showMemoryUsage"
                className="flex items-center space-x-2 text-sm text-gray-700"
              >
                <Monitor size={16} />
                <span>메모리 사용량 표시</span>
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="debug"
                checked={settings.debug}
                onChange={(e) => updateSetting("debug", e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="debug"
                className="flex items-center space-x-2 text-sm text-gray-700"
              >
                <Settings size={16} />
                <span>디버그 모드</span>
              </label>
            </div>
          </div>

          {/* MCP 서버 설정 */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Server size={16} />
              <span>MCP 서버</span>
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={mcpServerInput}
                onChange={(e) => setMcpServerInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addMcpServer()}
                placeholder="MCP 서버 이름 입력"
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={addMcpServer}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                추가
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {settings.mcpServers.map((server) => (
                <span
                  key={server}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {server}
                  <button
                    onClick={() => removeMcpServer(server)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Extensions 설정 */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Layers size={16} />
              <span>확장 프로그램</span>
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={extensionInput}
                onChange={(e) => setExtensionInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addExtension()}
                placeholder="확장 프로그램 이름 입력"
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={addExtension}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                추가
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {settings.extensions.map((extension) => (
                <span
                  key={extension}
                  className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {extension}
                  <button
                    onClick={() => removeExtension(extension)}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* 설명 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">
              기능 설명
            </h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>
                <strong>샌드박스 모드:</strong> 코드를 안전한 환경에서 실행
              </li>
              <li>
                <strong>모든 파일 포함:</strong> 프로젝트의 모든 파일을
                컨텍스트에 포함
              </li>
              <li>
                <strong>메모리 사용량:</strong> 실시간 메모리 사용량을 상태바에
                표시
              </li>
              <li>
                <strong>MCP 서버:</strong> Model Context Protocol 서버 연동
              </li>
              <li>
                <strong>확장 프로그램:</strong> Gemini CLI 확장 기능 활성화
              </li>
            </ul>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={() => setIsVisible(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              닫기
            </button>
            <button
              onClick={() => {
                // 설정 저장 로직
                setIsVisible(false);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              적용
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
