const mongoose = require('mongoose');
const Client = require('../models/clients');

const editableFields = [
    'clientName', 'phoneNumber', 'principalAmount', 'interestRate', 'interestType',
    'interestFrequency', 'startDate', 'dueDate', 'paymentStatus', 'amountPaid', 'payments'
];
const requiredFields = [
    'clientName', 'phoneNumber', 'principalAmount', 'interestRate', 'interestType',
    'interestFrequency', 'startDate', 'dueDate'
];

const validationError = (message) => {
    const error = new Error(message);
    error.status = 400;
    return error;
};

const validatePaymentFields = (data) => {
    if (data.amountPaid !== undefined && (!Number.isFinite(Number(data.amountPaid)) || Number(data.amountPaid) < 0)) {
        throw validationError('Amount paid must be zero or greater');
    }
    if (data.payments !== undefined && !Array.isArray(data.payments)) {
        throw validationError('Payments must be an array');
    }
};

const pickEditableFields = (data) => Object.fromEntries(
    editableFields.filter((field) => Object.hasOwn(data, field)).map((field) => [field, data[field]])
);

const validateClientData = (data) => {
    for (const field of requiredFields) {
        if (['principalAmount', 'interestRate'].includes(field)) {
            continue;
        }
        if (['startDate', 'dueDate'].includes(field)) {
            if (!(data[field] instanceof Date) && (typeof data[field] !== 'string' || !data[field].trim())) {
                throw validationError(`${field} is required`);
            }
            continue;
        }
        if (typeof data[field] !== 'string') {
            throw validationError(`${field} is required`);
        }
        if (typeof data[field] === 'string' && !data[field].trim()) {
            throw validationError(`${field} is required`);
        }
    }
    if (!/^\d{10}$/.test(data.phoneNumber)) throw validationError('Phone number must contain 10 digits');
    if (!Number.isFinite(Number(data.principalAmount)) || Number(data.principalAmount) <= 0) {
        throw validationError('Principal amount must be greater than zero');
    }
    if (!Number.isFinite(Number(data.interestRate)) || Number(data.interestRate) <= 0) {
        throw validationError('Interest rate must be greater than zero');
    }
    if (!['Simple Interest', 'Compound Interest'].includes(data.interestType)) {
        throw validationError('Interest type is invalid');
    }
    if (!['Daily', 'Weekly', 'Monthly', 'Yearly'].includes(data.interestFrequency)) {
        throw validationError('Interest frequency is invalid');
    }
    const startDate = new Date(data.startDate);
    const dueDate = new Date(data.dueDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(dueDate.getTime()) || dueDate <= startDate) {
        throw validationError('Due date must be after a valid start date');
    }
    validatePaymentFields(data);
};

const validateId = (id) => {
    if (!mongoose.isValidObjectId(id)) throw validationError('Client ID is invalid');
};

