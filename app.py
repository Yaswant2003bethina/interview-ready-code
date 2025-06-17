
from flask import Flask, request, jsonify, render_template, session, redirect, url_for, flash
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import sqlite3
import subprocess
import tempfile
import os
import json
import uuid
import sys

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-this'

# Database initialization
def init_db():
    conn = sqlite3.connect('coding_platform.db')
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'student',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT 1
        )
    ''')
    
    # Modules table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS modules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT 1
        )
    ''')
    
    # Problems table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS problems (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            module_id INTEGER,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            sample_input TEXT,
            sample_output TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT 1,
            FOREIGN KEY (module_id) REFERENCES modules (id)
        )
    ''')
    
    # Test cases table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS test_cases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            problem_id INTEGER,
            input_data TEXT NOT NULL,
            expected_output TEXT NOT NULL,
            is_hidden BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (problem_id) REFERENCES problems (id)
        )
    ''')
    
    # Submissions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            problem_id INTEGER,
            code TEXT NOT NULL,
            language TEXT NOT NULL,
            status TEXT,
            test_results TEXT,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (problem_id) REFERENCES problems (id)
        )
    ''')
    
    # Create default admin user
    cursor.execute('SELECT COUNT(*) FROM users WHERE role = "admin"')
    if cursor.fetchone()[0] == 0:
        admin_hash = generate_password_hash('admin123')
        cursor.execute('''
            INSERT INTO users (username, email, password_hash, full_name, role)
            VALUES (?, ?, ?, ?, ?)
        ''', ('admin', 'admin@coding.platform', admin_hash, 'System Administrator', 'admin'))
    
    conn.commit()
    conn.close()

# Fixed code execution functions
def execute_python(code, input_data):
    temp_file = None
    try:
        # Create temporary file
        fd, temp_file = tempfile.mkstemp(suffix='.py', text=True)
        
        # Write code to file and close file descriptor
        with os.fdopen(fd, 'w') as f:
            f.write(code)
        
        # Execute the file
        process = subprocess.run(
            [sys.executable, temp_file],
            input=input_data,
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if process.returncode == 0:
            return {'success': True, 'output': process.stdout.strip()}
        else:
            return {'success': False, 'error': process.stderr}
            
    except subprocess.TimeoutExpired:
        return {'success': False, 'error': 'Time Limit Exceeded'}
    except Exception as e:
        return {'success': False, 'error': str(e)}
    finally:
        # Clean up temporary file
        if temp_file and os.path.exists(temp_file):
            try:
                os.unlink(temp_file)
            except OSError:
                pass  # File might already be deleted or locked

def execute_javascript(code, input_data):
    temp_file = None
    try:
        # Create a Node.js script that handles input
        node_code = f'''
const readline = require('readline');

let inputLines = `{input_data}`.trim().split('\\n');
let currentLine = 0;

function input() {{
    if (currentLine < inputLines.length) {{
        return inputLines[currentLine++];
    }}
    return '';
}}

// Make input available globally
global.input = input;

