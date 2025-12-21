# Firebase Operations Reference

## Firebase Admin Setup

```typescript
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'

COLLECTIONS.PROJECTS   // 'projects'
COLLECTIONS.USERS      // 'users'
COLLECTIONS.COMMENTS   // 'comments'
COLLECTIONS.WHISPERS   // 'whispers'
COLLECTIONS.AI_USAGE   // 'ai_usage'
```

## Basic Operations

### Get Single Document
```typescript
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

const projects = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
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

### Batch Writes
```typescript
const batch = db.batch()

batch.update(docRef1, { likes: FieldValue.increment(1) })
batch.delete(docRef2)
batch.set(db.collection(COLLECTIONS.COMMENTS).doc(), newComment)

await batch.commit()  // Max 500 operations
```

### Field Value Operations
```typescript
import { FieldValue } from 'firebase-admin/firestore'

// Increment
await docRef.update({ likes: FieldValue.increment(1) })

// Array operations
await docRef.update({
  tags: FieldValue.arrayUnion('new-tag'),
  oldTags: FieldValue.arrayRemove('old-tag'),
})

// Delete field
await docRef.update({ deprecatedField: FieldValue.delete() })

// Server timestamp
await docRef.update({ updatedAt: FieldValue.serverTimestamp() })
```

### Transactions
```typescript
await db.runTransaction(async (transaction) => {
  const doc = await transaction.get(docRef)
  if (!doc.exists) throw new Error('Document not found')

  const currentLikes = doc.data()?.likes || 0
  transaction.update(docRef, { likes: currentLikes + 1 })
})
```

## Query Patterns

### Compound Queries
```typescript
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
const firstPage = await db.collection(COLLECTIONS.PROJECTS)
  .orderBy('createdAt', 'desc')
  .limit(20)
  .get()

// Next page
const lastDoc = firstPage.docs[firstPage.docs.length - 1]
const nextPage = await db.collection(COLLECTIONS.PROJECTS)
  .orderBy('createdAt', 'desc')
  .startAfter(lastDoc)
  .limit(20)
  .get()
```

### Count Documents
```typescript
const snapshot = await db.collection(COLLECTIONS.PROJECTS)
  .where('authorId', '==', userId)
  .count()
  .get()

const count = snapshot.data().count
```

## Timestamp Handling

```typescript
import { Timestamp } from 'firebase-admin/firestore'

// Create
const now = Timestamp.now()
const fromDate = Timestamp.fromDate(new Date('2024-01-01'))

// Convert to ISO (for API Response)
const project = {
  ...doc.data(),
  createdAt: doc.data().createdAt?.toDate().toISOString(),
}

// Query by date range
const startDate = Timestamp.fromDate(new Date('2024-01-01'))
const snapshot = await db.collection(COLLECTIONS.PROJECTS)
  .where('createdAt', '>=', startDate)
  .get()
```

## Common Patterns

### Soft Delete
```typescript
await docRef.update({
  isDeleted: true,
  deletedAt: Timestamp.now(),
})

// Query excludes deleted
const snapshot = await db.collection(COLLECTIONS.PROJECTS)
  .where('isDeleted', '!=', true)
  .get()
```

### Upsert
```typescript
await docRef.set(data, { merge: true })
```

## Indexes

Composite queries require indexes in `firestore.indexes.json`:

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

## Limitations
- No full-text search (use client-side filtering)
- Max 500 docs per batch write
- Max 1 write/sec per document
- Composite indexes required for complex queries
