
let selectedAnswers = {};

function selectOption(element, option, mcqId) {
    // Remove previous selection
    const mcqCard = element.closest('.mcq-card');
    const options = mcqCard.querySelectorAll('.option');
    options.forEach(opt => opt.classList.remove('selected'));
    
    // Add selection to clicked option
    element.classList.add('selected');
    selectedAnswers[mcqId] = option;
}

function submitAnswer(mcqId) {
    const selectedAnswer = selectedAnswers[mcqId];
    if (!selectedAnswer) {
        alert('Please select an answer first.');
        return;
    }
    
    fetch('/submit_mcq_answer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            mcq_id: mcqId,
            answer: selectedAnswer
        })
    })
    .then(response => response.json())
    .then(data => {
        const resultDiv = document.getElementById('result-' + mcqId);
        const mcqCard = document.querySelector(`[data-mcq-id="${mcqId}"]`) || 
                       document.querySelector('.mcq-card .mcq-actions button[onclick*="' + mcqId + '"]').closest('.mcq-card');
        
        if (data.correct) {
            resultDiv.innerHTML = '<div class="result-correct"><i class="fas fa-check-circle"></i> Correct!</div>';
            resultDiv.className = 'mcq-result correct';
        } else {
            resultDiv.innerHTML = '<div class="result-incorrect"><i class="fas fa-times-circle"></i> Incorrect. Correct answer: ' + data.correct_answer + '</div>';
            resultDiv.className = 'mcq-result incorrect';
        }
        
        resultDiv.style.display = 'block';
        
        // Show explanation button if explanation exists
        const explanationBtn = mcqCard.querySelector('.btn-outline');
        if (explanationBtn) {
            explanationBtn.style.display = 'inline-block';
        }
        
        // Disable further selections
        const options = mcqCard.querySelectorAll('.option');
        options.forEach(opt => {
            opt.style.pointerEvents = 'none';
            if (opt.textContent.trim().startsWith(data.correct_answer + ')')) {
                opt.classList.add('correct-answer');
            }
        });
        
        // Hide submit button
        mcqCard.querySelector('.btn-primary').style.display = 'none';
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while submitting the answer.');
    });
}

function showExplanation(mcqId) {
    const explanationDiv = document.getElementById('explanation-' + mcqId);
    if (explanationDiv) {
        explanationDiv.style.display = explanationDiv.style.display === 'none' ? 'block' : 'none';
    }
}

function filterMCQs() {
    const moduleFilter = document.getElementById('moduleFilter').value;
    const difficultyFilter = document.getElementById('difficultyFilter').value;
    const mcqCards = document.querySelectorAll('.mcq-card');
    
    mcqCards.forEach(card => {
        const cardModule = card.getAttribute('data-module');
        const cardDifficulty = card.getAttribute('data-difficulty');
        
        let showCard = true;
        
        if (moduleFilter && cardModule !== moduleFilter) {
            showCard = false;
        }
        
        if (difficultyFilter && cardDifficulty !== difficultyFilter) {
            showCard = false;
        }
        
        card.style.display = showCard ? 'block' : 'none';
    });
}
