import { ProblemParser, ProblemDefinition } from "./ProblemParser";
import { TypeMapper } from "./TypeMapper";

export class ProblemDefinitionParser {
  private parser = new ProblemParser();
  private def: ProblemDefinition = { problemName: "", functionName: "", inputFields: [], outputFields: [] };

  parse(input: string): void {
    this.def = this.parser.parse(input);
  }

  generateCpp(): string {
    const { functionName, inputFields, outputFields } = this.def;
    const inputs = inputFields
      .map((field) => `${TypeMapper.mapTypeToCpp(field.type)} ${field.name}`)
      .join(", ");
      
    const outputType = outputFields.length > 0 ? outputFields[0]!.type : "void";
    const mappedOutputType = outputType === "void" ? "void" : TypeMapper.mapTypeToCpp(outputType);
    const returnStatement = outputType === "void" ? "" : `\n    return ${TypeMapper.getDefaultReturnValueCpp(outputType)};`;

    return `${mappedOutputType} ${functionName}(${inputs}) {\n    // Implementation goes here${returnStatement}\n}`;
  }

  generateJs(): string {
    const { functionName, inputFields, outputFields } = this.def;
    const inputs = inputFields.map((field) => field.name).join(", ");
      
    const outputType = outputFields.length > 0 ? outputFields[0]!.type : "void";
    const returnStatement = outputType === "void" ? "" : `\n    return ${TypeMapper.getDefaultReturnValueJs(outputType)};`;

    return `function ${functionName}(${inputs}) {\n    // Implementation goes here${returnStatement}\n}`;
  }

  generateRust(): string {
    const { functionName, inputFields, outputFields } = this.def;
    const inputs = inputFields
      .map((field) => `${field.name}: ${TypeMapper.mapTypeToRust(field.type)}`)
      .join(", ");
      
    const outputType = outputFields.length > 0 ? outputFields[0]!.type : "void";
    const mappedOutputType = outputType === "void" ? "()" : TypeMapper.mapTypeToRust(outputType);
    
    // Rust doesn't strictly need a return keyword if it's the last expression,
    // but a default empty or dummy return helps compilation.
    const returnStatement = outputType === "void" ? "" : `\n    ${TypeMapper.getDefaultReturnValueRust(outputType)}`;
    const returnTypeArrow = outputType === "void" ? "" : ` -> ${mappedOutputType}`;

    return `fn ${functionName}(${inputs})${returnTypeArrow} {\n    // Implementation goes here${returnStatement}\n}`;
  }
}
