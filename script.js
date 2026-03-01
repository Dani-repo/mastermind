// Define the available symbol sets for the game
const numberSet = [
    { id: 'zero', symbol: '0' },
    { id: 'one', symbol: '1' },
    { id: 'two', symbol: '2' },
    { id: 'three', symbol: '3' },
    { id: 'four', symbol: '4' },
    { id: 'five', symbol: '5' },
    { id: 'six', symbol: '6' },
    { id: 'seven', symbol: '7' },
    { id: 'eight', symbol: '8' },
    { id: 'nine', symbol: '9' }];
const animalSet = [
    { id: 'camel', symbol: '🐫' },
    { id: 'dog', symbol: '🐶' },
    { id: 'cat', symbol: '🐱' },
    { id: 'spider', symbol: '🕷️' },
    { id: 'cow', symbol: '🐮' },
    { id: 'owl', symbol: '🦉' },
    { id: 'butterfly', symbol: '🦋' },
    { id: 'rooster', symbol: '🐓' },
    { id: 'lobster', symbol: '🦞' },
    { id: 'duck', symbol: '🦆' }];
const thingSet = [
    { id: 'telephone', symbol: '☎︎' },
    { id: 'scissors', symbol: '✂︎' },
    { id: 'umbrella', symbol: '⛱︎' },
    { id: 'spade', symbol: '♣︎' },
    { id: 'heart', symbol: '❤︎' },
    { id: 'diamond', symbol: '♦︎' },
    { id: 'club', symbol: '♠︎' },
    { id: 'recycle', symbol: '♻︎' },
    { id: 'yinyang', symbol: '☯︎' },
    { id: 'scale', symbol: '⚖︎' }];

// symbols array to store the currently active symbol set (numbers / animals / shapes).
let symbols = [numberSet.length]; // default symbol type is Numbers
// selectedSymbols array to store the palette chosen by the player from the active set
let selectedSymbols = []; // for the set of symbols to play
// guessedSymbols array to store the current in-progress guess for the active attempt.
let guessedSymbols = [];  // set of symbols submitted as guess by player
let numberofGuessSymbols = 0; 
// answer array to store the last submitted guess (snapshot of guessedSymbols).
let answer = []; 
// Game configuration constants.
const MIN_SELECTED_SYMBOLS = 5; // minimum palette size required to start a game
const CODE_LENGTH = 5;          // number of symbols in the secret code / each guess
const MAX_ATTEMPTS = 10;        // max number of guesses the player gets

let currentAttempt = 1;
let secretCode = []; // to store the randomly generated secret code
let totalScore = 0; // cumulative score across guesses in the current game
// When true, the current guess row is finalised and cannot be edited.
let guessLocked = false; // flag to lock in guesses

// DOM element references
// these are used to attach event listeners and update the UI.
const symbolTypeSelect = document.getElementById('symbol-type');
const difficultySlider = document.getElementById('difficultySlider');

const selectedPalette = document.getElementById('selected-table');

const quickPickBtn = document.getElementById('quick-pick-btn');
const removeAllBtn = document.getElementById('remove-all-btn');
const playBtn = document.getElementById('play-btn');

const undoGuessBtn = document.getElementById('undo-guess-btn');
const submitGuessBtn = document.getElementById('submit-guess-btn');

const scoreDisplay = document.getElementById('score');
const scoreValue = document.getElementById('score-value');
const gameMessage = document.getElementById('game-message');
const secretCodeLabel = document.getElementById('secret-code-label');
const secretCodeDisplay = document.getElementById('secret-code-display');

// gameActive flag to track if a game is in progress (true) or not (false)
let gameActive = false;


// Update button labels and enable/disable button states based on current game
// and selection status so the player cannot perform invalid actions.
function updateControlStates() {
    const typeRadios = document.querySelectorAll('input[name="typeRadio"]');
    const hasEnoughSelected = selectedSymbols.length >= MIN_SELECTED_SYMBOLS;

    // if game is active, started (after Start Game btn is clicked)
    if (gameActive) {
        playBtn.textContent = 'Stop Game';
        playBtn.disabled = false;
        typeRadios.forEach(radio => {
            radio.disabled = true;
        });
        difficultySlider.disabled = true;
        quickPickBtn.disabled = true;
        removeAllBtn.disabled = true;
        undoGuessBtn.disabled = guessLocked || numberofGuessSymbols === 0;
        submitGuessBtn.disabled = guessLocked || numberofGuessSymbols !== CODE_LENGTH;
    } else {
        // when game has not started
        playBtn.textContent = 'Start Game';
        playBtn.disabled = !hasEnoughSelected;
        typeRadios.forEach(radio => {
            radio.disabled = false;
        });
        difficultySlider.disabled = false;
        quickPickBtn.disabled = false;
        removeAllBtn.disabled = selectedSymbols.length === 0;
        undoGuessBtn.disabled = true;
        submitGuessBtn.disabled = true;
    }
}

