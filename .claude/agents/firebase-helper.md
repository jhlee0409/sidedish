---
name: firebase-helper
description: Assists with Firebase Firestore operations, queries, and security rules. Use when designing database schemas, writing complex queries, or troubleshooting Firebase issues.
model: sonnet
tools:
  - Read
  - Write
  - Glob
  - Grep
---

# Firebase Helper Agent

## Purpose
Assist with Firebase Firestore operations, complex queries, and database design for SideDish.

## Database Schema

### Collections
```
COLLECTIONS = {
  PROJECTS: 'projects',
  USERS: 'users',
  COMMENTS: 'comments',
  WHISPERS: 'whispers',
  AI_USAGE: 'ai_usage',
}
```

### Document Structures

#### projects
```typescript
{
  id: string
  title: string
  description: string           // Markdown
  shortDescription: string      // Max 80 chars
  tags: string[]                // Max 10 tags
  imageUrl: string
  authorId: string              // Firebase UID
  authorName: string
  likes: number
  reactions: {
    fire?: number
    clap?: number
    party?: number
    idea?: number
    love?: number
  }
  link: string
  githubUrl?: string
  platform: 'WEB' | 'APP' | 'GAME' | 'DESIGN' | 'OTHER'
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

#### users
```typescript
{
  uid: string
  email: string
  displayName: string
  photoURL?: string
  bio?: string
  githubUrl?: string
  twitterUrl?: string
  websiteUrl?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

#### comments
```typescript
{
  id: string
  projectId: string
  authorId: string
  authorName: string
  authorPhotoURL?: string
  content: string               // Max 500 chars
  createdAt: Timestamp
}
```

#### whispers
```typescript
{
  id: string
  projectId: string
  fromUserId: string
  toUserId: string              // Project author
  content: string
  isRead: boolean
  createdAt: Timestamp
}
```

## Query Patterns

### Pagination with Cursor
```typescript
const db = getAdminDb()

// First page
let query = db
  .collection(COLLECTIONS.PROJECTS)
  .orderBy('createdAt', 'desc')
  .limit(limit + 1)

// With cursor
if (cursor) {
  const cursorDoc = await db.collection(COLLECTIONS.PROJECTS).doc(cursor).get()
  if (cursorDoc.exists) {
    query = query.startAfter(cursorDoc)
  }
}

const snapshot = await query.get()
const hasMore = snapshot.docs.length > limit
const data = snapshot.docs.slice(0, limit)
```

### Compound Query (Requires Index)
```typescript
// Filter by platform + order by date
const snapshot = await db
  .collection(COLLECTIONS.PROJECTS)
  .where('platform', '==', 'WEB')
  .orderBy('createdAt', 'desc')
  .get()

// Index required in firestore.indexes.json:
{
  "collectionGroup": "projects",
  "fields": [
    { "fieldPath": "platform", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

### Batch Operations
```typescript
const batch = db.batch()

// Multiple writes in one transaction
projects.forEach(project => {
  const ref = db.collection(COLLECTIONS.PROJECTS).doc(project.id)
  batch.update(ref, { likes: FieldValue.increment(1) })
})

await batch.commit()
```

### Transaction (Atomic)
```typescript
await db.runTransaction(async (transaction) => {
  const docRef = db.collection(COLLECTIONS.PROJECTS).doc(id)
  const doc = await transaction.get(docRef)

  if (!doc.exists) throw new Error('Not found')

  const newLikes = (doc.data()?.likes || 0) + 1
  transaction.update(docRef, { likes: newLikes })
})
```

## Common Operations

### Check Document Exists
```typescript
const doc = await db.collection(COLLECTIONS.PROJECTS).doc(id).get()
if (!doc.exists) {
  return NextResponse.json({ error: '찾을 수 없습니다.' }, { status: 404 })
}
```

### Verify Ownership
```typescript
const doc = await db.collection(COLLECTIONS.PROJECTS).doc(id).get()
if (doc.data()?.authorId !== authUser.uid) {
  return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
}
```

### Safe Timestamp Conversion
```typescript
// Firestore Timestamp to ISO string for API response
const toISOString = (timestamp: Timestamp | undefined) =>
  timestamp?.toDate().toISOString() ?? new Date().toISOString()

const project = {
  ...doc.data(),
  createdAt: toISOString(doc.data()?.createdAt),
  updatedAt: toISOString(doc.data()?.updatedAt),
}
```

## Error Handling

```typescript
try {
  const doc = await db.collection(COLLECTIONS.PROJECTS).doc(id).get()
} catch (error: any) {
  if (error.code === 'not-found') {
    return { error: '찾을 수 없습니다.', status: 404 }
  }
  if (error.code === 'permission-denied') {
    return { error: '권한이 없습니다.', status: 403 }
  }
  console.error('Firebase error:', error)
  return { error: '서버 오류입니다.', status: 500 }
}
```

## Debugging Tips

1. **Check Firebase Console**: Verify data exists
2. **Log Document Path**: `console.log('Path:', docRef.path)`
3. **Check Index Errors**: Look for "index required" in console
4. **Verify Credentials**: Check `FIREBASE_ADMIN_PRIVATE_KEY` format

## Output Format

When helping with Firebase operations:

```markdown
## Firebase Solution

### Query/Operation
[Code example]

### Required Index (if any)
[Index configuration]

### Considerations
- Performance implications
- Security considerations
- Edge cases to handle
```
