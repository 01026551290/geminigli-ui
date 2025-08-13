/* eslint-disable */

// 웹 환경 감지 - Tauri 환경 여부를 더 정확히 확인
const isWeb =
  typeof window !== "undefined" &&
  !(window as any).__TAURI__ &&
  !(window as any).__TAURI_INTERNALS__;

if (typeof window !== "undefined") {
  console.log("Environment check:", {
    hasWindow: typeof window !== "undefined",
    hasTauri: !!(window as any).__TAURI__,
    hasTauriInternals: !!(window as any).__TAURI_INTERNALS__,
    isWeb: isWeb,
  });
}

// 운영체제 감지
export function detectOS(): "macos" | "windows" | "linux" {
  if (isWeb) {
    // 웹 환경에서는 User Agent로 OS 감지
    const userAgent = navigator.userAgent;
    if (userAgent.includes("Mac")) return "macos";
    if (userAgent.includes("Windows")) return "windows";
    return "linux";
  }

  try {
    // Tauri 환경에서 플랫폼 감지
    const { platform } = require("@tauri-apps/plugin-os");
    const platformName = platform();
    if (platformName === "darwin") return "macos";
    if (platformName === "win32") return "windows";
    return "linux";
  } catch {
    return "macos"; // 기본값
  }
}

export async function hasGeminiCli() {
  console.log("hasGeminiCli called - isWeb:", isWeb);

  if (isWeb) {
    console.log("Web environment - CLI detection skipped");
    return false;
  }

  console.log("=== Starting CLI detection ===");

  try {
    const { Command } = require("@tauri-apps/plugin-shell");
    
    // Windows 환경에서 CLI 확인
    const os = detectOS();
    if (os === "windows") {
      console.log("Windows detected - checking CLI with multiple methods");
      
      // 1) gemini 명령어 직접 실행 시도
      try {
        const directResult = await Command.create("gemini", ["--version"]).execute();
        if (directResult.code === 0) {
          console.log("✅ gemini command found via direct execution");
          return true;
        }
      } catch (error) {
        console.log("Direct gemini command failed:", error);
      }

      // 2) npx를 통한 실행 시도
      try {
        const npxResult = await Command.create("npx", ["@google/gemini-cli", "--version"]).execute();
        if (npxResult.code === 0) {
          console.log("✅ gemini CLI found via npx");
          return true;
        }
      } catch (error) {
        console.log("npx gemini command failed:", error);
      }

      // 3) where 명령어로 경로 확인
      try {
        const whereResult = await Command.create("cmd", ["/C", "where", "gemini"]).execute();
        if (whereResult.code === 0 && whereResult.stdout) {
          console.log("✅ gemini CLI found at:", whereResult.stdout);
          return true;
        }
      } catch (error) {
        console.log("where command failed:", error);
      }

      console.log("❌ Gemini CLI not found on Windows");
      return false;
    }

    // macOS/Linux 환경에서 CLI 확인
    try {
      const result = await Command.create("which", ["gemini"]).execute();
      if (result.code === 0 && result.stdout) {
        console.log("✅ gemini CLI found at:", result.stdout);
        return true;
      }
    } catch (error) {
      console.log("which command failed:", error);
    }

    // Homebrew 경로 확인 (macOS)
    if (os === "macos") {
      try {
        const brewResult = await Command.create("/opt/homebrew/bin/gemini", ["--version"]).execute();
        if (brewResult.code === 0) {
          console.log("✅ gemini CLI found in Homebrew path");
          return true;
        }
      } catch (error) {
        console.log("Homebrew path check failed:", error);
      }
    }

    console.log("❌ Gemini CLI not found");
    return false;
  } catch (error) {
    console.log("CLI detection error:", error);
    return false;
  }
}

