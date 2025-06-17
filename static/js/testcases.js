
// Test case management JavaScript
function openAddTestCaseModal() {
    openModal('addTestCaseModal');
}

// Add test case form submission
document.getElementById('addTestCaseForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!validateForm(this)) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    
    // Convert checkbox to boolean
    data.is_hidden = document.getElementById('is_hidden').checked;
    
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    const stopLoading = showLoading(submitBtn, originalText);
    
    apiCall('/admin/test_cases/add', {
        method: 'POST',
        body: JSON.stringify(data)
    })
    .then(response => {
        if (response.success) {
            showToast(response.message);
            closeModal('addTestCaseModal');
            location.reload();
        } else {
            showToast(response.message, 'error');
        }
    })
    .catch(error => {
        showToast('Failed to add test case', 'error');
    })
    .finally(() => {
        stopLoading();
    });
});

// Test case cards animation
document.addEventListener('DOMContentLoaded', function() {
    const testCaseCards = document.querySelectorAll('.test-case-card');
    
    // Add staggered animation to test case cards
    testCaseCards.forEach((card, index) => {
        card.style.animation = `zoomIn 0.5s ease-out ${index * 0.1}s both`;
    });
    
    // Add copy functionality to test cases
    testCaseCards.forEach(card => {
        const inputPre = card.querySelector('.test-input pre');
        const outputPre = card.querySelector('.test-output pre');
        
        if (inputPre) {
            inputPre.addEventListener('click', function() {
                copyToClipboard(this.textContent);
            });
            inputPre.style.cursor = 'pointer';
            inputPre.title = 'Click to copy';
        }
        
        if (outputPre) {
            outputPre.addEventListener('click', function() {
                copyToClipboard(this.textContent);
            });
            outputPre.style.cursor = 'pointer';
            outputPre.title = 'Click to copy';
        }
    });
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes zoomIn {
            from {
                opacity: 0;
                transform: scale(0.9);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
    `;
    document.head.appendChild(style);
});
