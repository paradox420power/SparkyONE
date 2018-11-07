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
"global", " if", "import", "in", "is", "lambda", "nonlocal", "not", "or", "pass", "print",
"raise", "return", "try", "while", "with", "yield"];

var code_line = 1;

function getChar(myString){
    var nextChar = null;
    if(myString.length > 0)
        nextChar = myString.charAt(0);
    return nextChar;
}

function isNumeric(variable){
    var isNumeric = true;
    var numbers = /^[0-9]+$/;
    for(var x = 0; x < variable.length; x++){
        if(!(variable.charAt(x).match(numbers)))
            isNumeric = false;
    }
    return isNumeric;
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
    var alphanum = /^[0-9a-zA-Z]+$/; //used to ensure input is alpha numeric
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
    
    if(isNumeric(lexeme.id)) //checks if all read characters are numbers
        lexeme.type = "NUMBER"; //if they are, assign number type
    
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
    
    if(input !== null){
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
                code_line++;
                break;
            default:
                if(!(keySymbol.includes(input.charAt(0)))){
                    lexeme = readWord(input);
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
};