export async function installGeminiCli(os: "mac" | "win" | "linux") {
  if (isWeb) {
    console.log("Web environment - CLI installation not supported");
    return false;
  }

  try {
    const { Command } = require("@tauri-apps/plugin-shell");
    console.log(`Installing Gemini CLI for ${os}...`);

    // Windows 환경용 설치 로직
    if (os === "win") {
      console.log("Windows detected - trying multiple installation methods");
      
      // 1) npm 글로벌 설치 시도
      try {
        console.log("Trying npm install...");
        const npmResult = await Command.create("cmd", [
          "/C",
          "npm",
          "install",
          "-g",
          "@google/gemini-cli"
        ]).execute();
        console.log("npm install result:", npmResult);
        if (npmResult.code === 0) {
          console.log("✅ npm install successful");
          return true;
        }
      } catch (error) {
        console.log("npm install failed:", error);
      }

      // 2) PowerShell 통해 npm 시도
      try {
        console.log("Trying PowerShell npm install...");
        const psResult = await Command.create("powershell", [
          "-Command",
          "npm install -g @google/gemini-cli"
        ]).execute();
        console.log("PowerShell npm result:", psResult);
        if (psResult.code === 0) {
          console.log("✅ PowerShell npm install successful");
          return true;
        }
      } catch (error) {
        console.log("PowerShell npm install failed:", error);
      }

      // 3) Chocolatey 시도 (있다면)
      try {
        console.log("Trying Chocolatey install...");
        const chocoResult = await Command.create("choco", [
          "install",
          "nodejs",
          "-y"
        ]).execute();
        if (chocoResult.code === 0) {
          // Node.js 설치 후 npm으로 다시 시도
          const npmAfterChoco = await Command.create("npm", [
            "install",
            "-g",
            "@google/gemini-cli"
          ]).execute();
          if (npmAfterChoco.code === 0) {
            console.log("✅ Chocolatey + npm install successful");
            return true;
          }
        }
      } catch (error) {
        console.log("Chocolatey install failed:", error);
      }

      // 4) 직접 다운로드 시도
      try {
        console.log("Trying direct npx execution...");
        const npxResult = await Command.create("npx", [
          "@google/gemini-cli",
          "--version"
        ]).execute();
        console.log("npx result:", npxResult);
        if (npxResult.code === 0) {
          console.log("✅ npx execution successful");
          return true;
        }
      } catch (error) {
        console.log("npx execution failed:", error);
      }

      console.log("❌ All Windows installation methods failed");
      return false;
    }

    // macOS/Linux 환경용 설치 로직
    // 1) npm 글로벌 설치 시도 (크로스플랫폼)
    try {
      console.log("Trying npm install...");
      const npmResult = await Command.create("npm", [
        "install",
        "-g",
        "@google/gemini-cli",
      ]).execute();
      console.log("npm install result:", npmResult);
      if (npmResult.code === 0) {
        console.log("✅ npm install successful");
        return true;
      }
    } catch (error) {
      console.log("npm install failed:", error);
    }

    // 2) mac/linux면 brew 시도
    if (os === "mac" || os === "linux") {
      try {
        console.log("Trying brew install...");
        const brewResult = await Command.create("brew", [
          "install",
          "gemini-cli",
        ]).execute();
        console.log("brew install result:", brewResult);
        if (brewResult.code === 0) {
          console.log("✅ brew install successful");
          return true;
        }
      } catch (error) {
        console.log("brew install failed:", error);
      }
    }

    // 3) 마지막 수단: npx 즉시 실행
    try {
      console.log("Trying npx execution...");
      const npxResult = await Command.create("npx", [
        "@google/gemini-cli",
        "--version",
      ]).execute();
      console.log("npx result:", npxResult);
      if (npxResult.code === 0) {
        console.log("✅ npx execution successful");
        return true;
      }
    } catch (error) {
      console.log("npx execution failed:", error);
    }

    console.log("❌ All installation methods failed");
    return false;
  } catch (error) {
    console.log("CLI installation error:", error);
    return false;
  }
}
