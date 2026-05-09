# Security Specification - Firestore

## 1. Data Invariants
- **Identity Integrity**: Users can only read and write their own data (User Profile, Notifications, Orders specifically assigned to them).
- **Admin Supremacy**: Users with `role: 'admin'` or `isAdmin: true` in the `users` collection (verified via server-side lookup) have elevated access to manage products, categories, settings, and view all orders.
- **Relational Integrity**: 
  - Reviews must be attached to a valid `productId` and `userId`.
  - Orders must have valid `userId`.
- **Administrative Immutability**: Customers cannot upgrade their own `role` or set `isAdmin` to `true`.
- **Resource Exhaustion Guard**: All document IDs and string fields must have size constraints.

## 2. The "Dirty Dozen" Payloads (Attack Vectors)
1. **Self-Promotion**: Authenticated user attempts to set `isAdmin: true` on their own profile during account creation.
2. **Profile Hijack**: User A attempts to update User B's profile.
3. **Orphaned Review**: User attempts to create a review with a non-existent `productId`.
4. **ID Poisoning**: Malicious actor attempts to create a document with a 1MB string as the ID.
5. **Unauthorized Admin Access**: Non-admin attempts to delete a product.
6. **Price Tampering**: User attempts to update an order's `total` after creation.
7. **Bypass Verification**: User with unverified email attempts to perform sensitive writes (if required).
8. **Inventory Exhaustion**: User attempts to "update" stockCount to a negative number or bypass the decrement logic.
9. **Global Read Leak**: Unauthenticated user attempts to list all users.
10. **Coupon Theft**: User attempts to manually increment `usedCount` on a coupon without placing an order.
11. **PII Exposure**: User attempts to "get" another user's profile to see their email/phone.
12. **State Skipping**: User attempts to "update" an order status from `pending` directly to `delivered`.

## 3. Test Runner Plan
- Verify `PERMISSION_DENIED` for all Dirty Dozen payloads.
- Verify `PERMISSION_OK` for legitimate owner actions.
- Verify `PERMISSION_OK` for legitimate admin management.
