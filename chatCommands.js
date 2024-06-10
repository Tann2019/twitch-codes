const vscode = require('vscode');
const { startVote, castVote, checkVote } = require('./votingSystem');
const { changeLine } = require('./editor');

function handleCommand(commandParts, channel, client) {
    const command = commandParts[0];

    if (command === 'suggest') {
        // Start a new vote for a code change
        const lineNumber = parseInt(commandParts[1]);
        const newCode = commandParts.slice(2).join(' ');
        if (!isNaN(lineNumber)) {
            startVote(lineNumber, newCode, channel, client);
        }
    } else if (command === 'yes' || command === 'no') {
        // Cast a vote
        const voteResult = castVote(command);
        if (voteResult) {
            // If the vote has ended, apply or reject the change
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                changeLine(voteResult, editor, channel, client);
            }
        }
    }
}

module.exports = { handleCommand };