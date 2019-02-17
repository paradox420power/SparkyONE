/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


//these are the symbols the lexer is prepared to parse, input not on this list
//and not handled by parse word will produce an error
var keySymbol = ["=", "+", "-", "*", "/", "%", "<", ">", ":", ";",
    "(", ")", "[", "]", "{", "}", ",", ".", "\"", "\'", "\\", " ", "\n"];


//python's reserved words that a user shouldn't be able to use out of context
var reservedWord = ["True", "False", "None", "abs", "and", "as", "ascii", "assert", "bin", "bool", "break", "ceil", "chr", "class", "cos", 
    "continue", "def", "del", "elif", "else", "except", "float", "floor", "finally", "for", "from", "global", "hex",
    "if", "import", "in", "input", "int", "is", "lambda", "len", "max", "min", "my_range", "nonlocal", "not", "oct", "or", "ord", "pass", "print",
    "raise", "randint", "random", "range", "return", "round", "seed", "sin", "str", "sqrt", "tan", "try", "type", "while", "with", "xrange", "yield", "format", "input"];

var code_line = 1;
var lastTokenType = ""; //used to help differentiate +, ++, & +-+-++3... because python

function getChar(myString){
    var nextChar = null;
    if(myString.length > 0)
        nextChar = myString.charAt(0);
    return nextChar;
}

//some numbers have n-many + or - before the number, & those should be accounted for
function readPrefixOps(input){
    var prefixOps = {
        id: "",
        length: 0
    };
    var incomplete = true;
    var charCheck = "";
    var charCheckIndex= 0;
    while(incomplete){
        if(charCheckIndex < input.length){
            charCheck = input.charAt(charCheckIndex);
            if(charCheck === '+' || charCheck === '-'){
                prefixOps.id += charCheck;
                prefixOps.length++;
                charCheckIndex++;
            }else{
                incomplete = false;
            }
        }else
            incomplete = false;
        
    }
    return prefixOps;
}

function isBinary(input){
    var isBinary = true;
    var bin = /^[0-1]+$/;
    var incomplete = true;
    var charCheck = "";
    var charCheckIndex = 0;
    if(charCheckIndex < input.length){ //headed by 0b, ensure that is checked
        charCheck = input.charAt(charCheckIndex);
        if(charCheck === '0'){
            charCheckIndex++;
            if(charCheckIndex < input.length){
                charCheck = input.charAt(charCheckIndex);
                if(charCheck === 'b' || charCheck === 'B'){
                    charCheckIndex++;
                }else{ //starts 0, but isn't followed b 'b'
                    isBinary = false;
                    incomplete = false;
                }
            }
        }else{
            isBinary = false;
            incomplete = false;
        }
    }
    while(incomplete){
        if(charCheckIndex < input.length){ //still have input to read
            charCheck = input.charAt(charCheckIndex);
            if(charCheck.match(bin)){ //still a valid binary input
                charCheckIndex++;
            }else{
                if(keySymbol.includes(charCheck)){ //checks if next character is an acceptable follow to the varaible
                    incomplete = false; //we hit the next space
                    charCheckIndex--; //unget that last index since it is next in sequence
                }else{ //not followed by key Symbol, which makes it not a binary
                    isBinary = false;
                    incomplete = false;
                }
            }
        }else{ //end of input
            if(charCheckIndex === 2)
                isBinary = false; //only 0b read, not a binary
            incomplete = false;
            charCheckIndex--;
        }
    }
    return isBinary;
}

function readBin(input){
    var lexeme = {
        id:"", //the exact input from the string
        type:"BINARY", //what the token is classified as
        line_no: code_line, //what line of code the token is on
        length: 0 //used to remove the lexeme including preceding spaces from input string upon return
    };
    
    var bin = /^[0-1]+$/;
    var incomplete = true;
    var charCheck = "";
    var charCheckIndex = 0;
    //get '0b' appended to id, and go from there
    charCheck = input.charAt(charCheckIndex);
    lexeme.id += charCheck;
    charCheckIndex++;
    charCheck = input.charAt(charCheckIndex);
    lexeme.id += charCheck;
    charCheckIndex++;
    //continue reading binary
    while(incomplete){
        if(charCheckIndex < input.length){
            charCheck = input.charAt(charCheckIndex);
            if(charCheck.match(bin)){
                lexeme.id += charCheck;
                charCheckIndex++;
            }else if(keySymbol.includes(charCheck)){ //checks if next character is an acceptable follow to the varaible
                    incomplete = false; //we hit the next space
                    charCheckIndex--; //unget that last index since it is next in sequence
                }else{ //not followed by key Symbol, which makes it not a binary
                    incomplete = false;
                }
        }else{
            incomplete = false;
            charCheckIndex--;
        }
    }
    lexeme.length = charCheckIndex + 1;
    return lexeme;
}

