import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProfileEditModal from '@/components/ProfileEditModal'
import { useAuth } from '@/contexts/AuthContext'

// Mock useAuth hook
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

// Mock api-client
vi.mock('@/lib/api-client', () => ({
  updateUser: vi.fn(),
  uploadImage: vi.fn(),
}))

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockUser = {
  id: 'user-123',
  name: '기존닉네임',
  avatarUrl: 'https://example.com/avatar.png',
}

describe('ProfileEditModal', () => {
  const mockOnClose = vi.fn()
  const mockRefreshUser = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: mockUser,
      refreshUser: mockRefreshUser,
    })
  })

  const renderModal = (isOpen = true) => {
    return render(
      <ProfileEditModal
        isOpen={isOpen}
        onClose={mockOnClose}
        currentName={mockUser.name}
        currentAvatarUrl={mockUser.avatarUrl}
      />
    )
  }

  describe('rendering', () => {
    it('should not render when closed', () => {
      renderModal(false)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should render when open', () => {
      renderModal()
      expect(screen.getByText('프로필 수정')).toBeInTheDocument()
    })

    it('should display current name in input', () => {
      renderModal()
      const nameInput = screen.getByPlaceholderText(/닉네임/)
      expect(nameInput).toHaveValue('기존닉네임')
    })
  })

  describe('form validation', () => {
    it('should show error for empty name', async () => {
      const user = userEvent.setup()
      renderModal()

      const nameInput = screen.getByPlaceholderText(/닉네임/)
      await user.clear(nameInput)

      // Trigger blur to validate
      fireEvent.blur(nameInput)

      await waitFor(() => {
        expect(screen.getByText(/2자 이상/)).toBeInTheDocument()
      })
    })

    it('should show error for name with special characters', async () => {
      const user = userEvent.setup()
      renderModal()

      const nameInput = screen.getByPlaceholderText(/닉네임/)
      await user.clear(nameInput)
      await user.type(nameInput, 'test@name!')

      fireEvent.blur(nameInput)

      await waitFor(() => {
        expect(screen.getByText(/특수문자/)).toBeInTheDocument()
      })
    })

    it('should show error for name exceeding max length', async () => {
      const user = userEvent.setup()
      renderModal()

      const nameInput = screen.getByPlaceholderText(/닉네임/)
      await user.clear(nameInput)
      await user.type(nameInput, '가'.repeat(25))

      fireEvent.blur(nameInput)

      await waitFor(() => {
        expect(screen.getByText(/20자/)).toBeInTheDocument()
      })
    })

    it('should accept valid Korean name', async () => {
      const user = userEvent.setup()
      renderModal()

      const nameInput = screen.getByPlaceholderText(/닉네임/)
      await user.clear(nameInput)
      await user.type(nameInput, '새로운닉네임')

      fireEvent.blur(nameInput)

      await waitFor(() => {
        expect(screen.queryByText(/특수문자/)).not.toBeInTheDocument()
        expect(screen.queryByText(/2자 이상/)).not.toBeInTheDocument()
      })
    })
  })

  describe('form submission', () => {
    it('should disable submit button when form is invalid', async () => {
      const user = userEvent.setup()
      renderModal()

      const nameInput = screen.getByPlaceholderText(/닉네임/)
      await user.clear(nameInput)

      const submitButton = screen.getByRole('button', { name: /저장/ })
      expect(submitButton).toBeDisabled()
    })

    it('should enable submit button when form is valid', async () => {
      const user = userEvent.setup()
      renderModal()

      const nameInput = screen.getByPlaceholderText(/닉네임/)
      await user.clear(nameInput)
      await user.type(nameInput, '유효한닉네임')

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /저장/ })
        expect(submitButton).not.toBeDisabled()
      })
    })

    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup()
      renderModal()

      const cancelButton = screen.getByRole('button', { name: /취소/ })
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('character counter', () => {
    it('should display current character count', () => {
      renderModal()
      // 기존닉네임 = 5자
      expect(screen.getByText(/5.*\/.*20/)).toBeInTheDocument()
    })

    it('should update character count as user types', async () => {
      const user = userEvent.setup()
      renderModal()

      const nameInput = screen.getByPlaceholderText(/닉네임/)
      await user.clear(nameInput)
      await user.type(nameInput, '테스트')

      expect(screen.getByText(/3.*\/.*20/)).toBeInTheDocument()
    })
  })
})