// Update numeric score display under 'Your Score'
function updateScoreDisplay() {
    if (scoreValue) {
        scoreValue.textContent = totalScore;
    }
}

// attach event listener to difficulty level slider
// Changing difficulty before a game starts resets the selected palette
difficultySlider.addEventListener('input', function () {
    if (!gameActive) {
        selectedSymbols = [];
        renderSelectedSet();
        updateControlStates();
    }
});

// **************************************************************************
//                              SET UP THE GAME
// **************************************************************************
// Build a row of pool buttons from the current symbols array
function fillPool() {
    const cellsHTML = symbols.map((item, index) => `
        <td class="pool-item">
            <button id="pool-btn-${index}" class="btn fs-4 text-center">
                ${item.symbol}
            </button>
        </td>`
    ).join('');

    return `<tr>${cellsHTML}</tr>`;
}


// Listen to changes on the symbol type radio buttons and rebuild the pool
// This also clears the selected symbols when no game is running
function getGameSymbolType() {
    document.querySelectorAll('input[name="typeRadio"]').forEach(radio => {
        radio.addEventListener('change', function () {
            gameType = this.value;
            switch (gameType) {
                case 'Numbers':
                    symbols = numberSet;
                    break;
                case 'Animals':
                    symbols = animalSet;
                    break;
                case 'Shapes':
                    symbols = thingSet;
                    break;
                default:
                    symbols = numberSet;
                    break;
            }
            const symbolPool = document.getElementById('pool-table');
            symbolPool.innerHTML = fillPool();
            if (!gameActive) {
                selectedSymbols = [];
                renderSelectedSet();
                updateControlStates();
            }
        });
    });
}

// **************************************************************************
//                              SELECT THE PLAY SYMBOLS
// **************************************************************************

// Create DOM for the selected symbols based on selectedSymbols array
// Re-render the whole row once so symbols "stack" instead of overriding
function renderSelectedSet() {
    const cells = selectedSymbols.map((item, index) => `
        <td class="selected-item">
            <button id="selected-btn-${index}" class="btn fs-4 text-center">
                ${item.symbol}
            </button>
        </td>`
    ).join('');

    selectedPalette.innerHTML = `<tr>${cells}</tr>`;
}

// Allow the player to manually pick symbols from the pool into selectedSymbols.
function pickSelected() {
    // Default to the number symbol set the first time the pool is filled
    // The active set will be updated when the user changes the radio button
    symbols = numberSet;
    const selectedPool = document.getElementById('pool-table');
    selectedPool.innerHTML = fillPool();

    // Clicking a button inside the pool table appends that symbol
    // to the selectedSymbols palette (unless a game is running).
    selectedPool.addEventListener('click', (event) => {
        if (gameActive) {
            return;
        }
        const btn = event.target.closest('button');

        // get the button id of the clicked button
        // from all "pool-btn-x" buttons and render the selectedSymbols
        if (btn && btn.id.startsWith('pool-btn-')) {
            const idParts = btn.id.split('-');
            const symbolIndex = parseInt(idParts[2]);
            // if symbols is available push it to the seletedSymbols array and render
            if (symbols[symbolIndex]) {
                selectedSymbols.push(symbols[symbolIndex]);
                renderSelectedSet();
                updateControlStates();
            }
        }
    });

    // if Quick Pick btn is clicked, push symbols in symbols pool to selectedSymbols array
    // numberi of symbols to be pushed depending on the difficulty level
    // and render the selectedSymbols.
    // Quick Pick fills selectedSymbols automatically based on difficulty
    quickPickBtn.addEventListener('click', function () {
        if (gameActive) {
            return;
        }
        let gameLevel = parseInt(difficultySlider.value, 10);
        selectedSymbols = [];
        for (let i = 0; i < gameLevel && i < symbols.length; i++) {
            selectedSymbols[i] = symbols[i];
        }
        renderSelectedSet();
        updateControlStates();
    });
}

// Attach listener to remove all symbols from the selectedSymbols palette
function removeAll() {
    removeAllBtn.addEventListener('click', function () {
        selectedPalette.innerHTML = "";
        selectedSymbols = [];
        updateControlStates();
    });
}

// **************************************************************************
//                              SUBMIT GUESSES
// **************************************************************************

// Attach event listener to the Selected Symbols table itself
const selectedSet = document.getElementById('selected-table');
selectedSet.addEventListener('click', handleSelectedClick);