function isOct(input){
    var isOctal = true;
    var oct = /^[0-8]+$/;
    var incomplete = true;
    var charCheck = "";
    var charCheckIndex = 0;
    if(charCheckIndex < input.length){ //headed by 0o, ensure that is checked
        charCheck = input.charAt(charCheckIndex);
        if(charCheck === '0'){
            charCheckIndex++;
            if(charCheckIndex < input.length){
                charCheck = input.charAt(charCheckIndex);
                if(charCheck === 'o' || charCheck === 'O'){
                    charCheckIndex++;
                }else{ //starts 0, but isn't followed by 'o'
                    isOctal = false;
                    incomplete = false;
                }
            }
        }else{
            isOctal = false;
            incomplete = false;
        }
    }
    while(incomplete){
        if(charCheckIndex < input.length){ //still have input to read
            charCheck = input.charAt(charCheckIndex);
            if(charCheck.match(oct)){ //still a valid octal input
                charCheckIndex++;
            }else if(keySymbol.includes(charCheck)){ //checks if next character is an acceptable follow to the varaible
                incomplete = false; //we hit the next space
                charCheckIndex--; //unget that last index since it is next in sequence
            }else{ //not followed by key Symbol, which makes it not a octal
                isOctal = false;
                incomplete = false;
            }
        }else{ //end of input
            if(charCheckIndex === 2)
                isOctal = false; //only 0o read, not a octal
            incomplete = false;
            charCheckIndex--;
        }
    }
    return isOctal;
}

function readOct(input){
    var lexeme = {
        id:"", //the exact input from the string
        type:"OCTAL", //what the token is classified as
        line_no: code_line, //what line of code the token is on
        length: 0 //used to remove the lexeme including preceding spaces from input string upon return
    };
    
    var bin = /^[0-8]+$/;
    var incomplete = true;
    var charCheck = "";
    var charCheckIndex = 0;
    //get '0o' appended to id, and go from there
    charCheck = input.charAt(charCheckIndex);
    lexeme.id += charCheck;
    charCheckIndex++;
    charCheck = input.charAt(charCheckIndex);
    lexeme.id += charCheck;
    charCheckIndex++;
    //continue reading octal
    while(incomplete){
        if(charCheckIndex < input.length){
            charCheck = input.charAt(charCheckIndex);
            if(charCheck.match(bin)){
                lexeme.id += charCheck;
                charCheckIndex++;
            }else if(keySymbol.includes(charCheck)){ //checks if next character is an acceptable follow to the varaible
                incomplete = false; //we hit the next space
                charCheckIndex--; //unget that last index since it is next in sequence
            }else{ //not followed by key Symbol, which makes it not a octal
                incomplete = false;
            }
        }else{
            incomplete = false;
            charCheckIndex--;
        }
    }
    lexeme.length = charCheckIndex + 1;
    return lexeme;
}

function isHex(input){
    var isHex = true;
    var hexNums = /^[0-9]+$/;
    var hexVals = /^[a-f]+$/;
    var hexVals2 = /^[A-F]+$/;
    var incomplete = true;
    var charCheck = "";
    var charCheckIndex = 0;
    if(charCheckIndex < input.length){ //headed by 0x, ensure that is checked
        charCheck = input.charAt(charCheckIndex);
        if(charCheck === '0'){
            charCheckIndex++;
            if(charCheckIndex < input.length){
                charCheck = input.charAt(charCheckIndex);
                if(charCheck === 'x' || charCheck === 'X'){
                    charCheckIndex++;
                }else{ //starts 0, but isn't followed by 'x'
                    isHex = false;
                    incomplete = false;
                }
            }
        }else{
            isHex = false;
            incomplete = false;
        }
    }
    while(incomplete){
        if(charCheckIndex < input.length){ //still have input to read
            charCheck = input.charAt(charCheckIndex);
            if(charCheck.match(hexVals) || charCheck.match(hexNums) || charCheck.match(hexVals2)){ //still a valid hex input
                charCheckIndex++;
            }else if(keySymbol.includes(charCheck)){ //checks if next character is an acceptable follow to the varaible
                incomplete = false; //we hit the next space
                charCheckIndex--; //unget that last index since it is next in sequence
            }else{ //not followed by key Symbol, which makes it not a hex
                isHex = false;
                incomplete = false;
            }
        }else{ //end of input
            if(charCheckIndex === 2)
                isHex = false; //only 0x read, not a hex
            incomplete = false;
            charCheckIndex--;
        }
    }
    return isHex;
}

