import React, { useEffect, useState } from 'react';
import { 
  BookOpen, 
  Server, 
  Layout, 
  Users, 
  Calendar, 
  BookOpenCheck,
  GraduationCap,
  Clock,
  CheckCircle2,
  BarChart3
} from 'lucide-react';
import axios from 'axios';

// Types
interface Course {
  id: string;
  title: string;
  instructor: string;
  progress: number;
  totalModules: number;
  completedModules: number;
  nextLesson: string;
  duration: string;
}

interface Assignment {
  id: number;
  title: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded';
  course: string;
}

interface Announcement {
  id: number;
  title: string;
  date: string;
  content: string;
}

function App() {
  const [apiStatus, setApiStatus] = useState<string>('Checking...');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [courses, setCourses] = useState<Course[]>([]);

  const [assignments] = useState<Assignment[]>([
    {
      id: 1,
      title: "React Components Project",
      dueDate: "2024-03-20",
      status: "pending",
      course: "Introduction to React Development"
    },
    {
      id: 2,
      title: "JavaScript Algorithms",
      dueDate: "2024-03-25",
      status: "submitted",
      course: "Advanced JavaScript Concepts"
    },
    {
      id: 3,
      title: "Design System Creation",
      dueDate: "2024-03-18",
      status: "graded",
      course: "UI/UX Design Principles"
    }
  ]);

  const [announcements] = useState<Announcement[]>([
    {
      id: 1,
      title: "New Course Available",
      date: "2024-03-15",
      content: "We're excited to announce a new course on TypeScript Development!"
    },
    {
      id: 2,
      title: "System Maintenance",
      date: "2024-03-17",
      content: "The platform will be under maintenance on Sunday from 2 AM to 4 AM EST."
    }
  ]);

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/health');
        setApiStatus(response.data.message);
        setError(null);
      } catch (err) {
        if (err instanceof Error) {
          setError('Failed to connect to the API');
        }
        setApiStatus('Offline');
      }
    };

    const fetchCourses = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/courses', {
          headers: {
            Authorization: 'Bearer student:dummy-token-123'
          }
        });
        setCourses(response.data);
      } catch (err) {
        if (err instanceof Error) {
          setError(`Failed to fetch courses: ${err.message}`);
        }
      }
    };

    checkApiStatus();
    fetchCourses();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-500';
      case 'submitted': return 'text-blue-500';
      case 'graded': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Progress Overview */}
      <div className="col-span-full bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Learning Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <BookOpenCheck className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold text-blue-600">{courses.length}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Active Courses</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <span className="text-lg font-semibold text-green-600">18</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Completed Modules</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="h-6 w-6 text-purple-600" />
              <span className="text-lg font-semibold text-purple-600">24h</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Learning Time</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-orange-600" />
              <span className="text-lg font-semibold text-orange-600">85%</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Average Score</p>
          </div>
        </div>
      </div>

      {/* Current Courses */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Current Courses</h3>
        <div className="space-y-4">
          {courses.map(course => (
            <div key={course.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-gray-800">{course.title}</h4>
                  <p className="text-sm text-gray-600">Instructor: {course.instructor}</p>
                </div>
                <span className="text-sm text-gray-500">{course.duration}</span>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{course.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 rounded-full h-2" 
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                <p>Next: {course.nextLesson}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Assignments */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Upcoming Assignments</h3>
        <div className="space-y-4">
          {assignments.map(assignment => (
            <div key={assignment.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-gray-800">{assignment.title}</h4>
                  <p className="text-sm text-gray-600">{assignment.course}</p>
                </div>
                <span className={`text-sm font-medium ${getStatusColor(assignment.status)}`}>
                  {assignment.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Due: {assignment.dueDate}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Announcements */}
      <div className="col-span-full bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Announcements</h3>
        <div className="space-y-4">
          {announcements.map(announcement => (
            <div key={announcement.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-800">{announcement.title}</h4>
                <span className="text-sm text-gray-500">{announcement.date}</span>
              </div>
              <p className="text-sm text-gray-600">{announcement.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-800">LMS Platform</span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-800">
                <Users className="h-6 w-6" />
              </button>
              <button className="text-gray-600 hover:text-gray-800">
                <Calendar className="h-6 w-6" />
              </button>
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt="Profile"
                  className="h-8 w-8 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* API Status */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Server className="h-5 w-5 text-red-500" />
              <span className="text-red-700">API Status: {apiStatus}</span>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 border-b">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Layout className="h-5 w-5 inline-block mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'courses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BookOpenCheck className="h-5 w-5 inline-block mr-2" />
              Courses
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assignments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <GraduationCap className="h-5 w-5 inline-block mr-2" />
              Assignments
            </button>
          </nav>
        </div>

        {/* Content Area */}
        {activeTab === 'dashboard' && renderDashboard()}
        {/* Add other tab content components as needed */}
      </div>
    </div>
  );
}

export default App;