// User code
{code}
'''
        
        # Create temporary file
        fd, temp_file = tempfile.mkstemp(suffix='.js', text=True)
        
        # Write code to file and close file descriptor
        with os.fdopen(fd, 'w') as f:
            f.write(node_code)
        
        # Execute the file
        process = subprocess.run(
            ['node', temp_file],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if process.returncode == 0:
            return {'success': True, 'output': process.stdout.strip()}
        else:
            return {'success': False, 'error': process.stderr}
            
    except subprocess.TimeoutExpired:
        return {'success': False, 'error': 'Time Limit Exceeded'}
    except Exception as e:
        return {'success': False, 'error': str(e)}
    finally:
        # Clean up temporary file
        if temp_file and os.path.exists(temp_file):
            try:
                os.unlink(temp_file)
            except OSError:
                pass

def execute_java(code, input_data):
    temp_file = None
    class_file = None
    temp_dir = None
    try:
        # Extract class name from code
        import re
        class_match = re.search(r'public\s+class\s+(\w+)', code)
        if not class_match:
            return {'success': False, 'error': 'No public class found'}
        
        class_name = class_match.group(1)
        
        # Create temporary directory for Java files
        temp_dir = tempfile.mkdtemp()
        temp_file = os.path.join(temp_dir, f'{class_name}.java')
        
        # Write Java code to file
        with open(temp_file, 'w') as f:
            f.write(code)
        
        # Compile
        compile_process = subprocess.run(
            ['javac', temp_file],
            capture_output=True,
            text=True,
            timeout=10,
            cwd=temp_dir
        )
        
        if compile_process.returncode != 0:
            return {'success': False, 'error': compile_process.stderr}
        
        class_file = os.path.join(temp_dir, f'{class_name}.class')
        
        # Run
        process = subprocess.run(
            ['java', '-cp', temp_dir, class_name],
            input=input_data,
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if process.returncode == 0:
            return {'success': True, 'output': process.stdout.strip()}
        else:
            return {'success': False, 'error': process.stderr}
            
    except subprocess.TimeoutExpired:
        return {'success': False, 'error': 'Time Limit Exceeded'}
    except Exception as e:
        return {'success': False, 'error': str(e)}
    finally:
        # Clean up temporary files and directory
        if temp_file and os.path.exists(temp_file):
            try:
                os.unlink(temp_file)
            except OSError:
                pass
        if class_file and os.path.exists(class_file):
            try:
                os.unlink(class_file)
            except OSError:
                pass
        if temp_dir and os.path.exists(temp_dir):
            try:
                os.rmdir(temp_dir)
            except OSError:
                pass

def execute_cpp(code, input_data):
    temp_file = None
    exe_file = None
    try:
        # Create temporary files
        fd, temp_file = tempfile.mkstemp(suffix='.cpp', text=True)
        exe_file = temp_file.replace('.cpp', '.exe')
        
        # Write code to file and close file descriptor
        with os.fdopen(fd, 'w') as f:
            f.write(code)
        
        # Compile
        compile_process = subprocess.run(
            ['g++', temp_file, '-o', exe_file],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if compile_process.returncode != 0:
            return {'success': False, 'error': compile_process.stderr}
        
        # Run
        process = subprocess.run(
            [exe_file],
            input=input_data,
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if process.returncode == 0:
            return {'success': True, 'output': process.stdout.strip()}
        else:
            return {'success': False, 'error': process.stderr}
            
    except subprocess.TimeoutExpired:
        return {'success': False, 'error': 'Time Limit Exceeded'}
    except Exception as e:
        return {'success': False, 'error': str(e)}
    finally:
        # Clean up temporary files
        if temp_file and os.path.exists(temp_file):
            try:
                os.unlink(temp_file)
            except OSError:
                pass
        if exe_file and os.path.exists(exe_file):
            try:
                os.unlink(exe_file)
            except OSError:
                pass

# Routes
@app.route('/')
def index():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    if session.get('role') == 'admin':
        return redirect(url_for('admin_dashboard'))
    else:
        return redirect(url_for('student_dashboard'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        conn = sqlite3.connect('coding_platform.db')
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE username = ? AND is_active = 1', (username,))
        user = cursor.fetchone()
        conn.close()
        
        if user and check_password_hash(user[3], password):
            session['user_id'] = user[0]
            session['username'] = user[1]
            session['role'] = user[5]
            session['full_name'] = user[4]
            return redirect(url_for('index'))
        else:
            flash('Invalid credentials', 'error')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/admin')
def admin_dashboard():
    if session.get('role') != 'admin':
        return redirect(url_for('login'))
    
    conn = sqlite3.connect('coding_platform.db')
    cursor = conn.cursor()
    
    # Get statistics
    cursor.execute('SELECT COUNT(*) FROM users WHERE role = "student" AND is_active = 1')
    total_students = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM modules WHERE is_active = 1')
    total_modules = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM problems WHERE is_active = 1')
    total_problems = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM submissions')
    total_submissions = cursor.fetchone()[0]
    
    conn.close()
    
    return render_template('admin_dashboard.html', 
                         total_students=total_students,
                         total_modules=total_modules,
                         total_problems=total_problems,
                         total_submissions=total_submissions)

@app.route('/student')
def student_dashboard():
    if session.get('role') != 'student':
        return redirect(url_for('login'))
    
    conn = sqlite3.connect('coding_platform.db')
    cursor = conn.cursor()
    
    # Get modules with problems
    cursor.execute('''
        SELECT m.id, m.name, m.description, COUNT(p.id) as problem_count
        FROM modules m
        LEFT JOIN problems p ON m.id = p.module_id AND p.is_active = 1
        WHERE m.is_active = 1
        GROUP BY m.id, m.name, m.description
    ''')
    modules = cursor.fetchall()
    
    conn.close()
    
    return render_template('student_dashboard.html', modules=modules)

# ... keep existing code (user management routes)

@app.route('/admin/users')
def manage_users():
    if session.get('role') != 'admin':
        return redirect(url_for('login'))
    
    conn = sqlite3.connect('coding_platform.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE is_active = 1 ORDER BY created_at DESC')
    users = cursor.fetchall()
    conn.close()
    
    return render_template('manage_users.html', users=users)

@app.route('/admin/users/add', methods=['POST'])
def add_user():
    if session.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'})
    
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name')
    role = data.get('role', 'student')
    
    if not all([username, email, password, full_name]):
        return jsonify({'success': False, 'message': 'All fields are required'})
    
    conn = sqlite3.connect('coding_platform.db')
    cursor = conn.cursor()
    
    try:
        password_hash = generate_password_hash(password)
        cursor.execute('''
            INSERT INTO users (username, email, password_hash, full_name, role)
            VALUES (?, ?, ?, ?, ?)
        ''', (username, email, password_hash, full_name, role))
        conn.commit()
        return jsonify({'success': True, 'message': 'User added successfully'})
    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'message': 'Username or email already exists'})
    finally:
        conn.close()

@app.route('/admin/users/<int:user_id>/edit', methods=['POST'])
def edit_user(user_id):
    if session.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'})
    
    data = request.json
    
    conn = sqlite3.connect('coding_platform.db')
    cursor = conn.cursor()
    
    try:
        if data.get('password'):
            password_hash = generate_password_hash(data['password'])
            cursor.execute('''
                UPDATE users 
                SET username = ?, email = ?, password_hash = ?, full_name = ?, role = ?
                WHERE id = ?
            ''', (data['username'], data['email'], password_hash, data['full_name'], data['role'], user_id))
        else:
            cursor.execute('''
                UPDATE users 
                SET username = ?, email = ?, full_name = ?, role = ?
                WHERE id = ?
            ''', (data['username'], data['email'], data['full_name'], data['role'], user_id))
        
        conn.commit()
        return jsonify({'success': True, 'message': 'User updated successfully'})
    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'message': 'Username or email already exists'})
    finally:
        conn.close()

@app.route('/admin/users/<int:user_id>/delete', methods=['POST'])
def delete_user(user_id):
    if session.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'})
    
    conn = sqlite3.connect('coding_platform.db')
    cursor = conn.cursor()
    cursor.execute('UPDATE users SET is_active = 0 WHERE id = ?', (user_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'User deleted successfully'})

# ... keep existing code (module management routes)

@app.route('/admin/modules')
def manage_modules():
    if session.get('role') != 'admin':
        return redirect(url_for('login'))
    
    conn = sqlite3.connect('coding_platform.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT m.*, COUNT(p.id) as problem_count
        FROM modules m
        LEFT JOIN problems p ON m.id = p.module_id AND p.is_active = 1
        WHERE m.is_active = 1
        GROUP BY m.id
        ORDER BY m.created_at DESC
    ''')
    modules = cursor.fetchall()
    conn.close()
    
    return render_template('manage_modules.html', modules=modules)

