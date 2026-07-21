import parseMap from "./parse-map.json" with { type: 'json' };
import stringifyMap from "./stringify-map.json" with { type: 'json' };

type SymbolDecorate = ":" | ";" | "_" | "^";
type SymbolConsonant = "\"" | "!" | "$" | "%" | "&" | "'" | "(" | ")" | "=";
type NormalNum = "1" | "2" | "3" | "4" | "5";
type ExtendNum = NormalNum | "6";
type SymbolLongVowel = "-" | "~";
type SymbolPunctuationI = "/";
type SymbolPunctuationII = "-" | "|"

type CnsnntA<T extends string> = T extends "%" ? `${ExtendNum}` : `${NormalNum}`;

type VowelToken = ["#", NormalNum];
type ConsonantToken = ["#", SymbolConsonant, CnsnntA<SymbolConsonant>];
type DecorateCnsnntToken = ["#", SymbolDecorate, SymbolConsonant | "#", CnsnntA<SymbolConsonant>];
type LongVowelToken = ["#", SymbolLongVowel, SymbolLongVowel];
type PunctuationToken = ["#", SymbolPunctuationI, SymbolPunctuationII];
type SharpToken = VowelToken | ConsonantToken | DecorateCnsnntToken | LongVowelToken | PunctuationToken | ["#", "?", "?"];
type TokenType =
    | "vowelT"
    | "consonantT"
    | "decorateCnsnntT"
    | "longVowelT"
    | "punctuationT"
    | "unknownT";


const vowelReg: RegExp = /^#[1-5]$/;
const consonantReg: RegExp = /^#(["!$&'()=][1-5]|%[1-6])$/;
const decorateCnsnntReg: RegExp = /^#[:;_^](["!$&'()=#][1-5]|%[1-6])$/;
const longVowelReg: RegExp = /^#[\-~]{2}$/;
const punctuationReg: RegExp = /^#\/[\-|]$/;

const regTester = <T extends string[]>(text: string[], regex: RegExp): text is T => regex.test(text.join(""));
const condition = <T,>(target: any, condition: boolean): target is T => condition;

class Token {
    type: TokenType;
    value: SharpToken;
    private constructor(type: TokenType, value: SharpToken) {
        this.type = type;
        this.value = value;
    }
    static new(text: string): Token {
        const tuple = text.split("");
        if (regTester<VowelToken>(tuple, vowelReg)) return new Token("vowelT", tuple);
        else if (regTester<ConsonantToken>(tuple, consonantReg)) return new Token("consonantT", tuple);
        else if (regTester<DecorateCnsnntToken>(tuple, decorateCnsnntReg)) return new Token("decorateCnsnntT", tuple);
        else if (regTester<LongVowelToken>(tuple, longVowelReg)) return new Token("longVowelT", tuple);
        else if (regTester<PunctuationToken>(tuple, punctuationReg)) return new Token("punctuationT", tuple);
        else return new Token("unknownT", ["#", "?", "?"]);
    }
    parse(): string {
        if (condition<VowelToken>(this.value, this.type === "vowelT")) return Token.#parseVowelT(this.value);
        else if (condition<ConsonantToken>(this.value, this.type === "consonantT")) return Token.#parseCnsnntT(this.value);
        else if (condition<DecorateCnsnntToken>(this.value, this.type === "decorateCnsnntT")) return Token.#parseDcrtCnsnntT(this.value);
        else if (condition<LongVowelToken>(this.value, this.type === "longVowelT")) return Token.#parseLongVowelT(this.value);
        else if (condition<PunctuationToken>(this.value, this.type === "punctuationT")) return Token.#parsePunctuationT(this.value);
        else return "??";
    }
    static #parseVowelT(value: VowelToken): string {
        return parseMap[value[0]][value[1]];
    }
    static #parseCnsnntT(value: ConsonantToken): string {
        if (value[1] === "%") return parseMap[value[0]][value[1]][value[2]];
        else return parseMap[value[0]][value[1]][value[2] === "6" ? "5" : value[2]];
    }
    static #parseDcrtCnsnntT(value: DecorateCnsnntToken): string {
        if (value[2] === "%") return parseMap[value[0]][value[1]][value[2]][value[3]];
        else return parseMap[value[0]][value[1]][value[2]][value[3] === "6" ? "5" : value[3]];
    }
    static #parseLongVowelT(value: LongVowelToken): string {
        return parseMap[value[0]][value[1]][value[2]];
    }
    static #parsePunctuationT(value: PunctuationToken): string {
        return parseMap[value[0]][value[1]][value[2]];
    }
}

const parse = (input: string) => {
    const tokens = input.split(/[, ]+/).filter(data => data !== "");
    const result: string[] = [];
    for (let i = 0; i < tokens.length; i++) {
        const token: Token = Token.new(tokens[i]);
        result.push(token.parse());
    }
    return {
        string: result.join(""),
        array: result
    } as const;
};

type Filter<T extends string> = T extends "ten" | "$other" ? never : T;
const isRegular = <T extends boolean>(char: string, ten: boolean): 
    char is (T extends false
        ? Filter<keyof typeof stringifyMap>
        : (Filter<keyof typeof stringifyMap["ten"]>)) => char in (ten ? stringifyMap["ten"] : stringifyMap);

const stringify = (input: string) => {
    const result: string[] = [];
    for (let i = 0; i < input.length; i++) {
        const char: string = input[i];
        const next: string = input[i + 1];
        const newChar = isRegular<false>(char, false) ? char : "$other";
        if ((next === "゛" || next === "゜") && newChar !== "$other") {
            const cmbndChar = newChar + next;
            const newCmbndChar = isRegular<true>(cmbndChar, true) ? cmbndChar : "$other";
            result.push(stringifyMap["ten"][newCmbndChar]);
            i++
        } else {
            result.push(stringifyMap[newChar]);
        }
    }
    return {
        string: result.join(", "),
        array: result
    } as const;
}

export default {
    parse,
    stringify
}