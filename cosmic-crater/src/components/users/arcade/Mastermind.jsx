import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Sponsors from './Sponsors';

const PEG_TYPES = 6;       // Numbers: 0 - 5
const SOLUTION_PEGS = 4;   // 4 peg solution
const MAX_ATTEMPTS = 3;    // Number of allowed attempts

// Helper: Create a random solution array of 4 numbers (0 to PEG_TYPES-1)
const initSolution = () => {
  const solution = [];
  for (let i = 0; i < SOLUTION_PEGS; i++) {
    solution.push(Math.floor(Math.random() * PEG_TYPES));
  }
  return solution;
};

// Helper: Compute feedback given the solution and guess
// black: number in correct position; white: number present but in wrong position
const getFeedback = (solution, guess) => {
  let black = 0;
  let white = 0;
  for (let i = 0; i < SOLUTION_PEGS; i++) {
    if (guess[i] === solution[i]) {
      black++;
    } else if (guess.includes(solution[i])) {
      white++;
    }
  }
  return { black, white };
};

function MastermindGame() {
  const [solution, setSolution] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [currentGuess, setCurrentGuess] = useState(Array(SOLUTION_PEGS).fill(''));
  const [attemptCount, setAttemptCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameMessage, setGameMessage] = useState('');

  // Initialize or restart the game.
  const initGame = () => {
    setSolution(initSolution());
    setAttempts([]);
    setCurrentGuess(Array(SOLUTION_PEGS).fill(''));
    setAttemptCount(0);
    setGameOver(false);
    setGameMessage('');
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleInputChange = (index, value) => {
    // Even though the input is disabled when correct,
    // we still update state for any changes.
    const newGuess = [...currentGuess];
    newGuess[index] = value;
    setCurrentGuess(newGuess);
  };

  const submitGuess = () => {
    // First, compute the current progress from previous attempts.
    const progress = Array(SOLUTION_PEGS).fill("?");
    attempts.forEach(attempt => {
      attempt.guess.forEach((peg, index) => {
        if (peg === solution[index]) {
          progress[index] = peg;
        }
      });
    });

    // For positions that were already correct, use the correct digit.
    // Otherwise, parse the user's current input.
    const finalGuess = currentGuess.map((val, index) =>
      progress[index] !== "?" ? progress[index] : parseInt(val, 10)
    );

    // Validate guess for non-locked positions.
    for (let i = 0; i < SOLUTION_PEGS; i++) {
      if (progress[i] === "?") {
        const num = parseInt(currentGuess[i], 10);
        if (isNaN(num) || num < 0 || num >= PEG_TYPES) {
          alert(`Each guess must be a number between 0 and ${PEG_TYPES - 1}`);
          return;
        }
      }
    }

    // Compute feedback and update attempts.
    const feedback = getFeedback(solution, finalGuess);
    const newAttempt = {
      guess: finalGuess,
      feedback,
    };

    const newAttemptCount = attemptCount + 1;
    const updatedAttempts = [...attempts, newAttempt];
    setAttempts(updatedAttempts);
    setAttemptCount(newAttemptCount);

    if (feedback.black === SOLUTION_PEGS) {
      setGameMessage("You Win!!!");
      setGameOver(true);
      return;
    }

    if (newAttemptCount >= MAX_ATTEMPTS) {
      setGameMessage("You Lost!");
      setGameOver(true);
      return;
    }

    // Compute updated progress including the new attempt.
    const newProgress = Array(SOLUTION_PEGS).fill("?");
    updatedAttempts.forEach(attempt => {
      attempt.guess.forEach((peg, index) => {
        if (peg === solution[index]) {
          newProgress[index] = peg;
        }
      });
    });

    // Reset the current guess for next attempt.
    // Pre-fill positions already correctly guessed.
    setCurrentGuess(newProgress.map(x => x === "?" ? '' : x));
  };

  // Compute progress for display.
  const progress = Array(SOLUTION_PEGS).fill("?");
  attempts.forEach(attempt => {
    attempt.guess.forEach((peg, index) => {
      if (peg === solution[index]) {
        progress[index] = peg;
      }
    });
  });

  return (
    <div className="row">
      <div className="col-12 col-md-8">
        <div className="p-1 mt-4">
          <h1 className="mb-3">Mastermind Game</h1>
          <p>
            Guess the {SOLUTION_PEGS}-digit solution using numbers from 0 to {PEG_TYPES - 1}. You have {MAX_ATTEMPTS} attempts.
          </p>

          {/* Progress Display */}
          <div className="mb-4">
            <h4>Your Progress</h4>
            <div className="d-flex">
              {progress.map((peg, index) => (
                <div key={index} className="border rounded p-2 mx-1" style={{ width: '4rem', textAlign: 'center' }}>
                  {peg}
                </div>
              ))}
            </div>
          </div>

          {gameOver ? (
            <div className="alert alert-info">
              <h4>Game Over</h4>
              <p>{gameMessage}</p>
              <p>
                The solution was:{" "}
                {solution.map((peg, index) => (
                  <span key={index} className="mx-1">{peg}</span>
                ))}
              </p>
              <button className="btn btn-primary" onClick={initGame}>
                Restart Game
              </button>
            </div>
          ) : (
            <div className="mb-3">
              <h5>Attempt #{attemptCount + 1}</h5>
              <div className="d-flex">
                {currentGuess.map((val, index) => (
                  <input
                    key={index}
                    type="number"
                    className="bg-dark text-white form-control mx-1"
                    style={{ width: '4rem' }}
                    // If a peg was correctly guessed previously, disable and pre-fill its value.
                    value={progress[index] !== "?" ? progress[index] : val}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    placeholder="*"
                    min="0"
                    max={PEG_TYPES - 1}
                    disabled={progress[index] !== "?"}
                  />
                ))}
              </div>
              <button className="btn btn-success mt-2" onClick={submitGuess}>
                Submit Guess
              </button>
            </div>
          )}

          {attempts.length > 0 && (
            <div className="mt-4">
              <h4>Previous Attempts</h4>
              {attempts.map((attempt, idx) => (
                <div key={idx} className="border rounded p-2 mb-2">
                  <p>
                    <strong>Attempt {idx + 1}:</strong>{" "}
                    {attempt.guess.map((peg, i) => (
                      <span key={i} className="mx-1">{peg}</span>
                    ))}
                  </p>
                  <p>
                    Black (correct spot): {attempt.feedback.black} | White (wrong spot): {attempt.feedback.white}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="col-12 col-md-4">
        <Sponsors />
      </div>
    </div>
  );
}

export default MastermindGame;
