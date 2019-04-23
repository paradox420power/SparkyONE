//added INPUT in bgnTokens for testing purposes for now
var bgnTokens = ["IMPORT", "FROM", "IF", "FOR", "WHILE", "ID", "HASH_TAG", "RETURN", "DEF"];
var libFunctions = ["ABS", "BIN", "BOOL", "CHR", "FLOAT", "HEX", "LEN", "OCT", "ORD", "STR", "TYPE", "MIN", "MAX", "INT", 
    "INPUT", "PRINT", "CEIL", "FLOOR", "SQRT", "COS", "SIN", "TAN", "PI", "E", "RANDOM", "SEED", "RANDINT"];
var program = "";
var indent_stack = [];
var encapsulation_stack = [];
var cust_func_list = [];//Will likely need to be readdressed within future iterations
//USED FOR TESTING FUTURE IMPLEMENTATION
var insideDef = 0;
//USED FOR TESTING WHETHER OR NOT THE PARSER RESULTED IN A SYNTAX_ERROR
var testingResult = true;
var errorResult = "";

function test(input){
    parse_begin_program(input);
    return [testingResult, errorResult];
}

//print parsing error
function error_expected_not_matching(expected, received, line_no){
    //document.write("Expected Token: " + expected + "<br>Received Token: " + received + "<br>At line " + line_no + "<br>");
}

//used to remove unwanted spaces
function skipSpaces(){
    var token = getToken(program, false);
    if(token.type === "SPACE"){
        program = program.slice(token.length);
        token = getToken(program,false);
        if(token.type === "TAB"){
            skipSpaces();
        }
        //token = getToken(program, false);
        //document.write("Next Token: " + token.id + "<br>");
    }else if(token.type === "TAB"){
        program = program.slice(token.length/8);
        token = getToken(program,false);
        if(token.type === "SPACE"){
            skipSpaces();
        }
    }
    //else do nothing
}

// Checks current token with indent_stack for dedent and unexpected indentation
function check_indents(){
    var token = getToken(program, false);
    if(token.type !== "SPACE" && token.type !== "TAB"){
        if(indent_stack.length === 1){
            //There has been no new level of indentation
            //do nothing as this should be valid
        }else{
            //there was a dedent that led to the first indentation level
            while(indent_stack.length !== 1){
                indent_stack.pop();
            }
        }
    }else{
        if(indent_stack.length !== 1){
            var current = indent_stack.pop();
            if(token.length > current){
                //unexpected indent
                indent_stack = [];
                indent_stack.push(0);
                //document.write("index syntax error at line " + token.line_no + "<br>Current: " + current + " TabLength: " + token.length + "<br>");
                syntax_error("INDENTATION_ERROR");
            }else if(token.length < current){
                //possible dedent
                //document.write("Popping: " + current + "<br>");
                //document.write(indent_stack.toString() + "<br>");
                check_indents();
            }else if(token.length === current){
                //matching indent
                if(token.type === "SPACE"){
                    program = program.slice(token.length);
                }else if(token.type === "TAB"){
                    program = program.slice(token.length/8);
                }
                indent_stack.push(current);
            }
        }else{
            if(token.type === "SPACE" || token.type === "TAB"){
                syntax_error("INDENTATION_ERROR");
            }
        }
    }
}

function increase_indent(){
    var token = getToken(program, false);
    if(token.type === "SPACE" || token.type === "TAB"){
        var current = indent_stack.pop();
        if(token.length <= current){
            //TO DO, insert syntax error
            //expected an indent
            syntax_error("");
            //indent_stack.push(current);
        }else{
            indent_stack.push(current);
            indent_stack.push(token.length);
            //document.write("Token: " + token.type + " adding " + token.length + " to stack at line " + token.line_no + "<br>");
        }
    }else{
        //TO DO, insert syntax error
        //expected a new level of indentation
        syntax_error("");
    }
}

//TO DO
//Consider using saveSpaces as a way to help with the potential danger of peek_2_ahead
//used to save potentially useful spaces
function saveSpaces(){
    var token = getToken(program, false);
    if(token.type === "SPACE" || token.type === "TAB"){
        return [token.length, token.type];
    }else{
        return [0, "SPACE"];
    }
}

function returnHeldSpaces(spaces){
    //document.write("<br>" + spaces + "<br>");
    if (typeof spaces === 'undefined'){
        //Occurs in the case of an end_of_file
        //the program has ended so there is no reason to return the spaces back to the program
    }else{
        if(spaces[1] === "SPACE"){
            var allSpaces = "";
            for(var x = 0; x < spaces[0]; x++)
                allSpaces += " ";
            program = allSpaces + program;
        }else if(spaces[1] === "TAB"){
            var allSpaces = "";
            for(var x = 0; x < spaces[0]/8; x++)
                allSpaces += "\t";
            program = allSpaces + program;
        }else{
            //TO DO
            //INSERT SYNTAX ERROR
            syntax_error("");
        }
    }
}

//reads & returns next token, ignoring spaces
function peek(){
    skipSpaces();
    var token = getToken(program, false);
    return token;
}

//use very carefully because if the first token peeked is a line break, skip spaces when peeking a second time might alter indents
function peek_2_ahead(){ //necessary for a few location in parser
    skipSpaces();
    var token = getToken(program, false);
    program = program.slice(token.length);
    var spaceCount = saveSpaces();
    var returnToken = peek();
    returnHeldSpaces(spaceCount);
    program = token.id + program; //return skipped token & the spacing after it
    return returnToken;
}

 //reads next token, throws an error if they don't match
 // & splices token from input, ignoring spaces
function expect(tokenType, inString = false){
    skipSpaces();
    var token = getToken(program, true);
    if(token.type === tokenType){
        if(!inString){
            if(["LPAREN", "LBRACE", "LBRACKET"].includes(token.type)){
                encapsulation_stack.push(token.type);
            }else if(["RPAREN", "RBRACE", "RBRACKET"].includes(token.type)){
                if(encapsulation_stack[encapsulation_stack.length-1].substring(1) === (token.type).substring(1)){
                    encapsulation_stack.pop();
                }else{
                    //TO DO
                    //INSERT SYNTAX ERROR
                    //Occured
                    syntax_error("");
                }
            }
        }
        program = program.slice(token.length);
        
        if(encapsulation_stack.length !== 0 && !inString){
            readEmptyLines();
        }else{
            if(token.type === "END_OF_LINE"){
                readEmptyLines();
                //check correct indents (stack issue)
                //check_indents();
            }
        }
        //document.write(token.type + " read at line " + token.line_no + "<br>"); //comment this out when not trouble shooting

    }else{
        program = program.slice(token.length); //unnecessary to slice since an error is thrown
        error_expected_not_matching(tokenType, token.type, token.line_no);
    }
    //document.write(program + "<br><br>");
    return token;
}

//read empty lines, will recursively call, reads until next input
function readEmptyLines(){
    var token = getToken(program, false);
    var token2;
    if(token.type === "SPACE"){
        program = program.slice(token.length); //slice off the spaces
        token2 = getToken(program, false);
        if(token2.type === "END_OF_LINE" || token2.type === "TAB"){ //if next is line break, its ok
            readEmptyLines();
        }else{ //some keyword was read & the spaces could be indent that need to be read
            if(token.type === "SPACE"){
                for(i = 0; i < token.length; i++){
                    program = " " + program;
                }
                //increase_indent();
            }else{//TO DO: This never ends up being called...why is it here?
                program = token.id + "" + program; //add spliced id back to front of program
            }
        }
    }else if(token.type === "TAB"){
        program = program.slice(token.length/8); //slice off the tab
        token2 = getToken(program, false);
        if(token2.type === "END_OF_LINE" || token2.type === "SPACE"){ //if next is line break, its ok
            readEmptyLines();
        }else{ //some keyword was read & the spaces could be indent that need to be read
            if(token.type === "TAB"){
                for(i = 0; i < token.length/8; i++){
                    program = "\t" + program;
                }
                //increase_indent();
            }else{//TO DO: This never ends up being called...why is it here?
                program = token.id + "" + program; //add spliced id back to front of program
            }
        }
    }else if(token.type === "END_OF_LINE"){
        program = program.slice(token.length);
        readEmptyLines();
    }
}

