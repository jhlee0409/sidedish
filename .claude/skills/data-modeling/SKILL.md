---
name: data-modeling
description: Firestore 데이터 모델링과 스키마 설계 패턴을 적용합니다. 새 컬렉션 추가, 관계 설계, 인덱스 최적화, 데이터 마이그레이션 시 사용하세요. NoSQL 특성에 맞는 비정규화 전략을 포함합니다.
allowed-tools: Read, Glob, Grep
---

# Data Modeling Skill

## Instructions

1. **Denormalize** frequently accessed data (NoSQL has no joins)
2. Use **composite keys** for unique relationships (e.g., `${userId}_${projectId}`)
3. Maintain **counters** on parent documents for read optimization
4. Use **soft delete** for legal compliance
5. Apply consistent **timestamp patterns**

## Current Collections

```
firestore/
├── projects        # Main content
├── users           # User profiles
├── comments        # Project comments
├── whispers        # Private feedback
├── ai_usage        # AI rate limiting
├── likes           # User-project likes (composite key)
├── digests         # Newsletter digests
└── subscriptions   # Newsletter subscriptions
```

## Key Patterns

```typescript
// Denormalization: embed author info
const project = {
  authorId: 'user123',
  authorName: '홍길동',  // Copied from user
}

// Composite Key: unique constraint
const likeId = `${userId}_${projectId}`

// Counter Pattern
await docRef.update({ likes: FieldValue.increment(1) })
```

For complete schemas, design patterns, and migration strategies, see [reference.md](reference.md).