const parseDate = (value) => {
    if (value instanceof Date) {
        return Number.isNaN(value.getTime())
            ? null
            : new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
    }
    if (typeof value !== 'string') return null;

    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    const date = match
        ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
        : new Date(value);
    return Number.isNaN(date.getTime())
        ? null
        : new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const addPeriod = (date, unit, count = 1) => {
    const months = (unit === 'year' ? 12 : 1) * count;
    const targetMonth = date.getUTCMonth() + months;
    const targetYear = date.getUTCFullYear() + Math.floor(targetMonth / 12);
    const month = targetMonth % 12;
    const finalDay = new Date(Date.UTC(targetYear, month + 1, 0)).getUTCDate();
    return new Date(Date.UTC(targetYear, month, Math.min(date.getUTCDate(), finalDay)));
};

const calendarPeriods = (start, end, unit) => {
    let anchor = start;
    let wholePeriods = 0;
    let next = addPeriod(anchor, unit);

    while (next <= end) {
        anchor = next;
        wholePeriods += 1;
        next = addPeriod(start, unit, wholePeriods + 1);
    }

    const periodLength = next.getTime() - anchor.getTime();
    return wholePeriods + (periodLength > 0 ? (end.getTime() - anchor.getTime()) / periodLength : 0);
};

const calculateInterest = (client, endDate) => {
    const start = parseDate(client.startDate);
    const end = parseDate(endDate);
    const principal = Number(client.principalAmount);
    const rate = Number(client.interestRate);
    if (!start || !end || end <= start || principal <= 0 || rate <= 0) return 0;

    const days = Math.floor((end.getTime() - start.getTime()) / 86400000);
    let periods;
    switch (String(client.interestFrequency).toLowerCase()) {
        case 'daily':
            periods = days;
            break;
        case 'weekly':
            periods = days / 7;
            break;
        case 'yearly':
            periods = calendarPeriods(start, end, 'year');
            break;
        case 'monthly':
        default:
            periods = calendarPeriods(start, end, 'month');
            break;
    }

    const compound = String(client.interestType).toLowerCase().includes('compound');
    const interest = compound
        ? principal * (Math.pow(1 + rate / 100, periods) - 1)
        : principal * (rate / 100) * periods;
    return Number.isFinite(interest) ? interest : 0;
};

const paymentTotal = (client) => (client.payments ?? []).reduce(
    (total, payment) => total + (Number.isFinite(Number(payment.paymentAmount)) ? Number(payment.paymentAmount) : 0),
    0
);

const getDashboardSummary = async () => {
    const clients = await Client.find({})
        .select('principalAmount interestRate interestType interestFrequency startDate dueDate amountPaid payments createdAt')
        .lean();
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const todayMonth = today.getUTCMonth();
    const todayYear = today.getUTCFullYear();
    const monthStart = new Date(Date.UTC(todayYear, todayMonth, 1));
    const dueSoonEnd = new Date(today.getTime() + 30 * 86400000);
    const monthBuckets = new Map();
    const monthlyLoanCounts = new Map();

    for (let offset = 7; offset >= 0; offset -= 1) {
        const date = new Date(Date.UTC(todayYear, todayMonth - offset, 1));
        const key = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}`;
        monthBuckets.set(key, {
            year: date.getUTCFullYear(),
            month: date.getUTCMonth() + 1,
            amount: 0
        });
        const isCurrentMonth = date.getUTCFullYear() === todayYear && date.getUTCMonth() === todayMonth;
        const periodEnd = isCurrentMonth
            ? today
            : new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
        monthlyLoanCounts.set(key, {
            year: date.getUTCFullYear(),
            month: date.getUTCMonth() + 1,
            activeLoans: 0,
            dueSoonLoans: 0,
            periodEnd
        });
    }

    let totalPrincipal = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let activeLoans = 0;
    let dueSoonLoans = 0;
    let createdThisMonth = 0;

    for (const client of clients) {
        const principal = Number(client.principalAmount) || 0;
        const paid = Math.max(Number(client.amountPaid) || 0, paymentTotal(client));
        const outstanding = Math.max(0, principal + calculateInterest(client, today) - paid);
        const dueDate = parseDate(client.dueDate);
        const createdAt = parseDate(client.createdAt);

        for (const loanMonth of monthlyLoanCounts.values()) {
            const startDate = parseDate(client.startDate);
            if (!startDate || startDate > loanMonth.periodEnd || (createdAt && createdAt > loanMonth.periodEnd)) continue;
            const historicalPaid = (client.payments ?? []).length > 0
                ? client.payments.reduce((total, payment) => {
                    const paymentDate = parseDate(payment.paymentDate);
                    return paymentDate && paymentDate <= loanMonth.periodEnd
                        ? total + (Number(payment.paymentAmount) || 0)
                        : total;
                }, 0)
                : Number(client.amountPaid) || 0;
            const historicalOutstanding = Math.max(
                0,
                principal + calculateInterest(client, loanMonth.periodEnd) - historicalPaid
            );
            if (historicalOutstanding > 0) {
                loanMonth.activeLoans += 1;
                const periodDueSoonEnd = new Date(loanMonth.periodEnd.getTime() + 30 * 86400000);
                if (dueDate && dueDate >= loanMonth.periodEnd && dueDate <= periodDueSoonEnd) {
                    loanMonth.dueSoonLoans += 1;
                }
            }
        }

        totalPrincipal += principal;
        totalCollected += paid;
        totalOutstanding += outstanding;
        if (outstanding > 0) {
            activeLoans += 1;
            if (dueDate && dueDate >= today && dueDate <= dueSoonEnd) dueSoonLoans += 1;
        }

        if (createdAt && createdAt >= monthStart && createdAt <= today) createdThisMonth += 1;

        for (const payment of client.payments ?? []) {
            const paymentDate = parseDate(payment.paymentDate);
            if (!paymentDate) continue;
            const key = `${paymentDate.getUTCFullYear()}-${paymentDate.getUTCMonth() + 1}`;
            const bucket = monthBuckets.get(key);
            if (bucket) {
                bucket.amount += Number(payment.paymentAmount) || 0;
            }
        }
    }

    return {
        totalClients: clients.length,
        activeLoans,
        dueSoonLoans,
        totalPrincipal,
        totalCollected,
        totalOutstanding,
        createdThisMonth,
        monthlyPayments: [...monthBuckets.values()],
        monthlyLoanCounts: [...monthlyLoanCounts.values()].map(({ periodEnd, ...counts }) => counts)
    };
};

const getPublicDashboardSummary = async () => {
    const summary = await getDashboardSummary();
    return {
        totalClients: summary.totalClients,
        activeLoans: summary.activeLoans,
        dueSoonLoans: summary.dueSoonLoans,
        monthlyLoanCounts: summary.monthlyLoanCounts
    };
};

const createClient = async (data, userId) => {
    const fields = pickEditableFields(data);
    validateClientData(fields);
    return Client.create({ ...fields, createdBy: userId });
};

const getClients = (userId) => Client.find({ createdBy: userId }).sort({ createdAt: -1 });

const getClient = async (id, userId) => {
    validateId(id);
    return Client.findOne({ _id: id, createdBy: userId });
};

const updateClient = async (id, data, userId) => {
    validateId(id);
    const fields = pickEditableFields(data);
    const updatedFields = Object.keys(fields);
    const paymentFields = ['paymentStatus', 'amountPaid', 'payments'];

    if (updatedFields.length === 0) {
        return Client.findOne({ _id: id, createdBy: userId });
    }

    if (updatedFields.every((field) => paymentFields.includes(field))) {
        validatePaymentFields(fields);
        return Client.findOneAndUpdate(
            { _id: id, createdBy: userId },
            { $set: fields },
            { new: true, runValidators: true }
        );
    }

    const client = await Client.findOne({ _id: id, createdBy: userId });
    if (!client) return null;

    validateClientData({ ...client.toObject(), ...fields });
    Object.assign(client, fields);
    return client.save();
};

const deleteClient = async (id, userId) => {
    validateId(id);
    return Client.findOneAndDelete({ _id: id, createdBy: userId });
};

module.exports = {
    createClient,
    getClients,
    getClient,
    updateClient,
    deleteClient,
    getDashboardSummary,
    getPublicDashboardSummary
};