function parse_begin_program(input){
    program = input;
    indent_stack.push(0);
    //TO DO
    //var spaceCount = saveSpaces();
    var token = peek();
    if(token.type === "END_OF_LINE")
        expect("END_OF_LINE"); //this will precede to read all empty lines
    
    token = peek();
    if(token.type === "IMPORT" || token.type === "FROM"){
        parse_import_list();
        token = peek(); //if above it doesn't run this just peeks the same token
        if(token.type !== "END_OF_FILE")
            parse_program(); //this will run on any non-empty program
        expect("END_OF_FILE");
    }else if(token.type === "END_OF_FILE"){
        //nothing to parse
    }else if(token.type === "unchecked symbol"){
        syntax_error("UNKNOWN_SYMBOL");
    }else{
        parse_program();
        expect("END_OF_FILE");
    }
    
}

function parse_import_list(){
    parse_import_stmt();
    var token = peek();
    if(token.type !== "END_OF_FILE"){//some statements are the end of the program & won't have a line break
        if(token.type === "END_OF_LINE"){
            expect("END_OF_LINE");
        }else if(token.type === "SEMICOLON"){
            expect("SEMICOLON");
            token = peek(); //sometimes a semicolon is followed by a line break
            if(token.type === "END_OF_LINE")
                expect("END_OF_LINE");
        }else{
            //TO DO
            //INSERT SYNTAX ERROR
            syntax_error("");
        }
    }
    var spaceCount = saveSpaces(); //need to be held on to for indent stack purposes
    token = peek();
    returnHeldSpaces(spaceCount); //now that we've peeked the next token we return the spaces
    if(token.type === "IMPORT" || token.type === "FROM"){
        parse_import_list();
    }
}

function parse_import_stmt(){
    var token = peek();
    var availableLibs = ["MATH", "RANDOM"];
    var libContents = { 
        MATH: ["CEIL", "FLOOR", "SQRT", "COS", "SIN", "TAN", "PI", "E"], 
        RANDOM: ["RANDOM", "SEED", "RANDINT"]
    };
    
    if(token.type === "IMPORT"){
        expect("IMPORT");
        token = peek();
        if(availableLibs.includes(token.type)){
            expect(token.type);
            token = peek();
            while(token.type === "COMMA"){
                expect("COMMA");
                token = peek();
                if(availableLibs.includes(token.type)){
                    expect(token.type);
                    token = peek();
                }else{
                    //INSERT SYNTAX ERROR
                    //More likely to just be a library we don't support
                    syntax_error("");
                }
            }
        }else{
            //INSERT SYNTAX ERROR
            //More likely to just be a library we don't support
            syntax_error("");
        }
    }else if(token.type === "FROM"){ //from module_name import...
        expect("FROM");
        token = peek();
        if(availableLibs.includes(token.type)){
            expect(token.type);
            expect("IMPORT");
            var token2 = peek();
            if(libContents[token.type].includes(token2.type)){
                expect(token2.type);
                token2 = peek();
                if(token2.type === "COMMA"){
                    while(token2.type === "COMMA"){
                        expect("COMMA");
                        token2 = peek();
                        if(libContents[token.type].includes(token2.type)){
                            expect(token2.type);
                            token2 = peek();
                        }else{
                            //INSERT SYNTAX ERROR
                            syntax_error("");
                        }
                    }
                }
            }else if(token2.type === "LPAREN"){
                expect("LPAREN");
                token2 = peek();
                if(libContents[token.type].includes(token2.type)){
                    expect(token2.type);
                    token2 = peek();
                    while(token2.type !== "RPAREN"){
                        expect("COMMA");
                        token2 = peek();
                        if(libContents[token.type].includes(token2.type)){
                            expect(token2.type);
                            token2 = peek();
                        }else if(token2.type === "RPAREN"){
                            break;
                        }else{
                            //INSERT SYNTAX ERROR
                            syntax_error("");
                            break;
                        }
                    }
                    expect("RPAREN");
                }
            }else if(token2.type === "MULT"){ //MULT is the token for the '*' operator, it's used for the following case: from module_name import *
                expect("MULT");
            }else{
                //INSERT SYNTAX ERROR
                syntax_error("");
            }
        }else{
            //INSERT SYNTAX ERROR
            //More likely to just be a library we don't support.
            syntax_error("");
        }
    }
}

function parse_program(){
    var token = peek();
    if(token.type === "unchecked symbol"){
        syntax_error("UNKNOWN_SYMBOL");
    }else{
        parse_stmt_list();
        token = peek();
        if(token.type !== "END_OF_FILE")
            //parse_program();
            syntax_error("");
    }
}

//TO DO
//Does not cover nested function declarations
function parse_function_full(){
    parse_function_def();
    var token = getToken(program, false);
    //After the definition of the function there should be an indent for the body of the function
    if(token.type === "SPACE" || token.type === "TAB"){
        if(indent_stack[indent_stack.length-1] < token.length){
            increase_indent();
            parse_stmt_list();
        }else{
            //INSERT SYNTAX ERROR, actually an indentation error
            syntax_error("");
        }
    }else{
        syntax_error("");
    }
    
}

function parse_function_def(){
    expect("DEF");
    expect("ID"); //should this ID then be added to reservedWords?
    expect("LPAREN");
    var token = peek();
    if(token.type !== "RPAREN"){
        parse_parameter_list();
    }
    expect("RPAREN");
    expect("COLON");
    expect("END_OF_LINE");
}

function parse_parameter_list(){
    expect("ID");
    var token = peek();
    if(token.type === "COMMA"){
        expect("COMMA");
        token = peek();
        if(token.type !== "RPAREN"){
            parse_parameter_list();
        }
    }
}

function parse_body(){
    //TO DO
    //Just make into stmt_list?
    //When the first RETURN is received go back to function full 
    //Read the return_stmt
    //continue reading until a dedent is noticed as syntax apparently doesn't matter after that if it's in the same scope...
    var token = peek();
    if(token.type === "RETURN"){
        parse_return_stmt();
    }
}

/*function parse_new_body(){
    
}

function parse_body_no_indent(){
    
}*/

function parse_return_stmt(){
    expect("RETURN");
    var token = peek();
    if(token.type === "END_OF_LINE" || token.type === "SEMICOLON" || "END_OF_FILE"){
        //do nothing, return to parse_body which will cover the expectation of one these tokens
    }else{
        parse_expr();
    }
}

function parse_stmt_list(onSameLine = false){
    parse_stmt(onSameLine);
    var token = peek();
    var spaceCount;
    var sameLine = onSameLine;
    
    if(token.type !== "END_OF_FILE"){//some statements are the end of the program & won't have a line break
        if(token.type === "END_OF_LINE"){
            expect("END_OF_LINE");
            spaceCount = saveSpaces();//need to be held on to for indent stack purposes
            token = peek();
            returnHeldSpaces(spaceCount);//now that we've peeked the next token we return the spaces
        }else if(token.type === "SEMICOLON"){
            expect("SEMICOLON");
            sameLine = true;
            spaceCount = saveSpaces();//need to be held on to for indent stack purposes
            token = peek(); //sometimes a semicolon is followed by a line break
            if(token.type === "END_OF_LINE"){
                expect("END_OF_LINE");
                spaceCount = saveSpaces();//need to be held on to for indent stack purposes
                sameLine = false;
            }
            token = peek();
            returnHeldSpaces(spaceCount);//now that we've peeked the next token we return the spaces
        }else{
            //TO DO
            //INSERT SYNTAX ERROR
            syntax_error("");
        }
    }
    
    if(token.type === "END_OF_FILE"){
        //do nothing, and return to parse_program to expect the token
    }else if(token.type === "DEF" && insideDef > 1){
        alert("Nested Function Declaration is Not Supported at This Time");
        exit();
    }else{
        parse_stmt_list(sameLine);
    }
}

