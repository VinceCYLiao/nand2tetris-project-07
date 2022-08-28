import fs from "fs";
import { CommandType } from "./parser.mjs";

export const isArithmetc = (commandType) => {
  return (
    commandType === CommandType.add ||
    commandType === CommandType.sub ||
    commandType === CommandType.neg ||
    commandType === CommandType.eq ||
    commandType === CommandType.gt ||
    commandType === CommandType.lt ||
    commandType === CommandType.and ||
    commandType === CommandType.or ||
    commandType === CommandType.not
  );
};

const SegmentType = {
  local: "local",
  argument: "argument",
  this: "this",
  that: "that",
  temp: "temp",
  static: "static",
  constant: "constant",
  pointer: "pointer",
};

class CodeWriter {
  constructor(inputPath) {
    this.outputFileName = inputPath.replace(".vm", ".asm");
    this.output = [];
    this.make = 0;
  }

  writeArithmetic(command) {
    const makeCode1 = (...asmCode) => {
      return ["@SP", "M=M-1", "A=M", "D=M", ...asmCode, "@SP", "M=M+1"].join(
        "\r\n"
      );
    };
    // D = y, M = x
    const makeCode2 = (...asmCode) => {
      return [
        "@SP",
        "M=M-1",
        "A=M",
        "D=M",
        "@SP",
        "M=M-1",
        "A=M",
        ...asmCode,
        "@SP",
        "M=M+1",
      ].join("\r\n");
    };
    switch (command) {
      case CommandType.add: {
        this.output.push(makeCode2("M=M+D"));
        break;
      }

      case CommandType.sub: {
        this.output.push(makeCode2("M=M-D"));
        break;
      }
      case CommandType.neg: {
        this.output.push(makeCode1("M=-M"));
        break;
      }
      case CommandType.eq: {
        this.output.push(
          makeCode2(
            ...[
              "D=M-D",
              `@TRUE${this.make}`,
              "D;JEQ",
              "D=0",
              `@SET${this.make}`,
              "0;JMP",
              `(TRUE${this.make})`,
              "D=-1",
              `(SET${this.make})`,
              "@SP",
              "A=M",
              "M=D",
            ]
          )
        );
        this.make += 1;
        break;
      }
      case CommandType.gt: {
        this.output.push(
          makeCode2(
            ...[
              "D=M-D",
              `@TRUE${this.make}`,
              "D;JGT",
              "D=0",
              `@SET${this.make}`,
              "0;JMP",
              `(TRUE${this.make})`,
              "D=-1",
              `(SET${this.make})`,
              "@SP",
              "A=M",
              "M=D",
            ]
          )
        );
        this.make += 1;
        break;
      }
      case CommandType.lt: {
        this.output.push(
          makeCode2(
            ...[
              "D=M-D",
              `@TRUE${this.make}`,
              "D;JLT",
              "D=0",
              `@SET${this.make}`,
              "0;JMP",
              `(TRUE${this.make})`,
              "D=-1",
              `(SET${this.make})`,
              "@SP",
              "A=M",
              "M=D",
            ]
          )
        );
        this.make += 1;
        break;
      }
      case CommandType.and: {
        this.output.push(makeCode2("M=M&D"));
        break;
      }
      case CommandType.or: {
        this.output.push(makeCode2("M=M|D"));
        break;
      }
      case CommandType.not: {
        this.output.push(makeCode1("M=!D"));
        break;
      }
      default:
        throw new Error("no matched arithmetic command");
    }
  }

