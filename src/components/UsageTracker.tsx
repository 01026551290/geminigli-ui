"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, AlertTriangle, CheckCircle } from "lucide-react";

interface UsageData {
  requests: number;
  dailyLimit: number;
  rpmLimit: number; // 분당 요청 제한
  lastReset: number; // timestamp
  minuteRequests: number; // 현재 분의 요청 수
  lastMinute: number; // 마지막 요청한 분
}

interface WindowWithApiUsage extends Window {
  incrementApiUsage?: () => Promise<void>;
  setUsageToLimit?: () => Promise<void>;
}

export default function UsageTracker() {
  const [usage, setUsage] = useState<UsageData>({
    requests: 0,
    dailyLimit: 1500, // Google AI Studio 실제 일일 한도
    rpmLimit: 60, // 분당 60회 제한
    lastReset: Date.now(),
    minuteRequests: 0,
    lastMinute: new Date().getMinutes(),
  });

  const [isVisible, setIsVisible] = useState(false);

  const saveUsageData = useCallback(async (newUsage: UsageData) => {
    try {
      if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
        const { Store } = await import("@tauri-apps/plugin-store");
        const store = await Store.load("usage.json");
        await store.set("usage", newUsage);
        await store.save();
      }
    } catch (error) {
      console.error("사용량 데이터 저장 오류:", error);
    }
  }, []);

  const isNewDay = useCallback((timestamp: number) => {
    const lastDate = new Date(timestamp);
    const currentDate = new Date();
    return (
      lastDate.getDate() !== currentDate.getDate() ||
      lastDate.getMonth() !== currentDate.getMonth() ||
      lastDate.getFullYear() !== currentDate.getFullYear()
    );
  }, []);

  const resetDailyUsage = useCallback(async () => {
    const newUsage: UsageData = {
      requests: 0,
      dailyLimit: 1500,
      rpmLimit: 60,
      lastReset: Date.now(),
      minuteRequests: 0,
      lastMinute: new Date().getMinutes(),
    };
    setUsage(newUsage);
    await saveUsageData(newUsage);
  }, [saveUsageData]);

  const loadUsageData = useCallback(async () => {
    try {
      if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
        const { Store } = await import("@tauri-apps/plugin-store");
        const store = await Store.load("usage.json");
        const savedUsage = await store.get("usage");

        if (savedUsage) {
          const usageData = savedUsage as UsageData;
          // 하루가 지났으면 리셋
          if (isNewDay(usageData.lastReset)) {
            await resetDailyUsage();
          } else {
            setUsage(usageData);
          }
        }
      }
    } catch (error) {
      console.error("사용량 데이터 로드 오류:", error);
    }
  }, [isNewDay, resetDailyUsage]);

  const checkDailyReset = useCallback(() => {
    if (isNewDay(usage.lastReset)) {
      resetDailyUsage();
    }
  }, [usage.lastReset, isNewDay, resetDailyUsage]);

  const setUsageToLimit = useCallback(async () => {
    const newUsage: UsageData = {
      ...usage,
      requests: Math.max(usage.dailyLimit - 10, usage.requests), // 한도에서 10개 정도 여유를 둠
    };
    setUsage(newUsage);
    await saveUsageData(newUsage);
  }, [usage, saveUsageData]);

  const incrementUsage = useCallback(async () => {
    const currentMinute = new Date().getMinutes();

    // 새로운 분이 시작되면 분당 카운터 리셋
    const minuteRequests =
      currentMinute === usage.lastMinute ? usage.minuteRequests + 1 : 1;

    const newUsage: UsageData = {
      ...usage,
      requests: usage.requests + 1,
      minuteRequests,
      lastMinute: currentMinute,
    };
    setUsage(newUsage);
    await saveUsageData(newUsage);
  }, [usage, saveUsageData]);

  useEffect(() => {
    loadUsageData();

    // 매 시간마다 체크 (자정에 리셋)
    const interval = setInterval(checkDailyReset, 60000);
    return () => clearInterval(interval);
  }, [loadUsageData, checkDailyReset]);

  const usagePercent = Math.min((usage.requests / usage.dailyLimit) * 100, 100);
  const remainingRequests = Math.max(usage.dailyLimit - usage.requests, 0);
  const rpmPercent = Math.min(
    (usage.minuteRequests / usage.rpmLimit) * 100,
    100
  );
  const remainingRpm = Math.max(usage.rpmLimit - usage.minuteRequests, 0);

  const getStatusColor = () => {
    if (usagePercent >= 90) return "text-red-600 bg-red-50 border-red-200";
    if (usagePercent >= 70)
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-green-600 bg-green-50 border-green-200";
  };

  const getBarColor = () => {
    if (usagePercent >= 90) return "bg-red-500";
    if (usagePercent >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusIcon = () => {
    if (usagePercent >= 90) return <AlertTriangle size={16} />;
    if (usagePercent >= 70) return <BarChart3 size={16} />;
    return <CheckCircle size={16} />;
  };

  const getRpmBarColor = () => {
    if (rpmPercent >= 80) return "bg-red-500";
    if (rpmPercent >= 60) return "bg-yellow-500";
    return "bg-blue-500";
  };

  // 전역에서 사용할 수 있도록 window 객체에 함수 등록
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as WindowWithApiUsage).incrementApiUsage = incrementUsage;
      (window as WindowWithApiUsage).setUsageToLimit = setUsageToLimit;
    }
  }, [incrementUsage, setUsageToLimit]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed top-4 right-4 bg-white shadow-lg rounded-lg p-2 hover:shadow-xl transition-shadow z-50"
      >
        <BarChart3 size={20} className="text-gray-600" />
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 bg-white shadow-xl rounded-lg p-4 w-80 z-50 border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <BarChart3 size={18} className="text-gray-700" />
          <h3 className="font-semibold text-gray-800">API 사용량</h3>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 text-xl"
        >
          ×
        </button>
      </div>

      <div className={`rounded-lg p-3 border ${getStatusColor()}`}>
        <div className="flex items-center space-x-2 mb-2">
          {getStatusIcon()}
          <span className="font-medium">
            {usage.requests} / {usage.dailyLimit} 요청 (일일)
          </span>
        </div>

        {/* 일일 프로그레스 바 */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getBarColor()}`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>

        <div className="flex justify-between text-sm mb-3">
          <span>잔여: {remainingRequests}회</span>
          <span>{usagePercent.toFixed(1)}%</span>
        </div>

        {/* 분당 요청 수 표시 */}
        <div className="border-t pt-2">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">분당 요청</span>
            <span
              className={
                remainingRpm < 10 ? "text-red-600 font-medium" : "text-gray-700"
              }
            >
              {usage.minuteRequests} / {usage.rpmLimit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${getRpmBarColor()}`}
              style={{ width: `${rpmPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        <p>• 일일 한도: 1,500회, 분당 한도: 60회</p>
        <p>• 분당 카운터는 매분 자동 리셋</p>
        <p>• 429 에러 발생시 한도 초과 상태</p>
        <button
          onClick={() => window.open("https://aistudio.google.com/", "_blank")}
          className="text-blue-500 hover:text-blue-700 mt-1"
        >
          → AI Studio에서 실제 사용량 확인
        </button>
      </div>
    </div>
  );
}
