const normalizeOrigin = (value) => {
    if (typeof value !== 'string' || !value.trim()) return null;

    try {
        const url = new URL(value.trim());
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
        return url.origin;
    } catch {
        return null;
    }
};

const allowedFrontendOrigins = new Set([
    'https://loan-interest-management-system.vercel.app',
    'https://loan-interest-management-system-8up.vercel.app',
    'http://localhost:4200',
    ...(process.env.FRONTEND_ORIGIN || '')
        .split(',')
        .map(normalizeOrigin)
        .filter(Boolean),
    normalizeOrigin(process.env.FRONTEND_URL),
    process.env.CODESPACE_NAME
        ? normalizeOrigin(`https://${process.env.CODESPACE_NAME}-4200.app.github.dev`)
        : null
].filter(Boolean));

const getAllowedFrontendOrigin = (origin) => {
    const normalizedOrigin = normalizeOrigin(origin);
    return normalizedOrigin && allowedFrontendOrigins.has(normalizedOrigin)
        ? normalizedOrigin
        : null;
};

const getPasswordResetFrontendUrl = (requestOrigin) => {
    const trustedOrigin = getAllowedFrontendOrigin(requestOrigin);
    if (trustedOrigin) return trustedOrigin;

    const configuredUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const configuredOrigin = normalizeOrigin(configuredUrl);
    if (!configuredOrigin) {
        throw new Error('FRONTEND_URL must be a valid absolute HTTP(S) URL');
    }
    return configuredOrigin;
};

module.exports = { getAllowedFrontendOrigin, getPasswordResetFrontendUrl };
