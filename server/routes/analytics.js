import express from 'express';
import { getUserAnalytics, getCourseAnalytics } from '../controllers/analyticsController.js';

const router = express.Router();

// Analytics routes
router.get('/user-count', getUserAnalytics);
router.get('/course-count', getCourseAnalytics);

export default router;