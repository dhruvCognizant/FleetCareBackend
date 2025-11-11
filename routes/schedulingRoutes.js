const express = require('express');
const router = express.Router();

const { specificScheduleService,getSchechuledServices,getVehicle, getTechnitian, getUnassignedServices} = require('../controllers/schedulingController');
const { validateSchedule } = require('../validator/schedule_validator');
const { authorizeRole } = require('../middlewares/auth');

router.get(`/vehicle/:id`,authorizeRole('admin'),getVehicle);
router.get('/available-technicians',authorizeRole('admin'), getTechnitian);
router.post('/schedule',authorizeRole('admin'),validateSchedule,specificScheduleService)

router.get('/scheduledServices',authorizeRole('admin'),getSchechuledServices)

router.get('/unassigned',authorizeRole('admin'),getUnassignedServices);

module.exports = router;
