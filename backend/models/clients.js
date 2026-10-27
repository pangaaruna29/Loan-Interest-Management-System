const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    paymentId: { type: String, required: true },
    paymentDate: { type: Date, required: true },
    paymentAmount: { type: Number, required: true, min: 0.01 },
    principalPaid: { type: Number, min: 0 },
    interestPaid: { type: Number, min: 0 },
    notes: { type: String, trim: true }
}, { _id: false });

const clientSchema = new mongoose.Schema({
    clientName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    principalAmount: { type: Number, required: true, min: 0.01 },
    interestRate: { type: Number, required: true, min: 0.01 },
    interestType: { type: String, required: true, enum: ['Simple Interest', 'Compound Interest'] },
    interestFrequency: { type: String, required: true, enum: ['Daily', 'Weekly', 'Monthly', 'Yearly'] },
    startDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    paymentStatus: { type: String, default: 'Pending' },
    amountPaid: { type: Number, default: 0, min: 0 },
    payments: { type: [paymentSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true }
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);