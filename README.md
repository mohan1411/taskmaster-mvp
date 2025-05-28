# FizzTask

Add fizz to your tasks! A comprehensive task management system with AI-powered email integration and smart follow-up reminders that makes productivity exciting.

## 🚀 Features

- **Task Management**: Create, update, delete, and organize tasks with priorities and categories
- **AI Email Integration**: Extract tasks from emails using OpenAI
- **Smart Follow-ups**: AI-powered follow-up detection and management
- **Reminder System**: Configurable reminder settings with multiple notification types
- **User Authentication**: Secure login/registration system
- **Real-time Updates**: Instant UI updates without page refreshes
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

### Frontend
- React.js
- Material-UI (MUI)
- Axios for API calls
- Date-fns for date handling

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- OpenAI API integration
- Nodemailer for email notifications

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- OpenAI API key (for AI features)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/fizztask.git
   cd fizztask
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/fizztask
   JWT_SECRET=your_jwt_secret_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```

   Create a `.env` file in the frontend directory:
   ```env
   REACT_APP_API_URL=http://localhost:5000
   ```

## 🚀 Running the Application

### Option 1: Start both servers separately

1. **Start the backend server**
   ```bash
   npm run server
   ```

2. **Start the frontend (in a new terminal)**
   ```bash
   cd frontend
   npm start
   ```

### Option 2: Use the provided batch files (Windows)
```bash
# Start both servers
start-fizztask.bat

# Stop servers
stop-fizztask.bat
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Task Endpoints
- `GET /api/tasks` - Get all tasks (with filtering)
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get task by ID
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/extract` - Extract tasks from text

### Follow-up Endpoints
- `GET /api/followups` - Get all follow-ups
- `POST /api/followups` - Create follow-up
- `PUT /api/followups/:id` - Update follow-up (including reminder settings)
- `DELETE /api/followups/:id` - Delete follow-up

## 🧪 Testing

### Manual Testing
Use the provided test scripts:
```bash
# Test task deletion
test-task-delete.bat

# Test reminder settings
test-reminder-settings.bat

# Test task summary counts
test-task-summary-counts.bat
```

### Database Testing
```bash
# Test database connectivity
test-reminder-db.bat
```

## 🔧 Configuration

### OpenAI Integration
The system uses OpenAI for:
- Task extraction from email content
- Follow-up detection and analysis
- Smart categorization and priority assignment

### Reminder System
Configure reminder settings per follow-up:
- Multiple reminder schedules
- Different notification types (in-app, email, browser)
- Priority-based timing adjustments

## 📁 Project Structure

```
fizztask/
├── backend/
│   ├── controllers/     # Route controllers
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── middleware/     # Custom middleware
│   ├── config/         # Configuration files
│   └── utils/          # Utility functions
├── frontend/
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Page components
│   │   ├── services/   # API services
│   │   └── context/    # React context
├── docs/               # Documentation
└── README.md
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`

2. **OpenAI API Errors**
   - Verify API key is correct
   - Check API usage limits

3. **Port Already in Use**
   - Change ports in `.env` files
   - Kill existing processes

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=true
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Recent Updates

- ✅ Fixed task deletion functionality
- ✅ Enhanced reminder settings management
- ✅ Improved real-time count updates
- ✅ Better error handling and user feedback
- ✅ Enhanced AI task extraction

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Mohan**
- Project Manager & Developer
- FizzTask Solutions

## 🙏 Acknowledgments

- OpenAI for AI capabilities
- Material-UI team for the component library
- MongoDB team for the database solution
- React team for the frontend framework
