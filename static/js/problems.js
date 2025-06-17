
// Problem management JavaScript
function openAddProblemModal() {
    openModal('addProblemModal');
}

// Add problem form submission
document.getElementById('addProblemForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!validateForm(this)) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    const stopLoading = showLoading(submitBtn, originalText);
    
    apiCall('/admin/problems/add', {
        method: 'POST',
        body: JSON.stringify(data)
    })
    .then(response => {
        if (response.success) {
            showToast(response.message);
            closeModal('addProblemModal');
            location.reload();
        } else {
            showToast(response.message, 'error');
        }
    })
    .catch(error => {
        showToast('Failed to add problem', 'error');
    })
    .finally(() => {
        stopLoading();
    });
});

// Problem cards animation and filtering
document.addEventListener('DOMContentLoaded', function() {
    const problemCards = document.querySelectorAll('.problem-card');
    
    // Add staggered animation to problem cards
    problemCards.forEach((card, index) => {
        card.style.animation = `slideInLeft 0.6s ease-out ${index * 0.1}s both`;
    });
    
    // Difficulty filter
    const difficultyFilter = document.getElementById('difficultyFilter');
    if (difficultyFilter) {
        difficultyFilter.addEventListener('change', function() {
            const selectedDifficulty = this.value.toLowerCase();
            
            problemCards.forEach(card => {
                const difficulty = card.querySelector('.difficulty-badge').textContent.toLowerCase();
                
                if (selectedDifficulty === '' || difficulty === selectedDifficulty) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInLeft {
            from {
                opacity: 0;
                transform: translateX(-30px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
    `;
    document.head.appendChild(style);
});
