/**
 * Firestore Security Rules Tests
 *
 * Firebase 에뮬레이터를 사용하여 Security Rules를 테스트합니다.
 *
 * 실행 방법:
 * 1. Firebase 에뮬레이터 시작: firebase emulators:start --only firestore
 * 2. 테스트 실행: pnpm test firestore-rules
 *
 * @see https://firebase.google.com/docs/rules/unit-tests
 */

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  setDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { connect } from 'net'

const PROJECT_ID = 'sidedish-test'
let testEnv: RulesTestEnvironment

/**
 * Check if Firebase Emulator is running
 */
async function checkEmulatorRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = connect(8080, 'localhost')
    const timeout = setTimeout(() => {
      socket.end()
      resolve(false)
    }, 1000)

    socket.on('connect', () => {
      clearTimeout(timeout)
      socket.end()
      resolve(true)
    })

    socket.on('error', () => {
      clearTimeout(timeout)
      resolve(false)
    })
  })
}

/**
 * 테스트 환경 초기화
 *
 * Note: Firebase 에뮬레이터가 실행 중이어야 합니다.
 * 에뮬레이터가 없으면 모든 테스트를 스킵합니다.
 *
 * 에뮬레이터 시작: firebase emulators:start --only firestore
 */
beforeAll(async () => {
  // Check if emulator is running before attempting connection
  const emulatorRunning = await checkEmulatorRunning()

  if (!emulatorRunning) {
    console.warn('⚠️  Firebase Emulator not running - skipping Firestore Rules tests')
    console.warn('   Start emulator: firebase emulators:start --only firestore')
    testEnv = undefined as any
    return
  }

  try {
    // Read firestore.rules from project root
    const rulesPath = resolve(process.cwd(), 'firestore.rules')
    const rules = readFileSync(rulesPath, 'utf8')

    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        host: 'localhost',
        port: 8080,
        rules,
      },
    })
  } catch (error: any) {
    console.error('Failed to initialize test environment:', error)
    testEnv = undefined as any
  }
})

/**
 * 각 테스트 후 데이터 정리
 * 에뮬레이터가 없으면 테스트를 스킵합니다.
 */
beforeEach(async (context) => {
  if (!testEnv) {
    context.skip()
    return
  }
  await testEnv.clearFirestore()
})

/**
 * 테스트 환경 종료
 */
afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup()
  }
})

// ========================================
// Users Collection Tests
// ========================================

