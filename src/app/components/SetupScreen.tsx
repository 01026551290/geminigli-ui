"use client";

import { useState } from "react";

interface SetupScreenProps {
  state: "needs_cli" | "needs_key" | "error" | "checking" | "ready";
  busy: boolean;
  os: "mac" | "win" | "linux";
  detail?: string;
  onInstall: () => Promise<boolean>;
  onSaveKey: (apiKey: string) => Promise<boolean>;
  onRetest: () => Promise<void>;
}

export default function SetupScreen({
  state,
  busy,
  os,
  detail,
  onInstall,
  onSaveKey,
  onRetest,
}: Readonly<SetupScreenProps>) {
  const [apiKey, setApiKey] = useState("");

  const getOSLabel = () => {
    if (os === "mac") return "macOS";
    if (os === "win") return "Windows";
    return "Linux";
  };

  const getInstallCommand = () => {
    if (os === "win") {
      return "npm install -g @google/gemini-cli";
    }
    return "npm install -g @google/gemini-cli 또는 brew install gemini-cli";
  };

  const getManualInstallSteps = () => {
    if (os === "win") {
      return [
        "1. PowerShell을 관리자 권한으로 실행",
        "2. Node.js 설치 확인: node --version",
        "3. Node.js가 없다면 https://nodejs.org에서 LTS 버전 다운로드",
        "4. PowerShell에서 실행: npm install -g @google/gemini-cli",
        "5. 설치 확인: gemini --version",
        "6. PATH 새로고침: 새 PowerShell 창을 열고 다시 확인"
      ];
    } else if (os === "mac") {
      return [
        "1. 터미널 열기",
        "2. Homebrew로 설치: brew install gemini-cli",
        "3. 또는 npm으로 설치: npm install -g @google/gemini-cli",
        "4. 설치 확인: gemini --version"
      ];
    } else {
      return [
        "1. 터미널 열기",
        "2. Node.js 설치 확인: node --version",
        "3. npm으로 설치: npm install -g @google/gemini-cli",
        "4. 설치 확인: gemini --version"
      ];
    }
  };

  const getTroubleshootingSteps = () => {
    if (os === "win") {
      return [
        "• PowerShell 실행 정책: Set-ExecutionPolicy RemoteSigned",
        "• 새 PowerShell 창에서 다시 시도 (PATH 갱신)",
        "• npm 캐시 정리: npm cache clean --force",
        "• Node.js 재설치 (LTS 버전)",
        "• 관리자 권한으로 설치 실행"
      ];
    } else {
      return [
        "• sudo npm install -g @google/gemini-cli",
        "• brew doctor && brew update (macOS)",
        "• npm 권한 문제: npm config fix",
        "• 터미널 재시작 후 다시 시도"
      ];
    }
  };

  const getStatusColor = () => {
    if (state === "ready") return "bg-green-500";
    if (state === "error") return "bg-red-500";
    return "bg-yellow-500";
  };

  const getStatusText = () => {
    if (state === "ready") return "준비완료";
    if (state === "error") return "오류";
    if (state === "checking") return "점검중";
    return "설정필요";
  };

  const handleInstall = async () => {
    await onInstall();
  };

  const handleSaveKey = async () => {
    if (!apiKey.trim()) return;
    const success = await onSaveKey(apiKey.trim());
    if (success) {
      setApiKey("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gemini Desktop
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Gemini CLI를 위한 데스크톱 인터페이스
          </p>
        </div>

        {/* 상태에 따른 UI */}
        {state === "checking" && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">환경 점검 중...</p>
          </div>
        )}

        {state === "needs_cli" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Gemini CLI 설치 필요
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Gemini CLI가 설치되어 있지 않습니다. {getOSLabel()}에 맞게
              자동으로 설치하겠습니다.
            </p>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                자동 설치 명령어:
              </p>
              <code className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {getInstallCommand()}
              </code>
            </div>

            {os === "win" && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  💡 Windows에서 수동 설치하기:
                </p>
                <div className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                  {getManualInstallSteps().map((step) => (
                    <div key={step} className="flex items-start">
                      <span className="inline-block w-4 text-center">•</span>
                      <span className="ml-2">{step}</span>
                    </div>
                  ))}
                </div>
                
                {/* 문제 해결 단계 추가 */}
                <div className="mt-4 pt-3 border-t border-blue-200 dark:border-blue-700">
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-2 font-semibold">
                    🔧 자동 설치가 실패하는 경우:
                  </p>
                  <div className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                    {getTroubleshootingSteps().map((step) => (
                      <div key={step} className="flex items-start">
                        <span className="inline-block w-4 text-center">•</span>
                        <span className="ml-2">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    ⚠️ 설치 후 새 PowerShell 창을 열어 gemini --version으로 확인하세요.
                  </p>
                </div>
              </div>
            )}

            {detail && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  {detail}
                </p>
              </div>
            )}

            <button
              onClick={handleInstall}
              disabled={busy}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
            >
              {busy ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>설치 중...</span>
                </>
              ) : (
                <span>Gemini CLI 설치</span>
              )}
            </button>
          </div>
        )}

        {state === "needs_key" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              API 키 설정
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Google AI Studio에서 발급받은 API 키를 입력해주세요.
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                💡 API 키 발급 방법:
              </p>
              <ol className="text-sm text-blue-600 dark:text-blue-400 space-y-1 list-decimal list-inside">
                <li>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    Google AI Studio
                  </a>{" "}
                  에서 API 키 생성
                </li>
                <li>아래 입력란에 키 입력</li>
                <li>저장 버튼 클릭</li>
              </ol>
            </div>

            {detail && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  {detail}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="api-key-input"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                API 키
              </label>
              <input
                id="api-key-input"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="여기에 API 키를 입력하세요..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <button
              onClick={handleSaveKey}
              disabled={!apiKey.trim() || busy}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
            >
              {busy ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>설정 중...</span>
                </>
              ) : (
                <span>API 키 저장</span>
              )}
            </button>
          </div>
        )}

        {state === "error" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
              오류 발생
            </h2>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">
                {detail || "알 수 없는 오류가 발생했습니다."}
              </p>
            </div>

            <button
              onClick={onRetest}
              disabled={busy}
              className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
            >
              {busy ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>재시도 중...</span>
                </>
              ) : (
                <span>다시 시도</span>
              )}
            </button>
          </div>
        )}

        {/* 하단 상태 표시 */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              감지된 OS: {getOSLabel()}
            </span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
              <span className="text-gray-500 dark:text-gray-400">
                {getStatusText()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
