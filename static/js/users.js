
// User management JavaScript
function openAddUserModal() {
    openModal('addUserModal');
}

function editUser(id, username, email, fullName, role) {
    document.getElementById('edit_user_id').value = id;
    document.getElementById('edit_username').value = username;
    document.getElementById('edit_email').value = email;
    document.getElementById('edit_full_name').value = fullName;
    document.getElementById('edit_role').value = role;
    document.getElementById('edit_password').value = '';
    
    openModal('editUserModal');
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        const originalText = event.target.innerHTML;
        const stopLoading = showLoading(event.target, originalText);
        
        apiCall(`/admin/users/${userId}/delete`, {
            method: 'POST'
        })
        .then(response => {
            if (response.success) {
                showToast(response.message);
                location.reload();
            } else {
                showToast(response.message, 'error');
            }
        })
        .catch(error => {
            showToast('Failed to delete user', 'error');
        })
        .finally(() => {
            stopLoading();
        });
    }
}

// Add user form submission
document.getElementById('addUserForm')?.addEventListener('submit', function(e) {
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
    
    apiCall('/admin/users/add', {
        method: 'POST',
        body: JSON.stringify(data)
    })
    .then(response => {
        if (response.success) {
            showToast(response.message);
            closeModal('addUserModal');
            location.reload();
        } else {
            showToast(response.message, 'error');
        }
    })
    .catch(error => {
        showToast('Failed to add user', 'error');
    })
    .finally(() => {
        stopLoading();
    });
});

// Edit user form submission
document.getElementById('editUserForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!validateForm(this)) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    const userId = data.user_id;
    delete data.user_id;
    
    // Remove password if empty
    if (!data.password) {
        delete data.password;
    }
    
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    const stopLoading = showLoading(submitBtn, originalText);
    
    apiCall(`/admin/users/${userId}/edit`, {
        method: 'POST',
        body: JSON.stringify(data)
    })
    .then(response => {
        if (response.success) {
            showToast(response.message);
            closeModal('editUserModal');
            location.reload();
        } else {
            showToast(response.message, 'error');
        }
    })
    .catch(error => {
        showToast('Failed to update user', 'error');
    })
    .finally(() => {
        stopLoading();
    });
});

// Search functionality
const searchInput = document.getElementById('userSearch');
if (searchInput) {
    const searchUsers = debounce(function(query) {
        const rows = document.querySelectorAll('.data-table tbody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(query.toLowerCase())) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }, 300);
    
    searchInput.addEventListener('input', function() {
        searchUsers(this.value);
    });
}

// Sort table functionality
function sortTable(columnIndex) {
    const table = document.querySelector('.data-table');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    const isAscending = table.dataset.sortOrder !== 'asc';
    table.dataset.sortOrder = isAscending ? 'asc' : 'desc';
    
    rows.sort((a, b) => {
        const aText = a.cells[columnIndex].textContent.trim();
        const bText = b.cells[columnIndex].textContent.trim();
        
        if (isAscending) {
            return aText.localeCompare(bText);
        } else {
            return bText.localeCompare(aText);
        }
    });
    
    rows.forEach(row => tbody.appendChild(row));
}

// Initialize user management
document.addEventListener('DOMContentLoaded', function() {
    // Add sort indicators to table headers
    const headers = document.querySelectorAll('.data-table th');
    headers.forEach((header, index) => {
        if (index < headers.length - 1) { // Skip actions column
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => sortTable(index));
        }
    });
    
    // Add hover effects to action buttons
    const actionButtons = document.querySelectorAll('.actions .btn');
    actionButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
});
