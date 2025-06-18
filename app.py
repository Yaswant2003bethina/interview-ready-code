import os
import sqlite3
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import subprocess
import json

app = Flask(__name__)
app.secret_key = os.urandom(24)

DATABASE = 'database.db'

# Function to initialize the database
def init_db():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()

    # Users table
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  full_name TEXT NOT NULL,
                  email TEXT NOT NULL UNIQUE,
                  password TEXT NOT NULL,
                  role TEXT NOT NULL DEFAULT 'student',
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')

    # Modules table
    c.execute('''CREATE TABLE IF NOT EXISTS modules
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL,
                  description TEXT,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')

    # Problems table
    c.execute('''CREATE TABLE IF NOT EXISTS problems
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  module_id INTEGER NOT NULL,
                  title TEXT NOT NULL,
                  description TEXT NOT NULL,
                  difficulty TEXT NOT NULL,
                  sample_input TEXT,
                  sample_output TEXT,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (module_id) REFERENCES modules (id))''')

    # Test cases table
    c.execute('''CREATE TABLE IF NOT EXISTS test_cases
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  problem_id INTEGER NOT NULL,
                  input TEXT NOT NULL,
                  expected_output TEXT NOT NULL,
                  hidden BOOLEAN NOT NULL DEFAULT 0,
                  FOREIGN KEY (problem_id) REFERENCES problems (id))''')

    # Submissions table
    c.execute('''CREATE TABLE IF NOT EXISTS submissions
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id INTEGER NOT NULL,
                  problem_id INTEGER NOT NULL,
                  code TEXT NOT NULL,
                  status TEXT NOT NULL,
                  score INTEGER NOT NULL,
                  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (user_id) REFERENCES users (id),
                  FOREIGN KEY (problem_id) REFERENCES problems (id))''')
    
    # MCQs table
    c.execute('''CREATE TABLE IF NOT EXISTS mcqs
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  question TEXT NOT NULL,
                  option_a TEXT NOT NULL,
                  option_b TEXT NOT NULL,
                  option_c TEXT NOT NULL,
                  option_d TEXT NOT NULL,
                  correct_answer TEXT NOT NULL,
                  difficulty TEXT NOT NULL,
                  module_id INTEGER,
                  explanation TEXT,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (module_id) REFERENCES modules (id))''')
    
    # MCQ submissions table
    c.execute('''CREATE TABLE IF NOT EXISTS mcq_submissions
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id INTEGER NOT NULL,
                  mcq_id INTEGER NOT NULL,
                  selected_answer TEXT NOT NULL,
                  is_correct BOOLEAN NOT NULL,
                  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (user_id) REFERENCES users (id),
                  FOREIGN KEY (mcq_id) REFERENCES mcqs (id))''')

    conn.commit()
    conn.close()

# Function to create an admin user if none exists
def create_admin_user():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE role = 'admin'")
    admin = c.fetchone()
    if not admin:
        hashed_password = generate_password_hash('admin', method='sha256')
        c.execute("INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)",
                  ('Admin User', 'admin@example.com', hashed_password, 'admin'))
        conn.commit()
        print('Admin user created.')
    conn.close()

# Function to execute code
def execute_code(code, language, input):
    try:
        if language == 'python':
            process = subprocess.Popen(['python3', '-c', code],
                                       stdin=subprocess.PIPE,
                                       stdout=subprocess.PIPE,
                                       stderr=subprocess.PIPE)
        elif language == 'javascript':
            process = subprocess.Popen(['node', '-e', code],
                                       stdin=subprocess.PIPE,
                                       stdout=subprocess.PIPE,
                                       stderr=subprocess.PIPE)
        elif language == 'java':
            # Save code to a file
            with open('Test.java', 'w') as f:
                f.write(code)
            # Compile the code
            compile_process = subprocess.Popen(['javac', 'Test.java'],
                                               stdout=subprocess.PIPE,
                                               stderr=subprocess.PIPE)
            compile_output, compile_error = compile_process.communicate()
            if compile_error:
                return {'output': '', 'error': compile_error.decode('utf-8')}
            # Execute the compiled code
            process = subprocess.Popen(['java', 'Test'],
                                       stdin=subprocess.PIPE,
                                       stdout=subprocess.PIPE,
                                       stderr=subprocess.PIPE)
        elif language == 'cpp':
            # Save code to a file
            with open('test.cpp', 'w') as f:
                f.write(code)
            # Compile the code
            compile_process = subprocess.Popen(['g++', 'test.cpp', '-o', 'test'],
                                               stdout=subprocess.PIPE,
                                               stderr=subprocess.PIPE)
            compile_output, compile_error = compile_process.communicate()
            if compile_error:
                return {'output': '', 'error': compile_error.decode('utf-8')}
            # Execute the compiled code
            process = subprocess.Popen(['./test'],
                                       stdin=subprocess.PIPE,
                                       stdout=subprocess.PIPE,
                                       stderr=subprocess.PIPE)
        else:
            return {'output': '', 'error': 'Unsupported language'}

        output, error = process.communicate(input=input.encode('utf-8'))
        return {'output': output.decode('utf-8'), 'error': error.decode('utf-8')}
    except Exception as e:
        return {'output': '', 'error': str(e)}

# Routes
@app.route('/')
def index():
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = c.fetchone()
        conn.close()

        if user and check_password_hash(user[3], password):
            session['user_id'] = user[0]
            session['full_name'] = user[1]
            session['email'] = user[2]
            session['role'] = user[4]
            if user[4] == 'admin':
                return redirect(url_for('admin_dashboard'))
            else:
                return redirect(url_for('student_dashboard'))
        else:
            flash('Invalid email or password', 'error')
            return render_template('login.html')
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    session.pop('full_name', None)
    session.pop('email', None)
    session.pop('role', None)
    return redirect(url_for('login'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        full_name = request.form['full_name']
        email = request.form['email']
        password = request.form['password']
        hashed_password = generate_password_hash(password, method='sha256')
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        try:
            c.execute("INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)",
                      (full_name, email, hashed_password))
            conn.commit()
            flash('Registration successful. Please log in.', 'success')
            return redirect(url_for('login'))
        except sqlite3.IntegrityError:
            flash('Email address already registered.', 'error')
        finally:
            conn.close()
    return render_template('register.html')

@app.route('/admin_dashboard')
def admin_dashboard():
    if 'user_id' not in session or session['role'] != 'admin':
        return redirect(url_for('login'))
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM users WHERE role = 'student'")
    total_students = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM modules")
    total_modules = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM problems")
    total_problems = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM submissions")
    total_submissions = c.fetchone()[0]
    conn.close()
    return render_template('admin_dashboard.html', total_students=total_students,
                           total_modules=total_modules, total_problems=total_problems,
                           total_submissions=total_submissions)

@app.route('/student_dashboard')
def student_dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT id, name, description, (SELECT COUNT(*) FROM problems WHERE module_id = modules.id) AS problem_count FROM modules ORDER BY name")
    modules = c.fetchall()
    conn.close()
    return render_template('student_dashboard.html', modules=modules)

@app.route('/manage_users')
def manage_users():
    if 'user_id' not in session or session['role'] != 'admin':
        return redirect(url_for('login'))
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE role = 'student' ORDER BY full_name")
    students = c.fetchall()
    conn.close()
    return render_template('manage_users.html', students=students)

@app.route('/manage_modules', methods=['GET', 'POST'])
def manage_modules():
    if 'user_id' not in session or session['role'] != 'admin':
        return redirect(url_for('login'))

    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()

    if request.method == 'POST':
        name = request.form['name']
        description = request.form.get('description', '')
        c.execute("INSERT INTO modules (name, description) VALUES (?, ?)", (name, description))
        conn.commit()
        flash('Module added successfully', 'success')
        return redirect(url_for('manage_modules'))

    c.execute("SELECT id, name, description, (SELECT COUNT(*) FROM problems WHERE module_id = modules.id) AS problem_count FROM modules ORDER BY name")
    modules = c.fetchall()
    conn.close()
    return render_template('manage_modules.html', modules=modules)

@app.route('/manage_problems', methods=['GET', 'POST'])
def manage_problems():
    if 'user_id' not in session or session['role'] != 'admin':
        return redirect(url_for('login'))

    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()

    if request.method == 'POST':
        module_id = request.form['module_id']
        title = request.form['title']
        description = request.form['description']
        difficulty = request.form['difficulty']
        sample_input = request.form.get('sample_input', '')
        sample_output = request.form.get('sample_output', '')
        c.execute('''INSERT INTO problems (module_id, title, description, difficulty, sample_input, sample_output)
                     VALUES (?, ?, ?, ?, ?, ?)''', (module_id, title, description, difficulty, sample_input, sample_output))
        conn.commit()
        flash('Problem added successfully', 'success')
        return redirect(url_for('manage_problems'))

    module_id = request.args.get('module')
    if module_id:
        c.execute('''SELECT p.*, m.name AS module_name,
                     (SELECT COUNT(*) FROM test_cases WHERE problem_id = p.id) AS test_case_count
                     FROM problems p
                     JOIN modules m ON p.module_id = m.id
                     WHERE p.module_id = ?
                     ORDER BY p.created_at DESC''', (module_id,))
        problems = c.fetchall()
    else:
        c.execute('''SELECT p.*, m.name AS module_name,
                     (SELECT COUNT(*) FROM test_cases WHERE problem_id = p.id) AS test_case_count
                     FROM problems p
                     JOIN modules m ON p.module_id = m.id
                     ORDER BY p.created_at DESC''')
        problems = c.fetchall()

    c.execute("SELECT * FROM modules ORDER BY name")
    modules = c.fetchall()
    conn.close()
    return render_template('manage_problems.html', problems=problems, modules=modules)

@app.route('/manage_test_cases/<int:problem_id>', methods=['GET', 'POST'])
def manage_test_cases(problem_id):
    if 'user_id' not in session or session['role'] != 'admin':
        return redirect(url_for('login'))

    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()

    if request.method == 'POST':
        input_data = request.form['input']
        expected_output = request.form['expected_output']
        hidden = 'hidden' in request.form
        c.execute('''INSERT INTO test_cases (problem_id, input, expected_output, hidden)
                     VALUES (?, ?, ?, ?)''', (problem_id, input_data, expected_output, hidden))
        conn.commit()
        flash('Test case added successfully', 'success')
        return redirect(url_for('manage_test_cases', problem_id=problem_id))

    c.execute("SELECT * FROM problems WHERE id = ?", (problem_id,))
    problem = c.fetchone()
    if not problem:
        flash('Problem not found', 'error')
        return redirect(url_for('manage_problems'))

    c.execute("SELECT * FROM test_cases WHERE problem_id = ? ORDER BY id", (problem_id,))
    test_cases = c.fetchall()
    conn.close()
    return render_template('manage_test_cases.html', problem=problem, test_cases=test_cases)

@app.route('/module_problems/<int:module_id>')
def module_problems(module_id):
    if 'user_id' not in session:
        return redirect(url_for('login'))
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT * FROM modules WHERE id = ?", (module_id,))
    module = c.fetchone()
    if not module:
        flash('Module not found', 'error')
        return redirect(url_for('student_dashboard'))
    c.execute("SELECT * FROM problems WHERE module_id = ? ORDER BY difficulty", (module_id,))
    problems = c.fetchall()
    conn.close()
    return render_template('module_problems.html', module=module, problems=problems)

@app.route('/solve_problem/<int:problem_id>', methods=['GET', 'POST'])
def solve_problem(problem_id):
    if 'user_id' not in session:
        return redirect(url_for('login'))

    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()

    c.execute("SELECT * FROM problems WHERE id = ?", (problem_id,))
    problem = c.fetchone()
    if not problem:
        flash('Problem not found', 'error')
        return redirect(url_for('student_dashboard'))

    c.execute("SELECT * FROM test_cases WHERE problem_id = ?", (problem_id,))
    test_cases = c.fetchall()

    if request.method == 'POST':
        code = request.form['code']
        language = request.form['language']
        user_id = session['user_id']
        
        # Prepare to run test cases and collect results
        test_results = []
        all_tests_passed = True
        
        for test_case in test_cases:
            # Execute the code against the test case input
            result = execute_code(code, language, test_case[2])  # test_case[2] is the input
            
            # Check for execution errors
            if result['error']:
                all_tests_passed = False
                test_results.append({
                    'test_case_id': test_case[0],
                    'status': 'error',
                    'message': 'Execution Error: ' + result['error']
                })
                continue  # Skip to the next test case
            
            # Compare the output with the expected output
            if result['output'].strip() == test_case[3].strip():  # test_case[3] is the expected output
                test_results.append({
                    'test_case_id': test_case[0],
                    'status': 'passed',
                    'message': 'Passed'
                })
            else:
                all_tests_passed = False
                test_results.append({
                    'test_case_id': test_case[0],
                    'status': 'failed',
                    'message': 'Failed: Expected output:\n' + test_case[3] + '\nYour output:\n' + result['output']
                })
        
        # Calculate the score based on the test results
        if all_tests_passed:
            score = 100
            status = 'Accepted'
        else:
            score = sum(1 for res in test_results if res['status'] == 'passed') * (100 / len(test_cases))
            status = 'Wrong Answer'
        
        # Insert the submission into the database
        c.execute('''INSERT INTO submissions (user_id, problem_id, code, status, score)
                     VALUES (?, ?, ?, ?, ?)''', (user_id, problem_id, code, status, score))
        conn.commit()
        
        # Pass the test results to the template for display
        return render_template('solve_problem.html', problem=problem, test_cases=test_cases,
                               code=code, language=language, test_results=test_results)

    conn.close()
    return render_template('solve_problem.html', problem=problem, test_cases=test_cases)

# MCQ Management Routes
@app.route('/manage_mcqs')
def manage_mcqs():
    if 'user_id' not in session or session['role'] != 'admin':
        return redirect(url_for('login'))
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    # Get all MCQs with module names
    c.execute('''SELECT m.*, md.name as module_name 
                 FROM mcqs m 
                 LEFT JOIN modules md ON m.module_id = md.id 
                 ORDER BY m.created_at DESC''')
    mcqs = c.fetchall()
    
    # Get all modules for the form
    c.execute('SELECT * FROM modules ORDER BY name')
    modules = c.fetchall()
    
    conn.close()
    
    return render_template('manage_mcqs.html', mcqs=mcqs, modules=modules)

@app.route('/add_mcq', methods=['POST'])
def add_mcq():
    if 'user_id' not in session or session['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'})
    
    try:
        question = request.form['question']
        option_a = request.form['option_a']
        option_b = request.form['option_b']
        option_c = request.form['option_c']
        option_d = request.form['option_d']
        correct_answer = request.form['correct_answer']
        difficulty = request.form['difficulty']
        module_id = request.form.get('module_id') or None
        explanation = request.form.get('explanation', '')
        
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        
        c.execute('''INSERT INTO mcqs (question, option_a, option_b, option_c, option_d, 
                     correct_answer, difficulty, module_id, explanation)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                  (question, option_a, option_b, option_c, option_d, 
                   correct_answer, difficulty, module_id, explanation))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'MCQ added successfully'})
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/delete_mcq/<int:mcq_id>', methods=['DELETE'])
def delete_mcq(mcq_id):
    if 'user_id' not in session or session['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'})
    
    try:
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        
        # Delete MCQ submissions first
        c.execute('DELETE FROM mcq_submissions WHERE mcq_id = ?', (mcq_id,))
        
        # Delete MCQ
        c.execute('DELETE FROM mcqs WHERE id = ?', (mcq_id,))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'MCQ deleted successfully'})
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

