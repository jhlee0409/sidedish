---
name: writing-korean-ux-text
description: Writes Korean UI text for SideDish. Use when adding buttons, labels, error messages, placeholders, or any user-facing Korean text. Includes culinary metaphors (메이커=셰프, 프로젝트=메뉴) and tone guidelines.
---

# Korean UX Writing Skill

## When to Use
- Writing button labels (등록하기, 저장, 취소)
- Creating form labels and placeholders
- Writing error and success messages
- Adding empty state messages
- Using culinary metaphors consistently

## Tone & Voice
- **친근하고 전문적인** (Friendly yet professional)
- **음식/요리 메타포 활용** (Use culinary metaphors)
- **간결하고 명확하게** (Concise and clear)

## Common UI Text

### Buttons
| English | Korean |
|---------|--------|
| Submit | 등록하기 |
| Save | 저장하기 |
| Cancel | 취소 |
| Delete | 삭제 |
| Edit | 수정 |
| Close | 닫기 |
| Back | 돌아가기 |
| Next | 다음 |
| Start | 시작하기 |
| Explore | 둘러보기 |
| Register Project | 프로젝트 등록 |
| Generate with AI | AI로 생성하기 |

### Form Labels
| English | Korean |
|---------|--------|
| Title | 제목 |
| Description | 설명 |
| Short Description | 한줄 소개 |
| Tags | 태그 |
| Image | 이미지 |
| Link | 링크 |
| GitHub URL | GitHub 주소 |
| Platform | 플랫폼 |
| Author | 작성자 |

### Placeholders
```
프로젝트 이름을 입력하세요
간단한 설명을 작성해주세요
태그를 입력하고 Enter를 누르세요
https://example.com
```

### Error Messages
```
오류가 발생했습니다. 잠시 후 다시 시도해주세요.
필수 항목을 입력해주세요.
유효한 URL을 입력해주세요.
이미지 크기는 5MB 이하여야 합니다.
AI 생성에 실패했습니다.
```

### Success Messages
```
프로젝트가 등록되었습니다!
저장되었습니다.
복사되었습니다.
```

### Empty States
```
아직 등록된 프로젝트가 없습니다.
검색 결과가 없습니다.
첫 번째 프로젝트를 등록해보세요!
```

## Culinary Metaphors (SideDish Theme)

### Concepts
| Concept | Metaphor |
|---------|----------|
| Projects | 메뉴, 요리, 디시 |
| Makers | 셰프, 요리사 |
| Users | 미식가, 다이너 |
| Features | 재료, 레시피 |
| Tech Stack | 비밀 재료, 소스 |
| Description | 메뉴 설명 |
| Launch | 오픈, 서빙 |

### Example Phrases
```
"메이커가 요리한 맛있는 사이드 프로젝트"
"미식가들의 입맛을 사로잡은 프로젝트들"
"직접 셰프가 되어 첫 번째 요리를 등록해보세요"
"지금 핫한 메뉴"
"전체 메뉴판 보기"
"메뉴(프로젝트) 이름이나 재료(태그)를 검색해보세요"
```

## Numbers & Formatting
```
좋아요 128개
댓글 32개
조회수 1,234회
2024년 12월 15일
방금 전 / 1분 전 / 1시간 전 / 1일 전
```

## Accessibility
- 스크린 리더를 위한 aria-label 제공
- 이미지에 alt 텍스트 추가
- 버튼에 명확한 텍스트 사용

```tsx
<button aria-label="프로젝트 좋아요">
  <Heart />
</button>

<img alt="프로젝트 썸네일 이미지" />
```