function readHex(input){
    var lexeme = {
        id:"", //the exact input from the string
        type:"HEX", //what the token is classified as
        line_no: code_line, //what line of code the token is on
        length: 0 //used to remove the lexeme including preceding spaces from input string upon return
    };
    
    var hexNums = /^[0-9]+$/;
    var hexVals = /^[a-f]+$/;
    var hexVals2 = /^[A-F]+$/;
    var incomplete = true;
    var charCheck = "";
    var charCheckIndex = 0;
    //get '0x' appended to id, and go from there
    charCheck = input.charAt(charCheckIndex);
    lexeme.id += charCheck;
    charCheckIndex++;
    charCheck = input.charAt(charCheckIndex);
    lexeme.id += charCheck;
    charCheckIndex++;
    //continue reading binary
    while(incomplete){
        if(charCheckIndex < input.length){
            charCheck = input.charAt(charCheckIndex);
            if(charCheck.match(hexNums) || charCheck.match(hexVals) || charCheck.match(hexVals2)){
                lexeme.id += charCheck;
                charCheckIndex++;
            }else if(keySymbol.includes(charCheck)){ //checks if next character is an acceptable follow to the varaible
                incomplete = false; //we hit the next space
                charCheckIndex--; //unget that last index since it is next in sequence
            }else{ //not followed by key Symbol, which makes it not a hex
                incomplete = false;
            }
        }else{
            incomplete = false;
            charCheckIndex--;
        }
    }
    lexeme.length = charCheckIndex + 1;
    return lexeme;
}

