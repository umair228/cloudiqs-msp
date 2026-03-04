# Model B Invariants (External-Customer MSP)

This file defines non-negotiable runtime invariants for customer access.
Any implementation that violates these rules is out of scope.

## 1) Tenant Boundary

- Customer accounts are external.
- AWS Organizations data must not drive customer request/approval/grant behavior.

## 2) Request Plane (Runtime)

- Account dropdown source of truth is `Customers.accountIds`.
- No org account listing/intersection is allowed in customer request flow.
- For `mt-*` requests, customer selection is required.

## 3) Approval Plane (Runtime)

- For `mt-*`, approver resolution must use `Customers.approverGroupIds` only.
- No OU/account approver-table fallback for `mt-*`.
- No silent bypasses for `mt-*`.

## 4) Grant/Revoke Plane (Runtime)

- `mt-*` grant/revoke must use Model B path only (assume-role/broker).
- No SSO assignment path participation for `mt-*`.

## 5) Organizations Integration (If Kept)

- Organizations can exist only as admin diagnostics/inventory.
- It must be isolated from runtime customer access decisions.

## Change Gate (Mandatory)

Before merging any change, answer all questions with "yes":

1. Does this keep runtime account selection customer-scoped (`Customers.accountIds`)?
2. Does this avoid AWS Organizations in request/approval/grant runtime logic?
3. Does `mt-*` approval use only `Customers.approverGroupIds`?
4. Does `mt-*` grant/revoke stay on Model B path only?
5. If Organizations code exists, is it admin-only and isolated from runtime decisions?

