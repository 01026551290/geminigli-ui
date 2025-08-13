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
      console.log("Windows detected - comprehensive CLI detection");
      
      // 1) 다양한 gemini 명령어 실행 시도
      const geminiCommands = [
        ["gemini", ["--version"]],
        ["gemini.cmd", ["--version"]],
        ["%APPDATA%\\npm\\gemini.cmd", ["--version"]],
        ["%APPDATA%\\npm\\gemini", ["--version"]],
      ];

      for (const [command, args] of geminiCommands) {
        try {
          console.log(`Trying command: ${command} ${(args as string[]).join(' ')}`);
          const result = await Command.create(command as string, args as string[]).execute();
          if (result.code === 0) {
            console.log(`✅ gemini CLI found with command: ${command}`);
            console.log("Output:", result.stdout);
            return true;
          }
        } catch (error) {
          console.log(`Command ${command} failed:`, error);
        }
      }

      // 2) npm 전역 패키지 경로에서 직접 확인
      try {
        console.log("Checking npm global packages...");
        const npmListResult = await Command.create("npm", ["list", "-g", "@google/gemini-cli", "--depth=0"]).execute();
        console.log("npm list result:", npmListResult);
        
        if (npmListResult.stdout && npmListResult.stdout.includes("@google/gemini-cli")) {
          console.log("✅ gemini CLI found in npm global packages");
          
          // npm 전역 bin 경로 확인
          try {
            const npmBinResult = await Command.create("npm", ["bin", "-g"]).execute();
            if (npmBinResult.code === 0 && npmBinResult.stdout) {
              const binPath = npmBinResult.stdout.trim();
              console.log("npm global bin path:", binPath);
              
              // 해당 경로의 gemini 실행 시도
              const geminiBinPath = `${binPath}\\gemini.cmd`;
              try {
                const binExecResult = await Command.create(geminiBinPath, ["--version"]).execute();
                if (binExecResult.code === 0) {
                  console.log("✅ gemini CLI executable found in npm bin path");
                  return true;
                }
              } catch (error) {
                console.log("npm bin path execution failed:", error);
              }
            }
          } catch (error) {
            console.log("npm bin path check failed:", error);
          }
          
          return true; // npm list에서 발견했으므로 설치되어 있다고 판단
        }
      } catch (error) {
        console.log("npm list check failed:", error);
      }

      // 3) npx를 통한 실행 시도 (개선된 버전)
      try {
        console.log("Trying npx execution...");
        const npxResult = await Command.create("npx", ["--yes", "@google/gemini-cli", "--version"]).execute();
        console.log("npx result:", npxResult);
        if (npxResult.code === 0) {
          console.log("✅ gemini CLI available via npx");
          return true;
        }
      } catch (error) {
        console.log("npx execution failed:", error);
      }

      // 4) PowerShell을 통한 확인
      try {
        console.log("Trying PowerShell detection...");
        const psCommand = `
          try {
            $geminiPath = Get-Command gemini -ErrorAction SilentlyContinue
            if ($geminiPath) {
              Write-Output "FOUND: $($geminiPath.Source)"
              gemini --version
              exit 0
            } else {
              Write-Output "NOT_FOUND"
              exit 1
            }
          } catch {
            Write-Output "ERROR: $_"
            exit 1
          }
        `;
        
        const psResult = await Command.create("powershell", ["-Command", psCommand]).execute();
        console.log("PowerShell result:", psResult);
        
        if (psResult.code === 0 && psResult.stdout && psResult.stdout.includes("FOUND:")) {
          console.log("✅ gemini CLI found via PowerShell Get-Command");
          return true;
        }
      } catch (error) {
        console.log("PowerShell detection failed:", error);
      }

      // 5) where/which 명령어들 시도
      const searchCommands = [
        ["where", ["gemini"]],
        ["where", ["gemini.cmd"]],
        ["cmd", ["/C", "where", "gemini"]],
        ["cmd", ["/C", "where", "gemini.cmd"]]
      ];

      for (const [command, args] of searchCommands) {
        try {
          console.log(`Trying search command: ${command} ${(args as string[]).join(' ')}`);
          const result = await Command.create(command as string, args as string[]).execute();
          if (result.code === 0 && result.stdout && result.stdout.trim()) {
            console.log(`✅ gemini CLI found at: ${result.stdout.trim()}`);
            return true;
          }
        } catch (error) {
          console.log(`Search command ${command} failed:`, error);
        }
      }

      // 6) 일반적인 설치 경로들 직접 확인
      const commonPaths = [
        "%APPDATA%\\npm\\node_modules\\@google\\gemini-cli\\bin\\gemini.js",
        "%ProgramFiles%\\nodejs\\node_modules\\@google\\gemini-cli\\bin\\gemini.js",
        "%ProgramFiles(x86)%\\nodejs\\node_modules\\@google\\gemini-cli\\bin\\gemini.js",
      ];

      for (const path of commonPaths) {
        try {
          console.log(`Checking common path: ${path}`);
          const result = await Command.create("node", [path, "--version"]).execute();
          if (result.code === 0) {
            console.log(`✅ gemini CLI found at common path: ${path}`);
            return true;
          }
        } catch (error) {
          console.log(`Common path ${path} failed:`, error);
        }
      }

      console.log("❌ Gemini CLI not found with any Windows detection method");
      return false;
    }

    // macOS/Linux 환경에서 CLI 확인 (기존 로직 개선)
    console.log(`${os} detected - checking CLI`);
    
    // 1) 직접 명령어 실행
    try {
      const result = await Command.create("gemini", ["--version"]).execute();
      if (result.code === 0) {
        console.log("✅ gemini CLI found via direct command");
        return true;
      }
    } catch (error) {
      console.log("Direct gemini command failed:", error);
    }

    // 2) which 명령어로 경로 확인
    try {
      const result = await Command.create("which", ["gemini"]).execute();
      if (result.code === 0 && result.stdout) {
        console.log("✅ gemini CLI found at:", result.stdout);
        return true;
      }
    } catch (error) {
      console.log("which command failed:", error);
    }

    // 3) 일반적인 macOS 경로들 확인
    const macPaths = [
      "/opt/homebrew/bin/gemini",
      "/usr/local/bin/gemini",
      "/opt/homebrew/lib/node_modules/@google/gemini-cli/bin/gemini.js",
      "/usr/local/lib/node_modules/@google/gemini-cli/bin/gemini.js"
    ];

    for (const path of macPaths) {
      try {
        console.log(`Checking path: ${path}`);
        let result;
        if (path.endsWith('.js')) {
          result = await Command.create("node", [path, "--version"]).execute();
        } else {
          result = await Command.create(path, ["--version"]).execute();
        }
        
        if (result.code === 0) {
          console.log(`✅ gemini CLI found at: ${path}`);
          return true;
        }
      } catch (error) {
        console.log(`Path ${path} failed:`, error);
      }
    }

    // 4) npx 확인
    try {
      const result = await Command.create("npx", ["@google/gemini-cli", "--version"]).execute();
      if (result.code === 0) {
        console.log("✅ gemini CLI available via npx");
        return true;
      }
    } catch (error) {
      console.log("npx check failed:", error);
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

    // Windows 환경용 설치 로직 (대폭 개선)
    if (os === "win") {
      console.log("Windows detected - comprehensive installation process");
      
      // 0) 먼저 Node.js와 npm이 있는지 확인
      try {
        const nodeCheck = await Command.create("node", ["--version"]).execute();
        const npmCheck = await Command.create("npm", ["--version"]).execute();
        
        if (nodeCheck.code !== 0 || npmCheck.code !== 0) {
          console.log("❌ Node.js or npm not found. Installation cannot proceed.");
          return false;
        }
        
        console.log("✅ Node.js and npm found");
        console.log("Node version:", nodeCheck.stdout?.trim());
        console.log("npm version:", npmCheck.stdout?.trim());
      } catch (error) {
        console.log("Node.js/npm check failed:", error);
        return false;
      }

      // 1) 표준 npm 글로벌 설치 시도
      try {
        console.log("Trying standard npm global install...");
        const npmResult = await Command.create("npm", [
          "install", "-g", "@google/gemini-cli"
        ]).execute();
        
        console.log("npm install result:", npmResult);
        console.log("Exit code:", npmResult.code);
        console.log("stdout:", npmResult.stdout);
        console.log("stderr:", npmResult.stderr);
        
        if (npmResult.code === 0) {
          console.log("✅ npm install successful - verifying...");
          
          // 설치 후 즉시 확인
          const verification = await hasGeminiCli();
          if (verification) {
            console.log("✅ Installation verified successfully");
            return true;
          } else {
            console.log("⚠️ Installation completed but verification failed");
          }
        }
      } catch (error) {
        console.log("npm install failed:", error);
      }

      // 2) cmd를 통한 npm 설치 시도
      try {
        console.log("Trying npm install via cmd...");
        const cmdResult = await Command.create("cmd", [
          "/C", "npm", "install", "-g", "@google/gemini-cli"
        ]).execute();
        
        console.log("cmd npm result:", cmdResult);
        if (cmdResult.code === 0) {
          console.log("✅ cmd npm install successful");
          const verification = await hasGeminiCli();
          if (verification) return true;
        }
      } catch (error) {
        console.log("cmd npm install failed:", error);
      }

      // 3) PowerShell 관리자 권한으로 시도
      try {
        console.log("Trying PowerShell installation...");
        const psScript = `
          try {
            Write-Host "Installing @google/gemini-cli globally..."
            npm install -g @google/gemini-cli
            if ($LASTEXITCODE -eq 0) {
              Write-Host "Installation completed successfully"
              Write-Host "Verifying installation..."
              gemini --version
              if ($LASTEXITCODE -eq 0) {
                Write-Host "SUCCESS: gemini CLI is working"
                exit 0
              } else {
                Write-Host "WARNING: Installation completed but gemini command not working"
                exit 0
              }
            } else {
              Write-Host "ERROR: Installation failed"
              exit 1
            }
          } catch {
            Write-Host "ERROR: $($_.Exception.Message)"
            exit 1
          }
        `;
        
        const psResult = await Command.create("powershell", [
          "-ExecutionPolicy", "Bypass",
          "-Command", psScript
        ]).execute();
        
        console.log("PowerShell result:", psResult);
        if (psResult.code === 0) {
          console.log("✅ PowerShell installation successful");
          const verification = await hasGeminiCli();
          if (verification) return true;
        }
      } catch (error) {
        console.log("PowerShell installation failed:", error);
      }

      // 4) 다양한 npm 설치 옵션들 시도
      const installVariants = [
        ["npm", ["install", "-g", "@google/gemini-cli", "--force"]],
        ["npm", ["install", "-g", "@google/gemini-cli", "--legacy-peer-deps"]],
        ["npm", ["install", "-g", "@google/gemini-cli", "--no-optional"]],
        ["yarn", ["global", "add", "@google/gemini-cli"]], // yarn이 있다면
      ];

      for (const [command, args] of installVariants) {
        try {
          console.log(`Trying installation variant: ${command} ${(args as string[]).join(' ')}`);
          const result = await Command.create(command, args).execute();
          
          if (result.code === 0) {
            console.log(`✅ ${command} installation successful`);
            const verification = await hasGeminiCli();
            if (verification) return true;
          }
        } catch (error) {
          console.log(`Installation variant ${command} failed:`, error);
        }
      }

      // 5) npx를 통한 직접 사용 (설치 없이)
      try {
        console.log("Trying npx direct usage...");
        const npxResult = await Command.create("npx", [
          "--yes", "@google/gemini-cli", "--version"
        ]).execute();
        
        if (npxResult.code === 0) {
          console.log("✅ npx direct usage successful");
          // npx로 작동한다면 설치된 것으로 간주
          return true;
        }
      } catch (error) {
        console.log("npx direct usage failed:", error);
      }

      console.log("❌ All Windows installation methods failed");
      return false;
    }

    // macOS/Linux 환경용 설치 로직 (기존 개선)
    console.log(`${os} detected - trying installation methods`);
    
    // 1) npm 글로벌 설치 시도
    try {
      console.log("Trying npm install...");
      const npmResult = await Command.create("npm", [
        "install", "-g", "@google/gemini-cli",
      ]).execute();
      console.log("npm install result:", npmResult);
      
      if (npmResult.code === 0) {
        console.log("✅ npm install successful");
        const verification = await hasGeminiCli();
        if (verification) return true;
      }
    } catch (error) {
      console.log("npm install failed:", error);
    }

    // 2) mac/linux면 brew 시도
    if (os === "mac" || os === "linux") {
      try {
        console.log("Trying brew install...");
        const brewResult = await Command.create("brew", [
          "install", "gemini-cli",
        ]).execute();
        console.log("brew install result:", brewResult);
        
        if (brewResult.code === 0) {
          console.log("✅ brew install successful");
          const verification = await hasGeminiCli();
          if (verification) return true;
        }
      } catch (error) {
        console.log("brew install failed:", error);
      }
    }

    // 3) sudo를 사용한 npm 설치 시도 (Unix 계열)
    if (os === "mac" || os === "linux") {
      try {
        console.log("Trying sudo npm install...");
        const sudoResult = await Command.create("sudo", [
          "npm", "install", "-g", "@google/gemini-cli"
        ]).execute();
        
        if (sudoResult.code === 0) {
          console.log("✅ sudo npm install successful");
          const verification = await hasGeminiCli();
          if (verification) return true;
        }
      } catch (error) {
        console.log("sudo npm install failed:", error);
      }
    }

    // 4) npx 확인
    try {
      console.log("Trying npx execution...");
      const npxResult = await Command.create("npx", [
        "@google/gemini-cli", "--version",
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