function parse_stmt(sameLine = false){
    var spaceCount = saveSpaces(); //need to be held on to for indent stack purposes
    var token = peek();

    if(token.type === "HASH_TAG"){
        //Multiline comments are accounted for by parse_expr() as they are subject to indentation
        parse_comment();
    }else{
        returnHeldSpaces(spaceCount); //now that we've peeked the next token we return the spaces
        if(!sameLine){
            check_indents();
        }
        var token = peek();
        if(bgnTokens.includes(token.type)){
            switch(token.type){
                case "IF": parse_if_stmt();
                    break;
                case "FOR": parse_for_stmt();
                    break;
                case "WHILE": parse_while_stmt();
                    break;
                case "ID": 
                    var tempInput = program;
                    var token2 = peek_2_ahead();
                    
                    if(token2.type === "LBRACE"){//list[0] = ...
                        expect("ID");
                        expect("LBRACE");
                        parse_expr();//Validity should be handled by runtime implementation.
                        token2 = peek();
                        if(token2.type === "COLON"){//list[0:2] = ...
                            expect("COLON");
                            parse_expr();//Validity should be handled by runtime implementation.
                        }
                        expect("RBRACE");
                        token2 = peek();
                        program = tempInput;
                    }
                    
                    if(token2.type === "ASSIGN_EQUALS"){
                        parse_assign_stmt();
                    }else if(token2.type === "COMMA"){ //a,b,c,d = 1,2,3,4
                        //TO DO
                        //Account for tuple assignment
                        parse_multi_val_assign_stmt();      
                    }else if(token2.type === "PERIOD"){ //TO DO: function call
                        
                    }else{
                        parse_expr();
                    }
                    break;
                case "DEF": parse_function_full();
                    break;
                case "RETURN": 
                    //TO DO
                    //USED FOR TESTING FUTURE IMPLEMENTATION
                    if(insideDef > 0){
                        parse_return_stmt();
                    }else{
                        //INSERT SYNTAX ERROR
                        //return used outside of function call
                        syntax_error("");
                    }
                    break;
                default: syntax_error("INVALID_STATEMENT");
                    break;
            }
        }else{//This is for when an expression is used outside of assigning it to a variable
            while(!["END_OF_LINE", "END_OF_FILE", "SEMICOLON"].includes(token.type)){
                while(["PLUS", "MINUS", "INCREMENT", "DECREMENT"].includes(token.type)){
                    expect(token.type);
                    token = peek();
                }
                parse_expr();
                token = peek();
                if(token.type === "COMMA"){
                    expect("COMMA");
                    token = peek();
                }
            }
        }
    }
}

function parse_if_stmt(){
    expect("IF");
    parse_conditional();
    expect("COLON");
    expect("END_OF_LINE");
    increase_indent();
    parse_stmt_list();
    parse_else_stmt();
}

function parse_else_stmt(){
    var token = peek();
    if(token.type === "ELIF"){
        expect("ELIF");
        parse_conditional();
        expect("COLON");
        expect("END_OF_LINE");
        parse_stmt_list();
        parse_else_stmt();
    }else if (token.type === "ELSE"){
        expect("ELSE");
        //parse_conditional();
        expect("COLON");
        expect("END_OF_LINE");
        parse_stmt_list();
    }//else do nothing, no else detected
}

function parse_conditional(){
    var token = peek();
    while(token.type === "NOT"){
        expect("NOT");
        token = peek();
    }
    parse_expr();
    token = peek();
    var compare_ops = ["COMPARE_EQUALS", "NOT_EQUAL", "LESS_THAN", "LESS_THAN_EQUAL", "GREATER_THAN", "GREATER_THAN_EQUAL"];
    var link_ops = ["AND", "OR"];
    let moreToCompare = false;
    if(compare_ops.includes(token.type) || link_ops.includes(token.type))
        moreToCompare = true;
    while(moreToCompare){
        if(compare_ops.includes(token.type)){
            parse_comparison_operator();
            token = peek();
            while(token.type === "NOT"){
                expect("NOT");
                token = peek();
            }
            parse_expr();
            token = peek();
            if(!compare_ops.includes(token.type) && !link_ops.includes(token.type))
                moreToCompare = false;
        }else if(link_ops.includes(token.type)){
            parse_comparison_link();
            token = peek();
            while(token.type === "NOT"){
                expect("NOT");
                token = peek();
            }
            parse_expr();
            token = peek();
            if(!compare_ops.includes(token.type) && !link_ops.includes(token.type))
                moreToCompare = false;
        }else{
            syntax_error("INVALID_COND_OPERATOR");
            moreToCompare = false;
        }
        token = peek();
    }
}

function parse_comparison_operator(){
    var token = peek();
    var compare_ops = ["COMPARE_EQUALS", "NOT_EQUAL", "LESS_THAN", "LESS_THAN_EQUAL", "GREATER_THAN", "GREATER_THAN_EQUAL"];
    if(compare_ops.includes(token.type)){
        switch(token.type){
            case "COMPARE_EQUALS": expect("COMPARE_EQUALS");
                break;
            case "NOT_EQUAL": expect("NOT_EQUAL");
                break;
            case "LESS_THAN": expect("LESS_THAN");
                break;
            case "LESS_THAN_EQUAL": expect("LESS_THAN_EQUAL");
                break;
            case "GREATER_THAN": expect("GREATER_THAN");
                break;
            case "GREATER_THAN_EQUAL": expect("GREATER_THAN_EQUAL");
                break;
            default: syntax_error("INVALID_COMP_OPERATOR");
                break;
        }
    }else{
        syntax_error("INVALID_COMP_OPERATOR");
    }
}

function parse_comparison_link(){
    var token = peek();
    var link_ops = ["AND", "OR"];
    if(link_ops.includes(token.type) ){
        switch(token.type){
            case "AND": expect("AND");
                break;
            case "OR": expect("OR");
                break;
            default: syntax_error("INVALID_LINK");
                break;
        }
    }else{
        syntax_error("INVALID_LINK");
    }
}

function parse_for_stmt(){
    expect("FOR");
    expect("ID");
    expect("IN");
    var token = peek();
    switch(token.type){
        case "RANGE":
            expect("RANGE");
            expect("LPAREN");
            expect("NUMBER");
            token = peek();
            if(token.type === "RPAREN"){
                // only one number within parenthesis
                expect("RPAREN");
                expect("COLON");
                expect("END_OF_LINE");
                increase_indent();
                parse_stmt_list();
                break;
            }
            expect("COMMA");
            expect("NUMBER");
            token = peek();
            if(token.type === "RPAREN"){
                // two numbers seperated by a colon
                expect("RPAREN");
                expect("COLON");
                expect("END_OF_LINE");
                increase_indent();
                parse_stmt_list();
                break;
            }
            // three numbers should be no more
            expect("COMMA");
            expect("NUMBER");
            expect("RPAREN");
            expect("COLON");
            expect("END_OF_LINE");
            increase_indent();
            parse_stmt_list();
            break;
        case "ID":
            expect("ID");
            token = peek();
            if (token.type === "LBRACE"){
                //Loop over a slice copy of the entire list
                expect("LBRACE");
                expect("COLON");
                expect("RBRACE");
            }
            expect("COLON");
            expect("END_OF_LINE");
            increase_indent();
            parse_stmt_list();
            break;
        default: syntax_error("INVALID_RANGE");
            break;
    }
}

function parse_while_stmt(){
    expect("WHILE");
    parse_conditional();
    expect("COLON");
    expect("END_OF_LINE");
    increase_indent();
    parse_stmt_list();
}

//TO DO
//Consider how to handle this tuple case: t = (1,2,3); a,b,c = t;
//Might need to add a case in parse_multi_val_assign_stmt(); to accomdate.
//That, or find a way to differentiate between the two.
function parse_assign_stmt(){
    var multi_token = peek(); //used in the case we need to unget the ID, for the multi_val_assign_stmt
    expect("ID");
    var token = peek();
    
    if(token.type === "LBRACE"){//list[0] = ...
        expect("LBRACE");
        parse_expr();//Validity should be handled by runtime implementation.
        token = peek();
        if(token.type === "COLON"){//list[0:2] = ...
            expect("COLON");
            parse_expr();//Validity should be handled by runtime implementation.
        }
        expect("RBRACE");
        token = peek();
    }
    
    var math_assigns = ["ADD_ASSIGN", "SUB_ASSIGN", "MULT_ASSIGN", "DIV_ASSIGN", "MOD_ASSIGN"];
    if(math_assigns.includes(token.type)){ //calc & assign statements
        parse_assign_op();
        token = peek();
        parse_expr();
    }else if(token.type === "ASSIGN_EQUALS"){ //simply assigning, but could be a multi assign statement
        expect("ASSIGN_EQUALS");
        token = peek();
        var token2 = peek_2_ahead();
        if(token.type === "ID"){
            if(token2.type === "ASSIGN_EQUALS" || token2.type === "END_OF_LINE" || token2.type === "SEMICOLON"){ //2nd tokens indicative of an assign stmt
                parse_assign_stmt();
            }else{ //else an id should be a primary/expression
                parse_expr();
                //TO DO
                //Maybe a while loop to account for commas being used to create a tuple that doesn't utilize paranthesis
                token = peek();
                while(token.type === "COMMA"){
                    expect("COMMA");
                    parse_expr();
                    token = peek();
                }
            }
        }else{
            if(["PLUS", "MINUS", "INCREMENT", "DECREMENT"].includes(token.type)){
                expect(token.type);
                token = peek();
                while(["PLUS", "MINUS", "INCREMENT", "DECREMENT"].includes(token.type)){
                    expect(token.type);
                    token = peek();
                }
            }
            //TO DO
            //Probably get rid of the switch case altogether and just call parse_expr
            //Obviously excessive for final implementation
            switch(token.type){
                case "LPAREN":
                case "LBRACE":
                case "NUMBER":
                case "FLOAT":
                case "TRUE":
                case "FALSE":
                case "APOSTROPHE":
                case "QUOTE": 
                case "NONE":
                case "ABS":
                case "BIN":
                case "BOOL":
                case "CHR":
                case "FLOAT":
                case "HEX":
                case "LEN":
                case "OCT": 
                case "ORD":
                case "STR":
                case "INT":
                case "MAX":
                case "MIN":
                case "INPUT":
                case "PRINT":
                case "MATH":
                case "CEIL":
                case "FLOOR":
                case "SQRT": 
                case "COS": 
                case "SIN": 
                case "TAN": 
                case "PI": 
                case "E": 
                case "RANDOM":
                case "RANDINT":
                case "SEED":
                    parse_expr();
                    token = peek();
                    while(token.type === "COMMA"){//Used for potential tuple creation
                        expect("COMMA");
                        var token2 = peek();
                        if(token2.type !== "END_OF_LINE" && token2.type !== "SEMICOLON" && token2.type !== "END_OF_FILE"){
                            parse_expr();
                            token = peek();
                        }else{
                            token = peek();
                        }
                    }
                    break;
                case "INPUT": parse_input_stmt();
                    break;
                default: syntax_error("INVALID_RHS");
                    break;
            }
        }
    }else if(token.type === "END_OF_LINE" || token.type === "SEMICOLON"){ //end of assign stmt recursion expected
        //do nothing
    }else{
        syntax_error("INVALID_ASSIGNMENT");
    }
}

