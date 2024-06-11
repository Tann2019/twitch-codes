const vscode = require('vscode');
const tmi = require('tmi.js');

function activate(context) {
    console.log('Congratulations, your extension "highlighter" is now active!');

    const highlightDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(129,95,192,.5)'
    });

    const highlightCommand = vscode.commands.registerCommand('highlighter.highlightLine', function () {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const line = editor.selection.active.line;
            const range = new vscode.Range(line, 0, line, editor.document.lineAt(line).text.length);
            const decorationOptions = { range: range };
            editor.setDecorations(highlightDecorationType, [decorationOptions]);
        }
    });

    const unhighlightCommand = vscode.commands.registerCommand('highlighter.unhighlightLine', function () {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.setDecorations(highlightDecorationType, []); // remove all decorations of this type
        }
    });

    const connectCommand = vscode.commands.registerCommand('highlighter.connect', async function () {
        const config = vscode.workspace.getConfiguration('highlighter');
        let oauthToken = config.get('oauthToken');
        let channelName = config.get('channelName');
    
        if (!oauthToken) {
            oauthToken = await vscode.window.showInputBox({ prompt: 'Enter your OAuth token:' });
            await config.update('oauthToken', oauthToken, vscode.ConfigurationTarget.Global);
        }
    
        if (!channelName) {
            channelName = await vscode.window.showInputBox({ prompt: 'Enter your channel name:' });
            await config.update('channelName', channelName, vscode.ConfigurationTarget.Global);
        }

        if (oauthToken && channelName) {
            const client = new tmi.Client({
                options: { debug: true },
                connection: {
                    secure: true,
                    reconnect: true
                },
                identity: {
                    username: channelName,
                    password: oauthToken
                },
                channels: [ channelName ]
            });

            client.connect();

            let currentDecorations = [];
            let currentVote = null;


            client.on('message', (channel, tags, message) => {
                if (message.startsWith('!')) {
                    const username = tags['username'];
                    console.log(`Message from ${username}: ${message}`);
                    // This is a command, perform the desired action
                    const commandParts = message.slice(1).split(' '); // remove the '!' from the start of the message and split by spaces
                    const command = commandParts[0];
                    if (command === 'highlight') {
                        // Highlight the specified line in the editor
                        const lineNumber = parseInt(commandParts[1]);
                        const reason = commandParts.slice(2).join(' '); // get the rest of the message as the reason
                        if (!isNaN(lineNumber)) {
                            const editor = vscode.window.activeTextEditor;
                            if (editor) {
                                const zeroBasedLineNumber = lineNumber - 1; // convert to 0-based index
                                const range = new vscode.Range(zeroBasedLineNumber, 0, zeroBasedLineNumber, editor.document.lineAt(zeroBasedLineNumber).text.length);
                                let decorationOptions;
                                if (reason.length !== 0) {
                                    decorationOptions = { 
                                        range: range,
                                        renderOptions: {
                                            after: {
                                                contentText: ` Highlighted by ${username} for reason: ${reason}`,
                                                color: 'rgba(132,105,182,.6)'
                                            }
                                        }
                                    };
                                } else {
                                    decorationOptions = { 
                                        range: range,
                                        renderOptions: {
                                            after: {
                                                contentText: ` Highlighted by ${username}`,
                                                color: 'rgba(132,105,182,.6)'
                                            }
                                        }
                                    };
                                }

                                // Check if a highlight already exists for this line
                                const existingDecorationIndex = currentDecorations.findIndex(decoration => decoration.range.isEqual(range));
                                if (existingDecorationIndex !== -1) {
                                    // If a highlight already exists, remove it
                                    currentDecorations.splice(existingDecorationIndex, 1);
                                }

                                // Add the new highlight
                                currentDecorations.push(decorationOptions);
                                editor.setDecorations(highlightDecorationType, currentDecorations);
                            }
                        }
                    } else if (command === 'unhighlight') {
                        // Remove all highlights from the editor
                        const editor = vscode.window.activeTextEditor;
                        if (editor) {
                            currentDecorations = []; // clear the current decorations
                            editor.setDecorations(highlightDecorationType, currentDecorations); // remove all decorations of this type
                        }
                    }

                    if (command === 'suggest') {
                        const editor = vscode.window.activeTextEditor;
                        // Start a new vote for a code change
                        const lineNumber = parseInt(commandParts[1]);
                        const newCode = commandParts.slice(2).join(' ');
                        if (!isNaN(lineNumber)) {
                            currentVote = {
                                lineNumber: lineNumber,
                                newCode: newCode,
                                yesVotes: 0,
                                noVotes: 0
                            };
                            let decorationOptions;
                            client.say(channel, `A vote has been started to change line ${lineNumber} to "${newCode}". Say !yes to approve the change or !no to reject it.`);
                            vscode.window.showInformationMessage(`A vote has been started to change line ${lineNumber} to "${newCode}".`);
                            vscode.window.showInformationMessage(`Current vote count: Yes - ${currentVote.yesVotes}, No - ${currentVote.noVotes}`);
                            const zeroBasedLineNumber = lineNumber - 1; // convert to 0-based index
                            const range = new vscode.Range(zeroBasedLineNumber, 0, zeroBasedLineNumber, editor.document.lineAt(zeroBasedLineNumber).text.length);
                            editor.revealRange(range, vscode.TextEditorRevealType.InCenter); // Scroll to the line
                            decorationOptions = { 
                                range: range,
                                renderOptions: {
                                    after: {
                                        contentText: ` Suggested by ${username} to replace with: ${newCode}`,
                                        color: 'rgba(255, 3, 64, 0.69)'
                                    }
                                }
                            };
                            currentDecorations.push(decorationOptions);
                            editor.setDecorations(highlightDecorationType, currentDecorations);
                            setTimeout(() => {
                                if (currentVote && currentVote.lineNumber === lineNumber) {
                                    if (currentVote.yesVotes > currentVote.noVotes) {
                                        // Apply the change
                                        const editor = vscode.window.activeTextEditor;
                                        if (editor) {
                                            const zeroBasedLineNumber = currentVote.lineNumber - 1;
                                            const range = new vscode.Range(zeroBasedLineNumber, 0, zeroBasedLineNumber, editor.document.lineAt(zeroBasedLineNumber).text.length);
                                            editor.edit(editBuilder => {
                                                editBuilder.replace(range, currentVote.newCode);
                                            });
                                            client.say(channel, `The change has been made to line ${currentVote.lineNumber}.`);
                                            vscode.window.showInformationMessage(`The change has been made to line ${currentVote.lineNumber}.`);
                                            vscode.window.showInformationMessage(`Final vote count: Yes - ${currentVote.yesVotes}, No - ${currentVote.noVotes}`);
                                            editor.revealRange(range, vscode.TextEditorRevealType.InCenter); // Scroll to the line
                                            //remove the decoration
                                            const existingDecorationIndex = currentDecorations.findIndex(decoration => decoration.range.isEqual(range));
                                            if (existingDecorationIndex !== -1) {
                                                // If a highlight already exists, remove it
                                                currentDecorations.splice(existingDecorationIndex, 1);
                                            }
                                            editor.setDecorations(highlightDecorationType, currentDecorations);
                                        }
                                    } else {
                                        client.say(channel, `The change to line ${currentVote.lineNumber} has been rejected.`);
                                        vscode.window.showInformationMessage(`The change to line ${currentVote.lineNumber} has been rejected.`);
                                        vscode.window.showInformationMessage(`Final vote count: Yes - ${currentVote.yesVotes}, No - ${currentVote.noVotes}`);
                                        //remove the decoration
                                        const zeroBasedLineNumber = currentVote.lineNumber - 1;
                                        const range = new vscode.Range(zeroBasedLineNumber, 0, zeroBasedLineNumber, editor.document.lineAt(zeroBasedLineNumber).text.length);
                                        const existingDecorationIndex = currentDecorations.findIndex(decoration => decoration.range.isEqual(range));
                                        editor.revealRange(range, vscode.TextEditorRevealType.InCenter); // Scroll to the line
                                        if (existingDecorationIndex !== -1) {
                                            // If a highlight already exists, remove it
                                            currentDecorations.splice(existingDecorationIndex, 1);
                                        }
                                        editor.setDecorations(highlightDecorationType, currentDecorations);
                                    }
                                }
                            }, 10000); // assuming the vote lasts for 10 seconds
                        }
                    } else if (command === 'yes' || command === 'no') {
                        // Count the votes
                        let voteMessage;
                        if (command === 'yes') {
                            currentVote.yesVotes++;
                            if (voteMessage) {
                                voteMessage.hide();
                            }
                            voteMessage = vscode.window.showInformationMessage(`Current vote count: Yes - ${currentVote.yesVotes}, No - ${currentVote.noVotes}`);
                        } else if (command === 'no') {
                            currentVote.noVotes++;
                            if (voteMessage) {
                                voteMessage.hide();
                            }
                            voteMessage = vscode.window.showInformationMessage(`Current vote count: Yes - ${currentVote.yesVotes}, No - ${currentVote.noVotes}`);
                        }
                        
                    } else if (command.startsWith('scrollto')) {
                        const lineNumber = parseInt(commandParts[1]);
                        if (!isNaN(lineNumber)) {
                            const editor = vscode.window.activeTextEditor;
                            if (editor) {
                                const zeroBasedLineNumber = lineNumber - 1;
                                const range = new vscode.Range(zeroBasedLineNumber, 0, zeroBasedLineNumber, editor.document.lineAt(zeroBasedLineNumber).text.length);
                                editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
                                client.say(channel, `Scrolled to line ${lineNumber}.`);
                            }
                        }
                    } else if (command === 'help') {
                        client.say(channel, 'Available commands: !highlight <line number> <reason>, !unhighlight, !suggest <line number> <new code>, !yes, !no, !scrollto <line number>');
                    }
                }
            });
        } else {
            vscode.window.showErrorMessage('OAuth token and channel name are required to connect to Twitch chat.');
        }
    });

    context.subscriptions.push(highlightCommand, unhighlightCommand, connectCommand);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};