---
name: working-with-firebase
description: Performs Firebase Firestore operations. Use when querying collections, creating/updating/deleting documents, using batch writes, or working with Timestamps. Includes pagination, transactions, and security rules patterns.
---

# Firebase Operations Skill

## When to Use
- Querying Firestore collections
- Creating, updating, or deleting documents
- Implementing batch operations
- Working with Firestore Timestamps
- Setting up composite indexes

## Firebase Admin Setup

### Location
`src/lib/firebase-admin.ts`

### Available Exports
```typescript
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'

// Collection names
COLLECTIONS.PROJECTS   // 'projects'
COLLECTIONS.USERS      // 'users'
COLLECTIONS.COMMENTS   // 'comments'
COLLECTIONS.WHISPERS   // 'whispers'
COLLECTIONS.AI_USAGE   // 'ai_usage'
```

## Basic Operations

### Get Single Document
```typescript
const db = getAdminDb()
const doc = await db.collection(COLLECTIONS.PROJECTS).doc(id).get()

if (!doc.exists) {
  return NextResponse.json({ error: '찾을 수 없습니다.' }, { status: 404 })
}

const data = doc.data()
```

### Get Collection with Query
```typescript
const snapshot = await db
  .collection(COLLECTIONS.PROJECTS)
  .where('authorId', '==', userId)
  .orderBy('createdAt', 'desc')
  .limit(20)
  .get()

const projects = snapshot.docs.map((doc) => ({
  id: doc.id,
  ...doc.data(),
}))
```

### Create Document
```typescript
import { Timestamp } from 'firebase-admin/firestore'

const docRef = db.collection(COLLECTIONS.PROJECTS).doc()
const now = Timestamp.now()

await docRef.set({
  id: docRef.id,
  title: 'New Project',
  authorId: userId,
  createdAt: now,
  updatedAt: now,
})
```

### Update Document
```typescript
import { Timestamp } from 'firebase-admin/firestore'

await db.collection(COLLECTIONS.PROJECTS).doc(id).update({
  title: 'Updated Title',
  updatedAt: Timestamp.now(),
})
```

### Delete Document
```typescript
await db.collection(COLLECTIONS.PROJECTS).doc(id).delete()
```

## Advanced Operations

### Batch Writes (Multiple Operations)
```typescript
const batch = db.batch()

// Add multiple operations
const docRef1 = db.collection(COLLECTIONS.PROJECTS).doc(id1)
const docRef2 = db.collection(COLLECTIONS.PROJECTS).doc(id2)

batch.update(docRef1, { likes: FieldValue.increment(1) })
batch.delete(docRef2)
batch.set(db.collection(COLLECTIONS.COMMENTS).doc(), newComment)

// Execute all at once
await batch.commit()
```

### Field Value Operations
```typescript
import { FieldValue } from 'firebase-admin/firestore'

// Increment number
await docRef.update({
  likes: FieldValue.increment(1),
  views: FieldValue.increment(-1),  // Decrement
})

// Array operations
await docRef.update({
  tags: FieldValue.arrayUnion('new-tag'),      // Add to array
  oldTags: FieldValue.arrayRemove('old-tag'),  // Remove from array
})

// Delete field
await docRef.update({
  deprecatedField: FieldValue.delete(),
})

// Server timestamp
await docRef.update({
  updatedAt: FieldValue.serverTimestamp(),
})
```

### Transactions (Atomic Operations)
```typescript
await db.runTransaction(async (transaction) => {
  const docRef = db.collection(COLLECTIONS.PROJECTS).doc(id)
  const doc = await transaction.get(docRef)

  if (!doc.exists) {
    throw new Error('Document not found')
  }

  const currentLikes = doc.data()?.likes || 0
  transaction.update(docRef, { likes: currentLikes + 1 })
})
```

## Query Patterns

### Compound Queries
```typescript
// Multiple conditions
const snapshot = await db
  .collection(COLLECTIONS.PROJECTS)
  .where('platform', '==', 'WEB')
  .where('authorId', '==', userId)
  .orderBy('createdAt', 'desc')
  .get()
```

### Pagination with Cursors
```typescript
// First page
const firstPage = await db
  .collection(COLLECTIONS.PROJECTS)
  .orderBy('createdAt', 'desc')
  .limit(20)
  .get()

// Next page using last document
const lastDoc = firstPage.docs[firstPage.docs.length - 1]
const nextPage = await db
  .collection(COLLECTIONS.PROJECTS)
  .orderBy('createdAt', 'desc')
  .startAfter(lastDoc)
  .limit(20)
  .get()
```

### Check if Document Exists
```typescript
const doc = await db.collection(COLLECTIONS.USERS).doc(userId).get()
const userExists = doc.exists
```

### Count Documents
```typescript
const snapshot = await db
  .collection(COLLECTIONS.PROJECTS)
  .where('authorId', '==', userId)
  .count()
  .get()

const count = snapshot.data().count
```

## Timestamp Handling

### Create Timestamp
```typescript
import { Timestamp } from 'firebase-admin/firestore'

const now = Timestamp.now()
const fromDate = Timestamp.fromDate(new Date('2024-01-01'))
```

### Convert to ISO String (for API Response)
```typescript
const project = {
  ...doc.data(),
  createdAt: doc.data().createdAt?.toDate().toISOString(),
  updatedAt: doc.data().updatedAt?.toDate().toISOString(),
}
```

### Query by Date Range
```typescript
const startDate = Timestamp.fromDate(new Date('2024-01-01'))
const endDate = Timestamp.fromDate(new Date('2024-12-31'))

const snapshot = await db
  .collection(COLLECTIONS.PROJECTS)
  .where('createdAt', '>=', startDate)
  .where('createdAt', '<=', endDate)
  .get()
```

## Common Patterns

### Soft Delete
```typescript
// Instead of delete, mark as deleted
await docRef.update({
  isDeleted: true,
  deletedAt: Timestamp.now(),
})

// Query excludes deleted
const snapshot = await db
  .collection(COLLECTIONS.PROJECTS)
  .where('isDeleted', '!=', true)
  .get()
```

### Upsert (Create or Update)
```typescript
await docRef.set(data, { merge: true })
```

### Check Ownership
```typescript
const doc = await db.collection(COLLECTIONS.PROJECTS).doc(id).get()
if (doc.data()?.authorId !== authUser.uid) {
  return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
}
```

## Indexes

### Composite Index Required
When using multiple `where` clauses or `where` + `orderBy`:
```typescript
// This requires a composite index
db.collection('projects')
  .where('platform', '==', 'WEB')
  .orderBy('createdAt', 'desc')
```

Create index in Firebase Console or `firestore.indexes.json`:
```json
{
  "indexes": [
    {
      "collectionGroup": "projects",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "platform", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

## Error Handling

```typescript
try {
  await db.collection(COLLECTIONS.PROJECTS).doc(id).get()
} catch (error) {
  if (error.code === 'not-found') {
    return NextResponse.json({ error: '찾을 수 없습니다.' }, { status: 404 })
  }
  if (error.code === 'permission-denied') {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }
  console.error('Firestore error:', error)
  return NextResponse.json({ error: '서버 오류입니다.' }, { status: 500 })
}
```

## Limitations
- Firestore does not support full-text search (use client-side filtering)
- Maximum 500 documents per batch write
- Maximum 1 write per second per document
- Composite indexes required for complex queries
