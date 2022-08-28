import fs from "fs";

export const CommandType = {
  add: "add",
  sub: "sub",
  neg: "neg",
  eq: "eq",
  gt: "gt",
  lt: "lt",
  and: "and",
  or: "or",
  not: "not",
  push: "push",
  pop: "pop",
  label: "label",
  goto: "goto",
  if: "if",
  function: "function",
  return: "return",
  call: "call",
};

const stripWhitespaceAndComments = (readFileString) => {
  return readFileString
    .split(/\r\n|\n|\r/)
    .map((line) => line.replace(/\/\/.*/, "").trim())
    .filter((line) => line !== "");
};

class Parser {
  constructor(path) {
    this.source = stripWhitespaceAndComments(fs.readFileSync(path, "utf8"));
    this.currentCommand = "";
  }

  hasMoreLine() {
    return this.source.length > 0;
  }

  advance() {
    this.currentCommand = this.source.shift();
  }

  commandType() {
    return CommandType[this.arg1()];
  }

  arg1() {
    const [arg] = this.currentCommand.split(" ");
    return arg;
  }
  arg2() {
    const [, arg] = this.currentCommand.split(" ");
    return arg;
  }
  arg3() {
    const [, , arg] = this.currentCommand.split(" ");
    return arg;
  }
}

export default Parser;