describe('Users Collection Security Rules', () => {
  const userId = 'user123'
  const otherUserId = 'user456'

  it('should allow anyone to read user profiles (public)', async () => {
    const db = testEnv.unauthenticatedContext().firestore()

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const userRef = doc(context.firestore(), 'users', userId)
      await setDoc(userRef, {
        id: userId,
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        isProfileComplete: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    })

    const userRef = doc(db, 'users', userId)
    await assertSucceeds(getDoc(userRef))
  })

  it('should allow authenticated users to create their own profile', async () => {
    const db = testEnv.authenticatedContext(userId).firestore()
    const userRef = doc(db, 'users', userId)

    await assertSucceeds(
      setDoc(userRef, {
        id: userId,
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        isProfileComplete: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    )
  })

  it('should prevent users from creating profiles with different user IDs', async () => {
    const db = testEnv.authenticatedContext(userId).firestore()
    const otherUserRef = doc(db, 'users', otherUserId)

    await assertFails(
      setDoc(otherUserRef, {
        id: otherUserId,
        name: 'Other User',
        avatarUrl: 'https://example.com/avatar.jpg',
        isProfileComplete: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    )
  })

  it('should prevent users from setting admin role on creation', async () => {
    const db = testEnv.authenticatedContext(userId).firestore()
    const userRef = doc(db, 'users', userId)

    await assertFails(
      setDoc(userRef, {
        id: userId,
        name: 'Hacker',
        avatarUrl: 'https://example.com/avatar.jpg',
        role: 'admin', // ← Should fail
        isProfileComplete: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    )
  })

  it('should allow users to update their own profile', async () => {
    // Setup: Create user
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const userRef = doc(context.firestore(), 'users', userId)
      await setDoc(userRef, {
        id: userId,
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        isProfileComplete: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    })

    // Test: Update profile
    const db = testEnv.authenticatedContext(userId).firestore()
    const userRef = doc(db, 'users', userId)

    await assertSucceeds(
      updateDoc(userRef, {
        name: 'Updated Name',
        updatedAt: serverTimestamp(),
      })
    )
  })

  it('should prevent users from modifying role or createdAt fields', async () => {
    // Setup
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const userRef = doc(context.firestore(), 'users', userId)
      await setDoc(userRef, {
        id: userId,
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        role: 'user',
        isProfileComplete: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    })

    const db = testEnv.authenticatedContext(userId).firestore()
    const userRef = doc(db, 'users', userId)

    // Try to update role
    await assertFails(
      updateDoc(userRef, {
        role: 'admin', // ← Should fail
        updatedAt: serverTimestamp(),
      })
    )
  })

  it('should enforce name length constraints', async () => {
    const db = testEnv.authenticatedContext(userId).firestore()
    const userRef = doc(db, 'users', userId)

    // Too long name (> 20 characters)
    await assertFails(
      setDoc(userRef, {
        id: userId,
        name: 'This is a very long name that exceeds twenty characters',
        avatarUrl: 'https://example.com/avatar.jpg',
        isProfileComplete: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    )
  })
})

// ========================================
// Projects Collection Tests
// ========================================

describe('Projects Collection Security Rules', () => {
  const userId = 'user123'
  const otherUserId = 'user456'
  const projectId = 'project123'

  it('should allow anyone to read projects', async () => {
    // Setup
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const projectRef = doc(context.firestore(), 'projects', projectId)
      await setDoc(projectRef, {
        id: projectId,
        title: 'Test Project',
        description: 'Test description',
        shortDescription: 'Short desc',
        tags: ['test'],
        imageUrl: 'https://example.com/image.jpg',
        authorId: userId,
        authorName: 'Test User',
        likes: 0,
        reactions: {},
        link: 'https://example.com',
        links: [],
        platform: 'WEB',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    })

    // Test: Unauthenticated read
    const db = testEnv.unauthenticatedContext().firestore()
    const projectRef = doc(db, 'projects', projectId)
    await assertSucceeds(getDoc(projectRef))
  })

  it('should allow authenticated users to create projects', async () => {
    const db = testEnv.authenticatedContext(userId).firestore()
    const projectsRef = collection(db, 'projects')

    await assertSucceeds(
      addDoc(projectsRef, {
        id: 'new-project',
        title: 'New Project',
        description: 'Description',
        shortDescription: 'Short',
        tags: ['tag1'],
        imageUrl: 'https://example.com/image.jpg',
        authorId: userId,
        authorName: 'Test User',
        likes: 0,
        reactions: {},
        link: 'https://example.com',
        links: [],
        platform: 'WEB',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    )
  })

  it('should prevent users from creating projects with mismatched authorId', async () => {
    const db = testEnv.authenticatedContext(userId).firestore()
    const projectsRef = collection(db, 'projects')

    await assertFails(
      addDoc(projectsRef, {
        id: 'new-project',
        title: 'Fake Project',
        description: 'Description',
        shortDescription: 'Short',
        tags: ['tag1'],
        imageUrl: 'https://example.com/image.jpg',
        authorId: otherUserId, // ← Should fail
        authorName: 'Other User',
        likes: 0,
        reactions: {},
        link: 'https://example.com',
        links: [],
        platform: 'WEB',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    )
  })

  it('should enforce title length constraints (1-100 chars)', async () => {
    const db = testEnv.authenticatedContext(userId).firestore()
    const projectsRef = collection(db, 'projects')

    // Too long title
    const longTitle = 'a'.repeat(101)
    await assertFails(
      addDoc(projectsRef, {
        id: 'new-project',
        title: longTitle,
        description: 'Description',
        shortDescription: 'Short',
        tags: ['tag1'],
        imageUrl: 'https://example.com/image.jpg',
        authorId: userId,
        authorName: 'Test User',
        likes: 0,
        reactions: {},
        link: 'https://example.com',
        links: [],
        platform: 'WEB',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    )
  })

  it('should enforce tags array length constraints (1-5 tags)', async () => {
    const db = testEnv.authenticatedContext(userId).firestore()
    const projectsRef = collection(db, 'projects')

    // Too many tags
    await assertFails(
      addDoc(projectsRef, {
        id: 'new-project',
        title: 'Test Project',
        description: 'Description',
        shortDescription: 'Short',
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6'], // ← 6 tags
        imageUrl: 'https://example.com/image.jpg',
        authorId: userId,
        authorName: 'Test User',
        likes: 0,
        reactions: {},
        link: 'https://example.com',
        links: [],
        platform: 'WEB',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    )
  })

  it('should allow project owners to update their projects', async () => {
    // Setup
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const projectRef = doc(context.firestore(), 'projects', projectId)
      await setDoc(projectRef, {
        id: projectId,
        title: 'Original Title',
        description: 'Original description',
        shortDescription: 'Short',
        tags: ['test'],
        imageUrl: 'https://example.com/image.jpg',
        authorId: userId,
        authorName: 'Test User',
        likes: 0,
        reactions: {},
        link: 'https://example.com',
        links: [],
        platform: 'WEB',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    })

    // Test: Owner update
    const db = testEnv.authenticatedContext(userId).firestore()
    const projectRef = doc(db, 'projects', projectId)

    await assertSucceeds(
      updateDoc(projectRef, {
        title: 'Updated Title',
        updatedAt: serverTimestamp(),
      })
    )
  })

  it('should prevent non-owners from updating projects', async () => {
    // Setup
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const projectRef = doc(context.firestore(), 'projects', projectId)
      await setDoc(projectRef, {
        id: projectId,
        title: 'Original Title',
        description: 'Original description',
        shortDescription: 'Short',
        tags: ['test'],
        imageUrl: 'https://example.com/image.jpg',
        authorId: userId,
        authorName: 'Test User',
        likes: 0,
        reactions: {},
        link: 'https://example.com',
        links: [],
        platform: 'WEB',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    })

    // Test: Non-owner update
    const db = testEnv.authenticatedContext(otherUserId).firestore()
    const projectRef = doc(db, 'projects', projectId)

    await assertFails(
      updateDoc(projectRef, {
        title: 'Hacked Title',
        updatedAt: serverTimestamp(),
      })
    )
  })

  it('should prevent modifying protected fields (likes, reactions)', async () => {
    // Setup
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const projectRef = doc(context.firestore(), 'projects', projectId)
      await setDoc(projectRef, {
        id: projectId,
        title: 'Original Title',
        description: 'Original description',
        shortDescription: 'Short',
        tags: ['test'],
        imageUrl: 'https://example.com/image.jpg',
        authorId: userId,
        authorName: 'Test User',
        likes: 0,
        reactions: {},
        link: 'https://example.com',
        links: [],
        platform: 'WEB',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    })

    const db = testEnv.authenticatedContext(userId).firestore()
    const projectRef = doc(db, 'projects', projectId)

    // Try to modify likes
    await assertFails(
      updateDoc(projectRef, {
        likes: 9999, // ← Should fail
        updatedAt: serverTimestamp(),
      })
    )
  })

  it('should allow project owners to delete their projects', async () => {
    // Setup
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const projectRef = doc(context.firestore(), 'projects', projectId)
      await setDoc(projectRef, {
        id: projectId,
        title: 'Test Project',
        description: 'Description',
        shortDescription: 'Short',
        tags: ['test'],
        imageUrl: 'https://example.com/image.jpg',
        authorId: userId,
        authorName: 'Test User',
        likes: 0,
        reactions: {},
        link: 'https://example.com',
        links: [],
        platform: 'WEB',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    })

    // Test: Owner delete
    const db = testEnv.authenticatedContext(userId).firestore()
    const projectRef = doc(db, 'projects', projectId)

    await assertSucceeds(deleteDoc(projectRef))
  })

  it('should prevent non-owners from deleting projects', async () => {
    // Setup
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const projectRef = doc(context.firestore(), 'projects', projectId)
      await setDoc(projectRef, {
        id: projectId,
        title: 'Test Project',
        description: 'Description',
        shortDescription: 'Short',
        tags: ['test'],
        imageUrl: 'https://example.com/image.jpg',
        authorId: userId,
        authorName: 'Test User',
        likes: 0,
        reactions: {},
        link: 'https://example.com',
        links: [],
        platform: 'WEB',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    })

    // Test: Non-owner delete
    const db = testEnv.authenticatedContext(otherUserId).firestore()
    const projectRef = doc(db, 'projects', projectId)

    await assertFails(deleteDoc(projectRef))
  })
})

// ========================================
// Comments Collection Tests
// ========================================

describe('Comments Collection Security Rules', () => {
  const userId = 'user123'
  const otherUserId = 'user456'
  const projectId = 'project123'
  const commentId = 'comment123'

  it('should allow anyone to read comments', async () => {
    // Setup
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const commentRef = doc(context.firestore(), 'comments', commentId)
      await setDoc(commentRef, {
        id: commentId,
        projectId,
        authorId: userId,
        authorName: 'Test User',
        content: 'Test comment',
        createdAt: serverTimestamp(),
      })
    })

    // Test
    const db = testEnv.unauthenticatedContext().firestore()
    const commentRef = doc(db, 'comments', commentId)
    await assertSucceeds(getDoc(commentRef))
  })

  it('should allow authenticated users to create comments', async () => {
    const db = testEnv.authenticatedContext(userId).firestore()
    const commentsRef = collection(db, 'comments')

    await assertSucceeds(
      addDoc(commentsRef, {
        id: 'new-comment',
        projectId,
        authorId: userId,
        authorName: 'Test User',
        content: 'This is a comment',
        createdAt: serverTimestamp(),
      })
    )
  })

  it('should enforce content length constraints (1-1000 chars)', async () => {
    const db = testEnv.authenticatedContext(userId).firestore()
    const commentsRef = collection(db, 'comments')

    // Too long content
    const longContent = 'a'.repeat(1001)
    await assertFails(
      addDoc(commentsRef, {
        id: 'new-comment',
        projectId,
        authorId: userId,
        authorName: 'Test User',
        content: longContent,
        createdAt: serverTimestamp(),
      })
    )
  })

  it('should allow comment authors to delete their comments', async () => {
    // Setup
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const commentRef = doc(context.firestore(), 'comments', commentId)
      await setDoc(commentRef, {
        id: commentId,
        projectId,
        authorId: userId,
        authorName: 'Test User',
        content: 'Test comment',
        createdAt: serverTimestamp(),
      })
    })

    // Test
    const db = testEnv.authenticatedContext(userId).firestore()
    const commentRef = doc(db, 'comments', commentId)
    await assertSucceeds(deleteDoc(commentRef))
  })

  it('should prevent non-authors from deleting comments', async () => {
    // Setup
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const commentRef = doc(context.firestore(), 'comments', commentId)
      await setDoc(commentRef, {
        id: commentId,
        projectId,
        authorId: userId,
        authorName: 'Test User',
        content: 'Test comment',
        createdAt: serverTimestamp(),
      })
    })

    // Test
    const db = testEnv.authenticatedContext(otherUserId).firestore()
    const commentRef = doc(db, 'comments', commentId)
    await assertFails(deleteDoc(commentRef))
  })
})

// ========================================
// Whispers Collection Tests (Private Feedback)
// ========================================

describe('Whispers Collection Security Rules', () => {
  const projectAuthorId = 'author123'
  const senderId = 'sender456'
  const whisperId = 'whisper123'

  it('should allow project authors to read their whispers', async () => {
    // Setup
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const whisperRef = doc(context.firestore(), 'whispers', whisperId)
      await setDoc(whisperRef, {
        id: whisperId,
        projectId: 'project123',
        projectTitle: 'Test Project',
        projectAuthorId,
        senderName: 'Sender',
        senderId,
        content: 'Private feedback',
        isRead: false,
        createdAt: serverTimestamp(),
      })
    })

    // Test: Project author can read
    const db = testEnv.authenticatedContext(projectAuthorId).firestore()
    const whisperRef = doc(db, 'whispers', whisperId)
    await assertSucceeds(getDoc(whisperRef))
  })

  it('should prevent non-authors from reading whispers', async () => {
    // Setup
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const whisperRef = doc(context.firestore(), 'whispers', whisperId)
      await setDoc(whisperRef, {
        id: whisperId,
        projectId: 'project123',
        projectTitle: 'Test Project',
        projectAuthorId,
        senderName: 'Sender',
        senderId,
        content: 'Private feedback',
        isRead: false,
        createdAt: serverTimestamp(),
      })
    })

    // Test: Others cannot read
    const db = testEnv.authenticatedContext('other-user').firestore()
    const whisperRef = doc(db, 'whispers', whisperId)
    await assertFails(getDoc(whisperRef))
  })

  it('should allow authenticated users to create whispers', async () => {
    const db = testEnv.authenticatedContext(senderId).firestore()
    const whispersRef = collection(db, 'whispers')

    await assertSucceeds(
      addDoc(whispersRef, {
        id: 'new-whisper',
        projectId: 'project123',
        projectTitle: 'Test Project',
        projectAuthorId,
        senderName: 'Sender',
        content: 'Private feedback',
        isRead: false,
        createdAt: serverTimestamp(),
      })
    )
  })

  it('should enforce content length constraints (1-2000 chars)', async () => {
    const db = testEnv.authenticatedContext(senderId).firestore()
    const whispersRef = collection(db, 'whispers')

    // Too long content
    const longContent = 'a'.repeat(2001)
    await assertFails(
      addDoc(whispersRef, {
        id: 'new-whisper',
        projectId: 'project123',
        projectTitle: 'Test Project',
        projectAuthorId,
        senderName: 'Sender',
        content: longContent,
        isRead: false,
        createdAt: serverTimestamp(),
      })
    )
  })

  it('should allow project authors to mark whispers as read', async () => {
    // Setup
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const whisperRef = doc(context.firestore(), 'whispers', whisperId)
      await setDoc(whisperRef, {
        id: whisperId,
        projectId: 'project123',
        projectTitle: 'Test Project',
        projectAuthorId,
        senderName: 'Sender',
        senderId,
        content: 'Private feedback',
        isRead: false,
        createdAt: serverTimestamp(),
      })
    })

    // Test: Mark as read
    const db = testEnv.authenticatedContext(projectAuthorId).firestore()
    const whisperRef = doc(db, 'whispers', whisperId)
    await assertSucceeds(
      updateDoc(whisperRef, {
        isRead: true,
      })
    )
  })

  it('should prevent modifying whisper content after creation', async () => {
    // Setup
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const whisperRef = doc(context.firestore(), 'whispers', whisperId)
      await setDoc(whisperRef, {
        id: whisperId,
        projectId: 'project123',
        projectTitle: 'Test Project',
        projectAuthorId,
        senderName: 'Sender',
        senderId,
        content: 'Original content',
        isRead: false,
        createdAt: serverTimestamp(),
      })
    })

    // Test: Try to modify content
    const db = testEnv.authenticatedContext(projectAuthorId).firestore()
    const whisperRef = doc(db, 'whispers', whisperId)
    await assertFails(
      updateDoc(whisperRef, {
        content: 'Modified content', // ← Should fail
        isRead: true,
      })
    )
  })
})

// ========================================
// Likes Collection Tests
// ========================================

describe('Likes Collection Security Rules', () => {
  const userId = 'user123'
  const otherUserId = 'user456'
  const projectId = 'project123'
  const likeId = 'like123'

  it('should allow anyone to read likes', async () => {
    // Setup
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const likeRef = doc(context.firestore(), 'likes', likeId)
      await setDoc(likeRef, {
        userId,
        projectId,
        createdAt: serverTimestamp(),
      })
    })

    // Test
    const db = testEnv.unauthenticatedContext().firestore()
    const likeRef = doc(db, 'likes', likeId)
    await assertSucceeds(getDoc(likeRef))
  })

  it('should allow authenticated users to like projects', async () => {
    const db = testEnv.authenticatedContext(userId).firestore()
    const likesRef = collection(db, 'likes')

    await assertSucceeds(
      addDoc(likesRef, {
        userId,
        projectId,
        createdAt: serverTimestamp(),
      })
    )
  })

  it('should prevent users from liking as other users', async () => {
    const db = testEnv.authenticatedContext(userId).firestore()
    const likesRef = collection(db, 'likes')

    await assertFails(
      addDoc(likesRef, {
        userId: otherUserId, // ← Should fail
        projectId,
        createdAt: serverTimestamp(),
      })
    )
  })

  it('should allow users to delete their own likes', async () => {
    // Setup
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const likeRef = doc(context.firestore(), 'likes', likeId)
      await setDoc(likeRef, {
        userId,
        projectId,
        createdAt: serverTimestamp(),
      })
    })

    // Test
    const db = testEnv.authenticatedContext(userId).firestore()
    const likeRef = doc(db, 'likes', likeId)
    await assertSucceeds(deleteDoc(likeRef))
  })

  it('should prevent users from deleting other users likes', async () => {
    // Setup
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const likeRef = doc(context.firestore(), 'likes', likeId)
      await setDoc(likeRef, {
        userId,
        projectId,
        createdAt: serverTimestamp(),
      })
    })

    // Test
    const db = testEnv.authenticatedContext(otherUserId).firestore()
    const likeRef = doc(db, 'likes', likeId)
    await assertFails(deleteDoc(likeRef))
  })
})
