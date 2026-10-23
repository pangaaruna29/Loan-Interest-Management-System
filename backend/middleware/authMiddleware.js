const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { sessionCookieName } = require('../config/auth');

const authenticate = (req, res, next) => {
	const authorization = req.headers.authorization;
	const [scheme, token] = authorization?.split(' ') ?? [];
	const cookieToken = (req.headers.cookie ?? '')
		.split(';')
		.map((cookie) => cookie.trim())
		.find((cookie) => cookie.startsWith(`${sessionCookieName}=`))
		?.slice(sessionCookieName.length + 1);
	const sessionToken = scheme === 'Bearer' && token ? token : cookieToken;
	if (!sessionToken) {
		return res.status(401).json({ message: 'Authentication required' });
	}
	if (!process.env.JWT_SECRET) {
		return res.status(500).json({ message: 'Authentication is not configured' });
	}

	try {
		const payload = jwt.verify(sessionToken, process.env.JWT_SECRET);
		if (typeof payload === 'string' || !mongoose.isValidObjectId(payload.sub)) {
			return res.status(401).json({ message: 'Invalid authentication token' });
		}
		req.user = { id: payload.sub };
		return next();
	} catch {
		return res.status(401).json({ message: 'Invalid or expired authentication token' });
	}
};

const authenticateOptional = (req, _res, next) => {
	const cookieToken = (req.headers.cookie ?? '')
		.split(';')
		.map((cookie) => cookie.trim())
		.find((cookie) => cookie.startsWith(`${sessionCookieName}=`))
		?.slice(sessionCookieName.length + 1);
	if (!cookieToken || !process.env.JWT_SECRET) return next();

	try {
		const payload = jwt.verify(cookieToken, process.env.JWT_SECRET);
		if (typeof payload !== 'string' && mongoose.isValidObjectId(payload.sub)) {
			req.user = { id: payload.sub };
		}
	} catch {
		// An invalid session cookie is treated as a signed-out session.
	}
	return next();
};

module.exports = authenticate;
module.exports.authenticateOptional = authenticateOptional;
