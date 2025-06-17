
// Module management JavaScript
function openAddModuleModal() {
    openModal('addModuleModal');
}

// Add module form submission
document.getElementById('addModuleForm')?.addEventListener('submit', function(e) {
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
    
    apiCall('/admin/modules/add', {
        method: 'POST',
        body: JSON.stringify(data)
    })
    .then(response => {
        if (response.success) {
            showToast(response.message);
            closeModal('addModuleModal');
            location.reload();
        } else {
            showToast(response.message, 'error');
        }
    })
    .catch(error => {
        showToast('Failed to add module', 'error');
    })
    .finally(() => {
        stopLoading();
    });
});

// Module cards animation
document.addEventListener('DOMContentLoaded', function() {
    const moduleCards = document.querySelectorAll('.module-card');
    
    // Add staggered animation to module cards
    moduleCards.forEach((card, index) => {
        card.style.animation = `fadeInUp 0.6s ease-out ${index * 0.1}s both`;
    });
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
});
