# Document Management System

A full-featured Document Management System built with the MEAN stack (MongoDB, Express.js, Angular, Node.js) that allows users to upload, organize, search, and manage documents with permissions and version control.

## Features

### Core Features
- **Document Upload**: Support for PDFs, images, and various document formats
- **Tagging & Categorization**: Organize documents with custom tags and categories
- **Search & Filter**: Advanced search functionality with keyword and tag-based filtering
- **User Authentication**: Secure registration and login system
- **User Permissions**: Granular access control for viewing, editing, and deleting documents
- **Version Control**: Track document changes and maintain version history
- **Responsive Design**: Mobile-friendly interface using plain CSS

### Technical Features
- RESTful API architecture
- JWT-based authentication
- File upload with validation
- MongoDB for data storage
- AngularJS (v1.8) for frontend (without TypeScript)
- Plain CSS styling (no Tailwind CSS)
- Responsive grid layouts

## Technology Stack

### Backend
- **Node.js** (v14+ recommended)
- **Express.js** (v4.18.2)
- **MongoDB** (v4.4+)
- **Mongoose** (v7.5.0)
- **JWT** for authentication
- **Multer** for file uploads
- **bcryptjs** for password hashing

### Frontend
- **AngularJS** (v1.8.2)
- **Angular Route** for navigation
- **Plain CSS** (no preprocessors or frameworks)
- **Responsive design** with CSS Grid and Flexbox

## Project Structure

```
document-management-system/
├── server.js                 # Main server file
├── package.json             # Dependencies and scripts
├── .env                     # Environment variables
├── models/                  # MongoDB models
│   ├── User.js
│   └── Document.js
├── controllers/             # Route controllers
│   ├── authController.js
│   ├── documentController.js
│   └── mainController.js
├── routes/                  # API routes
│   ├── auth.js
│   ├── documents.js
│   └── users.js
├── middleware/              # Custom middleware
│   └── auth.js
├── uploads/                 # File upload directory
└── client/                  # Frontend application
    ├── index.html
    ├── styles.css
    ├── app.js
    ├── controllers/
    │   ├── authController.js
    │   ├── documentController.js
    │   └── mainController.js
    ├── services/
    │   ├── authService.js
    │   └── documentService.js
    └── views/
        ├── dashboard.html
        ├── documents.html
        ├── upload.html
        ├── document-detail.html
        ├── login.html
        ├── register.html
        └── profile.html
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Git

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd document-management-system

# Install backend dependencies
npm install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/document_management
JWT_SECRET=your_jwt_secret_key_here_change_in_production
NODE_ENV=development
PORT=3000
```

**Important**: Change the `JWT_SECRET` to a secure random string in production.

### Step 3: Start MongoDB

Make sure MongoDB is running on your system:

```bash
# On Windows (if installed as service)
net start MongoDB

# On macOS (using Homebrew)
brew services start mongodb-community

# On Linux
sudo systemctl start mongod
```

### Step 4: Run the Application

```bash
# Start the backend server
npm start

# For development with auto-restart
npm run dev
```

The server will start on `http://localhost:3000`

### Step 5: Access the Application

Open your web browser and navigate to:
- Frontend: `http://localhost:3000`
- API endpoints: `http://localhost:3000/api`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - Get all documents (with search/filter)
- `GET /api/documents/:id` - Get specific document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document
- `PUT /api/documents/:id/permissions` - Update document permissions

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get specific user

## Usage Guide

### 1. Registration and Login
- Visit `/register` to create a new account
- Use your email and password to login at `/login`

### 2. Uploading Documents
- Navigate to `/upload`
- Fill in document details (title, description, category, tags)
- Select a file (PDF, image, or document)
- Choose whether to make it public
- Click "Upload Document"

### 3. Managing Documents
- View all documents at `/documents`
- Use search and filters to find specific documents
- Click on any document to view details
- Edit document information or permissions
- Download or delete documents as needed

### 4. Permissions
- Document owners can set view, edit, and delete permissions
- Admin users have access to all documents
- Public documents are visible to all authenticated users

## File Upload Specifications

### Supported File Types
- PDF files (.pdf)
- Images (.jpg, .jpeg, .png, .gif)
- Documents (.doc, .docx, .txt)

### File Size Limit
- Maximum file size: 10MB per document

### Storage
- Files are stored in the `/uploads` directory
- Each file gets a unique timestamp-based filename
- Original filename is preserved in the database

## Security Features

### Authentication
- JWT-based authentication with expiration
- Password hashing using bcryptjs
- Secure token storage in localStorage

### File Security
- File type validation on upload
- File size limits
- Secure file handling with multer

### Access Control
- Role-based permissions (admin/user)
- Document-level access control
- Public/private document visibility

## Development

### Running in Development Mode

```bash
# Install nodemon for auto-restart
npm install -g nodemon

# Run with auto-restart
npm run dev
```

### Project Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run client     # Start Angular development server (if using Angular CLI)
npm run build      # Build Angular for production
```

## Production Deployment

### Environment Setup
1. Set `NODE_ENV=production` in your environment
2. Use a strong `JWT_SECRET`
3. Configure MongoDB connection string
4. Set up proper file storage (consider cloud storage for scalability)

### Security Considerations
- Enable HTTPS in production
- Use environment variables for sensitive data
- Implement rate limiting
- Set up proper CORS configuration
- Consider implementing file virus scanning

## Troubleshooting

### Common Issues

#### MongoDB Connection Error
```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ismaster')"

# Start MongoDB service
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
```

#### File Upload Issues
- Check if `/uploads` directory exists and has write permissions
- Verify file size doesn't exceed 10MB limit
- Ensure file type is supported

#### Authentication Issues
- Clear browser localStorage if experiencing login issues
- Verify JWT_SECRET is set correctly
- Check token expiration (24 hours by default)

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=* npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Check the troubleshooting section
- Review the API documentation
- Create an issue in the repository

---

**Note**: This application was built following the MEAN stack architecture without TypeScript and using plain CSS as specified in the requirements.
