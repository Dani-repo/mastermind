let secretCode = [0, 4, 3, 2, 5];
let yourGuess = [2, 4, 3, 1, 5];

let greenTick = 0, greyTick = 0;
for (let i = 0; i < yourGuess.length; i++) {
    const guess = yourGuess[i];
    

    for (let j = 0; j < secretCode.length; j++) {
        const code = secretCode[j];
        if (guess == code) {
            if (i == j) { greenTick++}
            else { greyTick++ }
            break;
        }
    }
}

console.log("greenTick :", greenTick);
console.log("greyTick :", greyTick);   