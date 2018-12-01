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
var reservedWord = ["True", "False", "None", "and", "as", "assert", "break", "class",
    "continue", "def", "del", "elif", "else", "except", "finally", "for", "from",
"global", "if", "import", "in", "is", "lambda", "my_range", "nonlocal", "not", "or", "pass", "print",
"raise", "range", "return", "try", "while", "with", "xrange", "yield"];

var code_line = 1;

function getChar(myString){
    var nextChar = null;
    if(myString.length > 0)
        nextChar = myString.charAt(0);
    return nextChar;
}

function isNumeric(input){
    var isNumeric = true;
    var numbers = /^[0-9]+$/;
    var incomplete = true;
    var charCheck = "";
    var charCheckIndex = 0;
    while(incomplete){
        if(charCheckIndex < input.length){ //still have input to read
            charCheck = input.charAt(charCheckIndex);
            if(charCheck.match(numbers)){ //still a valid numeric input
                charCheckIndex++;
            }else if(charCheck === "."){ //ensure not a floating point numeric
                charCheckIndex++;//move to next char
                while(incomplete){
                    if(charCheckIndex < input.length){
                        charCheck = input.charAt(charCheckIndex);
                        if(charCheck.match(numbers))
                            charCheckIndex++;
                        else{
                            if(keySymbol.includes(charCheck)){ //checks if next character is an acceptable follow to the varaible
                                incomplete = false; //we hit the next space
                                charCheckIndex--; //unget that last index since it is next in sequence
                            }else{ //not followed by key Symbol, which makes it not a number
                                isNumeric = false;
                                incomplete = false;
                            }
                        }
                    }
                }
            }else{
                if(keySymbol.includes(charCheck)){ //checks if next character is an acceptable follow to the varaible
                    incomplete = false; //we hit the next space
                    charCheckIndex--; //unget that last index since it is next in sequence
                }else{ //not followed by key Symbol, which makes it not a number
                    isNumeric = false;
                    incomplete = false;
                }
            }
        }else{ //end of input
            incomplete = false;
            charCheckIndex--;
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
    while(incomplete){
        if(charCheckIndex < input.length){ //still have input to read
            charCheck = input.charAt(charCheckIndex);
            if(charCheck.match(numbers)){ //still a valid numeric input
                lexeme.id += charCheck;
                charCheckIndex++;
            }else if(charCheck === "."){ //ensure not a floating point numeric
                lexeme.id += charCheck; //add "." to name
                lexeme.type = "FLOAT"; //update type
                charCheckIndex++;//move to next char
                while(incomplete){
                    if(charCheckIndex < input.length){
                        charCheck = input.charAt(charCheckIndex);
                        if(charCheck.match(numbers)){
                            lexeme.id += charCheck;
                            charCheckIndex++;
                        }else{
                            if(keySymbol.includes(charCheck) && charCheck !== "."){ //checks if next character is an acceptable follow to the varaible, cannot be "." bacuse that could mean 3.1.5 as a float, period, number
                                incomplete = false; //we hit the next space
                                charCheckIndex--; //unget that last index since it is next in sequence
                            }else{ //not followed by key Symbol, which makes it not a number
                                lexeme.id = "Error";
                                lexeme.type = "Error";
                                incomplete = false;
                            }
                        }
                    }
                }
            }else{
                if(keySymbol.includes(charCheck)){ //checks if next character is an acceptable follow to the varaible
                    incomplete = false; //we hit the next space
                    charCheckIndex--; //unget that last index since it is next in sequence
                }else{ //not followed by key Symbol, which makes it not a number
                    incomplete = false;
                }
            }
        }else{ //end of input
            incomplete = false;
            charCheckIndex--;
        }
    }
    lexeme.length = charCheckIndex + 1; //since charIndex started at 0, the returned length of the variable is the +1
    
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
    
    /*["=", "+", "-", "*", "/", "%", "<", ">", ":", ";",
    "(", ")", "[", "]", "{", "}", ",", ".", "\"", "\'", "\\", " ", "\n"];*/
    
    if(input !== null || input !== ""){
        switch(input.charAt(0)){
            case "+":
                lexeme.length++;
                if(input.charAt(1) === "+"){
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
                if(input.charAt(1) === "-"){
                    lexeme.id = "--";
                    lexeme.type = "DECREMENT";
                    lexeme.length++;
                }else if(input.charAt(1) === "="){
                    lexeme.id = "-=";
                    lexeme.type = "SUBTRACT_ASSIGN";
                    lexeme.length++;
                }else{
                    lexeme.id = "-";
                    lexeme.type = "PLUS";
                }
                break;
            case "*":
                lexeme.id = "*";
                lexeme.type = "MULTIPLY";
                lexeme.length++;
                break;
            case "/":
                lexeme.id = "/";
                lexeme.type = "DIVIDE";
                lexeme.length++;
                break;
            case "%":
                lexeme.id = "%";
                lexeme.type = "MODULO";
                lexeme.length++;
                break;
            case "<":
                lexeme.length++;
                if(input.charAt(1) === ">"){
                    lexeme.id = "<>";
                    lexeme.type = "NOT_EQUAL";
                    lexeme.length++;
                }else if(input.charAt(1) === "="){
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
                lexeme.id = "\\";
                lexeme.type = "ESCAPE_SLASH";
                lexeme.length++;
                break;
            case ",":
                lexeme.id = ",";
                lexeme.type = "COMMA";
                lexeme.length++;
                break;
            case ".":
                lexeme.id = ".";
                lexeme.type = "PERIOD";
                lexeme.length++;
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
            default:
                if(!(keySymbol.includes(input.charAt(0)))){
                    var numbers = /^[0-9]+$/;
                    if(input.charAt(0).match(numbers)){
                        if(isNumeric(input)){
                            lexeme = readNumber(input);
                        }else{
                            lexeme = readWord(input);
                        }
                    }else if(input !== ""){
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
    
    return lexeme;
}

function ungetToken(input, token){
    return token.id + "" + input;
}

function incrementCodeLine(){
    code_line++;
}
function decrementCodeLine(){
    code_line--;
}

