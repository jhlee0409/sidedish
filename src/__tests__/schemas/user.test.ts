import { describe, it, expect } from 'vitest'
import {
  signupFormSchema,
  profileEditFormSchema,
  withdrawalReasonFormSchema,
  withdrawalFeedbackFormSchema,
  withdrawalConfirmFormSchema,
  withdrawalFullFormSchema,
  WITHDRAWAL_REASONS,
  INCONVENIENCE_OPTIONS,
} from '@/lib/schemas/user'

describe('signupFormSchema', () => {
  describe('valid submissions', () => {
    it('should accept valid signup form', () => {
      const validSignup = {
        name: '홍길동',
        avatarUrl: 'https://example.com/avatar.png',
        termsOfService: true,
        privacyPolicy: true,
        marketing: false,
      }
      const result = signupFormSchema.safeParse(validSignup)
      expect(result.success).toBe(true)
    })

    it('should accept signup without avatar', () => {
      const validSignup = {
        name: 'Developer',
        avatarUrl: '',
        termsOfService: true,
        privacyPolicy: true,
        marketing: false,
      }
      const result = signupFormSchema.safeParse(validSignup)
      expect(result.success).toBe(true)
    })

    it('should accept marketing consent', () => {
      const validSignup = {
        name: '개발자',
        avatarUrl: '',
        termsOfService: true,
        privacyPolicy: true,
        marketing: true,
      }
      const result = signupFormSchema.safeParse(validSignup)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.marketing).toBe(true)
      }
    })
  })

  describe('name validation', () => {
    it('should reject short names', () => {
      const signup = {
        name: '홍',
        avatarUrl: '',
        termsOfService: true,
        privacyPolicy: true,
        marketing: false,
      }
      const result = signupFormSchema.safeParse(signup)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name')
      }
    })

    it('should reject names with special characters', () => {
      const signup = {
        name: 'user@name!',
        avatarUrl: '',
        termsOfService: true,
        privacyPolicy: true,
        marketing: false,
      }
      const result = signupFormSchema.safeParse(signup)
      expect(result.success).toBe(false)
    })
  })

  describe('terms validation', () => {
    it('should reject when termsOfService is false', () => {
      const signup = {
        name: '개발자',
        avatarUrl: '',
        termsOfService: false,
        privacyPolicy: true,
        marketing: false,
      }
      const result = signupFormSchema.safeParse(signup)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('이용약관')
      }
    })

    it('should reject when privacyPolicy is false', () => {
      const signup = {
        name: '개발자',
        avatarUrl: '',
        termsOfService: true,
        privacyPolicy: false,
        marketing: false,
      }
      const result = signupFormSchema.safeParse(signup)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('개인정보')
      }
    })
  })
})

describe('profileEditFormSchema', () => {
  it('should accept valid profile edit', () => {
    const validEdit = {
      name: '새로운이름',
      avatarUrl: 'https://example.com/new-avatar.png',
    }
    const result = profileEditFormSchema.safeParse(validEdit)
    expect(result.success).toBe(true)
  })

  it('should accept profile edit without avatar change', () => {
    const validEdit = {
      name: '닉네임변경',
      avatarUrl: '',
    }
    const result = profileEditFormSchema.safeParse(validEdit)
    expect(result.success).toBe(true)
  })

  it('should reject invalid name', () => {
    const invalidEdit = {
      name: '',
      avatarUrl: '',
    }
    const result = profileEditFormSchema.safeParse(invalidEdit)
    expect(result.success).toBe(false)
  })

  it('should reject invalid avatar URL', () => {
    const invalidEdit = {
      name: '닉네임',
      avatarUrl: 'not-a-url',
    }
    const result = profileEditFormSchema.safeParse(invalidEdit)
    expect(result.success).toBe(false)
  })
})

describe('withdrawalReasonFormSchema', () => {
  it('should accept valid withdrawal reason', () => {
    const validReason = {
      selectedReason: '사용 빈도가 낮아요',
      customReason: '',
    }
    const result = withdrawalReasonFormSchema.safeParse(validReason)
    expect(result.success).toBe(true)
  })

  it('should accept all predefined reasons', () => {
    WITHDRAWAL_REASONS.forEach(reason => {
      if (reason === '기타') return // 기타 requires customReason
      const validReason = {
        selectedReason: reason,
        customReason: '',
      }
      const result = withdrawalReasonFormSchema.safeParse(validReason)
      expect(result.success).toBe(true)
    })
  })

  it('should require customReason when 기타 is selected', () => {
    const invalidReason = {
      selectedReason: '기타',
      customReason: '',
    }
    const result = withdrawalReasonFormSchema.safeParse(invalidReason)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('customReason')
    }
  })

  it('should accept 기타 with custom reason', () => {
    const validReason = {
      selectedReason: '기타',
      customReason: '개인적인 사정으로 탈퇴합니다.',
    }
    const result = withdrawalReasonFormSchema.safeParse(validReason)
    expect(result.success).toBe(true)
  })

  it('should reject customReason exceeding max length', () => {
    const invalidReason = {
      selectedReason: '기타',
      customReason: '가'.repeat(250),
    }
    const result = withdrawalReasonFormSchema.safeParse(invalidReason)
    expect(result.success).toBe(false)
  })

  it('should reject invalid reason', () => {
    const invalidReason = {
      selectedReason: '존재하지 않는 사유',
      customReason: '',
    }
    const result = withdrawalReasonFormSchema.safeParse(invalidReason)
    expect(result.success).toBe(false)
  })
})

