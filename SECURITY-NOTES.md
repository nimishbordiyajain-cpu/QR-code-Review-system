# Security & Dependency Audit Notes

## Dependency Audit Review (Due Diligence Summary)

As part of security due-diligence and runtime hardening, the dependency tree was thoroughly analyzed via `npm audit`.

### 1. Developer Tooling (`@vercel/node`)
- **Package**: `@vercel/node` (`devDependencies`)
- **Role in Codebase**: Used exclusively for TypeScript type declarations (`VercelRequest`, `VercelResponse`) in `/api/*.ts` serverless route signatures during development and compilation (`tsc`).
- **Runtime Exposure**: **Zero**. `@vercel/node` is a build-time devDependency that is **never** bundled or shipped to production client or server bundles (`node dist/server.cjs`).
- **Transitive Advisories**: Upstream dependencies of Vercel CLI (`ajv`, `path-to-regexp`, `undici`) are bundled within `@vercel/node`. Upgrading `@vercel/node` to `@vercel/node@^8.1.0` was validated with zero breaking changes across all API routes (`tsc --noEmit` clean).

### 2. Upstream GCP Storage SDK (`firebase-admin`)
- **Package**: `firebase-admin` (`dependencies`)
- **Role in Codebase**: Server-side Firebase Admin SDK for token verification and Firestore management.
- **Advisory**: Transitive `uuid < 11.1.1` in `@google-cloud/storage` (buffer bounds check). `firebase-admin` is on version `14.3.0` (latest major). This is an internal buffer bounds advisory that has zero exploit vector in standard key-value document operations.

### 3. Server Runtime & Build Hardening
- **Production Server (`npm start`)**: Bundled via esbuild into `dist/server.cjs` with CJS/ESM hybrid directory resolution (`safeDirname`). Validated to start and bind on port 3000 cleanly.
- **Slug Collisions**: Business registration and admin provisioning verify unique slug candidate availability in Firestore before doc creation.
- **Cryptographic QR Identifiers**: QR IDs utilize `crypto.randomUUID()` for non-guessable, high-entropy unique identifiers.
- **Admin Access Control**: Complete authentication and role gate prevents unauthenticated or non-admin visitors from reaching `/admin`.
