import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import logger from './logger.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting middleware with custom key generator
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for'] || req.ip || 'anonymous';
  }
});

app.set('trust proxy', 1);
app.use(limiter);
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(morgan(':method :url :status :response-time ms - :res[content-length]', {
  stream: { write: message => logger.info(message.trim()) }
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Auth middleware
const authMiddleware = (allowedRoles = ['user']) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn(`Authentication failed: No token provided - ${req.method} ${req.path}`);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token is required'
      });
    }

    try {
      const [role, token] = authHeader.split(' ')[1].split(':');

      if (token !== 'dummy-token-123') {
        logger.warn(`Authentication failed: Invalid token - ${req.method} ${req.path}`);
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid authentication token'
        });
      }

      if (!allowedRoles.includes(role)) {
        logger.warn(`Authorization failed: Invalid role ${role} for ${req.method} ${req.path}`);
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to access this resource'
        });
      }

      req.user = { role, token };
      next();
    } catch (error) {
      logger.error('Auth middleware error:', error);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authentication token format'
      });
    }
  };
};

// Mock data
let courses = [];
let users = [
  { id: '1', email: 'admin@example.com', role: 'admin', name: 'Admin User' },
  { id: '2', email: 'instructor@example.com', role: 'instructor', name: 'John Doe' },
  { id: '3', email: 'student@example.com', role: 'student', name: 'Jane Smith' }
];

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the LMS API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      courses: '/api/courses',
      analytics: '/api/analytics'
    }
  });
});

// Analytics routes
app.get('/api/analytics/user-count', authMiddleware(['admin']), (req, res) => {
  try {
    // Group users by role
    const roleDistribution = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    // Convert to array format
    const analytics = Object.entries(roleDistribution).map(([role, count]) => ({
      role,
      count
    }));

    // Sort by count descending
    analytics.sort((a, b) => b.count - a.count);

    logger.info('User analytics generated successfully');
    res.json({
      totalUsers: users.length,
      roleDistribution: analytics
    });
  } catch (error) {
    logger.error('Error generating user analytics:', error);
    res.status(500).json({ error: 'Failed to generate user analytics' });
  }
});

app.get('/api/analytics/course-count', authMiddleware(['admin']), (req, res) => {
  try {
    // Group courses by category
    const categoryGroups = courses.reduce((acc, course) => {
      const category = course.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = {
          count: 0,
          totalEnrolled: 0,
          totalCapacity: 0
        };
      }
      acc[category].count++;
      acc[category].totalEnrolled += course.enrolledStudents.length;
      acc[category].totalCapacity += course.capacity || 0;
      return acc;
    }, {});

    // Convert to array format with calculated metrics
    const analytics = Object.entries(categoryGroups).map(([category, data]) => ({
      category,
      count: data.count,
      totalEnrolled: data.totalEnrolled,
      averageCapacity: Math.round((data.totalCapacity / data.count) * 100) / 100,
      enrollmentRate: Math.round((data.totalEnrolled / data.totalCapacity) * 100 * 100) / 100
    }));

    // Sort by count descending
    analytics.sort((a, b) => b.count - a.count);

    logger.info('Course analytics generated successfully');
    res.json({
      totalCourses: courses.length,
      categoryDistribution: analytics
    });
  } catch (error) {
    logger.error('Error generating course analytics:', error);
    res.status(500).json({ error: 'Failed to generate course analytics' });
  }
});

// Course routes
app.post('/api/courses', authMiddleware(['admin', 'instructor']), (req, res) => {
  const course = {
    id: Date.now().toString(),
    ...req.body,
    enrolledStudents: [],
    createdAt: new Date().toISOString()
  };
  courses.push(course);
  logger.info(`Course created: ${course.id}`);
  res.status(201).json(course);
});

app.get('/api/courses', authMiddleware(['admin', 'instructor', 'student']), (req, res) => {
  // Transform courses to match the expected frontend format
  const transformedCourses = courses.map(course => ({
    id: course.id,
    title: course.title,
    instructor: course.instructor,
    progress: Math.floor(Math.random() * 100), // Mock progress
    totalModules: 10, // Mock total modules
    completedModules: Math.floor(Math.random() * 10), // Mock completed modules
    nextLesson: 'Introduction to React', // Mock next lesson
    duration: '8 weeks' // Mock duration
  }));
  res.json(transformedCourses);
});

app.post('/api/courses/:courseId/enroll/:studentId', authMiddleware(['admin', 'instructor']), (req, res) => {
  const course = courses.find(c => c.id === req.params.courseId);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }
  
  if (course.enrolledStudents.includes(req.params.studentId)) {
    return res.status(400).json({ error: 'Student already enrolled' });
  }
  
  course.enrolledStudents.push(req.params.studentId);
  res.json({ message: 'Student enrolled successfully' });
});

app.delete('/api/courses/:courseId/enroll/:studentId', authMiddleware(['admin', 'instructor']), (req, res) => {
  const course = courses.find(c => c.id === req.params.courseId);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }
  
  course.enrolledStudents = course.enrolledStudents.filter(id => id !== req.params.studentId);
  res.json({ message: 'Student unenrolled successfully' });
});

app.delete('/api/courses/:id', authMiddleware(['admin']), (req, res) => {
  const courseIndex = courses.findIndex(c => c.id === req.params.id);
  if (courseIndex === -1) {
    return res.status(404).json({ error: 'Course not found' });
  }
  
  if (courses[courseIndex].enrolledStudents.length > 0) {
    return res.status(400).json({
      error: 'Cannot delete course with enrolled students',
      enrolledCount: courses[courseIndex].enrolledStudents.length
    });
  }
  
  courses.splice(courseIndex, 1);
  res.json({ message: 'Course deleted successfully' });
});

// Health check route
app.get('/api/health', (req, res) => {
  logger.info('Health check performed');
  res.json({ 
    status: 'ok', 
    message: 'LMS API is running'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params
  });

  const errorResponse = {
    error: {
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message,
      status: err.status || 500,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    }
  };

  if (process.env.NODE_ENV !== 'production') {
    errorResponse.error.stack = err.stack;
  }

  res.status(errorResponse.error.status).json(errorResponse);
});

// 404 handler
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404,
      path: req.path,
      method: req.method
    }
  });
});

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});