"use client";

import { useState, useEffect } from "react";
import { Command } from "@tauri-apps/plugin-shell";
import { Check, X, ExternalLink, Download, Settings } from "lucide-react";

interface SetupPageProps {
  readonly onSetupComplete: () => void;
}

export default function SetupPage({ onSetupComplete }: SetupPageProps) {
  const [cliStatus, setCliStatus] = useState<
    "checking" | "found" | "not-found"
  >("checking");
  const [apiKeyStatus, setApiKeyStatus] = useState<
    "checking" | "found" | "not-found" | "input"
  >("checking");
  const [apiKey, setApiKey] = useState("");
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState("");
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [keyValidation, setKeyValidation] = useState<{
    status: "idle" | "valid" | "invalid";
    message?: string;
  }>({ status: "idle" });

  useEffect(() => {
    const initializeSetup = async () => {
      // 1. CLI 확인
      const hasCliResult = await checkGeminiCli();

      // 2. CLI가 있으면 API 키 확인
      if (hasCliResult) {
        await checkExistingApiKey();
      }
    };

    initializeSetup();
  }, []);

  const checkGeminiCli = async (): Promise<boolean> => {
    try {
      const result = await Command.create("sh", [
        "-c",
        "which gemini",
      ]).execute();
      if (result.code === 0) {
        setCliStatus("found");
        return true;
      } else {
        setCliStatus("not-found");
        return false;
      }
    } catch (error) {
      console.error("CLI 확인 오류:", error);
      setCliStatus("not-found");
      return false;
    }
  };

  const checkExistingApiKey = async () => {
    setApiKeyStatus("checking");

    try {
      // 간단한 테스트 메시지로 API 키 확인
      const result = await Command.create("sh", [
        "-c",
        `echo "test" | timeout 10 /opt/homebrew/bin/gemini 2>&1 | head -1`,
      ]).execute();

      // "error", "authentication", "API key" 등의 키워드가 없고 정상적인 응답이 왔으면 키가 있는 것
      if (
        result.code === 0 &&
        result.stdout &&
        !result.stdout.toLowerCase().includes("error") &&
        !result.stdout.toLowerCase().includes("api key") &&
        !result.stdout.toLowerCase().includes("authentication") &&
        !result.stdout.toLowerCase().includes("permission") &&
        result.stdout.trim().length > 0
      ) {
        setApiKeyStatus("found");
        setKeyValidation({
          status: "valid",
          message: "기존 API 키가 설정되어 있습니다",
        });
      } else {
        setApiKeyStatus("not-found");
      }
    } catch (error) {
      console.error("API 키 확인 오류:", error);
      setApiKeyStatus("not-found");
    }
  };

  const validateApiKey = async (key: string): Promise<boolean> => {
    if (!key || key.length < 30) {
      setKeyValidation({
        status: "invalid",
        message: "API 키가 너무 짧습니다",
      });
      return false;
    }

    if (!key.startsWith("AI")) {
      setKeyValidation({
        status: "invalid",
        message: 'Google AI Studio API 키는 "AI"로 시작해야 합니다',
      });
      return false;
    }

    setIsValidatingKey(true);
    try {
      // Gemini CLI를 사용해서 실제 API 키 유효성 검사
      const testCommand = `echo "Hello" | timeout 10 GEMINI_API_KEY="${key}" /opt/homebrew/bin/gemini`;
      const result = await Command.create("sh", ["-c", testCommand]).execute();

      if (
        result.code === 0 &&
        result.stdout &&
        !result.stdout.toLowerCase().includes("error")
      ) {
        setKeyValidation({ status: "valid", message: "API 키가 유효합니다" });

        // 유효한 키를 저장
        if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
          const { Store } = await import("@tauri-apps/plugin-store");
          const store = await Store.load("config.json");
          await store.set("apiKey", key.trim());
          await store.save();
        }

        return true;
      } else {
        setKeyValidation({
          status: "invalid",
          message: "API 키가 유효하지 않습니다",
        });
        return false;
      }
    } catch (error) {
      console.error("API 키 검증 오류:", error);
      setKeyValidation({
        status: "invalid",
        message: "API 키 검증 중 오류가 발생했습니다",
      });
      return false;
    } finally {
      setIsValidatingKey(false);
    }
  };

  const installGeminiCli = async () => {
    setIsInstalling(true);
    setInstallProgress("Homebrew 확인 중...");

    try {
      const brewCheck = await Command.create("sh", [
        "-c",
        "which brew",
      ]).execute();

      if (brewCheck.code !== 0) {
        setInstallProgress("Homebrew 설치 중...");
        const brewInstall = await Command.create("sh", [
          "-c",
          '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
        ]).execute();

        if (brewInstall.code !== 0) {
          throw new Error("Homebrew 설치 실패");
        }
      }

      setInstallProgress("Gemini CLI 설치 중...");
      const geminiInstall = await Command.create("sh", [
        "-c",
        "brew install gemini",
      ]).execute();

      if (geminiInstall.code === 0) {
        setInstallProgress("설치 완료!");
        setCliStatus("found");
        await checkExistingApiKey();
      } else {
        throw new Error("Gemini CLI 설치 실패");
      }
    } catch (error) {
      console.error("설치 오류:", error);
      setInstallProgress("설치 중 오류 발생");
    } finally {
      setIsInstalling(false);
    }
  };

  const saveNewApiKey = async () => {
    if (!apiKey.trim()) {
      setKeyValidation({ status: "invalid", message: "API 키를 입력해주세요" });
      return;
    }

    const isValid = await validateApiKey(apiKey.trim());
    if (isValid) {
      setApiKeyStatus("found");
    }
  };

  const openGoogleAiStudio = () => {
    if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
      import("@tauri-apps/plugin-shell").then(({ Command }) => {
        Command.create("sh", [
          "-c",
          "open https://aistudio.google.com/apikey",
        ]).execute();
      });
    }
  };

  const canProceed = cliStatus === "found" && apiKeyStatus === "found";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full">
        <h1 className="text-2xl font-bold text-center mb-8">
          Gemini Desktop 설정
        </h1>

        {/* CLI 상태 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Gemini CLI</h2>
            {cliStatus === "checking" && (
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            )}
            {cliStatus === "found" && (
              <Check className="text-green-500" size={20} />
            )}
            {cliStatus === "not-found" && (
              <X className="text-red-500" size={20} />
            )}
          </div>

          {cliStatus === "not-found" && (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-red-700 mb-3">
                Gemini CLI가 설치되어 있지 않습니다.
              </p>
              {isInstalling ? (
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    {installProgress}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full animate-pulse"
                      style={{ width: "50%" }}
                    ></div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={installGeminiCli}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  <Download size={16} />
                  <span>자동 설치</span>
                </button>
              )}
            </div>
          )}

          {cliStatus === "found" && (
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <p className="text-green-700">
                ✅ Gemini CLI가 설치되어 있습니다.
              </p>
            </div>
          )}
        </div>

        {/* API 키 상태 */}
        {cliStatus === "found" && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">API 키 확인</h2>
              {apiKeyStatus === "checking" && (
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              )}
              {apiKeyStatus === "found" && (
                <Check className="text-green-500" size={20} />
              )}
              {apiKeyStatus === "not-found" && (
                <X className="text-red-500" size={20} />
              )}
            </div>

            {apiKeyStatus === "checking" && (
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-blue-700">
                  기존 API 키 설정을 확인하는 중...
                </p>
              </div>
            )}

            {apiKeyStatus === "found" && (
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <div className="flex items-center space-x-2 text-green-700 mb-3">
                  <Check size={16} />
                  <span className="font-medium">
                    API 키가 이미 설정되어 있습니다!
                  </span>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={onSetupComplete}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
                  >
                    바로 채팅하러 가기
                  </button>
                  <button
                    onClick={() => setApiKeyStatus("input")}
                    className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Settings size={16} />
                    <span>API 키 재설정</span>
                  </button>
                </div>
              </div>
            )}

            {(apiKeyStatus === "not-found" || apiKeyStatus === "input") && (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                  <p className="text-yellow-700 mb-3">API 키를 설정해주세요.</p>
                  <button
                    onClick={openGoogleAiStudio}
                    className="flex items-center space-x-1 text-blue-500 hover:text-blue-600 text-sm"
                  >
                    <ExternalLink size={16} />
                    <span>Google AI Studio에서 키 발급받기</span>
                  </button>
                </div>

                <div>
                  <label
                    htmlFor="api-key"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    API 키 입력
                  </label>
                  <input
                    id="api-key"
                    type="password"
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setKeyValidation({ status: "idle" });
                    }}
                    placeholder="AIza... 형태의 API 키를 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {keyValidation.message && (
                    <div
                      className={`flex items-center space-x-2 mt-2 text-sm ${
                        keyValidation.status === "valid"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {keyValidation.status === "valid" ? (
                        <Check size={16} />
                      ) : (
                        <X size={16} />
                      )}
                      <span>{keyValidation.message}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={saveNewApiKey}
                  disabled={!apiKey.trim() || isValidatingKey}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isValidatingKey ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>검증 중...</span>
                    </>
                  ) : (
                    <span>API 키 설정 완료</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 완료 버튼 */}
        {canProceed && (
          <div className="text-center">
            <button
              onClick={onSetupComplete}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
            >
              채팅 시작하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
