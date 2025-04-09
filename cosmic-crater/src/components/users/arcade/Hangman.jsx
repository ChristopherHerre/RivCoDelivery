import React, { useState, useEffect } from 'react';

const phrases = [
  "Chris Herre",
  "Project Two",
  "Gaddis 8th Edition",
  "Linux Kernel",
  "Dennis Ritchie"
];

const gallowsStages = [
  `       _____
       |    |
       |    |
       |
       |
       |
       |
       |
       |
       |
       |
       |
       |
_______|_________`,
  `       _____
       |    |
       |    |
       |  (0.0)
       |
       |
       |
       |
       |
       |
       |
       |
       |
_______|_________`,
  `       _____
       |    |
       |    |
       |  (0.0)
       |    o
       |    |
       |    |
       |    |
       |    |
       |
       |
       |
       |
_______|_________`,
  `       _____
       |    |
       |    |
       |  (0.0)
       |    o
       |  \\ |
       |   \\|
       |    |
       |    |
       |
       |
       |
       |
_______|_________`,
  `       _____
       |    |
       |    |
       |  (0.0)
       |    o
       |  \\ | /
       |   \\|/
       |    |
       |    |
       |
       |
       |
       |
_______|_________`,
  `       _____
       |    |
       |    |
       |  (0.0)
       |    o
       |  \\ | /
       |   \\|/
       |    |
       |    |
       |   / 
       |  /  
       |
       |
_______|_________`,
  `       _____
       |    |
       |    |
       |  (0.0)
       |    o
       |  \\ | /
       |   \\|/
       |    |
       |    |
       |   / \\
       |  /   \\
       |
       |
_______|_________`,
  `       _____
       |    |
       |    |
       |  (X.X)
       |    o
       |  \\ | /
       |   \\|/
       |    |
       |    |
       |   / \\
       |  /   \\
       |
       |
_______|_________`
];

