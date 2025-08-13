# 🤖 Gemini Desktop

Google Gemini CLI를 위한 현대적인 데스크톱 인터페이스입니다.

![Gemini Desktop](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS-blue)
![Version](https://img.shields.io/github/v/release/01026551290/geminigli-ui)
![License](https://img.shields.io/github/license/01026551290/geminigli-ui)

## ✨ 주요 기능

- 🎯 **직관적인 GUI**: 명령줄 대신 편리한 데스크톱 인터페이스
- 💬 **대화 기록**: 이전 대화를 기억하는 인터랙티브 모드
- 📎 **파일 첨부**: 드래그 앤 드롭으로 코드 파일 분석
- ⚙️ **고급 설정**: Sandbox, MCP 서버, 확장 프로그램 지원
- 📊 **사용량 추적**: 실시간 API 사용량 모니터링
- 🌈 **마크다운 렌더링**: 코드 구문 강조 및 마크다운 지원
- 🔒 **보안**: 로컬 데이터 저장, API 키 안전 관리

## 📥 설치 방법

### Windows
1. [Releases](https://github.com/01026551290/geminigli-ui/releases) 페이지에서 최신 `.msi` 파일 다운로드
2. 다운로드한 파일 실행하여 설치
3. ⚠️ Windows 보안 경고가 나타나면 [보안 가이드](WINDOWS_SECURITY.md) 참조

### macOS
1. [Releases](https://github.com/01026551290/geminigli-ui/releases) 페이지에서 최신 `.dmg` 파일 다운로드
2. DMG 파일을 열고 Applications 폴더로 드래그
3. 첫 실행 시 "시스템 환경설정 > 보안 및 개인정보보호"에서 허용

## 🚀 시작하기

1. **앱 실행**: 설치 후 Gemini Desktop 실행
2. **CLI 설치**: 앱에서 Gemini CLI 자동 설치 (또는 수동 설치)
3. **API 키 설정**: [Google AI Studio](https://aistudio.google.com/app/apikey)에서 API 키 발급 후 입력
4. **채팅 시작**: 준비 완료! Gemini와 대화를 시작하세요

## 💡 사용법

### 기본 채팅
- 메시지 입력 후 Enter 또는 전송 버튼 클릭
- Shift+Enter로 줄바꿈
- 마크다운과 코드 구문 강조 지원

### 파일 첨부
- 파일 첨부 버튼 클릭 또는 드래그 앤 드롭
- 지원 형식: 코드 파일, 텍스트, 마크다운, JSON 등
- 여러 파일 동시 첨부 가능

### 대화 기록
- 대화 기록 관리에서 "대화 모드" 활성화
- 이전 대화 내용을 기억하는 연속 대화 가능
- 세션별 대화 기록 관리

### 고급 설정
- Sandbox 모드: 안전한 코드 실행 환경
- All Files: 프로젝트 전체 파일 컨텍스트 제공
- MCP 서버: Model Context Protocol 서버 연결
- 확장 프로그램: 추가 기능 확장

## 🔧 개발자 가이드

### 요구사항
- Node.js 18+
- Rust 1.70+
- pnpm

### 로컬 개발
```bash
# 저장소 클론
git clone https://github.com/01026551290/geminigli-ui.git
cd geminigli-ui

# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm run tauri:dev
```

### 빌드
```bash
# 현재 플랫폼용 빌드
pnpm run tauri:build

# macOS용 빌드
pnpm run tauri:build:mac

# Windows용 빌드 (Windows에서)
pnpm run tauri:build:windows
```

## 🛠️ 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Desktop**: Tauri v2, Rust
- **UI Components**: Lucide React
- **Markdown**: react-markdown, react-syntax-highlighter

## 📋 문제 해결

### Windows 보안 경고
- [Windows 보안 가이드](WINDOWS_SECURITY.md) 참조

### CLI 설치 실패
- Node.js 설치 확인: `node --version`
- 수동 설치: `npm install -g @google/gemini-cli`
- 권한 문제: PowerShell 관리자 권한으로 실행

### API 키 문제
- [Google AI Studio](https://aistudio.google.com/app/apikey)에서 키 재발급
- 키 형식 확인: `AIza...`로 시작
- 네트워크 연결 확인

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 🙏 감사의 말

- [Google Gemini](https://gemini.google.com/) - AI 모델 제공
- [Tauri](https://tauri.app/) - 크로스 플랫폼 데스크톱 프레임워크
- [Next.js](https://nextjs.org/) - React 프레임워크

---

**문제가 있나요?** [Issues](https://github.com/01026551290/geminigli-ui/issues)에 문의해주세요!
