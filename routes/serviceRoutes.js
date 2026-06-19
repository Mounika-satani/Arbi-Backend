const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

router.post('/', serviceController.createService);
router.get('/', serviceController.getAllServices);
router.post('/dependency', serviceController.addDependency);
router.put('/:id', serviceController.updateService);
router.delete('/:id', serviceController.deleteService);
router.delete('/dependency/:serviceId/:dependsOnId', serviceController.deleteDependency);

module.exports = router;
