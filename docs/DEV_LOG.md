# DEV_LOG — 개발 의사결정 기록

단순 작업 일지 아님. 문제 인식 → 시도 → 해결 → 트레이드오프 흐름으로 기록.

---

<!-- 예시 포맷:

## 2026-XX-XX | 작업 제목

**배경**
왜 이 작업이 필요했는지.

**해결 방법**
어떻게 해결했는지. 실패한 시도가 있으면 함께 기록.

**트레이드오프**
이 선택의 장단점.

**변경 파일**
- 파일명

**검증**
어떻게 확인했는지.

-->

## 2026-06-27 | Vercel OAuth 라우팅 및 PWA 아이콘 정리

**배경**
배포 환경에서 카카오 로그인 버튼이 백엔드 OAuth 주소로 연결되지 않았고, PWA manifest가 참조하는 기본 아이콘도 없어 브라우저 콘솔에 404가 발생했다.

**해결 방법**
`vercel.json`의 rewrite 목적지를 실제 Cloudtype 백엔드 주소로 연결했다. 추가로 `public/icon-192.png`, `public/icon-512.png`를 생성해 배포 환경에서 manifest 아이콘 경로가 비지 않도록 맞췄다.

**트레이드오프**
rewrite에 백엔드 주소를 직접 넣으면 배포 연결은 단순해지지만, 백엔드 주소가 바뀔 때 프론트 저장소에서도 함께 수정해야 한다. 반면 로그인 진입 경로와 `/api` 경로를 같은 기준으로 맞출 수 있어 운영상 추적은 쉬워진다.

**변경 파일**
- vercel.json
- public/icon-192.png
- public/icon-512.png

**검증**
- `npm.cmd run build`
- rewrite 경로 및 아이콘 파일 존재 여부 확인

## 2026-07-02 | iPhone 채팅 입력 확대 이슈 조사 및 후속 작업 계획

**배경**
배포된 iPhone 화면에서 채팅 입력창을 터치하면 키보드가 올라오면서 화면이 자동 확대되었다. 동시에 입력창 폰트 크기 보정 과정에서 전송 버튼이 약하게 보이거나 레이아웃 균형이 깨지는 문제가 함께 드러났다.

**해결 방법**
우선 채팅 입력창의 폰트 크기를 `16px`로 올리고 입력 영역 높이와 전송 버튼 크기를 함께 조정했다. 다만 배포 화면에서 하단 채팅 바 디자인이 이미 바뀐 것이 확인되어 최신 배포는 반영된 상태였고, 그럼에도 iPhone 확대가 계속되어 단순 캐시 문제가 아니라 iOS Safari/PWA 동작 특성 또는 입력 영역 레이아웃 문제로 판단했다.

**트레이드오프**
웹에서 `user-scalable=no` 같은 전역 확대 금지 방식은 iPhone에서 일관되게 동작하지 않을 수 있고 접근성에도 좋지 않다. 따라서 다음 세션에서는 프로젝트 전체 전역 차단이 아니라 채팅 입력 영역 구조를 iPhone 기준으로 다시 다듬는 방향으로 진행한다.

**변경 파일**
- src/pages/ChatRoomPage.tsx

**검증**
- `npm.cmd run build`
- 배포 iPhone 화면에서 하단 채팅 바 디자인 변경 반영 여부 확인
- 확인 결과: 디자인 변경은 반영되었으나 입력 포커스 시 자동 확대는 아직 남아 있음

## 2026-07-02 | 입력 영역 레이아웃 재조정 및 iOS 자동 확대 전체 대응

**배경**
채팅 입력창 `fontSize: 16px` 적용 후에도 iPhone 자동 확대가 남아 있었고, 다른 입력 화면(`ProfileEditPage`, `CreateMeetupPage`, `Step4Profile`)의 `fontSize`가 여전히 14~15px이어서 동일 현상이 발생 가능했다.

**해결 방법**
1. `ChatRoomPage.tsx` — 채팅 footer 입력 영역 레이아웃 재조정
   - `footer`: `padding` 단축속성 + `paddingBottom` 중복 제거 → 명시적 `paddingTop/Left/Right/Bottom` 분리
   - `footerIconButton`: `24×24` → `40×40` (Apple HIG 최소 터치 타겟 기준)
   - `inputWrap`: `height 42` → `44` (send button과 정렬)
   - `input`: `minWidth: 0` 추가, `lineHeight: '20px'` → `'1.4'` (상대값), `-webkit-appearance: none`
   - `sendButton`: `40×40` → `44×44`
2. `ProfileEditPage.tsx` — `input fontSize 15→16`, `textarea fontSize 14→16`
3. `CreateMeetupPage.tsx` — `input fontSize 15→16`
4. `onboarding/Step4Profile.tsx` — `input fontSize 15→16`, `select fontSize 15→16`

**트레이드오프**
iOS는 16px 미만 입력 필드에서 자동 확대를 발생시킨다. 전역으로 `user-scalable=no`를 걸면 접근성이 나빠지므로, 각 입력 필드의 `fontSize`를 16px로 맞추는 방식을 택했다. `WebkitAppearance: 'none'`은 iOS 기본 스타일 충돌을 방지한다.

**변경 파일**
- src/pages/ChatRoomPage.tsx
- src/pages/ProfileEditPage.tsx
- src/pages/CreateMeetupPage.tsx
- src/pages/onboarding/Step4Profile.tsx