@app.route('/admin/modules/add', methods=['POST'])
def add_module():
    if session.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'})
    
    data = request.json
    name = data.get('name')
    description = data.get('description', '')
    
    if not name:
        return jsonify({'success': False, 'message': 'Module name is required'})
    
    conn = sqlite3.connect('coding_platform.db')
    cursor = conn.cursor()
    cursor.execute('INSERT INTO modules (name, description) VALUES (?, ?)', (name, description))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Module added successfully'})

# ... keep existing code (problem management routes)

@app.route('/admin/problems')
def manage_problems():
    if session.get('role') != 'admin':
        return redirect(url_for('login'))
    
    conn = sqlite3.connect('coding_platform.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT p.*, m.name as module_name, COUNT(t.id) as test_case_count
        FROM problems p
        LEFT JOIN modules m ON p.module_id = m.id
        LEFT JOIN test_cases t ON p.id = t.problem_id
        WHERE p.is_active = 1
        GROUP BY p.id
        ORDER BY p.created_at DESC
    ''')
    problems = cursor.fetchall()
    
    cursor.execute('SELECT * FROM modules WHERE is_active = 1')
    modules = cursor.fetchall()
    
    conn.close()
    
    return render_template('manage_problems.html', problems=problems, modules=modules)

@app.route('/admin/problems/add', methods=['POST'])
def add_problem():
    if session.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'})
    
    data = request.json
    
    conn = sqlite3.connect('coding_platform.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO problems (module_id, title, description, difficulty, sample_input, sample_output)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (data['module_id'], data['title'], data['description'], 
          data['difficulty'], data['sample_input'], data['sample_output']))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Problem added successfully'})

@app.route('/module/<int:module_id>/problems')
def module_problems(module_id):
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    conn = sqlite3.connect('coding_platform.db')
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM modules WHERE id = ? AND is_active = 1', (module_id,))
    module = cursor.fetchone()
    
    if not module:
        flash('Module not found', 'error')
        return redirect(url_for('student_dashboard'))
    
    cursor.execute('SELECT * FROM problems WHERE module_id = ? AND is_active = 1', (module_id,))
    problems = cursor.fetchall()
    
    conn.close()
    
    return render_template('module_problems.html', module=module, problems=problems)

@app.route('/problem/<int:problem_id>')
def solve_problem(problem_id):
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    conn = sqlite3.connect('coding_platform.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT p.*, m.name as module_name
        FROM problems p
        LEFT JOIN modules m ON p.module_id = m.id
        WHERE p.id = ? AND p.is_active = 1
    ''', (problem_id,))
    problem = cursor.fetchone()
    
    if not problem:
        flash('Problem not found', 'error')
        return redirect(url_for('student_dashboard'))
    
    conn.close()
    
    return render_template('solve_problem.html', problem=problem)

