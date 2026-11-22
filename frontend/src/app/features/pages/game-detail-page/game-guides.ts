/**
 * Short guides for the playable games, written from the backend game services
 * (FarkleService, YachtGameService, BabbleService/BabbleGameService,
 * CloverMindedGameService, FourInARowGameService). Keep them in step when rules change.
 */
export interface GameGuide {
    stepsTitle: string;
    steps: { title: string; body: string }[];
    scoring?: { title: string; rows: [string, string][]; note?: string };
    notes?: { title: string; body: string }[];
}

export const GAME_GUIDES: Record<string, GameGuide> = {
    Farkle: {
        stepsTitle: 'How a turn works',
        steps: [
            { title: 'Roll', body: 'Roll all six dice from your phone. Everyone watches them land on the table.' },
            { title: 'Keep scoring dice', body: 'Pick up at least one scoring die: a 1, a 5, or a set. Roll the rest. Use all six and you roll them all again.' },
            { title: 'Bank or push', body: 'Bank your points, or keep rolling. Roll no scoring dice and you farkle: the turn scores nothing.' }
        ],
        scoring: {
            title: 'Scoring',
            rows: [
                ['Single 1', '100'], ['Single 5', '50'], ['Three 1s', '300'],
                ['Three of a kind, 2 to 6', 'Face × 100'], ['Four of a kind', '1,000'],
                ['Five of a kind', '2,000'], ['Six of a kind', '3,000'],
                ['Straight, 1 to 6', '1,500'], ['Three pairs', '1,500'],
                ['Four of a kind and a pair', '1,500'], ['Two triplets', '2,500']
            ],
            note: 'Your first bank needs 500 points or more. Reach 10,000 and everyone else gets one last turn.'
        },
        notes: [{ title: 'Fair dice', body: 'The server rolls every die, so the result is the same on every screen and nobody can tamper with it.' }]
    },
    Yacht: {
        stepsTitle: 'How a turn works',
        steps: [
            { title: 'Roll', body: 'Roll five dice, up to three times a turn.' },
            { title: 'Hold', body: 'Tap dice on your phone to keep them between rolls.' },
            { title: 'Score', body: 'Choose one empty box on your scorecard. Each box is used once, and a roll that does not fit scores 0 there.' }
        ],
        scoring: {
            title: 'Scorecard',
            rows: [
                ['Ones to Sixes', 'Sum of that number'], ['Three of a kind', 'Sum of all dice'],
                ['Four of a kind', 'Sum of all dice'], ['Full house', '25'], ['Small straight', '30'],
                ['Large straight', '40'], ['Yacht, five of a kind', '50'], ['Chance', 'Sum of all dice']
            ],
            note: 'Score 63 or more in Ones to Sixes for a 35-point bonus. Every Yacht after your first adds 100.'
        }
    },
    Babble: {
        stepsTitle: 'How a round works',
        steps: [
            { title: 'Look', body: 'The table shows a grid of letters and starts the timer for everyone at once.' },
            { title: 'Find words', body: 'Type words on your phone by linking letters that touch, diagonals included. Use each letter once per word, three letters or more.' },
            { title: 'Compare', body: 'When time runs out, words found by more than one player score nothing. Find the ones nobody else did.' }
        ],
        scoring: {
            title: 'Scoring',
            rows: [['3 or 4 letters', '1'], ['5 letters', '2'], ['6 letters', '3'], ['7 letters', '5'], ['8 letters or more', '11']]
        }
    },
    CloverMinded: {
        stepsTitle: 'How a round works',
        steps: [
            { title: 'Write clues', body: 'Everyone gets a clover of four word cards. Write one clue for each pair of words that touch.' },
            { title: 'Solve together', body: 'One clover at a time, the group places and turns the four cards until every clue fits. Its writer watches and stays quiet.' },
            { title: 'Score as a team', body: 'Everyone shares one score, so help each other get every clover right.' }
        ],
        scoring: {
            title: 'Scoring',
            rows: [['All four right, first try', '6'], ['All four right, second try', '4'], ['Second try, some right', '1 per card']],
            note: 'After a wrong first try, the wrong cards come off and the group gets one more go.'
        }
    },
    FourInARow: {
        stepsTitle: 'How a game works',
        steps: [
            { title: 'Drop', body: 'Take turns dropping a disc into one of seven columns from your phone.' },
            { title: 'Connect', body: 'Get four of your discs in a line, across, down or diagonally, and you win.' },
            { title: 'Draw', body: 'If all 42 spaces fill with no line of four, the game is a draw.' }
        ]
    }
};

/** For games without their own guide yet: how any game night on Board Game Hub goes. */
export const GENERIC_GUIDE: GameGuide = {
    stepsTitle: 'How a game night works',
    steps: [
        { title: 'Host', body: 'Open the game on a TV, laptop or tablet. That screen becomes the table and shows a room code.' },
        { title: 'Join', body: 'Everyone scans the QR code or types the code on their phone. No app and no account needed.' },
        { title: 'Play', body: 'Your phone is your hand. The table shows the board, the scores and whose turn it is.' }
    ]
};
