let currentVote = null;

function startVote(lineNumber, newCode, channel, client) {
    currentVote = {
        lineNumber: lineNumber,
        newCode: newCode,
        yesVotes: 0,
        noVotes: 0
    };
    client.say(channel, `A vote has been started to change line ${lineNumber} to "${newCode}". Say !yes to approve the change or !no to reject it.`);
}

function castVote(vote) {
    if (currentVote) {
        if (vote === 'yes') {
            currentVote.yesVotes++;
        } else {
            currentVote.noVotes++;
        }

        // Check if the vote has ended
        if (currentVote.yesVotes + currentVote.noVotes >= 5) {
            const result = currentVote;
            currentVote = null;
            return result;
        }
    }
    return null;
}

module.exports = { startVote, castVote };