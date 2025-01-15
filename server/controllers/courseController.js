import Course from '../models/course.js';
import User from '../models/user.js';
import logger from '../logger.js';

export const createCourse = async (req, res) => {
  try {
    const course = new Course(req.body);
    await course.save();
    logger.info(`Course created: ${course._id}`);
    res.status(201).json(course);
  } catch (error) {
    logger.error('Error creating course:', error);
    res.status(400).json({ error: error.message });
  }
};

export const enrollStudent = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;
    const course = await Course.findById(courseId);
    
    if (!course) {
      throw new Error('Course not found');
    }

    await course.addStudent(studentId);
    res.json({ message: 'Student enrolled successfully' });
  } catch (error) {
    logger.error('Error enrolling student:', error);
    res.status(400).json({ error: error.message });
  }
};

export const unenrollStudent = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;
    const course = await Course.findById(courseId);
    
    if (!course) {
      throw new Error('Course not found');
    }

    await course.removeStudent(studentId);
    res.json({ message: 'Student unenrolled successfully' });
  } catch (error) {
    logger.error('Error unenrolling student:', error);
    res.status(400).json({ error: error.message });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      throw new Error('Course not found');
    }

    if (course.enrolledStudents.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete course with enrolled students',
        enrolledCount: course.enrolledStudents.length
      });
    }

    await course.remove();
    logger.info(`Course deleted: ${course._id}`);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    logger.error('Error deleting course:', error);
    res.status(400).json({ error: error.message });
  }
};