// handle clicks in the Selected Symbols table to build the current guess
function handleSelectedClick(event) {
    if (!gameActive || guessLocked) {
        return;
    }
    const btn = event.target.closest('button');
    if (!btn) {
        return;
    }

    // Push the clicked symbol into guessedSymbols (up to CODE_LENGTH) and re-render.
    if (numberofGuessSymbols < CODE_LENGTH) {
        const symbolIndex = parseInt(btn.id.split('-')[2]);
        if (selectedSymbols[symbolIndex]) {
            numberofGuessSymbols++;
            guessedSymbols.push(selectedSymbols[symbolIndex]);
            renderGuessedSet(currentAttempt);
            updateControlStates();
        }
    }
}

// Render the current guessedSymbols into the appropriate guess row.
function renderGuessedSet(guessSequenceNumber) {
    const row = document.getElementById(`guess-${guessSequenceNumber}`);
    if (!row) return;

    // Ensure the row has placeholder cells once.
    let cells = row.querySelectorAll('.guess-item');
    if (cells.length === 0) {
        let html = '';
        for (let i = 0; i < CODE_LENGTH; i++) {
            html += `<td class="guess-item fs-5 text-center bg-info"></td>`;
        }
        row.innerHTML = html;
        cells = row.querySelectorAll('.guess-item');
    }

    // Clear all cells.
    cells.forEach(cell => {
        cell.textContent = '';
    });

    // Fill cells with current guess symbols (up to CODE_LENGTH).
    guessedSymbols.forEach((item, index) => {
        if (index < cells.length) {
            cells[index].textContent = item.symbol;
        }
    });
}

// Clear the current guess buffer and reset guess-related state for the active attempt
function fillGuess() {
    guessedSymbols = [];
    numberofGuessSymbols = 0;
    guessLocked = false;
    renderGuessedSet(currentAttempt);
    updateControlStates();
}

// Start or stop a game when the user clicks the main Play/Stop button
playBtn.addEventListener('click', function () {
    if (!gameActive) {
        // Start a new game: reset state, generate secret code, clear table
        gameActive = true;
        guessLocked = false;
        currentAttempt = 1;
        guessedSymbols = [];
        numberofGuessSymbols = 0;
        secretCode = getRandomItems(CODE_LENGTH);
        totalScore = 0;
        updateScoreDisplay();
        // clear the win/lost status, secret code answer text area on the display
        if (gameMessage) gameMessage.textContent = '';
        if (secretCodeLabel) secretCodeLabel.textContent = '';
        if (secretCodeDisplay) secretCodeDisplay.textContent = '';

        // target all rows
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            const guessRow = document.getElementById(`guess-${attempt}`);
            // Clear all previous guesses
            if (guessRow) {
                guessRow.querySelectorAll('.guess-item').forEach(cell => {
                    cell.textContent = '';
                });
            }
            // Clear all previous results
            const resultRow = document.getElementById(`result-${attempt}`);
            if (resultRow) {
                resultRow.querySelectorAll('.results').forEach(cell => {
                    cell.classList.remove('results-green', 'results-orange');
                    cell.textContent = '';
                });
            }
        }
        // render current guess.
        renderGuessedSet(currentAttempt);
    } else {
        gameActive = false;
        guessLocked = true;

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            const guessRow = document.getElementById(`guess-${attempt}`);
            if (guessRow) {
                guessRow.querySelectorAll('.guess-item').forEach(cell => {
                    cell.textContent = '';
                });
            }
            const resultRow = document.getElementById(`result-${attempt}`);
            if (resultRow) {
                resultRow.querySelectorAll('.results').forEach(cell => {
                    cell.classList.remove('results-green', 'results-orange');
                    cell.textContent = '';
                });
            }
        }
    }
    updateControlStates();
});

// Remove the last symbol from the current guess when Undo is clicked.
function undoGuess() {
    undoGuessBtn.addEventListener('click', (event) => {
        // do nothing if guessLocked flag is true (guess has already been locked in)
        if (guessLocked) {
            return;
        }
        if (numberofGuessSymbols > 0) {
            numberofGuessSymbols--;
            console.log("undoGuess :", numberofGuessSymbols);
            guessedSymbols.pop();
            renderGuessedSet(currentAttempt);
            updateControlStates();
        }
    });
}

// Finalise the current guess and calculate scoring when Submit btn is clicked.
function submitGuess() {
    submitGuessBtn.addEventListener('click', (event) => {
        if (gameActive && numberofGuessSymbols === CODE_LENGTH && !guessLocked) {
            console.log("submitGuess :", numberofGuessSymbols);
            answer = guessedSymbols.slice();
            checkResults();
        }
    });
}
// **************************************************************************
//                              CHECK THE RESULTS
// **************************************************************************


