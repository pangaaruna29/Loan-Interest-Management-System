const mongoose = require('mongoose');
let connectionPromise;

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) return mongoose.connection;
    if (!process.env.MONGODB_URL) {
        throw new Error('MONGODB_URL is not configured');
    }

    if (mongoose.connection.readyState === 0) {
        connectionPromise = null;
    }
    if (!connectionPromise) {
        connectionPromise = mongoose.connect(process.env.MONGODB_URL)
            .then(() => {
                console.log('MongoDB connected successfully');
                return mongoose.connection;
            })
            .catch((error) => {
                connectionPromise = null;
                throw error;
            });
    }

    try {
        return await connectionPromise;
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        throw error;
    }
};

module.exports = connectDB;