function isNumeric(input){
    var isNumeric = false; //false until proven true
    var numbers = /^[0-9]+$/;
    var incomplete = true;
    var charCheck = "";
    var charCheckIndex = 0;
    if(charCheckIndex < input.length){ //only read within input bounds
        charCheck = input.charAt(charCheckIndex);
    }
    while(incomplete){ //read until end, '.', or 'e/E'
        if(charCheck === '0'){ //acceptable are 0..0e###, 0..0.###, or 00...
            charCheckIndex++; //go to next character
            if(charCheckIndex < input.length){
                while(incomplete){
                    charCheck = input.charAt(charCheckIndex); //get character in bounds
                    if(charCheck === '0'){ //acceptable
                        charCheckIndex++; //read next character
                        if(charCheckIndex >= input.length){ //this increment exceeds input bounds
                            incomplete = false;
                            isNumeric = true; //only 0s read
                        }
                    }else if(charCheck === '.'){ //acceptable
                        incomplete = false; //set to false, but don't update the charCheck
                    }else if(charCheck === 'e' || charCheck === 'E'){ //acceptable
                        incomplete = false; //set to false, but don't update the charCheck
                    }else if(keySymbol.includes(charCheck)){ //end of this numeric, acceptable
                        incomplete = false; //we've reached the end of this token
                        isNumeric = true; //only 0s should've been read
                    }else{ //followed by an unacceptable character, not legal numeric
                        incomplete = false; //input is 0..00# which is unacceptable
                    }
                }
            }else{ //input is 0 in totality, return is numeric
                isNumeric = true;
                incomplete = false;
            }
        }else if(charCheck === '.'){ //can be .####
            incomplete = false; //exit this loop & proceed to the post decimal loop
        }else if(charCheck.match(numbers)){//this check is technically 1-9 since 0 was checked above
            charCheckIndex++; //go to next character
            if(charCheckIndex < input.length){
                while(incomplete){
                    charCheck = input.charAt(charCheckIndex); //get character in bounds
                    if(charCheck.match(numbers)){ //acceptable number
                        charCheckIndex++; //read next character
                        if(charCheckIndex >= input.length){ //this increment exceeds input bounds
                            incomplete = false;
                            isNumeric = true; //only #s read, it is fine
                        }
                    }else if(charCheck === '.'){ //acceptable
                        incomplete = false; //set to false, but don't update the charCheck
                    }else if(charCheck === 'e' || charCheck === 'E'){ //acceptable
                        incomplete = false; //set to false, but don't update the charCheck
                    }else if(keySymbol.includes(charCheck)){ //end of this numeric, acceptable
                        incomplete = false; //we've reached the end of this token
                        isNumeric = true; //only #s should've been read
                    }else{ //followed by an unacceptable character, not legal numeric
                        incomplete = false; //input is ##..##s or something
                    }
                }
            }else{ //only 1 char read & it was a numeric
                incomplete = false;
                isNumeric = true;
            }
        }else{ //either isn't a number or is 'e/E' which can't start a numeric
            incomplete = false;
            if(charCheck === 'e' || charCheck === 'E') //need to change value or it might enter the loop below
                charCheck = 'x';
        }
    }
    if(charCheck === '.'){ //if looking at '.', validate the numbers after this character
        incomplete = true; //there is more to be read
        charCheckIndex++;
        if(charCheckIndex < input.length){ //still in bounds after this char
            while(incomplete){
                charCheck = input.charAt(charCheckIndex);
                if(charCheck.match(numbers)){
                    charCheckIndex++;
                    if(charCheckIndex >= input.length){
                        incomplete = false;
                        isNumeric= true; //##.## read
                    }
                }else if(keySymbol.includes(charCheck)){ //can have follow symbol whenever, 00.; is legal
                    incomplete = false;
                    isNumeric = true;
                }else if(charCheck === 'e' || charCheck === 'E'){
                    incomplete = false; //can be followed by 'e/E' but still needs checking
                }else{
                    incomplete = false; //invalid follow char detected
                }
            }
        }else{ //actually legal to follow '.' with nothing
            incomplete = false;
            isNumeric = true;
        }
    }
    if(charCheck === 'e' || charCheck === 'E'){ //still need to validate some #s
        incomplete = true; //there is more to be read
        charCheckIndex++;
        if(charCheckIndex < input.length){ //still in bounds after this char
            charCheck = input.charAt(charCheckIndex); //check 'e/E' is followed by at least 1 #
            if(!charCheck.match(numbers)) //if not followed by a number we have #e; which is illegal
                incomplete = false; //do not enter the while loop
            while(incomplete){
                charCheck = input.charAt(charCheckIndex);
                if(charCheck.match(numbers)){
                    charCheckIndex++;
                    if(charCheckIndex >= input.length){
                        incomplete = false;
                        isNumeric = true;
                    }
                }else if(keySymbol.includes(charCheck)){
                    incomplete = false;
                    isNumeric = true;
                }else{
                    incomplete = false; //illegal char read
                }
            }
        }else{ //not legal to follow 'e/E' with nothing
            incomplete = false;
        }
    }
    return isNumeric;
}