describe('withdrawalFeedbackFormSchema', () => {
  it('should accept empty feedback', () => {
    const validFeedback = {
      selectedFeedback: [],
      customFeedback: '',
    }
    const result = withdrawalFeedbackFormSchema.safeParse(validFeedback)
    expect(result.success).toBe(true)
  })

  it('should accept valid feedback selection', () => {
    const validFeedback = {
      selectedFeedback: ['프로젝트 등록 과정이 복잡해요', '원하는 기능이 부족해요'],
      customFeedback: '',
    }
    const result = withdrawalFeedbackFormSchema.safeParse(validFeedback)
    expect(result.success).toBe(true)
  })

  it('should accept all inconvenience options', () => {
    INCONVENIENCE_OPTIONS.forEach(option => {
      const feedback = {
        selectedFeedback: [option],
        customFeedback: '',
      }
      const result = withdrawalFeedbackFormSchema.safeParse(feedback)
      expect(result.success).toBe(true)
    })
  })

  it('should accept custom feedback', () => {
    const validFeedback = {
      selectedFeedback: ['직접 입력'],
      customFeedback: '구체적인 개선 의견입니다.',
    }
    const result = withdrawalFeedbackFormSchema.safeParse(validFeedback)
    expect(result.success).toBe(true)
  })

  it('should reject customFeedback exceeding max length', () => {
    const invalidFeedback = {
      selectedFeedback: [],
      customFeedback: '가'.repeat(600),
    }
    const result = withdrawalFeedbackFormSchema.safeParse(invalidFeedback)
    expect(result.success).toBe(false)
  })

  it('should reject invalid feedback option', () => {
    const invalidFeedback = {
      selectedFeedback: ['존재하지 않는 옵션'],
      customFeedback: '',
    }
    const result = withdrawalFeedbackFormSchema.safeParse(invalidFeedback)
    expect(result.success).toBe(false)
  })
})

describe('withdrawalConfirmFormSchema', () => {
  it('should accept exact confirmation text', () => {
    const validConfirm = {
      confirmText: '탈퇴합니다',
    }
    const result = withdrawalConfirmFormSchema.safeParse(validConfirm)
    expect(result.success).toBe(true)
  })

  it('should reject wrong confirmation text', () => {
    const invalidTexts = ['탈퇴', '탈퇴합니', '탈 퇴 합 니 다', 'WITHDRAW', '']
    invalidTexts.forEach(text => {
      const result = withdrawalConfirmFormSchema.safeParse({ confirmText: text })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('탈퇴합니다')
      }
    })
  })
})

describe('withdrawalFullFormSchema', () => {
  it('should accept complete withdrawal form', () => {
    const validForm = {
      selectedReason: '사용 빈도가 낮아요',
      customReason: '',
      selectedFeedback: ['특별히 불편한 점은 없었어요'],
      customFeedback: '',
      confirmText: '탈퇴합니다',
    }
    const result = withdrawalFullFormSchema.safeParse(validForm)
    expect(result.success).toBe(true)
  })

  it('should accept form with all optional fields', () => {
    const validForm = {
      selectedReason: '기타',
      customReason: '개인적인 사유입니다.',
      selectedFeedback: ['직접 입력', 'AI 생성 결과가 만족스럽지 않아요'],
      customFeedback: '더 나은 AI 결과물을 기대했습니다.',
      confirmText: '탈퇴합니다',
    }
    const result = withdrawalFullFormSchema.safeParse(validForm)
    expect(result.success).toBe(true)
  })

  it('should reject when required fields are missing', () => {
    const invalidForm = {
      selectedReason: undefined,
      customReason: '',
      selectedFeedback: [],
      customFeedback: '',
      confirmText: '탈퇴합니다',
    }
    const result = withdrawalFullFormSchema.safeParse(invalidForm)
    expect(result.success).toBe(false)
  })
})

describe('WITHDRAWAL_REASONS constant', () => {
  it('should have all expected reasons', () => {
    expect(WITHDRAWAL_REASONS).toContain('사이드 프로젝트 활동을 종료했어요')
    expect(WITHDRAWAL_REASONS).toContain('사용 빈도가 낮아요')
    expect(WITHDRAWAL_REASONS).toContain('다른 플랫폼을 이용 중이에요')
    expect(WITHDRAWAL_REASONS).toContain('기타')
  })

  it('should have 기타 as the last option', () => {
    expect(WITHDRAWAL_REASONS[WITHDRAWAL_REASONS.length - 1]).toBe('기타')
  })
})

describe('INCONVENIENCE_OPTIONS constant', () => {
  it('should have all expected options', () => {
    expect(INCONVENIENCE_OPTIONS).toContain('프로젝트 등록 과정이 복잡해요')
    expect(INCONVENIENCE_OPTIONS).toContain('AI 생성 결과가 만족스럽지 않아요')
    expect(INCONVENIENCE_OPTIONS).toContain('직접 입력')
  })

  it('should have 직접 입력 as the last option', () => {
    expect(INCONVENIENCE_OPTIONS[INCONVENIENCE_OPTIONS.length - 1]).toBe('직접 입력')
  })
})