/* This function handles a few potential cases.
 * The two general cases are: 
 *   1. The occurence of multiiple value assignment statements
 *      i.   a,b,c,d = 1,2,3,4
 *      ii.  a,b[0],c = 1,2,3
 *      iii. a,b[0:2],c = 1, [0,1,2], 1
 *      iv.  a,b,c, = (1,2,3)
 *   2. The occurence of tuples not inside of an assignment statement.
 *      i.   a,
 *      ii.  a, b, c 
 *      iii. a + 4, b
 * Determining the general difference between the two is done by the occurence of an ASSIGN_EQUALS token,
 * which denotes a multiple value assignment statement, or the occurence of a token that is neither an
 * ASSIGN_EQUALS token nor a COMMA token, which denotes a possible tuple.
 * 
 * It is important to note that the runtime implementation is expected to determine the validity of the
 * righ hand side assignment. This is why there are no hard checks in the parsing to determine whether 
 * the same number of elements are on both sides.
 */
function parse_multi_val_assign_stmt(){
    var token = peek();
    var possTuple = true;
    var possAssign = true;
    
    //Look for an ending marker that indicates the termination of this statement
    while(!["END_OF_LINE", "END_OF_FILE", "SEMICOLON"].includes(token.type)){ 
        if(possAssign && possTuple){//The parsing could still result in a tuple or assignment statement
            if(token.type === "ID"){
                var token2 = peek_2_ahead();
                if(token2.type === "COMMA"){//Matched both patterns
                    expect("ID");
                    expect("COMMA");
                    token = peek();
                }else if(token2.type === "ASSIGN_EQUALS"){//Matches assignment statement, does not match tuple
                    expect("ID");
                    expect("ASSIGN_EQUALS");
                    possTuple = false;
                }else if(token2.type === "LBRACE"){//Possibly matches an array element
                    var tempInput = program;//Used in case we need to call parse_expr()
                    expect("ID");
                    expect("LBRACE");
                    parse_expr();//Validity should be handled by runtime implementation.
                    token2 = peek();
                    if(token2.type === "COLON"){//list[0:2]
                        expect("COLON");
                        parse_expr();//Validity should be handled by runtime implementation.
                    }
                    expect("RBRACE");
                    
                    token2 = peek();
                    if(token2.type === "COMMA"){//Matches both assignment statement and potential tuple
                        expect("COMMA");
                        token = peek();
                    }else if(token2.type === "ASSIGN_EQUALS"){//Matches assignment statement, does not match tuple
                        expect("ASSIGN_EQUALS");
                        possTuple = false;
                    }else{//Otherwise, a different token was received meaning it can't be an Assignment Statement, but could be a tuple
                        possAssign = false;
                        program = tempInput;//return to previously unparsed list[] declaration
                        token = peek();
                    }
                }else{//Otherwise, a different token was received meaning it can't be an Assignment Statement, but could be a tuple
                    possAssign = false;
                    token = peek();
                }
            }else if(token.type === "ASSIGN_EQUALS"){//Used in the case of: a,b,c, = 1,2,3
                expect("ASSIGN_EQUALS");
                possTuple = false;
            }
        }else{
            //Either an ASSIGN_EQUALS was reached, and now the right hand side it being parsed
            //or an assignment statement is no longer possible and we must parse the remainder of the tuple
            parse_expr();//validity should be handled by runtime
            token = peek();
            if(token.type === "COMMA"){
                expect("COMMA");
                token = peek();
            }
        }
    }
}

function parse_assign_op(){
    var token = peek();
    var op_assigns = ["ADD_ASSIGN", "SUB_ASSIGN", "MULT_ASSIGN", "DIV_ASSIGN", "MOD_ASSIGN"];
    if(op_assigns.includes(token.type)){
        switch(token.type){
            case "ADD_ASSIGN": expect("ADD_ASSIGN");
                break;
            case "SUB_ASSIGN": expect("SUB_ASSIGN");
                break;
            case "MULT_ASSIGN": expect("MULT_ASSIGN");
                break;
            case "DIV_ASSIGN": expect("DIV_ASSIGN");
                break;
            case "MOD_ASSIGN": expect("MOD_ASSIGN");
                break;
            default: syntax_error("INVALID_ASSIGN_OPERATOR");
                break;
        }
    }else{
            syntax_error("INVALID_ASSIGN_OPERATOR");
    }
}

function parse_primary(){
    var token = peek();
    //document.write("Token: " + token.type + " " + token.id + "<br>")
    var primaries = ["ID", "NUMBER", "FLOAT", "TRUE", "FALSE", "QUOTE", "APOSTROPHE", "NONE"];
    if(primaries.includes(token.type)){
        switch(token.type){
            case "ID": expect("ID");
                break;
            case "NUMBER": expect("NUMBER");
                break;
            case "FLOAT": expect("FLOAT");
                break;
            case "TRUE": expect("TRUE");
                break;
            case "FALSE": expect("FALSE");
                break;
            case "APOSTROPHE":
            case "QUOTE": 
                var isMulti = multi_str_comment_check();
                if(isMulti)
                    parse_multi_str_comment();
                else
                    parse_string();
                break;
            case "NONE": expect("NONE");
                break;
            default: 
                //document.write("Token: " + token.type + " " + token.id + "<br>")
                syntax_error("INVALID_PRIMARY");
                break;
        }
    }else{
        syntax_error("INVALID_PRIMARY");
    }
}


function multi_str_comment_check(){
    var token = peek();
    var isMulti = false;
    
    if(token.type === "QUOTE"){
        expect("QUOTE", true);
        token = getToken(program, false);
        if(token.type === "QUOTE"){
            expect("QUOTE", true);
            token = getToken(program, false);
            if(token.type === "QUOTE")
                isMulti = true;
            program = "\"" + program;
        }
        program = "\"" + program;
    }else if(token.type === "APOSTROPHE"){
        expect("APOSTROPHE", true);
        token = getToken(program, false);
        if(token.type === "APOSTROPHE"){
            expect("APOSTROPHE", true);
            token = getToken(program, false);
            if(token.type === "APOSTROPHE")
                isMulti = true;
            program = "\'" + program;
        }
        program = "\'" + program;
    }
    
    return isMulti;
}

