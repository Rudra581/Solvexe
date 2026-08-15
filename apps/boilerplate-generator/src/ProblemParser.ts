export interface Field {
  type: string;
  name: string;
}

export interface ProblemDefinition {
  problemName: string;
  functionName: string;
  inputFields: Field[];
  outputFields: Field[];
}

export class ProblemParser {
  parse(input: string): ProblemDefinition {
    const lines = input.split("\n").map((line) => line.trim());
    let currentSection: string | null = null;

    const def: ProblemDefinition = {
      problemName: "",
      functionName: "",
      inputFields: [],
      outputFields: [],
    };

    lines.forEach((line) => {
      if (line.startsWith("Problem Name:")) {
        def.problemName = this.extractQuotedValue(line);
      } else if (line.startsWith("Function Name:")) {
        def.functionName = this.extractValue(line);
      } else if (line.startsWith("Input Structure:")) {
        currentSection = "input";
      } else if (line.startsWith("Output Structure:")) {
        currentSection = "output";
      } else if (line.startsWith("Input Field:")) {
        if (currentSection === "input") {
          const field = this.extractField(line);
          if (field) def.inputFields.push(field);
        }
      } else if (line.startsWith("Output Field:")) {
        if (currentSection === "output") {
          const field = this.extractField(line);
          if (field) def.outputFields.push(field);
        }
      }
    });

    return def;
  }

  private extractQuotedValue(line: string): string {
    const match = line.match(/: "(.*)"$/);
    return match ? (match[1] || "") : "";
  }

  private extractValue(line: string): string {
    const match = line.match(/: (\w+)$/);
    return match ? (match[1] || "") : "";
  }

  private extractField(line: string): Field | null {
    const match = line.match(/Field:\s*([a-zA-Z_]\w*(?:<\w+>)?)\s*([a-zA-Z_]\w*)\s*$/);
    return match ? { type: match[1] || "", name: match[2] || "" } : null;
  }
}
