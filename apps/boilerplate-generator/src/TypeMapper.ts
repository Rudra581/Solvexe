export class TypeMapper {
  static mapTypeToCpp(type: string): string {
    switch (type) {
      case "int":
        return "int";
      case "float":
        return "float";
      case "string":
        return "std::string";
      case "bool":
        return "bool";
      case "vector<int>":
        return "std::vector<int>";
      case "vector<float>":
        return "std::vector<float>";
      case "vector<string>":
        return "std::vector<std::string>";
      case "vector<bool>":
        return "std::vector<bool>";
      default:
        return "unknown";
    }
  }

  static mapTypeToRust(type: string): string {
    switch (type) {
      case "int":
        return "i32";
      case "float":
        return "f64";
      case "string":
        return "String";
      case "bool":
        return "bool";
      case "vector<int>":
        return "Vec<i32>";
      case "vector<float>":
        return "Vec<f64>";
      case "vector<string>":
        return "Vec<String>";
      case "vector<bool>":
        return "Vec<bool>";
      default:
        return "unknown";
    }
  }

  static getDefaultReturnValueCpp(type: string | undefined): string {
    if (!type || type === "void") return "";
    if (type === "int" || type === "float") return "0";
    if (type === "string") return '""';
    if (type === "bool") return "false";
    if (type.startsWith("vector<")) return "{}";
    return "";
  }

  static getDefaultReturnValueJs(type: string | undefined): string {
    if (!type || type === "void") return "";
    if (type === "int" || type === "float") return "0";
    if (type === "string") return '""';
    if (type === "bool") return "false";
    if (type.startsWith("vector<")) return "[]";
    return "";
  }

  static getDefaultReturnValueRust(type: string | undefined): string {
    if (!type || type === "void") return "";
    if (type === "int" || type === "float") return "0";
    if (type === "string") return "String::new()";
    if (type === "bool") return "false";
    if (type.startsWith("vector<")) return "vec![]";
    return "";
  }
}
