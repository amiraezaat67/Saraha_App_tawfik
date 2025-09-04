# Saraha App

This is a Node.js/Express backend for Saraha App, an anonymous messaging platform. It provides secure user authentication, profile management, and messaging features, including support for Google OAuth, profile pictures, privacy controls, and device login limits.

## Main Features

- User registration and authentication (email/password and Google OAuth)
- Profile management (update info, upload/delete profile pictures)
- Anonymous messaging (send, receive, manage messages)
- Privacy controls for messages
- Email verification and password recovery (OTP-based)
- Security: JWT tokens, token blacklisting, rate limiting, CORS, Helmet
- Cron jobs for scheduled background tasks (e.g., OTP expiration)
- Login is limited to a configurable number of devices per user

## API Overview

### Auth Endpoints (`/users`)

- `POST /users/register` — Register a new user
- `POST /users/auth-gmail` — Authenticate via Google OAuth
- `POST /users/login` — Login with email and password
- `POST /users/logout` — Logout (requires authentication)
- `POST /users/forget-Password` — Request password reset (sends OTP to email)
- `POST /users/refresh-token` — Refresh JWT tokens
- `POST /users/resend-email` — Resend email confirmation (requires authentication)
- `PATCH /users/confirm` — Confirm email with OTP (requires authentication)
- `PATCH /users/Reset-Password` — Reset password with OTP (requires authentication)
- `PATCH /users/update-password` — Update password (requires authentication)

### User Profile & Management (`/users`)

- `PUT /users/update` — Update user profile info (requires authentication)
- `PATCH /users/Upload-Profile-Picture` — Upload a profile picture (requires authentication, multipart/form-data)
- `DELETE /users/delete-user` — Delete user account (requires authentication)
- `DELETE /users/delete-message/:messageId` — Delete a specific message (requires authentication)
- `DELETE /users/Delete-Profile-Picture` — Delete profile picture (requires authentication)
- `PATCH /users/message-privacy/:messageId` — Change privacy of a message (requires authentication)
- `GET /users/list-users` — List all users (public)
- `GET /users/user-data/:id` — Get public profile data for a user
- `GET /users/user-messages` — Get all messages for the authenticated user

### Messaging (`/messages`)

- `POST /messages/send-message/:receiverId` — Send a message to a user (anonymous, validated)
- `GET /messages/user-public-messages/:userId` — Get all public messages for a user

## Security

- JWT authentication for all protected routes
- Token blacklisting for logout
- Rate limiting and CORS
- Helmet for HTTP headers
- OTPs for email confirmation and password recovery
- Login is limited to a configurable number of devices per user

## Environment Variables (`.env`)

- `PORT`: Server port
- `DATABASE_URL`: MongoDB connection string
- `ENCRYPTION_KEY`, `IV_LENGTH`: For encryption utilities
- `SALT_ROUNDS`: Bcrypt salt rounds
- `JWT_ACCESS_KEY`, `JWT_REFRESH_KEY`, `JWT_RECOVERY_KEY`: JWT secrets
- `JWT_ACCESS_EXPIRES_IN`, etc.: Token expiry durations
- `AUTHOR_EMAIL`, `AUTHOR_PASSWORD`: For sending emails
- `WEB_CLIENT_ID`: Google OAuth client ID
- `WHITELIST`: Allowed CORS origins

## Project Structure

```
src/
  index.js                # Main server entry
  config.js               # App config
  DB/                     # Database connection & models
  Middlewares/            # Auth, validation, rate limiting, uploads
  Modules/
    Users/Controllers/    # User & auth controllers
    Users/Services/       # User & auth business logic
    Messages/             # Message controllers & services
  Utils/                  # Cron jobs, encryption, email, tokens
  Validators/Schemas/     # Joi schemas for validation
  Common/Enums/           # Enums for user/message types
Uploads/
  Profile-Pic/            # Uploaded profile pictures
```

## How to Use

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up environment variables in a `.env` file as described above.
3. Run the server:
   ```bash
   npm start
   ```

## License

MIT
