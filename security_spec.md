# Security Specification - Money Bot Hub

## Data Invariants
1. **Ownership**: A bot or activity must always belong to the user who created it (`userId == request.auth.uid`).
2. **Relational Integrity**: Activities must reference an existing bot owned by the user.
3. **Immutability**: `userId` and `createdAt` fields must never change after creation.
4. **Terminal States**: (Not strictly applicable here yet, but bot status should be validated).
5. **ID Safety**: Document IDs must be within size limits and use safe characters.

## The "Dirty Dozen" Payloads

### Bot Collection (`/users/{userId}/bots/{botId}`)
1. **Identity Spoofing**: Create a bot for another user (`userId: "attacker_id"`).
2. **Shadow Field Injection**: Update a bot with a hidden field `isAdmin: true`.
3. **Privilege Escalation**: Update a bot to change its `userId`.
4. **Timestamp Fraud**: Set `createdAt` to a future date instead of `request.time`.
5. **ID Poisoning**: Use a 1MB string as a `botId`.
6. **Type Mismatch**: Set `status` to an integer instead of a string.
7. **Invalid Enum**: Set `type` to "malicious_bot".
8. **Orphaned Write**: Create a bot without a required field `name`.

### Activity Collection (`/users/{userId}/activities/{activityId}`)
9. **Log Forgery**: Create an activity log with a spoofed `timestamp`.
10. **Cross-User Leak**: Attempt to list activities of another user.
11. **Log Tampering**: Attempt to update an existing activity log (logs should be immutable).
12. **Content Overflow**: Create an activity with 1MB of text.

## Test Runner
Testing will be performed via `firestore.rules.test.ts` (simulated).