//TO DO
function parse_string(){
    var token = peek();
    var lineNum = token.line_no;
    //document.write(token.type + "<br><br>");
    if(token.type === "QUOTE"){
        expect("QUOTE", true);
        token = peek();
        while(token.type !== "QUOTE" && token.type !== "END_OF_FILE"){
            //document.write(token.type + "<br><br>");
            expect(token.type, true);
            token = peek();
        }
        if(token.line_no !== lineNum){//The quotations should be on the same line
            //TO DO
            //INSERT SYNTAX ERROR
            syntax_error("");
        }
        expect("QUOTE");
    }else if(token.type === "APOSTROPHE"){
        expect("APOSTROPHE", true);
        token = peek();
        while(token.type !== "APOSTROPHE"){
            //document.write(token.type + "<br><br>");
            expect(token.type, true);
            token = peek();
        }
        if(token.line_no !== lineNum){//The quotations should be on the same line
            //TO DO
            //INSERT SYNTAX ERROR
            syntax_error("");
        }
        expect("APOSTROPHE");
    }
}

function parse_multi_str_comment(){
    var token = peek();
    if(token.type === "QUOTE"){
        //There's always a check to affirm that these quotes happened in sequence before this function's call,
        //otherwise the below could cause an error where spaces are skipped. Meaning instead of """ we get "" "
        //which are not equivalent
        expect("QUOTE", true);
        expect("QUOTE", true);
        expect("QUOTE", true);
        token = peek();
        
        while(token.type !== "QUOTE" && token.type !== "END_OF_FILE"){
            //document.write(token.type + "<br><br>");
            expect(token.type, true);
            token = peek();
        }
        
        expect("QUOTE", true);
        token = getToken(program,false);
        if(token.type === "QUOTE"){
            expect("QUOTE", true);
            token = getToken(program, false);
            if(token.type === "QUOTE"){
                expect("QUOTE");
            }else{
                //TO DO
                //INSERT SYNTAX ERROR
                //EOF while scanning triple-quoted string literal
                syntax_error("");
            }
        }else{
            //TO DO
            //INSERT SYNTAX ERROR
            //EOF while scanning triple-quoted string literal
            syntax_error("");
        }
    }else if(token.type === "APOSTROPHE"){
        //There's always a check to affirm that these apostrophes happened in sequence before this function's call,
        //otherwise the below could cause an error where spaces are skipped. Meaning instead of """ we get "" "
        //which are not equivalent
        expect("APOSTROPHE", true);
        expect("APOSTROPHE", true);
        expect("APOSTROPHE", true);
        token = peek();
        
        while(token.type !== "APOSTROPHE" && token.type !== "END_OF_FILE"){
            //document.write(token.type + "<br><br>");
            expect(token.type, true);
            token = peek();
        }
        
        expect("APOSTROPHE", true);
        token = getToken(program,false);
        if(token.type === "APOSTROPHE"){
            expect("APOSTROPHE", true);
            token = getToken(program, false);
            if(token.type === "APOSTROPHE"){
                expect("APOSTROPHE");
            }else{
                //TO DO
                //INSERT SYNTAX ERROR
                //EOF while scanning triple-quoted string literal
                syntax_error("");
            }
        }else{
            //TO DO
            //INSERT SYNTAX ERROR
            //EOF while scanning triple-quoted string literal
            syntax_error("");
        }
    }
}

//TO DO
//Create for list declaration 
function parse_list(){
    var token = peek();
    if(token.type === "LBRACE"){//Start of a list
        expect("LBRACE");
        token = peek();
        if(token.type === "RBRACE"){//base case, variable = []
            expect("RBRACE");
        }else if(token.type === "COMMA"){// Invalid syntax, list = [,...] is not allowed
            syntax_error("");//INSERT SYNTAX ERROR
        }else{//variable = [...]
            parse_list_content();
            expect("RBRACE");
        }
    }
}

function parse_list_content(){
    var token = peek();
    if(token.type === "LBRACE"){
        parse_list();
        token = peek();
        if(token.type === "COMMA"){
            expect("COMMA");
            token = peek();
            if(token.type === "RBRACE"){
                //do nothing, returns to initial call
            }else if(token.type === "COMMA"){//Invalid syntax/excessive commas. list = [1,2,[],,]
                syntax_error("");//INSERT SYNTAX ERROR
            }else{
                parse_list_content();
            }
        }
    }else{
        parse_expr();
        token = peek();
        if(token.type === "COMMA"){
            expect("COMMA");
            token = peek();
            if(token.type === "RBRACE"){
                //do nothing, returns to initial call
            }else if(token.type === "COMMA"){//Invalid syntax/excessive commas. list = [1,2,3,,]
                syntax_error("");//INSERT SYNTAX ERROR
            }else{
                parse_list_content();
            }
        }
    }
}

//Does not account for the creation of a tuple when not using parentheses in the assignment statement
//i.e. name = "Bob", "John", "Brown"; is valid
function parse_tuple(){
    var token = peek();
    if(token.type === "LPAREN"){//Start of a tuple
        expect("LPAREN");
        token = peek();
        if(token.type === "RPAREN"){//base case, variable = ()
            expect("RPAREN");
        }else if(token.type === "COMMA"){// Invalid syntax, list = (,...) is not allowed
            syntax_error("");//INSERT SYNTAX ERROR
        }else{//variable = (...)
            parse_tuple_content();
            expect("RPAREN");
        }
    }
}

function parse_tuple_content(){
    var token = peek();
    if(token.type === "LPAREN"){
        parse_tuple();
        token = peek();
        //There could be an operator/expression that occurs after the use of parenthesis 
        var multi_operations = ["PLUS", "MINUS", "INCREMENT", "DECREMENT"];
        var operations = ["MULT", "DIV", "MOD", "EXPONENTIAL", "IN", "NOTIN", "IS", "ISNOT"];
        
        //Handles instances of operators that can appear in succession such as ++--+-+-+-+5
        if(multi_operations.includes(token.type)){
            while(multi_operations.includes(token.type)){
                expect(token.type);
                token = peek();
            }
            parse_expr();
        }else if(operations.includes(token.type)){
            parse_op();
            parse_expr();
        }
        
        token = peek();
        if(token.type === "COMMA"){
            expect("COMMA");
            token = peek();
            if(token.type === "RPAREN"){
                //do nothing, returns to initial call
            }else if(token.type === "COMMA"){//Invalid syntax/excessive commas. list = (1,2,[],,)
                syntax_error("");//INSERT SYNTAX ERROR
            }else{
                parse_tuple_content();
            }
        }
    }else{
        //There could be an operator/expression that occurs after the use of parenthesis 
        var multi_operations = ["PLUS", "MINUS", "INCREMENT", "DECREMENT"];

        //Handles instances of operators that can appear in succession such as ++--+-+-+-+5
        if(multi_operations.includes(token.type)){
            while(multi_operations.includes(token.type)){
                expect(token.type);
                token = peek();
            }
        }
        parse_expr();
        token = peek();
        if(token.type === "COMMA"){
            expect("COMMA");
            token = peek();
            if(token.type === "RPAREN"){
                //do nothing, returns to initial call
            }else if(token.type === "COMMA"){//Invalid syntax/excessive commas. list = (1,2,3,,)
                syntax_error("");//INSERT SYNTAX ERROR
            }else{
                parse_tuple_content();
            }
        }
        //else do nothing
        //Covers an expression being used inside parenthesis, but a tuple not being created.
        
    }
}

function parse_dictionary(){
    expect("LBRACKET");
    var token = peek();
    if(token.type === "RBRACKET"){//Base Case {}, empty dictionary
        expect("RBRACKET");
    }else{
        parse_dictionary_content();
        expect("RBRACKET");
    }
}

//TO DO
//Consider String implementation
function parse_dictionary_content(){
    var token = peek();
    var valid_types = ["NUMBER", "FLOAT", "ID", "LPAREN", "TRUE", "FALSE", "APOSTROPHE", "QUOTE"];
    if(valid_types.includes(token.type)){//TO DO: This will have to account for potentially invalid variables/tuples when runtime is incorporated.
        parse_expr();
        token = peek();
        if(token.type === "COLON"){
            expect("COLON");
            parse_expr();
            if(token.type === "COMMA"){
                expect("COMMA");
                parse_dictionary_content();
            }//else return to expect RBRACKET
        }else{
            syntax_error("");//INSERT SYNTAX ERROR
        }
    }else{
        syntax_error("");//INSERT SYNTAX ERROR
    }
}

//TO DO
function parse_set(){
    
}

