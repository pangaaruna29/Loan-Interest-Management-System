const service = require('../services/clientService');

const handleError = (res, error) => res.status(error.status || 500).json({
    message: error.message || 'Internal Server Error'
});

const createClient = async (req, res) => {
    try {
        const client = await service.createClient(req.body, req.user.id);
        return res.status(201).json({ client });
    } catch (error) {
        return handleError(res, error);
    }
};

const getClients = async (req, res) => {
    try {
        const clients = await service.getClients(req.user.id);
        return res.status(200).json({ clients });
    } catch (error) {
        return handleError(res, error);
    }
};

const getDashboardSummary = async (_req, res) => {
    try {
        const summary = await service.getDashboardSummary();
        return res.status(200).json({ summary });
    } catch (error) {
        return handleError(res, error);
    }
};

const getPublicDashboardSummary = async (_req, res) => {
    try {
        const summary = await service.getPublicDashboardSummary();
        return res.status(200).json({ summary });
    } catch (error) {
        return handleError(res, error);
    }
};

const getClient = async (req, res) => {
    try {
        const client = await service.getClient(req.params.id, req.user.id);
        if (!client) return res.status(404).json({ message: 'Client not found' });
        return res.status(200).json({ client });
    } catch (error) {
        return handleError(res, error);
    }
};

const updateClient = async (req, res) => {
    try {
        const client = await service.updateClient(req.params.id, req.body, req.user.id);
        if (!client) return res.status(404).json({ message: 'Client not found' });
        return res.status(200).json({ client });
    } catch (error) {
        return handleError(res, error);
    }
};

const deleteClient = async (req, res) => {
    try {
        const client = await service.deleteClient(req.params.id, req.user.id);
        if (!client) return res.status(404).json({ message: 'Client not found' });
        return res.status(200).json({ message: 'Client deleted successfully' });
    } catch (error) {
        return handleError(res, error);
    }
};

module.exports = {
    createClient,
    getClients,
    getDashboardSummary,
    getPublicDashboardSummary,
    getClient,
    updateClient,
    deleteClient
};