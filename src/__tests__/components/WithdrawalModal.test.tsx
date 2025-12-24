import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WithdrawalModal from '@/components/WithdrawalModal'
import { WITHDRAWAL_REASONS, INCONVENIENCE_OPTIONS } from '@/lib/schemas/user'

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock useAuth
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123', name: '테스트유저' },
    signOut: vi.fn(),
  }),
}))

// Mock api-client
vi.mock('@/lib/api-client', () => ({
  withdrawUser: vi.fn().mockResolvedValue({}),
}))

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('WithdrawalModal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderModal = (isOpen = true) => {
    return render(
      <WithdrawalModal isOpen={isOpen} onClose={mockOnClose} />
    )
  }

  describe('step 1: reason selection', () => {
    it('should render step 1 by default', () => {
      renderModal()
      expect(screen.getByText(/탈퇴하시는 이유/)).toBeInTheDocument()
    })

    it('should display all withdrawal reasons', () => {
      renderModal()
      WITHDRAWAL_REASONS.forEach(reason => {
        expect(screen.getByText(reason)).toBeInTheDocument()
      })
    })

    it('should have first reason selected by default', () => {
      renderModal()
      const firstReasonRadio = screen.getByLabelText(WITHDRAWAL_REASONS[0])
      expect(firstReasonRadio).toBeChecked()
    })

    it('should allow selecting a reason', async () => {
      const user = userEvent.setup()
      renderModal()

      const secondReason = screen.getByLabelText(WITHDRAWAL_REASONS[1])
      await user.click(secondReason)

      expect(secondReason).toBeChecked()
    })

    it('should show custom reason input when 기타 is selected', async () => {
      const user = userEvent.setup()
      renderModal()

      const otherOption = screen.getByLabelText('기타')
      await user.click(otherOption)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/사유를 입력/)).toBeInTheDocument()
      })
    })

    it('should proceed to step 2 on next button click', async () => {
      const user = userEvent.setup()
      renderModal()

      const nextButton = screen.getByRole('button', { name: /다음/ })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/불편.*점/)).toBeInTheDocument()
      })
    })
  })

  describe('step 2: feedback selection', () => {
    const goToStep2 = async () => {
      const user = userEvent.setup()
      renderModal()
      const nextButton = screen.getByRole('button', { name: /다음/ })
      await user.click(nextButton)
      await waitFor(() => {
        expect(screen.getByText(/불편.*점/)).toBeInTheDocument()
      })
      return user
    }

    it('should display all inconvenience options', async () => {
      await goToStep2()

      INCONVENIENCE_OPTIONS.forEach(option => {
        expect(screen.getByLabelText(option)).toBeInTheDocument()
      })
    })

    it('should allow selecting multiple feedback options', async () => {
      const user = await goToStep2()

      const option1 = screen.getByLabelText(INCONVENIENCE_OPTIONS[0])
      const option2 = screen.getByLabelText(INCONVENIENCE_OPTIONS[1])

      await user.click(option1)
      await user.click(option2)

      expect(option1).toBeChecked()
      expect(option2).toBeChecked()
    })

    it('should show custom feedback input when 직접 입력 is selected', async () => {
      const user = await goToStep2()

      const customOption = screen.getByLabelText('직접 입력')
      await user.click(customOption)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/의견.*입력/)).toBeInTheDocument()
      })
    })

    it('should allow going back to step 1', async () => {
      const user = await goToStep2()

      const backButton = screen.getByRole('button', { name: /이전/ })
      await user.click(backButton)

      await waitFor(() => {
        expect(screen.getByText(/탈퇴하시는 이유/)).toBeInTheDocument()
      })
    })
  })

  describe('step 3: information', () => {
    const goToStep3 = async () => {
      const user = userEvent.setup()
      renderModal()

      // Step 1 -> Step 2
      await user.click(screen.getByRole('button', { name: /다음/ }))
      await waitFor(() => {
        expect(screen.getByText(/불편.*점/)).toBeInTheDocument()
      })

      // Step 2 -> Step 3
      await user.click(screen.getByRole('button', { name: /다음/ }))
      await waitFor(() => {
        expect(screen.getByText(/탈퇴 안내/)).toBeInTheDocument()
      })

      return user
    }

    it('should display withdrawal information', async () => {
      await goToStep3()

      expect(screen.getByText(/탈퇴 안내/)).toBeInTheDocument()
      // Check for some warning text about data deletion
      expect(screen.getByText(/데이터/)).toBeInTheDocument()
    })
  })

  describe('step 4: confirmation', () => {
    const goToStep4 = async () => {
      const user = userEvent.setup()
      renderModal()

      // Navigate through all steps
      await user.click(screen.getByRole('button', { name: /다음/ }))
      await waitFor(() => {
        expect(screen.getByText(/불편.*점/)).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /다음/ }))
      await waitFor(() => {
        expect(screen.getByText(/탈퇴 안내/)).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /다음/ }))
      await waitFor(() => {
        expect(screen.getByText(/최종 확인/)).toBeInTheDocument()
      })

      return user
    }

    it('should display confirmation step', async () => {
      await goToStep4()

      expect(screen.getByText(/최종 확인/)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/탈퇴합니다/)).toBeInTheDocument()
    })

    it('should disable submit button until correct text is entered', async () => {
      await goToStep4()

      const submitButton = screen.getByRole('button', { name: /탈퇴하기/ })
      expect(submitButton).toBeDisabled()
    })

    it('should enable submit button when correct text is entered', async () => {
      const user = await goToStep4()

      const confirmInput = screen.getByPlaceholderText(/탈퇴합니다/)
      await user.type(confirmInput, '탈퇴합니다')

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /탈퇴하기/ })
        expect(submitButton).not.toBeDisabled()
      })
    })

    it('should not accept incorrect confirmation text', async () => {
      const user = await goToStep4()

      const confirmInput = screen.getByPlaceholderText(/탈퇴합니다/)
      await user.type(confirmInput, '탈퇴')

      const submitButton = screen.getByRole('button', { name: /탈퇴하기/ })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('modal behavior', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup()
      renderModal()

      const cancelButton = screen.getByRole('button', { name: /취소/ })
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should not render when isOpen is false', () => {
      renderModal(false)
      expect(screen.queryByText(/탈퇴하시는 이유/)).not.toBeInTheDocument()
    })
  })
})
