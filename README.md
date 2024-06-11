# TwitchDev Extension for Visual Studio Code

This extension allows Twitch chat to interact with your Visual Studio Code editor. Users can highlight lines, suggest code changes, and vote on those changes.

## Features

- Highlight a line of code in the editor
- Unhighlight a line of code in the editor
- Suggest a change to a line of code
- Vote on suggested changes
- Scroll to a specific line in the editor

<!-- ![Extension in action](images/extension-in-action.gif) -->

## Requirements

- Visual Studio Code
- Node.js
- A Twitch account

## Extension Settings

This extension contributes the following settings:

- `twitchdev.oauthToken`: Your Twitch OAuth token.
- `twitchdev.channelName`: The name of your Twitch channel.

## Commands

- `!highlight <line number> <reason>`: Highlights the specified line in the editor. The reason is optional.
- `!unhighlight`: Removes all highlights from the editor.
- `!suggest <line number> <new code>`: Starts a vote to change the specified line to the new code.
- `!yes` and `!no`: Vote on the current code change suggestion.
- `!scrollto <line number>`: Scrolls the editor to the specified line.
- `!help`: Lists all available commands.

## Known Issues

- Leaving Files removes Highlights
- Starting a new line after highlight keeps highlight
- cannot highlight blank lines
- suggestion voting system is spammy

## Release Notes

### 0.0.1

Initial release of TwitchDev


---

For more information:

- [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
- [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**