"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { detectOS, hasGeminiCli, installGeminiCli } from "../utils/cli";
import { writeGeminiEnvInAppData } from "..//utils/api-key";
import { quickCallTest } from "../utils/gemini-test";

export type HealthState =
  | "checking"
  | "needs_cli"
  | "needs_key"
  | "ready"
  | "error";

export function useGeminiHealth() {
  const [state, setState] = useState<HealthState>("checking");
  const [detail, setDetail] = useState<string>("");
  const [os, setOs] = useState<"mac" | "win" | "linux">("mac");
  const [busy, setBusy] = useState(false);

  const recheck = useCallback(async () => {
    console.log("=== Starting Gemini health check ===");
    setState("checking");
    setDetail("");

    try {
      const installed = await hasGeminiCli();
      console.log("CLI installation check result:", installed);

      if (!installed) {
        console.log("CLI not installed, showing needs_cli screen");
        setState("needs_cli");
        setDetail(
          "Gemini CLI를 찾을 수 없습니다. /opt/homebrew/bin/gemini 경로를 확인해주세요."
        );
        return;
      }

      console.log("CLI found, testing API connection...");
      const r = await quickCallTest("Say 'pong' only.");
      console.log("API test result:", r);

      if (r.ok) {
        console.log("All checks passed, setting ready state");
        setState("ready");
        setDetail("모든 설정이 완료되었습니다!");
        return;
      }

      if (r.reason === "AUTH") {
        console.log("Authentication needed, showing needs_key screen");
        setState("needs_key");
        setDetail(r.detail ?? "API 키 인증이 필요합니다.");
        return;
      }

      console.log("Setting error state:", r.reason, r.detail);
      setState(r.reason === "NO_CLI" ? "needs_cli" : "error");
      setDetail(r.detail ?? "알 수 없는 오류가 발생했습니다.");
    } catch (error) {
      console.error("Health check error:", error);
      setState("error");
      setDetail(`환경 점검 중 오류: ${error}`);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const detectedOs = detectOS(); // 이제 동기 함수
      console.log("OS detected:", detectedOs);

      // 타입 변환: "macos" -> "mac", "windows" -> "win"
      let mappedOs: "mac" | "win" | "linux";
      if (detectedOs === "macos") {
        mappedOs = "mac";
      } else if (detectedOs === "windows") {
        mappedOs = "win";
      } else {
        mappedOs = "linux";
      }

      setOs(mappedOs);
      await recheck();
    })();
  }, [recheck]);

  const installCli = useCallback(async () => {
    setBusy(true);
    try {
      const ok = await installGeminiCli(os);
      if (!ok) {
        setState("needs_cli");
        return false;
      }
      await recheck();
      return true;
    } finally {
      setBusy(false);
    }
  }, [os, recheck]);

  const saveApiKey = useCallback(
    async (apiKey: string) => {
      setBusy(true);
      try {
        await writeGeminiEnvInAppData(apiKey);
        await recheck();
        return true;
      } finally {
        setBusy(false);
      }
    },
    [recheck]
  );

  const flags = useMemo(
    () => ({
      isChecking: state === "checking",
      isReady: state === "ready",
      needsCli: state === "needs_cli",
      needsKey: state === "needs_key",
      hasError: state === "error",
      busy,
      os,
    }),
    [state, busy, os]
  );

  console.log("flags", flags);

  return { state, detail, ...flags, recheck, installCli, saveApiKey };
}