@app.route('/execute_code', methods=['POST'])
def execute_code():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'})
    
    data = request.json
    code = data.get('code')
    language = data.get('language')
    input_data = data.get('input', '')
    
    if language == 'python':
        result = execute_python(code, input_data)
    elif language == 'javascript':
        result = execute_javascript(code, input_data)
    elif language == 'java':
        result = execute_java(code, input_data)
    elif language == 'cpp':
        result = execute_cpp(code, input_data)
    else:
        result = {'success': False, 'error': 'Unsupported language'}
    
    return jsonify(result)

@app.route('/submit_solution', methods=['POST'])
def submit_solution():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'})
    
    data = request.json
    problem_id = data.get('problem_id')
    code = data.get('code')
    language = data.get('language')
    
    conn = sqlite3.connect('coding_platform.db')
    cursor = conn.cursor()
    
    # Get test cases
    cursor.execute('SELECT * FROM test_cases WHERE problem_id = ?', (problem_id,))
    test_cases = cursor.fetchall()
    
    results = []
    passed = 0
    
    for test_case in test_cases:
        test_input = test_case[2]
        expected_output = test_case[3].strip()
        
        if language == 'python':
            result = execute_python(code, test_input)
        elif language == 'javascript':
            result = execute_javascript(code, test_input)
        elif language == 'java':
            result = execute_java(code, test_input)
        elif language == 'cpp':
            result = execute_cpp(code, test_input)
        else:
            result = {'success': False, 'error': 'Unsupported language'}
        
        if result['success']:
            actual_output = result['output'].strip()
            test_passed = actual_output == expected_output
            if test_passed:
                passed += 1
            
            results.append({
                'test_case_id': test_case[0],
                'passed': test_passed,
                'expected': expected_output,
                'actual': actual_output,
                'error': None
            })
        else:
            results.append({
                'test_case_id': test_case[0],
                'passed': False,
                'expected': expected_output,
                'actual': '',
                'error': result['error']
            })
    
    # Save submission
    status = 'Accepted' if passed == len(test_cases) else 'Wrong Answer'
    cursor.execute('''
        INSERT INTO submissions (user_id, problem_id, code, language, status, test_results)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (session['user_id'], problem_id, code, language, status, json.dumps(results)))
    conn.commit()
    conn.close()
    
    return jsonify({
        'success': True,
        'results': results,
        'passed': passed,
        'total': len(test_cases),
        'status': status
    })

@app.route('/admin/test_cases/<int:problem_id>')
def manage_test_cases(problem_id):
    if session.get('role') != 'admin':
        return redirect(url_for('login'))
    
    conn = sqlite3.connect('coding_platform.db')
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM problems WHERE id = ?', (problem_id,))
    problem = cursor.fetchone()
    
    cursor.execute('SELECT * FROM test_cases WHERE problem_id = ?', (problem_id,))
    test_cases = cursor.fetchall()
    
    conn.close()
    
    return render_template('manage_test_cases.html', problem=problem, test_cases=test_cases)

@app.route('/admin/test_cases/add', methods=['POST'])
def add_test_case():
    if session.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'})
    
    data = request.json
    
    conn = sqlite3.connect('coding_platform.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO test_cases (problem_id, input_data, expected_output, is_hidden)
        VALUES (?, ?, ?, ?)
    ''', (data['problem_id'], data['input_data'], data['expected_output'], data.get('is_hidden', False)))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Test case added successfully'})

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
