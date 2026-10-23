const express = require('express');
const authenticate = require('../middleware/authMiddleware');
const controller = require('../controllers/clientController');

const router = express.Router();

router.get('/public-summary', controller.getPublicDashboardSummary);
router.use(authenticate);
router.post('/', controller.createClient);
router.get('/', controller.getClients);
router.get('/summary', controller.getDashboardSummary);
router.get('/:id', controller.getClient);
router.put('/:id', controller.updateClient);
router.delete('/:id', controller.deleteClient);

module.exports = router;