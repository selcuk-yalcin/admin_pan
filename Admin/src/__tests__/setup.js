const fs = require('fs');
const path = require('path');

const logFeedback = (feedback) => {
    const logFilePath = path.join(__dirname, '../../feedback-logs/feedback.log');
    const logEntry = `${new Date().toISOString()}: ${feedback}\n`;
    fs.appendFileSync(logFilePath, logEntry);
};

module.exports = { logFeedback };