function readNumber(input){
    var lexeme = {
        id:"", //the exact input from the string
        type:"NUMBER", //what the token is classified as
        line_no: code_line, //what line of code the token is on
        length: 0 //used to remove the lexeme including preceding spaces from input string upon return
    };
    
    var numbers = /^[0-9]+$/;
    var incomplete = true;
    var charCheck = "";
    var charCheckIndex = 0;
    
    if(charCheckIndex < input.length){ //only read within input bounds
        charCheck = input.charAt(charCheckIndex);
    }
    while(incomplete){ //read until end, '.', or 'e/E'
        if(charCheck === '0'){ //acceptable are 0..0e###, 0..0.###, or 00...
            lexeme.id += charCheck;
            charCheckIndex++; //go to next character
            if(charCheckIndex < input.length){
                while(incomplete){
                    charCheck = input.charAt(charCheckIndex); //get character in bounds
                    if(charCheck === '0'){ //acceptable
                        lexeme.id += charCheck;
                        charCheckIndex++; //read next character
                        if(charCheckIndex >= input.length){ //this increment exceeds input bounds
                            incomplete = false;
                        }
                    }else if(charCheck === '.'){ //acceptable
                        incomplete = false; //set to false, but don't update the charCheck
                    }else if(charCheck === 'e' || charCheck === 'E'){ //acceptable
                        incomplete = false; //set to false, but don't update the charCheck
                    }else if(keySymbol.includes(charCheck)){ //end of this numeric, acceptable
                        incomplete = false; //we've reached the end of this token
                    }else{ //followed by an unacceptable character, not legal numeric
                        incomplete = false; //input is 0..00# which is unacceptable
                    }
                }
            }else{ //input is 0 in totality, return is numeric
                isNumeric = true;
                incomplete = false;
            }
        }else if(charCheck === '.'){ //can be .####
            incomplete = false; //exit this loop & proceed to the post decimal loop
        }else if(charCheck.match(numbers)){//this check is technically 1-9 since 0 was checked above
            lexeme.id += charCheck;
            charCheckIndex++; //go to next character
            if(charCheckIndex < input.length){
                while(incomplete){
                    charCheck = input.charAt(charCheckIndex); //get character in bounds
                    if(charCheck.match(numbers)){ //acceptable number
                        lexeme.id += charCheck;
                        charCheckIndex++; //read next character
                        if(charCheckIndex >= input.length){ //this increment exceeds input bounds
                            incomplete = false;
                        }
                    }else if(charCheck === '.'){ //acceptable
                        incomplete = false; //set to false, but don't update the charCheck
                    }else if(charCheck === 'e' || charCheck === 'E'){ //acceptable
                        incomplete = false; //set to false, but don't update the charCheck
                    }else if(keySymbol.includes(charCheck)){ //end of this numeric, acceptable
                        incomplete = false; //we've reached the end of this token
                    }else{ //followed by an unacceptable character, not legal numeric
                        incomplete = false; //input is ##..##s or something
                    }
                }
            }else{
                incomplete = false;
            }
        }else{ //either isn't a number or is 'e/E' which can't start a numeric
            incomplete = false;
            if(charCheck === 'e' || charCheck === 'E') //need to change value or it might enter the loop below
                charCheck = 'x';
        }
    }
    if(charCheck === '.'){ //if looking at '.', validate the numbers after this character
        incomplete = true; //there is more to be read
        lexeme.id += charCheck;
        lexeme.type = "FLOAT"; //update type since it is now a known float
        charCheckIndex++;
        if(charCheckIndex < input.length){ //still in bounds after this char
            while(incomplete){
                charCheck = input.charAt(charCheckIndex);
                if(charCheck.match(numbers)){
                    lexeme.id += charCheck;
                    charCheckIndex++;
                    if(charCheckIndex >= input.length){
                        incomplete = false;
                    }
                }else if(keySymbol.includes(charCheck)){ //can have follow symbol whenever, 00.; is legal
                    incomplete = false;
                }else if(charCheck === 'e' || charCheck === 'E'){
                    incomplete = false; //can be followed by 'e/E' but still needs checking
                }else{
                    incomplete = false; //invalid follow char detected
                }
            }
        }else{ //actually legal to follow '.' with nothing
            incomplete = false;
            isNumeric = true;
        }
    }
    if(charCheck === 'e' || charCheck === 'E'){ //still need to validate some #s
        incomplete = true; //there is more to be read
        lexeme.id += charCheck;
        charCheckIndex++;
        if(charCheckIndex < input.length){ //still in bounds after this char
            charCheck = input.charAt(charCheckIndex); //check 'e/E' is followed by at least 1 #
            if(!charCheck.match(numbers)) //if not followed by a number we have #e; which is illegal
                incomplete = false; //do not enter the while loop
            while(incomplete){
                charCheck = input.charAt(charCheckIndex);
                if(charCheck.match(numbers)){
                    lexeme.id += charCheck;
                    charCheckIndex++;
                    if(charCheckIndex >= input.length){
                        incomplete = false;
                    }
                }else if(keySymbol.includes(charCheck)){
                    incomplete = false;
                }else{
                    incomplete = false; //illegal char read
                }
            }
        }else{ //not legal to follow 'e/E' with nothing
            incomplete = false;
        }
    }
    lexeme.length = charCheckIndex; //since charIndex started at 0, the returned length of the variable is the +1
    return lexeme;
}