//TO DO
//Address how to incorporate function calls on Strings.
//Consider future implementations of calling functions on other objects, consider slight redesign.
function parse_expr(){
    var token = peek();
    if(token.type === "ID"){
        expect("ID");
        var token2 = peek();
        if(token2.type === "PERIOD"){//Used in case of a function, in this case we only have the format function
            token2 = peek_2_ahead();
            if(token2.type === "FORMAT"){ //In case of print(a.format())
                program = ungetToken(program, token);
                parse_format_function();
            }else{
                //Currently no other functions supported
                //So throw error
                syntax_error("NON_FORMAT_ERROR");
            }
        }else if(token2.type === "LBRACE"){//list2 = list[0]
            expect("LBRACE");
            parse_expr();//Validity should be handled by runtime implementation.
            token2 = peek();
            if(token2.type === "COLON"){//list3 = list[0:2]
                expect("COLON");
                parse_expr();//Validity should be handled by runtime implementation.
            }
            expect("RBRACE");
        }
        //otherwise just parse the ID primary and continue parsing potential expression
    }else if(token.type === "APOSTROPHE" || token.type === "QUOTE"){
        var string_content = program;
        var isMulti = multi_str_comment_check();//
        if(isMulti)
            parse_multi_str_comment();
        else
            parse_string();
        string_content = string_content.substring(0,string_content.indexOf(program));
        //document.write("String content:" +string_content + "<br>");
        
        var token2 = peek();
        if(token2.type === "PERIOD"){//Used in case of a function, in this case we only have the format function
            token2 = peek_2_ahead();
            if(token2.type === "FORMAT"){ //In case of print("a".format())
                program = string_content + program;
                parse_format_function();
            }else{
                //Currently no other functions supported
                //So throw error
                syntax_error("NON_FORMAT_ERROR");
            }
        }
    }else if(token.type === "LBRACE"){
        parse_list();
    }else if(token.type === "LPAREN"){
        parse_tuple();
    }else if(token.type === "LBRACKET"){
        //TO DO
        //Check how to distinguish between dictionary and set implementations after parse_set has been incorporated.
        parse_dictionary();
    }else if (token.type === "MATH"){
        parse_math_lib_function();
    }else if (token.type === "RANDOM"){
        parse_random_lib_function();
    }else if(libFunctions.includes(token.type)){
        switch(token.type){
            case "ABS": parse_abs_function();
                break;
            case "BIN": parse_bin_function();
                break;
            case "BOOL": parse_bool_function();
                break;
            case "CHR": parse_chr_function();
                break;
            case "FLOAT": 
                if(token.id === "float"){
                    parse_float_function();
                }else{
                    parse_primary();
                }
                break;
            case "HEX": parse_hex_function();
                break;
            case "LEN": parse_len_function();
                break;
            case "OCT": parse_oct_function();
                break;
            case "ORD": parse_ord_function();
                break;
            case "STR": parse_str_function();
                break;
            case "INT": parse_int_function();
                break;
            case "MAX": parse_max_function();
                break;
            case "MIN": parse_min_function();
                break;
            case "INPUT": parse_input_stmt();
                break;
            case "PRINT": parse_print_stmt();
                break;
            case "CEIL": parse_ceil_function();
                break;
            case "FLOOR": parse_floor_function();
                break;
            case "SQRT": parse_sqrt_function();
                break;
            case "COS": parse_cos_function();
                break;
            case "SIN": parse_sin_function();
                break;
            case "TAN": parse_tan_function();
                break;
            case "PI": parse_pi_constant();
                break;
            case "E": parse_e_constant();
                break;
            case "RANDOM": parse_random_function();
                break;
            case "RANDINT": parse_randint_function();
                break;
            case "SEED": parse_seed_function();
                break;
            //INSERT SYNTAX ERROR
            default: syntax_error("");
                break;
        }
    }else{
        parse_primary();
    }
    
    token = peek();
    var multi_operations = ["PLUS", "MINUS", "INCREMENT", "DECREMENT"];
    var operations = ["MULT", "DIV", "MOD", "EXPONENTIAL", "IN", "NOTIN", "IS", "ISNOT"];
    var compare_ops = ["COMPARE_EQUALS", "NOT_EQUAL", "LESS_THAN", "LESS_THAN_EQUAL", "GREATER_THAN", "GREATER_THAN_EQUAL"];
    
    //Handles instances of operators that can appear in succession such as ++--+-+-+-+5
    if(multi_operations.includes(token.type)){
        while(multi_operations.includes(token.type)){
            expect(token.type);
            token = peek();
        }
        parse_expr();
    }else if(operations.includes(token.type)){
        parse_op();
        parse_expr();
    }else if(compare_ops.includes(token.type)){
        parse_comparison_operator();
        parse_expr();
    }/*else if(token.type === "COMMA"){
        //TO DO
        //COULD HAVE ADVERSE SIDE EFFECTS...
        //This WILL have adverse side effects due to functions using parse_expr() for argument values
        //Adding this would cause multiple arguments to potentially read when they shouldn't be
        //This would not be a useful solution, maybe a reimplementation of parse_multi_val() would
        //assist this endeavor to add tuple functionality outside of assignment statements.
        expect()
    }*///else do nothing
}

function parse_op(){
    var token = peek();
    switch(token.type){
        case "PLUS": expect("PLUS");
            break;
        case "MINUS": expect("MINUS");
            break;
        case "MULT": expect("MULT");
            break;
        case "DIV": expect("DIV");
            break;
        case "MOD": expect("MOD");
            break;
        case "EXPONENTIAL": expect("EXPONENTIAL");
            break;
        case "IN": expect("IN");
            break;
        case "NOTIN": expect("NOTIN");
            break;
        case "IS": expect("IS");
            break;
        case "ISNOT": expect("ISNOT");
            break;
        default: syntax_error("INVALID_OPERATOR");
            break;
    }
}

//TO DO
//Potentially have to account for more functionality
function parse_format_function(){
    var token = peek();
    var token2;
    var string_content;
    var type = "";
    var parameterCount = 0;//will be useful when grabbing the value stored inside a {} paring
    var nameFmtUsed = false;
    var namedParameters = [];
    
    if(token.type === "APOSTROPHE" || token.type === "QUOTE" || token.type === "ID"){
        if(token.type === "ID"){
            expect("ID");
        }else{
            //Getting the content of the string that the function is being called on
            type = token.type;
            string_content = program;
            var isMulti = multi_str_comment_check();
            if(isMulti)
                parse_multi_str_comment();
            else
                parse_string();
            string_content = string_content.substring(1, string_content.indexOf(program)-1);
        }        
        expect("PERIOD");
        //need to add format to keywords (alternatively a different array) in order to get the token.
        //That, or add a token equal to peek() and use an if statement to check that the token.id equals format
        //then do expect() using the token that was set.
        expect("FORMAT");
        expect("LPAREN");
        token = peek();
        if(token.type === "RPAREN"){
            expect("RPAREN");
        }else{
            while(token.type !== "RPAREN"){
                token = peek();
                token2 = peek_2_ahead();
                if(!nameFmtUsed){//named parameters have not occured yet, meaning primaries and expressions can be used as well
                     if(token.type === "ID" && token2.type === "ASSIGN_EQUALS"){//asd.format(a=5)
                        nameFmtUsed = true;
                        expect("ID");
                        expect("ASSIGN_EQUALS");
                        parse_expr();
                        namedParameters.push(token.id);

                        token = peek();//potentially set token to RPAREN and exit while loop
                        if(token.type === "COMMA"){//asd.format(a=5, ...)
                            expect("COMMA");
                            token = peek();//potentially set token to RPAREN and exit while loop
                            if(token.type === "RPAREN"){//asd.format(a=5,)
                                expect("RPAREN");
                            }
                        }else{
                            if(token.type === "RPAREN"){//asd.format(a=5)
                                expect("RPAREN");
                            }else{
                                syntax_error("ERROR_MISSING_RIGHT_PARENTHESIS");
                            }
                        }
                    }else{//asd.format(primary/expression, ...)
                        parse_expr();
                        parameterCount++;
                        token = peek();
                        if(token.type === "COMMA"){//asd.format(primary/expression, ...)
                            expect("COMMA");
                            token = peek();//potentially set token to RPAREN and exit while loop
                            if(token.type === "RPAREN"){//asd.format(primary/expression, ... , primary/expression,)
                                expect("RPAREN");
                            }
                        }else{
                            if(token.type === "RPAREN"){ //asd.format(primary/expression, ... , primary/expression)
                                expect("RPAREN");
                            }else{
                                syntax_error("ERROR_MISSING_RIGHT_PARENTHESIS");
                            }
                        }
                    }
                }else{//Only named paramters can appear after they've been used once
                    if(token.type === "ID" && token2.type === "ASSIGN_EQUALS"){ //asd.format(..., a=5, b=6, variable=...)
                        expect("ID");
                        expect("ASSIGN_EQUALS");
                        parse_expr();
                        namedParameters.push(token.id);
                        token = peek();//potentially set token to RPAREN and exit while loop
                        if(token.type === "COMMA"){//asd.format(a=5, b=6, ...)
                            expect("COMMA");
                            token = peek();//potentially set token to RPAREN and exit while loop
                            if(token.type === "RPAREN"){//asd.format(a=5, b=6, ... , z=10,)
                                expect("RPAREN");
                            }
                        }else{
                            if(token.type === "RPAREN"){//asd.format(a=5, b=6, ... , z=10)
                                expect("RPAREN");
                            }else{
                                syntax_error("ERROR_MISSING_RIGHT_PARENTHESIS");
                            }
                        }
                    }else{//There was a violation as only the named format can be used now.
                        syntax_error("ERROR_FORMAT_VIOLATION");
                        break;
                    }
                }
            }
        }
    }
    //syntax is correct, check other constraints for "somestring".format(...)
    if(type === "APOSTROPHE" || type === "QUOTE"){
        //TO DO
        if(string_content.includes("{") || string_content.includes("}")){
            validate_format_string(string_content, parameterCount, namedParameters);
            
        }else{
            //the string has no brackets, meaning there can be no syntax issues caused by different formats
        }
    }
}

