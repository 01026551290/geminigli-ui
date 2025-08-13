# Gemini Desktop - 빌드 가이드

이 문서는 macOS와 Windows용 Gemini Desktop 앱을 빌드하고 배포하는 방법을 설명합니다.

## 사전 요구사항

### macOS에서 빌드하기

1. **Rust 설치**

   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source $HOME/.cargo/env
   ```

2. **Tauri CLI 설치**

   ```bash
   cargo install tauri-cli
   ```

3. **Node.js 의존성 설치**
   ```bash
   pnpm install
   ```

### Windows 크로스 컴파일 설정 (macOS에서)

1. **Windows 타겟 추가**

   ```bash
   rustup target add x86_64-pc-windows-msvc
   ```

2. **필요한 도구들 설치**
   ```bash
   # Homebrew로 설치
   brew install mingw-w64
   ```

## 빌드 명령어

### 1. macOS용 빌드

```bash
# Universal Binary (Intel + Apple Silicon)
pnpm run tauri:build:mac
```

### 2. Windows용 빌드 (macOS에서 크로스 컴파일)

```bash
pnpm run tauri:build:windows
```

### 3. 모든 플랫폼 빌드

```bash
pnpm run tauri:build:all
```

### 4. 개발 모드 실행

```bash
pnpm run tauri:dev
```

## 빌드 결과물

빌드가 완료되면 다음 위치에서 설치 파일을 찾을 수 있습니다:

### macOS

- **위치**: `src-tauri/target/universal-apple-darwin/release/bundle/`
- **파일 형식**:
  - `.dmg` - 일반적인 macOS 설치 파일
  - `.app` - 앱 번들 (Applications 폴더에 직접 복사 가능)

### Windows

- **위치**: `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/`
- **파일 형식**:
  - `.msi` - Windows 설치 파일

## 배포 전 체크리스트

### 1. 버전 업데이트

- [ ] `package.json`의 version 업데이트
- [ ] `src-tauri/tauri.conf.json`의 version 업데이트
- [ ] `src-tauri/Cargo.toml`의 version 업데이트

### 2. 아이콘 확인

- [ ] macOS: `src-tauri/icons/icon.icns`
- [ ] Windows: `src-tauri/icons/icon.ico`

### 3. 앱 정보 확인

- [ ] 앱 이름, 설명, 저작권 정보
- [ ] Bundle identifier 고유성 확인

### 4. 테스트

- [ ] 개발 모드에서 모든 기능 테스트
- [ ] 빌드된 앱에서 기능 테스트

## 자동화된 빌드 (GitHub Actions)

GitHub Actions를 사용한 자동 빌드 설정도 가능합니다. `.github/workflows/build.yml` 파일을 생성하여 푸시할 때마다 자동으로 빌드하도록 설정할 수 있습니다.

## 문제 해결

### Windows 크로스 컴파일 오류

- `mingw-w64` 설치 확인
- Rust 타겟이 올바르게 추가되었는지 확인: `rustup target list --installed`

### macOS 코드 사이닝 오류

- 개발 빌드의 경우 코드 사이닝을 비활성화: `tauri build --debug`
- 배포용 빌드는 Apple Developer Program 가입 필요

### 의존성 오류

- `pnpm install` 다시 실행
- Node.js 버전 확인 (18+ 권장)
- Rust 및 Tauri CLI 최신 버전 사용

## 추가 리소스

- [Tauri 공식 문서](https://tauri.app/)
- [Tauri 빌드 가이드](https://tauri.app/v1/guides/building/)
- [크로스 컴파일 가이드](https://tauri.app/v1/guides/building/cross-platform)