//reads an input to ensure it matches python naming conventions & then checks if input is a reserve word
function readWord(input){
     var lexeme = {
        id:"", //the exact input from the string
        type:"ID", //what the token is classified as
        line_no: code_line, //what line of code the token is on
        length: 0 //used to remove the lexeme including preceding spaces from input string upon return
    };
    
    var charCheck = "";
    var charCheckIndex = 0;
    var alphanum = /^[0-9a-zA-Z_]+$/; //used to ensure input is alpha numeric
    var incomplete = true;
    while(incomplete){ //will continue to loop while next char is in alphanum
        if(charCheckIndex < input.length){
            charCheck = input.charAt(charCheckIndex);
            if(charCheck.match(alphanum)){
                lexeme.id += charCheck;
                charCheckIndex++; //increment to next char index
            }else{
                if(keySymbol.includes(charCheck)){ //checks if next character is an acceptable follow to the varaible
                    incomplete = false; //we hit the next space
                    charCheckIndex--; //unget that last index since it is next in sequence
                }else{
                    lexeme.id = "Error";
                    lexeme.type = "Error";
                    incomplete = false;
                }
            }
        }else{
            incomplete = false;
            charCheckIndex--;
        }
        
    }
    lexeme.length = charCheckIndex + 1; //since charIndex started at 0, the returned length of the variable is the +1
    
    for(var x = 0; x < reservedWord.length; x++){ //see if the scanned name is a reserved word
        if(reservedWord[x] === lexeme.id)
            lexeme.type = reservedWord[x].toUpperCase();
    }
    
    return lexeme;
}

function readString(input){
    var lexeme = {
        id:"\"", //the exact input from the string
        type:"QUOTE", //what the token is classified as
        line_no: code_line, //what line of code the token is on
        length: 1 //used to remove the lexeme including preceding spaces from input string upon return
    };
    
    var charCheck = "";
    var charCheckIndex = 1;
    var valid_printables = /^[\s*\w*]$/; // "/.*\n*/" will need to be implemented eventually
    var incomplete = true;
    
    while(incomplete){ //will continue to loop while the string is unfinished
        if(charCheckIndex < input.length){
            charCheck = input.charAt(charCheckIndex);
            if(charCheck.match(valid_printables)){
                lexeme.id += charCheck;
                charCheckIndex++; //increment to next char index
            }else{
                if(charCheck === "\""){ //checks if next character is an acceptable follow to the varaible
                    incomplete = false; //we hit the next space
                    lexeme.id += "\""; //unget that last index since it is next in sequence
                    lexeme.type = "STRING";
                }else{
                    lexeme.id = "Error";
                    lexeme.type = "Error";
                    incomplete = false;
                }
            }
        }else{
            incomplete = false;
            charCheckIndex--;
        }

        lexeme.length = charCheckIndex + 1; //since charIndex started at 1, the returned length of the variable is the +1
    }
    
    return lexeme;
}


/*calling getToken reads character by character against valid inputs & will return the exact input
 * as lexeme.id, the token type as lexeme.type, what line it was encountered on as lexeme.line_no,
 * and the length of the input which will be should be removed from the input after return (i.e. call input.slice(length))
 */
