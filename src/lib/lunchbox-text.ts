/**
 * @deprecated 도시락 기능은 UI에서 제거되었습니다. 레거시 코드로 유지됩니다.
 *
 * 도시락 UI 텍스트 상수
 * 코드에서는 Digest를 사용하지만, UI에서는 "도시락"으로 표시
 */

export const LUNCHBOX_TEXT = {
  // 페이지 헤더
  LIST_TITLE: '오늘의 도시락',
  LIST_ICON: '🍱',
  LIST_DESCRIPTION: '매일 아침, 당신에게 필요한 정보를 배달해드려요',

  // 버튼
  SUBSCRIBE: '도시락 신청하기',
  SUBSCRIBED: '신청 중',
  UNSUBSCRIBE: '구독 해제',
  SETTINGS: '설정',
  VIEW_DETAIL: '자세히 보기',

  // 마이페이지 탭
  TAB_TITLE: '도시락 구독',
  MY_SUBSCRIPTIONS: '내 도시락',
  BROWSE_LUNCHBOX: '도시락 둘러보기',
  SUBSCRIPTION_COUNT: (current: number, max: number) =>
    `신청 중인 도시락 (${current}/${max})`,
  EMPTY_STATE: '아직 신청한 도시락이 없어요',
  EMPTY_STATE_CTA: '도시락 둘러보기',
  EMPTY_SUBSCRIPTIONS: '아직 신청한 도시락이 없어요',
  EMPTY_SUBSCRIPTIONS_DESC: '매일 아침 필요한 정보를 받아보세요!',
  VIEW_MORE: '+ 더 많은 도시락 보기',

  // 상세 페이지
  PREVIEW_TITLE: '오늘의 도시락 미리보기',
  CITY_SELECT: '도시 선택',
  DELIVERY_TIME: (time: string) => `매일 오전 ${time} 배달`,

  // 이메일
  EMAIL_SUBJECT: '오늘의 도시락이 도착했어요!',
  EMAIL_SUBJECT_WITH_ICON: '🍱 오늘의 도시락이 도착했어요!',
  EMAIL_FOOTER: '이 메일은 SideDish 도시락 구독으로 배달되었습니다.',
  EMAIL_MANAGE_LINK: '구독 관리',

  // 상태 메시지
  SUBSCRIBE_SUCCESS: '도시락 신청이 완료되었어요!',
  SUBSCRIBE_ERROR: '도시락 신청에 실패했어요. 다시 시도해주세요.',
  UNSUBSCRIBE_SUCCESS: '구독이 해제되었어요.',
  UNSUBSCRIBE_ERROR: '구독 해제에 실패했어요. 다시 시도해주세요.',
  MAX_REACHED: (max: number) => `최대 ${max}개까지 신청할 수 있어요.`,
  LOGIN_REQUIRED: '도시락을 신청하려면 로그인이 필요해요.',

  // 모달
  SUBSCRIBE_MODAL_TITLE: '도시락 신청하기',
  SUBSCRIBE_MODAL_CONFIRM: '신청하기',
  SUBSCRIBE_MODAL_CANCEL: '취소',
  UNSUBSCRIBE_MODAL_TITLE: '구독을 해제할까요?',
  UNSUBSCRIBE_MODAL_MESSAGE: '더 이상 이 도시락을 받지 않게 됩니다.',
  UNSUBSCRIBE_MODAL_CONFIRM: '해제하기',

  // 카드
  PREMIUM_BADGE: '프리미엄',
  FREE_BADGE: '무료',
} as const

/** 배달 시간을 읽기 좋은 형식으로 변환 */
export function formatDeliveryTime(time: string): string {
  const [hour, minute] = time.split(':').map(Number)
  const period = hour < 12 ? '오전' : '오후'
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  const displayMinute = minute > 0 ? ` ${minute}분` : ''
  return `${period} ${displayHour}시${displayMinute}`
}

/** 오늘 날짜를 한글 형식으로 */
export function formatTodayKorean(): string {
  const today = new Date()
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const date = today.getDate()
  const day = days[today.getDay()]
  return `${year}년 ${month}월 ${date}일 ${day}요일`
}
