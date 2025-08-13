import { platform } from "@tauri-apps/plugin-os";

export function geminiProgramName() {
  const osType = platform();
  return osType === "windows" ? "gemini.cmd" : "gemini";
}
