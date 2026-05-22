function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function makeOptions(answer) {
  const opts = new Set([String(answer)]);
  while (opts.size < 4) {
    const delta = randInt(1, Math.max(3, Math.floor(Math.abs(answer) * 0.35) + 1));
    const sign = Math.random() < 0.5 ? -1 : 1;
    opts.add(String(answer + sign * delta));
  }
  return shuffle(Array.from(opts));
}

export function buildQuestion(difficulty = "easy") {
  const timeLimits = { easy: 20, medium: 25, hard: 30 };
  const ops = {
    easy: ["+", "-"],
    medium: ["+", "-", "*"],
    hard: ["+", "-", "*", "/"],
  };

  const op = shuffle(ops[difficulty] ?? ops.easy)[0];
  let a, b, answer, expression;

  if (op === "+") {
    a = randInt(1, difficulty === "hard" ? 50 : 20);
    b = randInt(1, difficulty === "hard" ? 50 : 20);
    answer = a + b;
  } else if (op === "-") {
    a = randInt(1, difficulty === "hard" ? 50 : 20);
    b = randInt(1, a);
    answer = a - b;
  } else if (op === "*") {
    a = randInt(2, difficulty === "hard" ? 15 : 12);
    b = randInt(2, difficulty === "hard" ? 15 : 10);
    answer = a * b;
  } else {
    b = randInt(2, difficulty === "hard" ? 12 : 8);
    answer = randInt(2, difficulty === "hard" ? 15 : 12);
    a = answer * b;
    expression = `${a} ÷ ${b}`;
  }

  if (!expression) expression = `${a} ${op} ${b}`;

  const options = makeOptions(answer);
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    expression,
    options,
    correct: options.indexOf(String(answer)),
    time_limit: timeLimits[difficulty] ?? 20,
  };
}
