
# Placement Coding Platform

A comprehensive coding platform designed for placement preparation with admin management capabilities.

## Features

- **Admin Dashboard**: Complete user and content management
- **Module-based Organization**: Problems organized in modules
- **Multi-language Support**: Python, JavaScript, Java, C++
- **Real-time Code Execution**: Test code with custom inputs
- **Automated Testing**: Test cases with pass/fail results
- **User Management**: Admin can add, edit, and delete users
- **Problem Management**: Create and manage coding problems
- **Test Case Management**: Add and manage test cases for problems

## Technology Stack

- **Backend**: Flask (Python)
- **Frontend**: HTML, CSS, JavaScript
- **Database**: SQLite
- **Code Editor**: Monaco Editor
- **Styling**: Custom CSS with modern design

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Application**:
   ```bash
   python app.py
   ```

3. **Access the Platform**:
   - Open your browser and go to `http://localhost:5000`
   - Default admin login: `admin` / `admin123`

## Usage

### Admin Features
- **Dashboard**: View platform statistics
- **User Management**: Add, edit, delete student accounts
- **Module Management**: Create and organize problem modules
- **Problem Management**: Add coding problems with descriptions
- **Test Case Management**: Define input/output test cases

### Student Features
- **Browse Modules**: View available problem modules
- **Solve Problems**: Use the integrated code editor
- **Multiple Languages**: Choose from Python, JavaScript, Java, C++
- **Test Code**: Run code with custom inputs
- **Submit Solutions**: Get automated feedback on test cases

## Code Execution
The platform supports secure code execution for:
- **Python**: Using subprocess with timeout
- **JavaScript**: Node.js execution
- **Java**: Compilation and execution with javac/java
- **C++**: Compilation with g++ and execution

## Security Features
- Session-based authentication
- Input sanitization
- Code execution timeout limits
- Secure file handling

## Database Schema
- **Users**: Store user accounts and profiles
- **Modules**: Organize problems into categories
- **Problems**: Store problem statements and metadata
- **Test Cases**: Input/output pairs for validation
- **Submissions**: Track student code submissions

## Default Admin Account
- Username: `admin`
- Password: `admin123`

## Contributing
This is an educational project designed for placement preparation. Feel free to extend and modify according to your needs.
