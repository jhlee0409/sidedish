# Data Modeling Reference

## Document Schemas

### ProjectDoc
```typescript
interface ProjectDoc {
  id: string
  title: string                 // max 100 chars
  shortDescription: string      // max 80 chars (tagline)
  description: string           // markdown, max 10000 chars
  tags: string[]                // max 10, each 30 chars
  imageUrl: string
  link: string
  githubUrl?: string
  platform: 'WEB' | 'APP' | 'GAME' | 'DESIGN' | 'OTHER'
  authorId: string              // Firebase UID
  authorName: string            // Denormalized snapshot
  likes: number                 // Counter cache
  reactions: { fire?: number, clap?: number, party?: number, idea?: number, love?: number }
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### UserDoc
```typescript
interface UserDoc {
  name: string                  // 2-20 chars
  avatarUrl: string
  email?: string
  role?: 'admin' | 'user'
  agreements: { termsOfService: boolean, privacyPolicy: boolean, marketing: boolean }
  isProfileComplete: boolean
  isWithdrawn: boolean          // Soft delete flag
  withdrawnAt?: Timestamp
  withdrawalReason?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### CommentDoc
```typescript
interface CommentDoc {
  id: string
  projectId: string
  authorId: string
  authorName: string            // Denormalized
  authorAvatarUrl: string       // Denormalized
  content: string               // max 1000 chars
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### WhisperDoc
```typescript
interface WhisperDoc {
  id: string
  projectId: string
  projectAuthorId: string       // For querying
  senderId: string
  senderName: string            // Denormalized
  content: string               // max 2000 chars
  isRead: boolean
  createdAt: Timestamp
}
```

## Design Patterns

### 1. Denormalization
```typescript
// Embed frequently accessed data
const project = {
  authorId: 'user123',
  authorName: '홍길동',  // Copy from user
}

// Update denormalized data
async function updateUserName(userId: string, newName: string) {
  const batch = db.batch()
  batch.update(db.collection('users').doc(userId), { name: newName })

  const projects = await db.collection('projects').where('authorId', '==', userId).get()
  projects.docs.forEach(doc => batch.update(doc.ref, { authorName: newName }))

  await batch.commit()
}
```

### 2. Composite Keys
```typescript
// likes collection: Document ID = `${userId}_${projectId}`
const likeId = `${userId}_${projectId}`
const likeRef = db.collection('likes').doc(likeId)

const exists = (await likeRef.get()).exists  // O(1) lookup
```

### 3. Counter Pattern
```typescript
// Increment on like
await db.collection('projects').doc(projectId).update({
  likes: FieldValue.increment(1),
})

// Decrement on unlike
await db.collection('projects').doc(projectId).update({
  likes: FieldValue.increment(-1),
})
```

### 4. Soft Delete
```typescript
await db.collection('users').doc(userId).update({
  isWithdrawn: true,
  withdrawnAt: Timestamp.now(),
  name: '탈퇴한 사용자',  // Anonymize
  email: FieldValue.delete(),
})

// Query excludes deleted
await db.collection('users').where('isWithdrawn', '!=', true).get()
```

### 5. Timestamp Consistency
```typescript
// Create
const now = Timestamp.now()
const doc = { ...data, createdAt: now, updatedAt: now }

// Update
await docRef.update({ ...updates, updatedAt: Timestamp.now() })

// API response conversion
const response = {
  ...doc.data(),
  createdAt: doc.data().createdAt?.toDate().toISOString(),
}
```

## Schema Evolution

### Adding New Fields
```typescript
// 1. Make optional
interface ProjectDoc { newField?: string }

// 2. Handle missing values
const project = { ...doc.data(), newField: doc.data().newField ?? 'default' }

// 3. Migration (optional)
snapshot.docs.forEach(doc => {
  if (!doc.data().newField) batch.update(doc.ref, { newField: 'default' })
})
```

### Removing Fields
```typescript
batch.update(doc.ref, { deprecatedField: FieldValue.delete() })
```

## Composite Indexes (firestore.indexes.json)

```json
{
  "indexes": [
    {
      "collectionGroup": "projects",
      "fields": [
        { "fieldPath": "platform", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "comments",
      "fields": [
        { "fieldPath": "projectId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

## Adding New Collection Checklist

1. [ ] Add Document interface to `db-types.ts`
2. [ ] Add Response interface to `types.ts`
3. [ ] Add to `COLLECTIONS` in `firebase-admin.ts`
4. [ ] Create API routes (CRUD)
5. [ ] Add client functions to `api-client.ts`
6. [ ] Add composite indexes if needed
7. [ ] Update security rules
8. [ ] Write tests
