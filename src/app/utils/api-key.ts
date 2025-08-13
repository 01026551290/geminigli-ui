import { appDataDir, join } from "@tauri-apps/api/path";
import { exists, create, writeTextFile } from "@tauri-apps/plugin-fs";

/**
 * ~/.gemini/.env 형태를 "앱 데이터 폴더"에 유사하게 만들고
 * gemini 실행 시 cwd를 그 폴더로 잡아 로컬 .env 를 로드하게 한다.
 * (CLI는 현재 디렉토리의 .gemini/.env 또는 홈의 ~/.gemini/.env 를 인식)
 */
export const GEMINI_ENV_DIR = ".gemini"; // 상대 경로

export async function writeGeminiEnvInAppData(key: string) {
  const base = await appDataDir(); // ~/Library/Application Support/<bundleId>/
  const dir = await join(base, ".gemini");
  const file = await join(dir, ".env");

  if (!(await exists(dir))) {
    await create(dir);
  }
  await writeTextFile(file, `GEMINI_API_KEY=${key}\n`);
}

/** 이 폴더를 cwd로 넘겨서 CLI가 .gemini/.env 를 자동 로드하도록 */
export async function geminiCwdOption() {
  const base = await appDataDir();
  return { cwd: base };
}
