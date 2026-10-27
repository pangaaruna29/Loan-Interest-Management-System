const sessionCookieName = 'loan_session';

const sessionCookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api'
};

module.exports = { sessionCookieName, sessionCookieOptions };