/**
 * Fisher-Yates shuffle algorithm.
 * @param {Array} codeArray The array to shuffle (a copy of selectedSymbols so not to change the original array)
 * @returns {Array} The shuffled codeArray.
 */
function shuffleArray(codeArray) {
    let currentIndex = codeArray.length; 
    let randomIndex;

    while (currentIndex !== 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [codeArray[currentIndex], codeArray[randomIndex]] = [
            codeArray[randomIndex], codeArray[currentIndex]];
    }
    return codeArray;
}

// Build a random secret code of the requested length from the selectedSymbols pool
function getRandomItems(codeLength) {
    console.log("getRandomItems - selectedSymbols.length :", selectedSymbols.length);
    if (selectedSymbols.length <= codeLength) {
        // if selectedSymbols <= codeLength, return whole array and shuffle
        return shuffleArray([...selectedSymbols]);
    }
    // do not change the original array
    const shuffled = shuffleArray([...selectedSymbols]);
    // Slice the first x elements from the shuffled array.
    return shuffled.slice(0, codeLength);
}




// Display ✔ with green or orange background colour for the given attempt
// based on the number of correct symbols and positions.
function renderResults(guessSequenceNumber, greenTick, orangeTick) {
    const row = document.getElementById(`result-${guessSequenceNumber}`);
    if (!row) return;

    const cells = row.querySelectorAll('.results');
    const totalCells = cells.length;
    let index;

    // Render greenTick ✔ symbols first (correct symbol and correct position).
    for (index=0; index < greenTick && index < totalCells; index++) {
        const cell = cells[index];
        cell.textContent = '✔';
        cell.classList.add('results-green');
    }
    // Then render orangeTick ✔ symbols (correct symbol, wrong position).
    for (let j = 0; j < orangeTick && index < totalCells; j++, index++) {
        const cell = cells[index];
        cell.textContent = '✔';
        cell.classList.add('results-orange');
    }
    
}
// Compare the current guess to the secret code, update ticks, and handle
// scoring and win/lose progression for the current attempt.
function checkResults() {
    if (!secretCode || secretCode.length === 0) {
        // if no secret code, then generate one
        secretCode = getRandomItems(CODE_LENGTH);
    }

    console.log("checkResults- secretCode :", secretCode);
    console.log("checkResults- guessedSymbols :", guessedSymbols);

    let greenTick = 0;
    let orangeTick = 0;
    // iterate every items in guessedSymbols on every item in secretCode
    for (let i = 0; i < guessedSymbols.length; i++) {
        const guess = guessedSymbols[i].id;

        for (let j = 0; j < secretCode.length; j++) {
            const code = secretCode[j].id;
            if (guess === code) {
                if (i === j) { greenTick++; } // item and position match
                else { orangeTick++; }        // item found but position is wrong
                break;
            }
        }
    }

    console.log("greenTick :", greenTick);
    console.log("orangeTick :", orangeTick);

    // Scoring: each green tick is worth 2 points, orange ticks are 0
    totalScore += greenTick * 2;
    updateScoreDisplay();

    renderResults(currentAttempt, greenTick, orangeTick);

    // display WIN if there are 5 greenTicks
    if (greenTick === CODE_LENGTH) {
        // Bonus for cracking the code early: 50 points + 10 per unused attempt
        const unusedAttempts = MAX_ATTEMPTS - currentAttempt;
        const bonus = 50 + unusedAttempts * 10;
        totalScore += bonus;
        updateScoreDisplay();

        if (gameMessage) gameMessage.textContent = 'You WIN';
        gameActive = false;
        guessLocked = true;
        updateControlStates();
        return;
    }

    currentAttempt++;
    
    // display LOST if attempts > MAX_ATTEMPTS (currently fixed at 10)
    if (currentAttempt > MAX_ATTEMPTS) {
        if (gameMessage) gameMessage.textContent = 'You LOST';

        // display secret code.
        if (secretCodeLabel) {
            secretCodeLabel.textContent = 'Secret code:';
        }
        if (secretCodeDisplay) {
            const codeSymbols = secretCode.map(item => item.symbol).join(' ');
            secretCodeDisplay.textContent = codeSymbols;
        }
        gameActive = false;
        guessLocked = true;
        updateControlStates();
        return;
    }

    // Prepare for next attempt
    guessedSymbols = [];
    numberofGuessSymbols = 0;
    guessLocked = false;
    renderGuessedSet(currentAttempt);
    updateControlStates();
}

// Main game play sequence
document.addEventListener('DOMContentLoaded', () => {
    if (!gameActive) {
        getGameSymbolType();
        pickSelected();
        removeAll();
        fillGuess();
        undoGuess();
        submitGuess();
        updateControlStates();
    }
});