function validate_format_string(str, paraCount, namedPara){
    var countValue = 0;
    var autoPairValues = 0;
    var manPairValues = [];
    var namedPairValues = [];
    var value = "";
    var autoFmt = false;
    var manFmt = false;

    for(var i = 0; i < str.length; i++){
        if(countValue === 0){
            if(str[i] === "{"){
                countValue++;
            }else if(str[i] === "}"){
                countValue--;
            }else{
                //else just read charcters in the string that are not bounded by brackets
            }
        }else if(countValue === 1){
            if(str[i] === "{"){
                if(value === ""){
                    countValue--;
                }else{
                    //Unexpected '{' in field name
                    syntax_error("");//INSERT SYNTAX ERROR
                }
            }else if(str[i] === "}"){
                if(value === ""){
                    if(manFmt){
                        //ValueError: cannot switch from manual field specification to automatic field numbering
                        syntax_error(""); //INSERT SYNTAX ERROR
                    }else{
                        autoFmt = true;
                        autoPairValues++;
                        value = "";
                        countValue--;
                    }
                }else if(/^\d+$/.test(value)){
                    if(autoFmt){
                        //ValueError: cannot switch from automatic field numbering to manual field specification
                        syntax_error(""); //INSERT SYNTAX ERROR
                    }else{
                        manFmt = true;
                        manPairValues.push(value);
                        value = "";
                        countValue--;
                    }
                }else{
                    namedPairValues.push(value);
                    value = "";
                    countValue--;
                }
            }else{
                value += str[i];
            }
        }else if(countValue === -1){
            if(str[i] === "}"){
                countValue++;
            }else{
                //Single '}' encountered in format string
                syntax_error("");//INSERT SYNTAX ERROR
            }
        }
    }
    
    //countValue should be 0 after going through the entire string, otherwise there was an error
    //where a either bracket appeared as the last character of the string. That, or the '{' bracket
    //appeared only once in the string and there was no closing '}' bracket.
    if(countValue === 1){
        //Single '{' encountered in format string
        syntax_error("");//INSERT SYNTAX ERROR
    }else if(countValue === -1){
        //Single '}' encountered in format string
        syntax_error("");//INSERT SYNTAX ERROR
    }else{
        if(autoFmt && !manFmt){
            automatic_format(autoPairValues, paraCount);
            named_format(namedPairValues, namedPara);
        }else if(manFmt && !autoFmt){
            manual_format(manPairValues, paraCount);
            named_format(namedPairValues, namedPara);
        }else if(!autoFmt && !manFmt){
            named_format(namedPairValues, namedPara);
        }
    }
}

function automatic_format(potentialPairs, paraCount){
    var validIndices = true;
    // true: "string values {}{}{}{namedParameter}".format(1,2,3,namedParameter = "i")"
    // false: "string values {}{}{}{}".format(1,2,3,namedParameter = "i")"
    if(potentialPairs.length >= paraCount){
        validIndices = false;
    }
    
    if(!validIndices){
        //IndexError: tuple index out of range
        syntax_error("");//INSERT SYNTAX ERROR
    }
    
}

function manual_format(potentialPairs, paraCount){
    var validIndices = true;
    
    for(var i = 0; i < potentialPairs.length; i++){
        // true: "string values {0}{1}{2}{namedParameter}".format(1,2,3,namedParameter = "i")"
        // false: "string values {0}{1}{2}{3}".format(1,2,3,namedParameter = "i")
        if(parseInt(potentialPairs[i]) >= paraCount){
            validIndices = false;
        } 
    }
    
    if(!validIndices){
        //IndexError: tuple index out of range
        syntax_error("");//INSERT SYNTAX ERROR
    }

}

function named_format(potentialPairs, namedPara){
    var validParaNames = true;
    var keyError = "";
    
    for(var i = 0; i < potentialPairs.length; i++){
        if(!namedPara.includes(potentialPairs[i])){
            validParaNames = false;
            keyError = potentialPairs[i];
        }
    }
    
    if(!validParaNames){
        //Key Error: 'keyError'
        syntax_error("");//INSERT SYNTAX ERROR
    }

}

function parse_comment(){
    expect("HASH_TAG");
    var token = peek();
    while(token.type !== "END_OF_LINE" && token.type !== "END_OF_FILE"){
        expect(token.type);
        token = peek();
    }
}

//Built-in Functions
//TO DO
//Will we have to worry about the typing of functions, modules, etc. ?
function parse_input_stmt(){
    expect("INPUT");
    expect("LPAREN");
    var token = peek();
    if(token.type === "RPAREN"){
        expect("RPAREN");
    }else{
        parse_expr();
        expect("RPAREN");
    }
}

//TO DO
//Account for the inclusion of functions in the list of possible tokens read
function parse_print_stmt(){
    expect("PRINT");
    expect("LPAREN");
    var token = peek();
    switch(token.type){
        case "RPAREN": expect("RPAREN");
            break;
        case "ID":
        case "NUMBER":
        case "FLOAT":
        case "TRUE":
        case "FALSE":
        case "LPAREN":
        case "LBRACKET": 
        case "LBRACE": 
        case "APOSTROPHE": 
        case "QUOTE":
            parse_print_multi_val();
            token = peek();
            if(token.type === "RPAREN"){//TO DO: Can reduce this to just use expect("RPAREN"), instead of this if statement
                expect("RPAREN");
            }else{
                syntax_error("ERROR_MISSING_RIGHT_PARENTHESIS");
            }
            break;
    }
}

//TO DO
//Need to address implementation for String type eventually.
//Currently this will account for every way to print with single input, or multiple inputs for the print function
function parse_print_multi_val(){
    var token = peek();
    var valid_types = ["ID", "NUMBER", "FLOAT", "TRUE", "FALSE", "LPAREN", "LBRACKET", "LBRACE", "APOSTROPHE", "QUOTE"];
    if(valid_types.includes(token.type)){
        parse_expr();
        var token = peek();
        if(token.type === "COMMA"){
            expect("COMMA");
            parse_print_multi_val();
        }
    }
}

function parse_abs_function(){
    expect("ABS");
    expect("LPAREN");
    parse_expr();
    expect("RPAREN");
}

function parse_bin_function(){
    expect("BIN");
    expect("LPAREN");
    parse_expr();
    expect("RPAREN");
}

function parse_bool_function(){
    expect("BOOL");
    expect("LPAREN");
    
    var token = peek();
    if(token.type !== "RPAREN"){
        parse_expr();
        expect("RPAREN");
    } else {
        expect("RPAREN");
    }
}

function parse_chr_function(){
    expect("CHR");
    expect("LPAREN");
    parse_expr();
    expect("RPAREN");
}

function parse_float_function(){
    expect("FLOAT");
    expect("LPAREN");
    var token = peek();
    if(token.type !== "RPAREN"){
        parse_expr();
        expect("RPAREN");
    } else {
        expect("RPAREN");
    }
}

function parse_hex_function(){
    expect("HEX");
    expect("LPAREN");
    parse_expr();
    expect("RPAREN");
}

function parse_len_function(){
    expect("LEN");
    expect("LPAREN");
    parse_expr();
    expect("RPAREN");
}

function parse_oct_function(){
    expect("OCT");
    expect("LPAREN");
    parse_expr();
    expect("RPAREN");
}

function parse_ord_function(){
    expect("ORD");
    expect("LPAREN");
    parse_expr();
    expect("RPAREN");
}

