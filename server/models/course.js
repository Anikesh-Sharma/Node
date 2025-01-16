import mongoose from 'mongoose';
import logger from '../logger.js';

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Programming', 'Design', 'Business', 'Marketing', 'Other']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    min: [1, 'Capacity must be at least 1']
  },
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  }
}, {
  timestamps: true
});

// Custom method to add a student to the course
courseSchema.methods.addStudent = async function(studentId) {
  try {
    // Check if student is already enrolled
    if (this.enrolledStudents.includes(studentId)) {
      throw new Error('Student is already enrolled in this course');
    }

    // Check course capacity
    if (this.enrolledStudents.length >= this.capacity) {
      throw new Error('Course has reached maximum capacity');
    }

    // Add student to course
    this.enrolledStudents.push(studentId);
    await this.save();

    // Add course to student's enrolled courses
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(
      studentId,
      { $addToSet: { enrolledCourses: this._id } }
    );

    logger.info(`Student ${studentId} successfully enrolled in course ${this._id}`);
    return true;
  } catch (error) {
    logger.error('Error enrolling student:', error);
    throw error;
  }
};

// Custom method to remove a student from the course
courseSchema.methods.removeStudent = async function(studentId) {
  try {
    // Check if student is enrolled
    if (!this.enrolledStudents.includes(studentId)) {
      throw new Error('Student is not enrolled in this course');
    }

    // Remove student from course
    this.enrolledStudents = this.enrolledStudents.filter(
      id => id.toString() !== studentId.toString()
    );
    await this.save();

    // Remove course from student's enrolled courses
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(
      studentId,
      { $pull: { enrolledCourses: this._id } }
    );

    logger.info(`Student ${studentId} successfully unenrolled from course ${this._id}`);
    return true;
  } catch (error) {
    logger.error('Error removing student:', error);
    throw error;
  }
};

// Pre-remove hook to check for enrolled students before deletion
courseSchema.pre('remove', async function(next) {
  if (this.enrolledStudents.length > 0) {
    const error = new Error('Cannot delete course with enrolled students');
    error.status = 400;
    return next(error);
  }
  next();
});

const Course = mongoose.model('Course', courseSchema);

export default Course;