import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormField, FormError, CharacterCount } from '@/components/form'

// Test component that uses our form utilities
const testSchema = z.object({
  title: z.string().min(2, '제목은 2자 이상이어야 합니다.').max(10, '제목은 10자 이하여야 합니다.'),
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  description: z.string().max(100, '설명은 100자 이하여야 합니다.').optional(),
})

type TestFormData = z.infer<typeof testSchema>

function TestFormComponent({ onSubmit = vi.fn() }: { onSubmit?: (data: TestFormData) => void }) {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      email: '',
      description: '',
    },
  })

  const titleValue = watch('title')

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormField label="제목" htmlFor="title" required error={errors.title?.message}>
        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <>
              <input {...field} id="title" data-testid="title-input" />
              <CharacterCount current={titleValue.length} max={10} />
            </>
          )}
        />
      </FormField>

      <FormField label="이메일" htmlFor="email" required error={errors.email?.message}>
        <Controller
          name="email"
          control={control}
          render={({ field }) => <input {...field} id="email" type="email" data-testid="email-input" />}
        />
      </FormField>

      <FormField label="설명" htmlFor="description" error={errors.description?.message} hint="선택사항입니다">
        <Controller
          name="description"
          control={control}
          render={({ field }) => <textarea {...field} id="description" data-testid="description-input" />}
        />
      </FormField>

      <button type="submit">제출</button>
    </form>
  )
}