function parse_str_function(){
    expect("STR");
    expect("LPAREN");
    var token = peek();
    if(token.type !== "RPAREN"){
        parse_expr();
        expect("RPAREN");
    } else {
        expect("RPAREN");
    }
}


function parse_int_function(){
    expect("INT");
    expect("LPAREN");
    var token = peek();
    
    if(token.type !== "RPAREN"){
        parse_expr();
        token = peek();
        if(token.type === "COMMA"){
            expect("COMMA");
            parse_expr();
        }
    }
    expect("RPAREN");
}

function parse_max_function(){
    expect("MAX");
    expect("LPAREN");
    parse_expr();
    expect("COMMA");
    parse_expr();
    var token = peek();
    
    while(token.type !== "RPAREN" && token.type !== "END_OF_FILE"){
        expect("COMMA");
        parse_expr();
        token = peek();
    }
    expect("RPAREN");
}

function parse_min_function(){
    expect("MIN");
    expect("LPAREN");
    parse_expr();
    expect("COMMA");
    parse_expr();
    var token = peek();
    
    while(token.type !== "RPAREN" && token.type !== "END_OF_FILE"){
        expect("COMMA");
        parse_expr();
        token = peek();
    }
    expect("RPAREN");
}

function parse_type_function(){
    expect("TYPE");
    expect("LPAREN");
    var token = peek();
    if(token.type === "RPAREN"){
        //INSERT TYPE ERROR
        //Type takes 1 argument (we are not covering the 3 arguments case)
        syntax_error("");
    }else{
        parse_expr();
        expect("RPAREN");
    }
}

function parse_round_function(){
    expect("ROUND");
    expect("LPAREN");
    parse_expr();
    var token = peek();
    if(token.type === "COMMA"){
        expect("COMMA");
        token = peek();
        if(token.type !== "RPAREN"){
            parse_expr();
        }
    }
    expect("RPAREN");
}

//Math Library functions
function parse_math_lib_function(){
    expect("MATH");
    expect("PERIOD");
    var token = peek();
    var math_functions = ["CEIL", "FLOOR", "SQRT", "COS", "SIN", "TAN", "PI", "E"];
    //TO DO
    //Incorporate in a better manner, this should be more for testing
    
    if(math_functions.includes(token.type) || token.type === "ID"){
        switch(token.type){
            case "CEIL": parse_ceil_function();
                break;
            case "FLOOR": parse_floor_function();
                break;
            case "SQRT": parse_sqrt_function();
                break;
            case "COS": parse_cos_function();
                break;
            case "SIN": parse_sin_function();
                break;
            case "TAN": parse_tan_function();
                break;
            /*case "PI": parse_pi_constant();
                break;
            case "E": parse_e_constant();
                break;
            */
            case "ID":
                if(token.id === "pi"){
                    parse_pi_constant();
                }else if(token.id === "e"){
                    parse_e_constant();
                }
                else{
                    //INSERT SYNTAX ERROR
                    syntax_error();
                }
                break;
            //INSERT SYNTAX ERROR
            default: syntax_error("");
                break;
        }
    }else{
        //INSERT SYNTAX ERROR
        syntax_error("");
    }
}
function parse_ceil_function(){
    expect("CEIL");
    expect("LPAREN");
    var token = peek();
    parse_expr();
    token = peek();
    if(token.type === "COMMA"){
        expect("COMMA");
    }
    expect("RPAREN");
}
function parse_floor_function(){
    expect("FLOOR");
    expect("LPAREN");
    var token = peek();
    parse_expr();
    token = peek();
    if(token.type === "COMMA"){
        expect("COMMA");
    }
    expect("RPAREN");
}
function parse_sqrt_function(){
    expect("SQRT");
    expect("LPAREN");
    var token = peek();
    parse_expr();
    token = peek();
    if(token.type === "COMMA"){
        expect("COMMA");
    }
    expect("RPAREN");
}
function parse_cos_function(){
    expect("COS");
    expect("LPAREN");
    var token = peek();
    parse_expr();
    token = peek();
    if(token.type === "COMMA"){
        expect("COMMA");
    }
    expect("RPAREN");
}
function parse_sin_function(){
    expect("SIN");
    expect("LPAREN");
    var token = peek();
    parse_expr();
    token = peek();
    if(token.type === "COMMA"){
        expect("COMMA");
    }
    expect("RPAREN");
}
function parse_tan_function(){
    expect("TAN");
    expect("LPAREN");
    var token = peek();
    parse_expr();
    token = peek();
    if(token.type === "COMMA"){
        expect("COMMA");
    }
    expect("RPAREN");
}
function parse_pi_constant(){
    //TO DO
    //fix after inclusion of pi
    //expect("PI");
    expect("ID");
}
function parse_e_constant(){
    //TO DO
    //fix after inclusion of e
    //expect("E");
    expect("ID");
}

//Random Library functions
function parse_random_lib_function(){
    var token = peek();
    var token2 = peek2_ahead();
    if(token.type === "RANDOM" && token2.type === "PERIOD"){
        expect("RANDOM");
        expect("PERIOD");
        token = peek();
        switch(token){
            case "RANDOM": parse_random_function();
                break;
            case "RANDINT": parse_randint_function();
                break;
            case "SEED": parse_seed_function();
                break;
            //INSERT SYNTAX ERROR
            default: syntax_error("");
                break;
        }
    }else if(token.type === "RANDOM" && token2.type === "LPAREN"){
        parse_random_function();
    }else{
        //INSERT SYNTAX ERROR
        syntax_error("");
    }
}
function parse_random_function(){
    expect("RANDOM");
    expect("LPAREN");
    expect("RPAREN");
}

function parse_seed_function(){
    expect("SEED");
    expect("LPAREN");
    var token = peek();
    
    if(token.type !== "RPAREN"){
        parse_expr();
        token = peek();
        
        if(token.type !== "RPAREN"){//Two Arguments
            expect("COMMA");
            parse_expr();
            expect("RPAREN");
        } else {//Single Arugment
            expect("RPAREN");
        }
        expect("RPAREN");
    } else {//No Arguments
        expect("RPAREN");
    }
}

function parse_randint_function(){
    expect("RANDINT");
    expect("LPAREN");
    parse_expr();
    expect("COMMA");
    parse_expr();
    expect("RPAREN");
}

function syntax_error(errorType){
    //document.write("<br>" + program + "<br>");
    if(testingResult){
        testingResult = false;
        program = "";
        
        if (errorType === "UNKNOWN_SYMBOL"){
            errorResult = "Program contains unknown symbols!";
            //exit();
        }else if (errorType === "INVALID_STATEMENT"){
            errorResult = "Invalid statement!";
            //exit();
        }else if (errorType === "INDENTATION_ERROR"){
            errorResult = "Indentation error detected!";
            //exit();
        }else if (errorType === "INVALID_COND_OPERATOR"){
            errorResult = "Invalid conditional operator!";
            //exit();
        }else if (errorType === "INVALID_COMP_OPERATOR"){
            errorResult = "Invalid comparison operator!";
            //exit();
        }else if (errorType === "INVALID_LINK"){
            errorResult = "Invalid comparison link!";
            //exit();
        }else if (errorType === "INVALID_RANGE"){
            errorResult = "Invalid ranged specified!";
            //exit();
        }else if (errorType === "INVALID_RHS"){
            errorResult = "Invalid right-hand side value/variable";
            //exit();
        }else if (errorType === "INVALID_ASSIGNMENT"){
            errorResult = "Invalid assignment operation!";
            //exit();
        }else if (errorType === "INVALID_ASSIGN_OPERATOR"){
            errorResult = "Invalid assignment operator!";
            //exit();
        }else if (errorType === "INVALID_PRIMARY"){
            errorResult = "Invalid primary type!";
            //exit();
        }else if (errorType === "NON_FORMAT_ERROR"){
            errorResult = "Only format() allowed!";
            //exit();
        }else if (errorType === "INVALID_OPERATOR"){
            errorResult = "Invalid arithmetic operator!";
            //exit();
        }else if (errorType === "ERROR_MISSING_RIGHT_PARENTHESIS"){
            errorResult = "Expecting right parenthesis!";
            //exit();
        }else if (errorType === "ERROR_FORMAT_VIOLATION"){
            errorResult = "format() violation detected!";
            //exit();
        }else if (errorType === "INVALID_INPUT"){
            errorResult = "Invalid input!";
            //exit();
        }else{
            //document.write("Unspecified Error<br>");
            errorResult = "Unspecified Error";
            //exit();
        }
    }
    
}