  writePushPop(commend, segment, index) {
    if (commend === CommandType.push) {
      switch (segment) {
        case SegmentType.argument: {
          this.output.push(
            [
              `@${index}`,
              "D=A",
              "@ARG",
              "A=M+D",
              "D=M",
              "@SP",
              "A=M",
              "M=D",
              "@SP",
              "M=M+1",
            ].join("\r\n")
          );
          break;
        }

        case SegmentType.local: {
          this.output.push(
            [
              `@${index}`,
              "D=A",
              "@LCL",
              "A=M+D",
              "D=M",
              "@SP",
              "A=M",
              "M=D",
              "@SP",
              "M=M+1",
            ].join("\r\n")
          );
          break;
        }
        case SegmentType.static: {
          this.output.push(
            [
              `@${index}`,
              "D=A",
              "@16",
              "A=A+D",
              "D=M",
              "@SP",
              "A=M",
              "M=D",
              "@SP",
              "M=M+1",
            ].join("\r\n")
          );
          break;
        }
        case SegmentType.this: {
          this.output.push(
            [
              `@${index}`,
              "D=A",
              "@THIS",
              "A=M+D",
              "D=M",
              "@SP",
              "A=M",
              "M=D",
              "@SP",
              "M=M+1",
            ].join("\r\n")
          );
          break;
        }
        case SegmentType.that: {
          this.output.push(
            [
              `@${index}`,
              "D=A",
              "@THAT",
              "A=M+D",
              "D=M",
              "@SP",
              "A=M",
              "M=D",
              "@SP",
              "M=M+1",
            ].join("\r\n")
          );
          break;
        }
        case SegmentType.temp: {
          this.output.push(
            [
              `@${index}`,
              "D=A",
              "@5",
              "A=A+D",
              "D=M",
              "@SP",
              "A=M",
              "M=D",
              "@SP",
              "M=M+1",
            ].join("\r\n")
          );
          break;
        }
        case SegmentType.pointer: {
          this.output.push(
            [
              `@${index === "0" ? 3 : 4}`,
              "D=M",
              "@SP",
              "A=M",
              "M=D",
              "@SP",
              "M=M+1",
            ].join("\r\n")
          );
          break;
        }
        case SegmentType.constant: {
          this.output.push(
            [`@${index}`, "D=A", "@SP", "A=M", "M=D", "@SP", "M=M+1"].join(
              "\r\n"
            )
          );
          break;
        }
        default:
          throw new Error("error when push");
      }
    } else {
      switch (segment) {
        case SegmentType.argument: {
          this.output.push(
            [
              "@SP",
              "M=M-1",
              "@SP",
              "A=M",
              "D=M",
              "@R13",
              "M=D",
              `@${index}`,
              "D=A",
              "@ARG",
              "D=M+D",
              "@R14",
              "M=D",
              "@R13",
              "D=M",
              "@R14",
              "A=M",
              "M=D",
            ].join("\r\n")
          );
          break;
        }
        case SegmentType.local: {
          this.output.push(
            [
              "@SP",
              "M=M-1",
              "@SP",
              "A=M",
              "D=M",
              "@R13",
              "M=D",
              `@${index}`,
              "D=A",
              "@LCL",
              "D=M+D",
              "@R14",
              "M=D",
              "@R13",
              "D=M",
              "@R14",
              "A=M",
              "M=D",
            ].join("\r\n")
          );
          break;
        }

        case SegmentType.this: {
          this.output.push(
            [
              "@SP",
              "M=M-1",
              "@SP",
              "A=M",
              "D=M",
              "@R13",
              "M=D",
              `@${index}`,
              "D=A",
              "@THIS",
              "D=M+D",
              "@R14",
              "M=D",
              "@R13",
              "D=M",
              "@R14",
              "A=M",
              "M=D",
            ].join("\r\n")
          );
          break;
        }
        case SegmentType.that: {
          this.output.push(
            [
              "@SP",
              "M=M-1",
              "@SP",
              "A=M",
              "D=M",
              "@R13",
              "M=D",
              `@${index}`,
              "D=A",
              "@THAT",
              "D=M+D",
              "@R14",
              "M=D",
              "@R13",
              "D=M",
              "@R14",
              "A=M",
              "M=D",
            ].join("\r\n")
          );
          break;
        }

        case SegmentType.temp: {
          this.output.push(
            [
              "@SP",
              "M=M-1",
              "@SP",
              "A=M",
              "D=M",
              "@R13",
              "M=D",
              `@${index}`,
              "D=A",
              "@5",
              "D=A+D",
              "@R14",
              "M=D",
              "@R13",
              "D=M",
              "@R14",
              "A=M",
              "M=D",
            ].join("\r\n")
          );
          break;
        }
        case SegmentType.static: {
          this.output.push(
            [
              "@SP",
              "M=M-1",
              "@SP",
              "A=M",
              "D=M",
              "@R13",
              "M=D",
              `@${index}`,
              "D=A",
              "@16",
              "D=A+D",
              "@R14",
              "M=D",
              "@R13",
              "D=M",
              "@R14",
              "A=M",
              "M=D",
            ].join("\r\n")
          );
          break;
        }
        case SegmentType.pointer: {
          this.output.push(
            [
              "@SP",
              "M=M-1",
              "@SP",
              "A=M",
              "D=M",
              `@${index === "0" ? 3 : 4}`,
              "M=D",
            ].join("\r\n")
          );
          break;
        }
        default:
          throw new Error("error when pop");
      }
    }
  }
  writeOutput() {
    this.output.push(["(END)", "@END", "0;JMP"].join("\r\n"));
    fs.writeFileSync(this.outputFileName, this.output.join("\r\n"), "utf8");
  }
}

export default CodeWriter;
