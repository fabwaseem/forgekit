class ExpressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExpressionError";
  }
}

type Token =
  | { type: "number"; value: number }
  | { type: "op"; value: "+" | "-" | "*" | "/" }
  | { type: "lparen" }
  | { type: "rparen" };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < input.length) {
    const char = input[index];
    if (!char || char.trim() === "") {
      index += 1;
      continue;
    }
    if (char === "(") {
      tokens.push({ type: "lparen" });
      index += 1;
      continue;
    }
    if (char === ")") {
      tokens.push({ type: "rparen" });
      index += 1;
      continue;
    }
    if (char === "+" || char === "-" || char === "*" || char === "/") {
      tokens.push({ type: "op", value: char });
      index += 1;
      continue;
    }
    if (/[0-9.]/.test(char)) {
      let end = index + 1;
      while (end < input.length) {
        const next = input[end];
        if (!next || !/[0-9.]/.test(next)) break;
        end += 1;
      }
      const raw = input.slice(index, end);
      if (!/^\d+(\.\d+)?$|^\.\d+$/.test(raw)) {
        throw new ExpressionError(`Invalid number "${raw}"`);
      }
      tokens.push({ type: "number", value: Number(raw) });
      index = end;
      continue;
    }
    throw new ExpressionError(`Unexpected character "${char}"`);
  }
  return tokens;
}

export function evaluateExpression(expression: string): number {
  const source = expression.trim();
  if (!source) throw new ExpressionError("Expression is empty");
  const tokens = tokenize(source);
  let cursor = 0;

  function peek() {
    return tokens[cursor];
  }

  function eat() {
    const token = tokens[cursor];
    cursor += 1;
    return token;
  }

  function parseExpression(): number {
    let value = parseTerm();
    while (peek()?.type === "op" && (peek()?.type === "op" && (peek() as { value: string }).value.match(/^[+-]$/))) {
      const op = eat();
      if (!op || op.type !== "op") break;
      const right = parseTerm();
      value = op.value === "+" ? value + right : value - right;
    }
    return value;
  }

  function parseTerm(): number {
    let value = parseFactor();
    while (peek()?.type === "op" && (peek() as { value?: string }).value?.match(/^[*/]$/)) {
      const op = eat();
      if (!op || op.type !== "op") break;
      const right = parseFactor();
      if (op.value === "/" && right === 0) throw new ExpressionError("Division by zero");
      value = op.value === "*" ? value * right : value / right;
    }
    return value;
  }

  function parseFactor(): number {
    const token = peek();
    if (!token) throw new ExpressionError("Unexpected end of expression");
    if (token.type === "op" && (token.value === "+" || token.value === "-")) {
      eat();
      const value = parseFactor();
      return token.value === "-" ? -value : value;
    }
    if (token.type === "number") {
      eat();
      return token.value;
    }
    if (token.type === "lparen") {
      eat();
      const value = parseExpression();
      const close = eat();
      if (!close || close.type !== "rparen") throw new ExpressionError("Missing closing parenthesis");
      return value;
    }
    throw new ExpressionError("Expected a number or parenthesis");
  }

  const result = parseExpression();
  if (cursor !== tokens.length) throw new ExpressionError("Unexpected trailing input");
  if (!Number.isFinite(result)) throw new ExpressionError("Result is not a finite number");
  return result;
}

export { ExpressionError };
