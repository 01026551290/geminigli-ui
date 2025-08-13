"use client";

interface SetupPageProps {
  readonly onSetupComplete: () => void;
}

export default function SetupPage({ onSetupComplete }: SetupPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full">
        <h1 className="text-2xl font-bold text-center mb-8">
          Gemini Desktop 설정
        </h1>

        <div className="text-center">
          <p className="mb-4">간단한 테스트 SetupPage입니다.</p>
          <button
            onClick={onSetupComplete}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
          >
            설정 완료
          </button>
        </div>
      </div>
    </div>
  );
}
