
// Code solver JavaScript
let editor;
let currentLanguage = 'python';

// Language templates
const languageTemplates = {
    python: `# Write your Python code here
def solution():
    # Your code here
    pass

# Read input
# n = int(input())
# arr = list(map(int, input().split()))

# Call your solution
solution()`,
    
    javascript: `// Write your JavaScript code here
function solution() {
    // Your code here
}

// Read input (use input() function)
// const n = parseInt(input());
// const arr = input().split(' ').map(Number);

// Call your solution
solution();`,
    
    java: `import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        // Read input
        // int n = scanner.nextInt();
        // int[] arr = new int[n];
        // for (int i = 0; i < n; i++) {
        //     arr[i] = scanner.nextInt();
        // }
        
        // Your solution here
        
        scanner.close();
    }
}`,
    
    cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    // Read input
    // int n;
    // cin >> n;
    // vector<int> arr(n);
    // for (int i = 0; i < n; i++) {
    //     cin >> arr[i];
    // }
    
    // Your solution here
    
    return 0;
}`
};

// Initialize Monaco Editor
function initializeEditor() {
    require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs' }});
    
    require(['vs/editor/editor.main'], function () {
        editor = monaco.editor.create(document.getElementById('codeEditor'), {
            value: languageTemplates[currentLanguage],
            language: currentLanguage,
            theme: 'vs-dark',
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true
        });
        
        // Auto-resize editor
        window.addEventListener('resize', () => {
            editor.layout();
        });
    });
}

// Change programming language
function changeLanguage(language) {
    currentLanguage = language;
    
    if (editor) {
        const currentCode = editor.getValue();
        
        // Only change template if editor is empty or contains default template
        const shouldChangeTemplate = currentCode.trim() === '' || 
            Object.values(languageTemplates).some(template => 
                currentCode.trim() === template.trim()
            );
        
        if (shouldChangeTemplate) {
            editor.setValue(languageTemplates[language]);
        }
        
        monaco.editor.setModelLanguage(editor.getModel(), language);
    }
}

// Run code
async function runCode() {
    if (!editor) return;
    
    const code = editor.getValue();
    const customInput = document.getElementById('customInput').value;
    const runBtn = document.getElementById('runBtn');
    const outputContent = document.getElementById('outputContent');
    
    if (!code.trim()) {
        showToast('Please write some code first', 'error');
        return;
    }
    
    const originalText = runBtn.innerHTML;
    const stopLoading = showLoading(runBtn, originalText);
    
    try {
        const response = await apiCall('/execute_code', {
            method: 'POST',
            body: JSON.stringify({
                code: code,
                language: currentLanguage,
                input: customInput
            })
        });
        
        if (response.success) {
            outputContent.textContent = response.output || 'No output';
            outputContent.style.color = '#16a34a';
        } else {
            outputContent.textContent = response.error || 'Execution failed';
            outputContent.style.color = '#dc2626';
        }
    } catch (error) {
        outputContent.textContent = 'Network error: ' + error.message;
        outputContent.style.color = '#dc2626';
    } finally {
        stopLoading();
    }
}

// Submit solution
async function submitSolution() {
    if (!editor) return;
    
    const code = editor.getValue();
    const submitBtn = document.getElementById('submitBtn');
    const resultsSection = document.getElementById('results');
    const resultsContent = document.getElementById('resultsContent');
    
    if (!code.trim()) {
        showToast('Please write some code first', 'error');
        return;
    }
    
    const originalText = submitBtn.innerHTML;
    const stopLoading = showLoading(submitBtn, originalText);
    
    try {
        const response = await apiCall('/submit_solution', {
            method: 'POST',
            body: JSON.stringify({
                problem_id: problemId,
                code: code,
                language: currentLanguage
            })
        });
        
        if (response.success) {
            displayResults(response);
            resultsSection.style.display = 'block';
            
            if (response.status === 'Accepted') {
                showToast('Congratulations! All test cases passed!', 'success');
            } else {
                showToast(`${response.passed}/${response.total} test cases passed`, 'error');
            }
        } else {
            showToast('Submission failed', 'error');
        }
    } catch (error) {
        showToast('Network error: ' + error.message, 'error');
    } finally {
        stopLoading();
    }
}

// Display test results
function displayResults(response) {
    const resultsContent = document.getElementById('resultsContent');
    
    let html = `
        <div class="results-summary">
            <h4>Results: ${response.passed}/${response.total} test cases passed</h4>
            <div class="status-badge ${response.status.toLowerCase().replace(' ', '-')}">${response.status}</div>
        </div>
        <div class="test-results">
    `;
    
    response.results.forEach((result, index) => {
        const statusClass = result.passed ? 'passed' : 'failed';
        const statusIcon = result.passed ? '✓' : '✗';
        
        html += `
            <div class="test-result ${statusClass}">
                <div class="test-header">
                    <span class="test-number">Test Case ${index + 1}</span>
                    <span class="test-status ${statusClass}">${statusIcon} ${result.passed ? 'Passed' : 'Failed'}</span>
                </div>
                ${!result.passed ? `
                    <div class="test-details">
                        <div class="test-expected">
                            <strong>Expected:</strong> <code>${result.expected}</code>
                        </div>
                        <div class="test-actual">
                            <strong>Got:</strong> <code>${result.actual || result.error}</code>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    
    resultsContent.innerHTML = html;
    
    // Add styles for results
    const style = document.createElement('style');
    style.textContent = `
        .results-summary {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .status-badge {
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 0.75rem;
        }
        
        .status-badge.accepted {
            background: #dcfce7;
            color: #166534;
        }
        
        .status-badge.wrong-answer {
            background: #fecaca;
            color: #991b1b;
        }
        
        .test-results {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        
        .test-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .test-number {
            font-weight: 500;
        }
        
        .test-details {
            margin-top: 0.5rem;
            padding-top: 0.5rem;
            border-top: 1px solid rgba(0, 0, 0, 0.1);
            font-size: 0.875rem;
        }
        
        .test-expected,
        .test-actual {
            margin-bottom: 0.25rem;
        }
        
        .test-details code {
            background: #f3f4f6;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-family: 'Courier New', monospace;
        }
    `;
    document.head.appendChild(style);
}

// Initialize solver
document.addEventListener('DOMContentLoaded', function() {
    // Initialize editor
    initializeEditor();
    
    // Language selector
    const languageSelect = document.getElementById('languageSelect');
    languageSelect.addEventListener('change', function() {
        changeLanguage(this.value);
    });
    
    // Button event listeners
    document.getElementById('runBtn').addEventListener('click', runCode);
    document.getElementById('submitBtn').addEventListener('click', submitSolution);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'Enter') {
                e.preventDefault();
                runCode();
            } else if (e.key === 's') {
                e.preventDefault();
                submitSolution();
            }
        }
    });
    
    // Auto-save code to localStorage
    setInterval(() => {
        if (editor) {
            const code = editor.getValue();
            localStorage.setItem(`code_${problemId}_${currentLanguage}`, code);
        }
    }, 5000);
    
    // Load saved code
    setTimeout(() => {
        if (editor) {
            const savedCode = localStorage.getItem(`code_${problemId}_${currentLanguage}`);
            if (savedCode && savedCode !== languageTemplates[currentLanguage]) {
                editor.setValue(savedCode);
            }
        }
    }, 1000);
    
    // Add problem solver animations
    const problemPanel = document.querySelector('.problem-panel');
    const codePanel = document.querySelector('.code-panel');
    
    if (problemPanel) {
        problemPanel.style.animation = 'slideInLeft 0.6s ease-out';
    }
    
    if (codePanel) {
        codePanel.style.animation = 'slideInRight 0.6s ease-out';
    }
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInLeft {
            from {
                opacity: 0;
                transform: translateX(-50px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(50px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
    `;
    document.head.appendChild(style);
});

// Export functions for global use
window.runCode = runCode;
window.submitSolution = submitSolution;
window.changeLanguage = changeLanguage;