function getToken(input){
    var lexeme = {
        id:"default", //the exact input from the string
        type:"default", //what the token is classified as
        line_no: code_line, //what line of code the token is on
        length: 0 //used to remove the lexeme including preceding spaces from input string upon return
    };
    
    /*["=", "+", "-", "*", "/", "%", "^", "<", ">", ":", ";",
    "(", ")", "[", "]", "{", "}", ",", ".", "\"", "\'", "\\", " ", "\n"];*/
    
    //if the last token was any of the following there might be a special case
    var operators = ["PLUS", "ADD_ASSIGN", "SUB", "SUB_ASSIGN", "MULT", "MULT_ASSIGN", "EXPONENTIAL",
                    "DIV", "DIV_ASSIGN", "MOD", "MOD_ASSIGN", "GREATER_THAN", "GREATER_THAN_EQUAL",
                    "LESS_THAN", "LESS_THAN_EQUAL", "NOT_EQUAL", "COMPARE_EQUALS", "ASSIGN_EQUALS",
                    "LPAREN", "RPAREN", "LBRACE", "RBRACE", "LBRACKET", "RBRACKET"]; //these might be followed by a number prefaced by + or -
    var mathIndicators = ["NUMBER", "FLOAT", "BINARY", "OCTAL", "HEX"]; //a + or - prefaced by this should be careful
    var numbers = /^[0-9]+$/;
    if(input !== null || input !== ""){
        var nextChar = input.charAt(0);
        if(operators.includes(lastTokenType) && (nextChar === '+' || nextChar === '-')){ //in this case we have something lik 3--3 which is special case Number, Minus, Number
            nextChar = 'x'; //this can be anything that isn't a dedicated case, just so long as it goes to the default
        }
        switch(nextChar){
            case "+":
                lexeme.length++;
                if(input.charAt(1) === "+" && mathIndicators.includes(lastTokenType) && input.charAt(2) !== "+" && input.charAt(2) !== "-"){ //3++ is increment, but 3++3 is not
                    lexeme.id = "++";
                    lexeme.type = "INCREMENT";
                    lexeme.length++;
                }else if(input.charAt(1) === "="){
                    lexeme.id = "+=";
                    lexeme.type = "ADD_ASSIGN";
                    lexeme.length++;
                }else{
                    lexeme.id = "+";
                    lexeme.type = "PLUS";
                }
                break;
            case "-":
                lexeme.length++;
                if(input.charAt(1) === "-" && mathIndicators.includes(lastTokenType) && input.charAt(2) !== "+" && input.charAt(2) !== "-"){ //3-- is decrement, but 3--3 is not
                    lexeme.id = "--";
                    lexeme.type = "DECREMENT";
                    lexeme.length++;
                }else if(input.charAt(1) === "="){
                    lexeme.id = "-=";
                    lexeme.type = "SUB_ASSIGN";
                    lexeme.length++;
                }else{
                    lexeme.id = "-";
                    lexeme.type = "MINUS";
                }
                break;
            case "*":
                lexeme.length++;
                if(input.charAt(1) === "="){
                    lexeme.length++;
                    lexeme.id = "*=";
                    lexeme.type = "MULT_ASSIGN";
                }else if(input.charAt(1) === "*"){
                    lexeme.length++;
                    lexeme.id = "**";
                    lexeme.type = "EXPONENTIAL";
                }else{
                    lexeme.id = "*";
                    lexeme.type = "MULT";
                }
                break;
            case "/":
                lexeme.length++;
                if(input.charAt(1) === "="){
                    lexeme.length++;
                    lexeme.id = "/=";
                    lexeme.type = "DIV_ASSIGN";
                }else{
                    lexeme.id = "/";
                    lexeme.type = "DIV";
                }
                break;
            case "%":
                lexeme.length++;
                if(input.charAt(1) === "="){
                    lexeme.length++;
                    lexeme.id = "%=";
                    lexeme.type = "MOD_ASSIGN";
                }else{
                    lexeme.id = "%";
                    lexeme.type = "MOD";
                }
                break;
            case "^":
                lexeme.id = "^";
                lexeme.type = "EXPO";
                lexeme.length++;
                break;
            case "<":
                lexeme.length++;
                if(input.charAt(1) === "="){
                    lexeme.id = "<=";
                    lexeme.type = "LESS_THAN_EQUAL";
                    lexeme.length++;
                }else{
                    lexeme.id = "<";
                    lexeme.type = "LESS_THAN";
                }
                break;
            case ">":
                lexeme.length++;
                if(input.charAt(1) === "="){
                    lexeme.id = ">=";
                    lexeme.type = "GREATER_THAN_EQUAL";
                    lexeme.length++;
                }else{
                    lexeme.id = ">";
                    lexeme.type = "GREATER_THAN";
                }
                break;
            case "=": //checks "=" & then "=="
                lexeme.length++;
                if(input.charAt(1) === "="){
                    lexeme.id = "==";
                    lexeme.type = "COMPARE_EQUALS";
                    lexeme.length++;
                }else{
                    lexeme.id = "=";
                    lexeme.type = "ASSIGN_EQUALS";
                }
                break;
            case "!":
                lexeme.length++;
                if(input.charAt(1) === "="){
                    lexeme.id = "!=";
                    lexeme.type = "NOT_EQUAL"; //May want to get rid of <> case altogether as its deprecated
                    lexeme.length++;
                }else{
                    lexeme.id = "error";
                    lexeme.type = "unchecked symbol";
                    lexeme.length++;
                }
                break;
            case ":":
                lexeme.id = ":";
                lexeme.type = "COLON";
                lexeme.length++;
                break;
            case ";":
                lexeme.id = ";";
                lexeme.type = "SEMICOLON";
                lexeme.length++;
                break;
            case "(":
                lexeme.id = "(";
                lexeme.type = "LPAREN";
                lexeme.length++;
                break;
            case ")":
                lexeme.id = ")";
                lexeme.type = "RPAREN";
                lexeme.length++;
                break;
            case "[":
                lexeme.id = "[";
                lexeme.type = "LBRACE";
                lexeme.length++;
                break;
            case "]":
                lexeme.id = "]";
                lexeme.type = "RBRACE";
                lexeme.length++;
                break;
            case "{":
                lexeme.id = "{";
                lexeme.type = "LBRACKET";
                lexeme.length++;
                break;
            case "}":
                lexeme.id = "}";
                lexeme.type = "RBRACKET";
                lexeme.length++;
                break;
            case "\"":
                lexeme.id = "\"";
                lexeme.type = "QUOTE";
                lexeme.length++;
                break;
            case "\'":
                lexeme.id = "\'";
                lexeme.type = "APOSTROPHE";
                lexeme.length++;
                break;
            case "\\":
                lexeme.length++;
                if(input.charAt(1) === "\""){
                    lexeme.length++;
                    lexeme.id = "\\\"";
                    lexeme.type = "ESCAPE_QUOTE";
                }else if(input.charAt(1) === "\'"){
                    lexeme.length++;
                    lexeme.id = "\\\'";
                    lexeme.type = "ESCAPE_APOSTROPHE";
                }else{
                    lexeme.id = "\\";
                    lexeme.type = "ESCAPE_SLASH";
                }
                break;
            case ",":
                lexeme.id = ",";
                lexeme.type = "COMMA";
                lexeme.length++;
                break;
            case ".":
                if(isNumeric(input)){ //double check .###
                    lexeme = readNumber(input);
                }else{
                    lexeme.id = ".";
                    lexeme.type = "PERIOD";
                    lexeme.length++;
                }
                break;
            case " ":
                if(input.charAt(1) === " ") //only parse next char if it is another space, otheriwse prepare to return
                    lexeme = getToken(input.slice(1));
                lexeme.id = " ";
                lexeme.type = "SPACE";
                lexeme.length++; //only incremenet the length since spaces are mostly ignored in parsing
                break;
            case "\n":
                lexeme.id = "line_break";
                lexeme.type = "END_OF_LINE";
                lexeme.length++;
                break;
            case "#":
                lexeme.id = "#";
                lexeme.type = "HASH_TAG";
                lexeme.length++;
                break;
            default:
                if(!(keySymbol.includes(input.charAt(0))) || input.charAt(0) === '+' || input.charAt(0) === '-'){
                    var numbers = /^[0-9]+$/;
                    var prefixOps ={
                        id: "",
                        length: 0
                    };
                    if(input.charAt(0) === '+' || input.charAt(0) === '-'){ //numbers can be prefaced by + & -
                        prefixOps = readPrefixOps(input);
                        input = input.slice(prefixOps.length);
                    }
                    if(input.charAt(0).match(numbers)){ //this one check can catch bin,oct,num, & hex, broken down within
                        if(isNumeric(input)){ //assume it to be a number first
                            lexeme = readNumber(input);
                            lexeme.id = prefixOps.id + "" + lexeme.id; //append any prefix ops to front of the number
                            lexeme.length += prefixOps.length;
                        }else if(isBinary(input)){ //might start with 0b
                            lexeme = readBin(input);
                            lexeme.id = prefixOps.id + "" + lexeme.id; //append any prefix ops to front of the number
                            lexeme.length += prefixOps.length;
                        }else if(isOct(input)){ //might xtart with 0o
                            lexeme = readOct(input);
                            lexeme.id = prefixOps.id + "" + lexeme.id; //append any prefix ops to front of the number
                            lexeme.length += prefixOps.length;
                        }else if(isHex(input)){ //might start with 0x
                            lexeme = readHex(input);
                            lexeme.id = prefixOps.id + "" + lexeme.id; //append any prefix ops to front of the number
                            lexeme.length += prefixOps.length;
                        }else{ //starts with 0 or # & isn't bin, oct, num, or hex so it is an error
                            lexeme.id = "error";
                            lexeme.type = "unchecked symbol";
                            lexeme.length++; //length won't matter on an error
                        }
                    }else if(input !== "" && prefixOps.length === 0){
                        lexeme = readWord(input);
                    }else{
                        lexeme.id = "end";
                        lexeme.type = "END_OF_FILE";
                    }
                }else{
                    lexeme.id = "error";
                    lexeme.type = "unchecked symbol";
                    lexeme.length++;
                }
                break;
            
        }
        
    }else{
        lexeme.id = "end";
        lexeme.type = "END_OF_FILE";
    }
    
    lastTokenType = lexeme.type; //store this for next token differentiation
    return lexeme;
}

function ungetToken(input, token){
    return token.id + " " + input;
}

function incrementCodeLine(){
    code_line++;
}
function decrementCodeLine(){
    code_line--;
}
