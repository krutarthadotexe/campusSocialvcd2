# campusSocialvcd

## Deployment

Recommended setup:

- Frontend: Vercel
- Backend: Railway
- Database: MongoDB Atlas

### 1. Deploy the backend to Railway

Create a Railway project from this repository root and deploy the backend service from the root folder.

Railway backend environment variables:

```env
NODE_ENV=production
PORT=4000
MONGO_URI=your-mongodb-atlas-uri
JWT_ACCESS_SECRET=your-long-random-access-secret
JWT_REFRESH_SECRET=your-long-random-refresh-secret
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
TEACHER_ROLE_PASSWORD=Teacher123
REFRESH_COOKIE_NAME=refreshToken
CORS_ORIGIN=https://your-vercel-frontend-domain.vercel.app
```

Notes:

- Railway will provide its own public backend URL, for example `https://your-api.up.railway.app`
- if you use a custom frontend domain later, update `CORS_ORIGIN`
- you can also provide multiple allowed origins as a comma-separated list in `CORS_ORIGIN`

### 2. Deploy the frontend to Vercel

Create a Vercel project using the `client/` folder as the project root.

Vercel frontend environment variables:

```env
VITE_API_BASE_URL=https://your-api.up.railway.app
```

The frontend automatically normalizes that value to `.../api/v1`.

### 3. Important auth/cookie behavior

For production:

- the backend sends refresh cookies with `SameSite=None`
- cookies are marked `Secure`
- the frontend uses `credentials: include`

That setup is required for Vercel frontend + Railway backend to keep login refresh working across domains.

### 4. Local development

Backend:

```bash
npm run dev
```

Frontend:

```bash
npm run client:dev
```

Optional frontend local env in `client/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:4000
```
