import User from '../models/user.js';
import Course from '../models/course.js';
import logger from '../logger.js';

export const getUserAnalytics = async (req, res) => {
  try {
    const analytics = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          role: '$_id',
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const totalUsers = await User.countDocuments();

    logger.info('User analytics generated successfully');
    res.json({
      totalUsers,
      roleDistribution: analytics
    });
  } catch (error) {
    logger.error('Error generating user analytics:', error);
    res.status(500).json({ error: 'Failed to generate user analytics' });
  }
};

export const getCourseAnalytics = async (req, res) => {
  try {
    const analytics = await Course.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalEnrolled: { $sum: { $size: '$enrolledStudents' } },
          averageCapacity: { $avg: '$capacity' }
        }
      },
      {
        $project: {
          category: '$_id',
          count: 1,
          totalEnrolled: 1,
          averageCapacity: { $round: ['$averageCapacity', 2] },
          enrollmentRate: {
            $round: [
              { $multiply: [
                { $divide: ['$totalEnrolled', { $multiply: ['$count', '$averageCapacity'] }] },
                100
              ]}, 
              2
            ]
          },
          _id: 0
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const totalCourses = await Course.countDocuments();

    logger.info('Course analytics generated successfully');
    res.json({
      totalCourses,
      categoryDistribution: analytics
    });
  } catch (error) {
    logger.error('Error generating course analytics:', error);
    res.status(500).json({ error: 'Failed to generate course analytics' });
  }
};