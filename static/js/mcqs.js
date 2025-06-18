
function openAddMCQModal() {
    document.getElementById('addMCQModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

document.getElementById('addMCQForm').onsubmit = function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    
    fetch('/add_mcq', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('MCQ added successfully!');
            location.reload();
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while adding the MCQ.');
    });
};

function editMCQ(mcqId) {
    // Implementation for editing MCQ
    alert('Edit functionality will be implemented');
}

function deleteMCQ(mcqId) {
    if (confirm('Are you sure you want to delete this MCQ?')) {
        fetch('/delete_mcq/' + mcqId, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('MCQ deleted successfully!');
                location.reload();
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while deleting the MCQ.');
        });
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('addMCQModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}