describe('Form Error Handling', () => {
  describe('FormField component', () => {
    it('should render label with required indicator', () => {
      render(
        <FormField label="필수 필드" htmlFor="test" required>
          <input id="test" />
        </FormField>
      )

      expect(screen.getByText('필수 필드')).toBeInTheDocument()
      expect(screen.getByText('*')).toBeInTheDocument()
    })

    it('should render label without required indicator', () => {
      render(
        <FormField label="선택 필드" htmlFor="test">
          <input id="test" />
        </FormField>
      )

      expect(screen.getByText('선택 필드')).toBeInTheDocument()
      expect(screen.queryByText('*')).not.toBeInTheDocument()
    })

    it('should render hint text when provided', () => {
      render(
        <FormField label="필드" htmlFor="test" hint="이것은 힌트입니다">
          <input id="test" />
        </FormField>
      )

      expect(screen.getByText('이것은 힌트입니다')).toBeInTheDocument()
    })

    it('should render error message when provided', () => {
      render(
        <FormField label="필드" htmlFor="test" error="에러가 발생했습니다">
          <input id="test" />
        </FormField>
      )

      expect(screen.getByText('에러가 발생했습니다')).toBeInTheDocument()
    })
  })

  describe('FormError component', () => {
    it('should render error message', () => {
      render(<FormError error="에러 메시지" />)
      expect(screen.getByText('에러 메시지')).toBeInTheDocument()
    })

    it('should not render when error is undefined', () => {
      const { container } = render(<FormError error={undefined} />)
      expect(container.firstChild).toBeNull()
    })

    it('should not render when error is empty string', () => {
      const { container } = render(<FormError error="" />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('CharacterCount component', () => {
    it('should display current and max count', () => {
      render(<CharacterCount current={5} max={10} />)
      expect(screen.getByText(/5.*\/.*10/)).toBeInTheDocument()
    })

    it('should display warning when approaching limit', () => {
      const { container } = render(<CharacterCount current={9} max={10} />)
      // Should have warning styling (orange color)
      expect(container.firstChild).toHaveClass(/text-orange/)
    })

    it('should display error when exceeding limit', () => {
      const { container } = render(<CharacterCount current={15} max={10} />)
      // Should have error styling (red color)
      expect(container.firstChild).toHaveClass(/text-red/)
    })

    it('should display min count when provided', () => {
      render(<CharacterCount current={1} max={100} min={10} />)
      expect(screen.getByText(/1.*\/.*10.*~.*100/)).toBeInTheDocument()
    })
  })

  describe('Form validation flow', () => {
    it('should show validation errors on blur', async () => {
      const user = userEvent.setup()
      render(<TestFormComponent />)

      const titleInput = screen.getByTestId('title-input')
      await user.type(titleInput, 'a')
      await user.tab() // blur

      await waitFor(() => {
        expect(screen.getByText('제목은 2자 이상이어야 합니다.')).toBeInTheDocument()
      })
    })

    it('should show email validation error', async () => {
      const user = userEvent.setup()
      render(<TestFormComponent />)

      const emailInput = screen.getByTestId('email-input')
      await user.type(emailInput, 'invalid-email')
      await user.tab() // blur

      await waitFor(() => {
        expect(screen.getByText('올바른 이메일 형식이 아닙니다.')).toBeInTheDocument()
      })
    })

    it('should clear error when valid input is provided', async () => {
      const user = userEvent.setup()
      render(<TestFormComponent />)

      const titleInput = screen.getByTestId('title-input')

      // Trigger error
      await user.type(titleInput, 'a')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('제목은 2자 이상이어야 합니다.')).toBeInTheDocument()
      })

      // Fix error
      await user.click(titleInput)
      await user.type(titleInput, 'bc') // Now 'abc'

      await waitFor(() => {
        expect(screen.queryByText('제목은 2자 이상이어야 합니다.')).not.toBeInTheDocument()
      })
    })

    it('should show max length error', async () => {
      const user = userEvent.setup()
      render(<TestFormComponent />)

      const titleInput = screen.getByTestId('title-input')
      await user.type(titleInput, '이것은매우긴제목입니다열자이상')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('제목은 10자 이하여야 합니다.')).toBeInTheDocument()
      })
    })

    it('should update character count as user types', async () => {
      const user = userEvent.setup()
      render(<TestFormComponent />)

      const titleInput = screen.getByTestId('title-input')

      expect(screen.getByText(/0.*\/.*10/)).toBeInTheDocument()

      await user.type(titleInput, '테스트')

      expect(screen.getByText(/3.*\/.*10/)).toBeInTheDocument()
    })

    it('should call onSubmit with valid data', async () => {
      const mockOnSubmit = vi.fn()
      const user = userEvent.setup()
      render(<TestFormComponent onSubmit={mockOnSubmit} />)

      await user.type(screen.getByTestId('title-input'), '유효한제목')
      await user.type(screen.getByTestId('email-input'), 'test@example.com')
      await user.click(screen.getByRole('button', { name: '제출' }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '유효한제목',
            email: 'test@example.com',
          }),
          expect.anything()
        )
      })
    })

    it('should not call onSubmit with invalid data', async () => {
      const mockOnSubmit = vi.fn()
      const user = userEvent.setup()
      render(<TestFormComponent onSubmit={mockOnSubmit} />)

      await user.type(screen.getByTestId('title-input'), 'a') // Too short
      await user.type(screen.getByTestId('email-input'), 'invalid') // Invalid email
      await user.click(screen.getByRole('button', { name: '제출' }))

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled()
      })

      // Should show validation errors
      expect(screen.getByText('제목은 2자 이상이어야 합니다.')).toBeInTheDocument()
      expect(screen.getByText('올바른 이메일 형식이 아닙니다.')).toBeInTheDocument()
    })
  })

  describe('Multiple field errors', () => {
    it('should display all field errors simultaneously', async () => {
      const user = userEvent.setup()
      render(<TestFormComponent />)

      // Submit empty form
      await user.click(screen.getByRole('button', { name: '제출' }))

      await waitFor(() => {
        expect(screen.getByText('제목은 2자 이상이어야 합니다.')).toBeInTheDocument()
        expect(screen.getByText('올바른 이메일 형식이 아닙니다.')).toBeInTheDocument()
      })
    })

    it('should clear specific field error when fixed', async () => {
      const user = userEvent.setup()
      render(<TestFormComponent />)

      // Submit empty form to trigger all errors
      await user.click(screen.getByRole('button', { name: '제출' }))

      await waitFor(() => {
        expect(screen.getByText('제목은 2자 이상이어야 합니다.')).toBeInTheDocument()
        expect(screen.getByText('올바른 이메일 형식이 아닙니다.')).toBeInTheDocument()
      })

      // Fix only title
      await user.type(screen.getByTestId('title-input'), '유효한제목')

      await waitFor(() => {
        expect(screen.queryByText('제목은 2자 이상이어야 합니다.')).not.toBeInTheDocument()
        // Email error should still be present
        expect(screen.getByText('올바른 이메일 형식이 아닙니다.')).toBeInTheDocument()
      })
    })
  })
})
