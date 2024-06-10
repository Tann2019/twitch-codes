const vscode = require('vscode');

function changeLine(voteResult, editor, channel, client) {
    const zeroBasedLineNumber = voteResult.lineNumber - 1;
    const range = new vscode.Range(zeroBasedLineNumber, 0, zeroBasedLineNumber, editor.document.lineAt(zeroBasedLineNumber).text.length);
    editor.edit(editBuilder => {
        editBuilder.replace(range, voteResult.newCode);
    });
    if (voteResult.yesVotes > voteResult.noVotes) {
        client.say(channel, `The change has been made to line ${voteResult.lineNumber}.`);
    } else {
        client.say(channel, `The change to line ${voteResult.lineNumber} has been rejected.`);
    }
}

module.exports = { changeLine };