import Parser from "./parser.mjs";
import CodeWriter, { isArithmetc } from "./codeWriter.mjs";

function main() {
  const path = process.argv[2];
  if (!path) return new Error("File path must be specified");

  let parser = new Parser(path);

  let codeWriter = new CodeWriter(path);

  while (parser.hasMoreLine()) {
    parser.advance();
    const commandType = parser.commandType();
    if (isArithmetc(commandType)) {
      codeWriter.writeArithmetic(parser.arg1());
    } else {
      codeWriter.writePushPop(parser.arg1(), parser.arg2(), parser.arg3());
    }
  }
  codeWriter.writeOutput();
}

main();