function HangmanGame() {
  // view can be "menu", "game", "score", or "tutorial"
  const [view, setView] = useState("menu");
  const [score, setScore] = useState(0);
  const [phrase, setPhrase] = useState("");
  // correct is an array holding correctly guessed characters (or null if not guessed)
  const [correct, setCorrect] = useState([]);
  const [wrongGuesses, setWrongGuesses] = useState([]);
  const [incorrect, setIncorrect] = useState(0);
  const [guess, setGuess] = useState("");
  const [gallows, setGallows] = useState(gallowsStages[0]);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState("");

  // Update the displayed progress (underscores and correct letters) whenever the game state changes.
  useEffect(() => {
    if (view === "game" && phrase) {
      let updatedProgress = "";
      for (let i = 0; i < phrase.length; i++) {
        if (phrase[i] === ' ') {
          updatedProgress += "   ";
        } else if (correct[i]) {
          updatedProgress += correct[i] + " ";
        } else {
          updatedProgress += "_ ";
        }
      }
      setProgress(updatedProgress);
    }
  }, [correct, phrase, view]);

  const startGame = () => {
    // Randomly choose a phrase
    const randPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    setPhrase(randPhrase);
    setCorrect(new Array(randPhrase.length).fill(null));
    setWrongGuesses([]);
    setIncorrect(0);
    setGallows(gallowsStages[0]);
    setMessage("");
    setView("game");
  };

  const handleGuess = (e) => {
    e.preventDefault();
    if (!guess) return;
    const lowerGuess = guess.toLowerCase();
    let found = false;

    // Check if the letter has already been guessed
    if (
      wrongGuesses.includes(lowerGuess) ||
      correct.some(ch => ch && ch.toLowerCase() === lowerGuess)
    ) {
      setMessage("Letter already guessed!");
      setGuess("");
      return;
    }

    let newCorrect = [...correct];
    // Reveal correct letters in the phrase
    for (let i = 0; i < phrase.length; i++) {
      if (phrase[i].toLowerCase() === lowerGuess) {
        newCorrect[i] = phrase[i]; // Preserve original casing
        found = true;
      }
    }
    if (found) {
      setCorrect(newCorrect);
      setMessage("");
    } else {
      // Handle incorrect guess
      const newWrongGuesses = [...wrongGuesses, lowerGuess];
      setWrongGuesses(newWrongGuesses);
      const newIncorrect = incorrect + 1;
      setIncorrect(newIncorrect);
      setScore(s => s - 1);
      if (newIncorrect < gallowsStages.length) {
        setGallows(gallowsStages[newIncorrect]);
      }
      setMessage("Incorrect guess!");
      if (newIncorrect === 7) {
        // Game lost
        setScore(s => s - 10);
        setMessage("Game Over! You lost. The phrase was: " + phrase);
        setTimeout(() => {
          setView("menu");
        }, 3000);
        return;
      }
    }
    setGuess("");

    // Check if the player has solved the phrase
    if (newCorrect.join("") === phrase) {
      setScore(s => s + 12);
      setMessage("Congratulations! You win!");
      setTimeout(() => {
        setView("menu");
      }, 2000);
    }
  };

  const renderMenu = () => (
    <div>
      <pre>{`
  /$$   /$$
 | $$  | $$
 | $$  | $$  /$$$$$$  /$$$$$$$   /$$$$$$  /$$$$$$/$$$$   /$$$$$$  /$$$$$$$
 | $$$$$$$$ |____  $$| $$__  $$ /$$__  $$| $$_  $$_  $$ |____  $$| $$__  $$
 | $$__  $$  /$$$$$$$| $$  \\ $$| $$  \\ $$| $$ \\ $$ \\ $$  /$$$$$$$| $$  \\ $$
 | $$  | $$ /$$__  $$| $$  | $$| $$  | $$| $$ | $$ | $$ /$$__  $$| $$  | $$
 | $$  | $$|  $$$$$$$| $$  | $$|  $$$$$$$| $$ | $$ | $$|  $$$$$$$| $$  | $$
 |__/  |__/ \\_______/|__/  |__/ \\____  $$|__/ |__/ |__/ \\_______/|__/  |__/
                              /$$  \\ $$                                  
                             |  $$$$$$/                                   
                              \\______/                                    
      `}</pre>
      <button onClick={startGame}>Play Hangman</button>
      <button onClick={() => setView("score")}>Show my score</button>
      <button onClick={() => setView("tutorial")}>Tutorial</button>
      {/* In a web app, "Close" might simply show a goodbye message */}
      <button onClick={() => alert("Thanks for playing!")}>Close</button>
    </div>
  );

  const renderScore = () => (
    <div>
      <h2>Your Score: {score}</h2>
      <button onClick={() => setView("menu")}>Back to Menu</button>
    </div>
  );

  const renderTutorial = () => (
    <div>
      <h2>Tutorial</h2>
      <p>Instructions:</p>
      <ul>
        <li>Solve the phrase by guessing the characters that fill in the blanks.</li>
        <li>You have 7 attempts to solve the phrase. Each wrong guess adds a part to the hangman.</li>
        <li>If the hangman is fully drawn, you lose and -10 points are deducted.</li>
        <li>Each wrong guess deducts an additional point.</li>
        <li>If you guess the phrase before the hangman is fully drawn, you earn 12 points.</li>
      </ul>
      <button onClick={() => setView("menu")}>Back to Menu</button>
    </div>
  );

  const renderGame = () => (
    <div>
      <pre>{gallows}</pre>
      <div>
        <p>Wrong Guesses: {wrongGuesses.join(", ")}</p>
      </div>
      <div>
        <p><strong>Phrase:</strong> {phrase}</p>
        <p><strong>Solved:</strong> {progress}</p>
      </div>
      <form onSubmit={handleGuess}>
        <label>
          Enter your guess:{" "}
          <input
            type="text"
            maxLength="1"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
          />
        </label>
        <button type="submit">Guess</button>
      </form>
      {message && <p>{message}</p>}
      <p>Score: {score}</p>
      <button onClick={() => setView("menu")}>Quit Game</button>
    </div>
  );

  return (
    <div>
      {view === "menu" && renderMenu()}
      {view === "score" && renderScore()}
      {view === "tutorial" && renderTutorial()}
      {view === "game" && renderGame()}
    </div>
  );
}

export default HangmanGame;
