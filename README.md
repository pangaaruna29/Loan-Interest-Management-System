# Loan & Interest Management System

## Frontend

```sh
cd frontend/loan-interest-management-system-ui
npm install
npm start
```

The Angular dev server proxies `/api` requests to the backend at `http://localhost:3000`.

## Backend

Set the required settings before starting the backend. Keep the JWT signing key in
`backend/.env.local` so it is not committed:

```env
JWT_SECRET=your-long-random-secret
```

Generate a secret locally with:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`backend/.env.local` is loaded before `backend/.env`; the regular `.env` can
continue to provide `PORT` and `MONGODB_URL`. Keep the generated value private.
The backend stores login sessions in an HttpOnly cookie, so the browser can
restore a session after refresh without exposing the JWT to frontend JavaScript.

```sh
cd backend
npm install
node index.js
```