# Student MCQ Routes
@app.route('/student_mcqs')
def student_mcqs():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    # Get all MCQs with module names
    c.execute('''SELECT m.*, md.name as module_name 
                 FROM mcqs m 
                 LEFT JOIN modules md ON m.module_id = md.id 
                 ORDER BY m.difficulty, m.created_at DESC''')
    mcqs = c.fetchall()
    
    # Get all modules for filtering
    c.execute('SELECT * FROM modules ORDER BY name')
    modules = c.fetchall()
    
    conn.close()
    
    return render_template('student_mcqs.html', mcqs=mcqs, modules=modules)

@app.route('/submit_mcq_answer', methods=['POST'])
def submit_mcq_answer():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'})
    
    try:
        data = request.get_json()
        mcq_id = data['mcq_id']
        selected_answer = data['answer']
        user_id = session['user_id']
        
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        
        # Get the correct answer
        c.execute('SELECT correct_answer FROM mcqs WHERE id = ?', (mcq_id,))
        result = c.fetchone()
        
        if not result:
            return jsonify({'success': False, 'message': 'MCQ not found'})
        
        correct_answer = result[0]
        is_correct = selected_answer == correct_answer
        
        # Save the submission
        c.execute('''INSERT INTO mcq_submissions (user_id, mcq_id, selected_answer, is_correct)
                     VALUES (?, ?, ?, ?)''',
                  (user_id, mcq_id, selected_answer, is_correct))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'correct': is_correct,
            'correct_answer': correct_answer
        })
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/get_user_submissions')
def get_user_submissions():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'})
    
    try:
        user_id = session['user_id']
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        
        # Get recent submissions
        c.execute('''SELECT s.*, p.title as problem_title 
                     FROM submissions s 
                     JOIN problems p ON s.problem_id = p.id 
                     WHERE s.user_id = ? 
                     ORDER BY s.submitted_at DESC 
                     LIMIT 10''',
                  (user_id,))
        submissions = c.fetchall()
        
        # Convert to list of dictionaries
        submissions_list = []
        for sub in submissions:
            submissions_list.append({
                'problem_title': sub[7],  # problem_title from JOIN
                'status': sub[4],         # status
                'score': sub[5],          # score
                'submitted_at': sub[6]    # submitted_at
            })
        
        conn.close()
        
        return jsonify({'success': True, 'submissions': submissions_list})
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

