import parseMap from "./parse-map.json" with { type: "json" };
import stringifyMap from "./stringify-map.json" with { type: "json" };

type SymbolDecorate = ":" | ";" | "_" | "^";
type SymbolConsonant = "\"" | "!" | "$" | "%" | "&" | "'" | "(" | ")" | "=";
type NormalNum = "1" | "2" | "3" | "4" | "5";
type ExtendNum = NormalNum | "6";
type SymbolLongVowel = "-" | "~";
type SymbolPunctuationI = "/";
type SymbolPunctuationII = "-" | "|";

type CnsnntA<T extends string> = T extends "%" ? `${ExtendNum}` : `${NormalNum}`;

type TypeVowel = ["#", NormalNum];
type TypeConsonant = ["#", SymbolConsonant, CnsnntA<SymbolConsonant>];
type TypeDecorateCnsnnt = ["#", SymbolDecorate, SymbolConsonant | "#", CnsnntA<SymbolConsonant>];
type TypeLongVowel = ["#", SymbolLongVowel, SymbolLongVowel];
type TypePunctuation = ["#", SymbolPunctuationI, SymbolPunctuationII];
type TypeUnknown = ["#", "?", "?"];
type VowelToken = {
    type: "vowelT",
    value: TypeVowel
}
type ConsonantToken = {
    type: "consonantT",
    value: TypeConsonant
}
type DecorateCnsnntToken = {
    type: "decorateCnsnntT",
    value: TypeDecorateCnsnnt
}
type LongVowelToken = {
    type: "longVowelT",
    value: TypeLongVowel
}
type PunctuationToken = {
    type: "punctuationT",
    value: TypePunctuation
}
type UnknownToken = {
    type: "unknownT",
    value: TypeUnknown
}
type SharpToken = VowelToken | ConsonantToken | DecorateCnsnntToken | LongVowelToken | PunctuationToken | UnknownToken;


const vowelReg: RegExp = /^#[1-5]$/;
const consonantReg: RegExp = /^#(["!$&'()=][1-5]|%[1-6])$/;
const decorateCnsnntReg: RegExp = /^#[:;_^](["!$&'()=#][1-5]|%[1-6])$/;
const longVowelReg: RegExp = /^#[\-~]{2}$/;
const punctuationReg: RegExp = /^#\/[\-|]$/;

const is = {
    vowel: (target: string[]): target is TypeVowel => vowelReg.test(target.join("")),
    consonant: (target: string[]): target is TypeConsonant => consonantReg.test(target.join("")),
    decorateCnsnnt: (target: string[]): target is TypeDecorateCnsnnt => decorateCnsnntReg.test(target.join("")),
    longVowel: (target: string[]): target is TypeLongVowel => longVowelReg.test(target.join("")),
    punctuation: (target: string[]): target is TypePunctuation => punctuationReg.test(target.join(""))
} as const;

const parse = {
    vowel: (value: TypeVowel) => parseMap[value[0]][value[1]],
    consonant: (value: TypeConsonant): string => value[1] === "%" 
        ? parseMap[value[0]][value[1]][value[2]]
        : parseMap[value[0]][value[1]][value[2] === "6" ? "5" : value[2]],
    decorateCnsnnt: (value: TypeDecorateCnsnnt): string => value[2] === "%"
        ? parseMap[value[0]][value[1]][value[2]][value[3]]
        : parseMap[value[0]][value[1]][value[2]][value[3] === "6" ? "5" : value[3]],
    longVowel: (value: TypeLongVowel): string => parseMap[value[0]][value[1]][value[2]],
    punctuation: (value: TypePunctuation): string => parseMap[value[0]][value[1]][value[2]]
} as const

const newToken = (enter: string): SharpToken => {
    const tuple = enter.split("");
    if (is.vowel(tuple)) return { type: "vowelT", value: tuple };
    else if (is.consonant(tuple)) return { type: "consonantT", value: tuple };
    else if (is.decorateCnsnnt(tuple)) return { type: "decorateCnsnntT", value: tuple };
    else if (is.longVowel(tuple)) return { type: "longVowelT", value: tuple };
    else if (is.punctuation(tuple)) return { type: "punctuationT", value: tuple };
    else return { type: "unknownT", value: tuple as TypeUnknown };
};

const tokenParse = (enter: SharpToken) => {
    const { type, value } = enter;
    switch(type) {
        case "vowelT":
            return parse.vowel(value);
        case "consonantT":
            return parse.consonant(value);
        case "decorateCnsnntT":
            return parse.decorateCnsnnt(value);
        case "longVowelT":
            return parse.longVowel(value);
        case "punctuationT":
            return parse.punctuation(value);
        case "unknownT":
            return "??";
    }
}


const parseA = (input: string) => {
    const tokens = input.split(/[, ]+/).filter(data => data !== "");
    const result: string[] = [];
    for (let i = 0; i < tokens.length; i++) {
        const token: SharpToken = newToken(tokens[i]);
        result.push(tokenParse(token));
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

const stringifyA = (input: string) => {
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
        } else if (char === "\\" && next === "n") {
            result.push("\n");
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
    parse: parseA,
    stringify: stringifyA
}