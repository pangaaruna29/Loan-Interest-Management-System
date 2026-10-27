const sessionCookieName = 'loan_session';

const sessionCookieOptions = {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api'
};

module.exports = { sessionCookieName, sessionCookieOptions };