# Test all compilers endpoint
@app.route('/test_compilers')
def test_compilers():
    if 'user_id' not in session or session['role'] != 'admin':
        return redirect(url_for('login'))
    
    test_results = {}
    
    # Test Python
    try:
        result = execute_code('print("Python works!")', 'python', '')
        test_results['python'] = {'status': 'success', 'output': result['output']}
    except Exception as e:
        test_results['python'] = {'status': 'error', 'error': str(e)}
    
    # Test JavaScript
    try:
        result = execute_code('console.log("JavaScript works!");', 'javascript', '')
        test_results['javascript'] = {'status': 'success', 'output': result['output']}
    except Exception as e:
        test_results['javascript'] = {'status': 'error', 'error': str(e)}
    
    # Test Java
    try:
        java_code = '''
public class Test {
    public static void main(String[] args) {
        System.out.println("Java works!");
    }
}'''
        result = execute_code(java_code, 'java', '')
        test_results['java'] = {'status': 'success', 'output': result['output']}
    except Exception as e:
        test_results['java'] = {'status': 'error', 'error': str(e)}
    
    # Test C++
    try:
        cpp_code = '''
#include <iostream>
using namespace std;
int main() {
    cout << "C++ works!" << endl;
    return 0;
}'''
        result = execute_code(cpp_code, 'cpp', '')
        test_results['cpp'] = {'status': 'success', 'output': result['output']}
    except Exception as e:
        test_results['cpp'] = {'status': 'error', 'error': str(e)}
    
    return jsonify(test_results)

if __name__ == '__main__':
    init_db()
    create_admin_user()
    app.run(debug=True)
