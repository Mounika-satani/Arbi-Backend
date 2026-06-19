const express = require('express');
const router = express.Router();
const simulationController = require('../controllers/simulationController');

router.post('/', simulationController.simulateFailure);
router.get('/history', simulationController.getHistory);

module.exports = router;
