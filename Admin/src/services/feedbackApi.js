function logFeedback(feedback) {
    const fs = require('fs');
    const path = require('path');
    const logFilePath = path.join(__dirname, '../../feedback-logs/feedback.log');

    const logEntry = {
        timestamp: new Date().toISOString(),
        feedback: feedback
    };

    fs.appendFileSync(logFilePath, JSON.stringify(logEntry) + '\n');
}

function submitFeedback(isLiked) {
    const feedback = isLiked ? 'beğendim' : 'beğenmedim';
    logFeedback(feedback);
    return feedback;
}

module.exports = {
    submitFeedback
};