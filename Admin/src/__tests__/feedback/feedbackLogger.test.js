const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '../../../feedback-logs/feedback.log');

function logFeedback(feedback) {
    fs.appendFileSync(logFilePath, `${new Date().toISOString()}: ${feedback}\n`);
}

test('feedback logging', () => {
    logFeedback('beğendim');
    const logs = fs.readFileSync(logFilePath, 'utf8').split('\n').filter(Boolean);
    expect(logs).toContain(expect.stringContaining('beğendim'));

    logFeedback('beğenmedim');
    const updatedLogs = fs.readFileSync(logFilePath, 'utf8').split('\n').filter(Boolean);
    expect(updatedLogs).toContain(expect.stringContaining('beğenmedim'));
});