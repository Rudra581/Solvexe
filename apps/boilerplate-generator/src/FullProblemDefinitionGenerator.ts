import { ProblemParser, ProblemDefinition } from "./ProblemParser";
import { TypeMapper } from "./TypeMapper";

export class FullProblemDefinitionParser {
  private parser = new ProblemParser();
  private def: ProblemDefinition = { problemName: "", functionName: "", inputFields: [], outputFields: [] };

  parse(input: string): void {
    this.def = this.parser.parse(input);
  }

  generateCpp(): string {
    const { functionName, inputFields, outputFields } = this.def;
    
    const inputReads = inputFields
      .map((field) => {
        if (field.type.startsWith("vector<")) {
          return `int size_${field.name};\n  std::cin >> size_${field.name};\n  ${TypeMapper.mapTypeToCpp(field.type)} ${field.name}(size_${field.name});\n  for(int i = 0; i < size_${field.name}; ++i) std::cin >> ${field.name}[i];`;
        } else if (field.type === "string") {
          return `std::string ${field.name};\n  std::getline(std::cin >> std::ws, ${field.name});`;
        } else {
          return `${TypeMapper.mapTypeToCpp(field.type)} ${field.name};\n  std::cin >> ${field.name};`;
        }
      })
      .join("\n  ");
      
    const outputType = outputFields.length > 0 ? outputFields[0]!.type : "void";
    const functionCall = outputType === "void"
      ? `${functionName}(${inputFields.map((field) => field.name).join(", ")});`
      : `${TypeMapper.mapTypeToCpp(outputType)} result = ${functionName}(${inputFields.map((field) => field.name).join(", ")});`;
    const outputWrite = outputType === "void" ? "" : `std::cout << result << std::endl;`;

    return `
#include <iostream>
#include <vector>
#include <string>
#include <bits/stdc++.h>

##USER_CODE_HERE##

int main() {
  ${inputReads}
  ${functionCall}
  ${outputWrite}
  return 0;
}
    `;
  }

  generateJs(): string {
    const { functionName, inputFields, outputFields } = this.def;
    const inputReads = inputFields
      .map((field) => {
        if (field.type.startsWith("vector<")) {
          return `const size_${field.name} = parseInt(input.shift());\nconst ${field.name} = input.splice(0, size_${field.name}).map(Number);`;
        } else if (field.type === "string") {
          return `const ${field.name} = input.shift();`;
        } else if (field.type === "float") {
          return `const ${field.name} = parseFloat(input.shift());`;
        } else {
          return `const ${field.name} = parseInt(input.shift());`;
        }
      })
      .join("\n  ");
      
    const outputType = outputFields.length > 0 ? outputFields[0]!.type : "void";
    const functionCall = outputType === "void"
      ? `${functionName}(${inputFields.map((field) => field.name).join(", ")});`
      : `const result = ${functionName}(${inputFields.map((field) => field.name).join(", ")});`;
    const outputWrite = outputType === "void" ? "" : `console.log(result);`;

    return `
##USER_CODE_HERE##

const input = require('fs').readFileSync(0, 'utf-8').trim().split(/\\s+/);
${inputReads}
${functionCall}
${outputWrite}
    `;
  }

  generateRust(): string {
    const { functionName, inputFields, outputFields } = this.def;
    const inputReads = inputFields
      .map((field) => {
        if (field.type.startsWith("vector<")) {
          return `let size_${field.name}: usize = input.next().unwrap().parse().unwrap();\n  let ${field.name}: ${TypeMapper.mapTypeToRust(field.type)} = (0..size_${field.name}).map(|_| input.next().unwrap().parse().unwrap()).collect();`;
        } else {
          return `let ${field.name}: ${TypeMapper.mapTypeToRust(field.type)} = input.next().unwrap().parse().unwrap();`;
        }
      })
      .join("\n  ");
      
    const outputType = outputFields.length > 0 ? outputFields[0]!.type : "void";
    const functionCall = outputType === "void"
      ? `${functionName}(${inputFields.map((field) => field.name).join(", ")});`
      : `let result = ${functionName}(${inputFields.map((field) => field.name).join(", ")});`;
    const outputWrite = outputType === "void" ? "" : `println!("{}", result);`;

    return `
use std::io::{self, Read};

##USER_CODE_HERE##

fn main() {
  let mut input_str = String::new();
  io::stdin().read_to_string(&mut input_str).unwrap();
  let mut input = input_str.split_whitespace();
  ${inputReads}
  ${functionCall}
  ${outputWrite}
}
    `;
  }
}
