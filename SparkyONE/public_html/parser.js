//added INPUT in bgnTokens for testing purposes for now
var bgnTokens = ["IMPORT", "IF", "FOR", "WHILE", "ID", "PRINT", "INPUT", "HASH_TAG"];
var program = "";
var indent_stack = [];

//print parsing error
function error_expected_not_matching(expected, received, line_no){
    document.write("Expected Token: " + expected + "<br>Received Token: " + received + "<br>At line " + line_no + "<br>");
}

//used to remove unwanted spaces
function skipSpaces(){
    var token = getToken(program, false);
    if(token.type === "SPACE"){
        program = program.slice(token.length);
        //token = getToken(program);
        //document.write("Next Token: " + token.id + "<br>");
    }
    //else do nothing
}

// Checks current token with indent_stack for dedent and unexpected indentation
function check_indents(){
    var token = getToken(program, false);
    if(indent_stack.length !== 1){
        var current = indent_stack.pop();
        if(token.length > current){
            //unexpected indent
            indent_stack = [];
            indent_stack.push(0);
            //document.write("index syntax error at line " + token.line_no + "<br>Current: " + current + " TabLength: " + token.length + "<br>");
            syntax_error("INDENTATION_ERROR");
        }else if(token.length < current){
            //posible dedent
            //document.write("Popping: " + current + "<br>");
            //document.write(indent_stack.toString() + "<br>");
            check_indents();
        }else if(token.length === current){
            //matching indent
            program = program.slice(token.length);
            indent_stack.push(current);
        }
    }else{
        if(token.type === "SPACE"){
            syntax_error("INDENTATION_ERROR");
        }
    }
}

function increase_indent(){
    var token = getToken(program, false);
    if(token.type === "SPACE"){
        current = indent_stack.pop();
        if(current === token.length){
            indent_stack.push(current);
        }else{
            indent_stack.push(current);
            indent_stack.push(token.length);
            //document.write("Token: " + token.type + " adding " + token.length + " to stack at line " + token.line_no + "<br>");
        }
    }
}

//TO DO
//Consider using saveSpaces as a way to help with the potential danger of peek_2_ahead
//used to save potentially useful spaces
function saveSpaces(){
    var token = getToken(program, false);
    if(token.type === "SPACE"){
        return token.length;
    }
}

function returnHeldSpaces(spaces){
    allSpaces = "";
    for(x = 0; x < spaces; x++)
        allSpaces += " ";
    program = allSpaces + program;
}

//reads & returns next token, ignoring spaces
function peek(){
    skipSpaces();
    var token = getToken(program, false);
    return token;
}

//use very carefully because if the first token peeked is a line break, skip spaces when peeking a second time might alter indents
function peek_2_ahead(){ //necessary for a few location is parser
    skipSpaces();
    var token = getToken(program, false);
    program = program.slice(token.length);
    var returnToken = peek();
    program = token.id + " " + program; //return skipped token & arbitrary space skipped by peek
    return returnToken;
}

 //reads next token, throws an error if they don't match
 // & splices token from input, ignoring spaces
function expect(tokenType){
    skipSpaces();
    var token = getToken(program, true);
    if(token.type === tokenType){
        program = program.slice(token.length);
        if(token.type === "END_OF_LINE"){
            incrementCodeLine();
            readEmptyLines();
            //check correct indents (stack issue)
            //check_indents();
        }
        document.write(token.type + " " + token.id +  " read at line " + token.line_no + "<br>"); //comment this out when not trouble shooting
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
        if(token2.type === "END_OF_LINE"){ //if next is line break, its ok
            readEmptyLines();
        }else{ //some keyword was read & the spaces could be indent that need to be read
            if(token.type === "SPACE"){
                for(i = 0; i < token.length; i++){
                    program = " " + program;
                }
                //increase_indent();
            }else{
                program = token.id + "" + program; //add spliced id back to front of program
            }
        }
    }else if(token.type === "END_OF_LINE"){
        program = program.slice(token.length);
        incrementCodeLine();
        readEmptyLines();
    }
}

function parse_begin_program(input){
    
    //TEST
    /*alert("THIS IS AN ALERT");
    exit();*/
    
    program = input;
    indent_stack.push(0);
    var token = peek();
    if(token.type === "END_OF_LINE")
        expect("END_OF_LINE"); //this will precede to read all empty lines
    token = peek();
    if(bgnTokens.includes(token.type)){
        //TO DO
        //address the unnecessary if statement below as it should just be included in parse_program
        if(token.type === "IMPORT")
            parse_import_list();
        var token = peek(); //if above if doesn't run this just peeks the same token
        if(token.type !== "END_OF_FILE")
            parse_program(); //this will run on any non-empty program
        expect("END_OF_FILE");
    }else if(token.type === "END_OF_FILE"){
        //nothing to parse
    }else{
        syntax_error("UNKNOWN_SYMBOL");
    }
    
}

//TO DO
//Update other functions to include import as a possibility
//See if this function is even truly necessary, as it does not seem to be
function parse_import_list(){
    parse_import_stmt();
    var token = peek();
    if(token.type === "IMPORT"){
        parse_import_list();
    }
}

//TO DO
//Update other functions to include import as a possibility
//Also update this function as some of it may be unnecessary given parse_stmt_list has changed overtime
function parse_import_stmt(){
    expect("IMPORT");
    expect("ID");
    var token = peek();
    //TO DO cont.
    //I believe the below if statement is a portion that can be safely deleted.
    if(token.type !== "END_OF_FILE"){ //some statements are the end of the program & won't have a line break
        if(token.type === "END_OF_LINE"){
            expect("END_OF_LINE");
        }else{
            expect("SEMICOLON"); //this will throw error if invalid follow-up read
            token = peek(); //sometimes a semicolon is followed by a line break
            if(token.type === "END_OF_LINE"){
                expect("END_OF_LINE");
            }
        }
    }
}

function parse_program(){
    var token = peek();
    if(bgnTokens.includes(token.type)){
        if(token.type === "DEF"){
            parse_function_full(); //won't actully be implemented
        }else{
            parse_stmt_list();
        }
        token = peek();
        if(token.type !== "END_OF_FILE")
            parse_program();
    }else{
        syntax_error("UNKNOWN_SYMBOL");
    }
}

function parse_function_full(){
    //we aren't handling function calls
}

function parse_stmt_list(){
    parse_stmt();
    var token = peek();
    if(token.type !== "END_OF_FILE"){//some statements are the end of the program & won't have a line break
        if(token.type === "END_OF_LINE"){
            expect("END_OF_LINE");
        }else if(token.type === "SEMICOLON"){
            expect("SEMICOLON");
            token = peek(); //sometimes a semicolon is followed by a line break
            if(token.type === "END_OF_LINE")
                expect("END_OF_LINE");
        }
    }
    var stmt_Starts = ["IF", "FOR" , "WHILE", "ID", "PRINT", "INPUT", "IMPORT", "HASH_TAG"];
    var spaceCount = saveSpaces(); //need to be held on to for indent stack purposes
    token = peek();
    returnHeldSpaces(spaceCount); //now that we've peeked the next token we reutnr the spaces
    if(stmt_Starts.includes(token.type)){ //this stmt is followed by a statement
        parse_stmt_list();
    }
}

function parse_stmt(){
    check_indents();
    var token = peek();
    if(bgnTokens.includes(token.type)){
        switch(token.type){
            case "IF": parse_if_stmt();
                break;
            case "FOR": parse_for_stmt();
                break;
            case "WHILE": parse_while_stmt();
                break;
            case "ID": parse_assign_stmt();
                break;
            case "PRINT": parse_print_stmt();
                break;
            //TO DO
            //Not useful, but still syntactically possible.
            //Reads a line from input, but wouldn't set it to anything.
            case "INPUT": parse_input_stmt();
                break;
            //TO DO
            //add comment_stmt check
            //add import_stmt check
            case "HASH_TAG": parse_comment();
                break;
            default: syntax_error("INVALID_STATEMENT");
                break;
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
    parse_primary();
    var token = peek();
    var compare_ops = ["COMPARE_EQUALS", "NOT_EQUAL", "LESS_THAN", "LESS_THAN_EQUAL", "GREATER_THAN", "GREATER_THAN_EQUAL"];
    if(compare_ops.includes(token.type)){
        parse_comparison_operator();
        parse_primary();
        token = peek();
        var link_ops = ["AND", "OR"];
        if(link_ops.includes(token.type)){
            parse_comparison_link();
            parse_conditional();
        }
    }else{
        syntax_error("INVALID_COND_OPERATOR");
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
            //TO DO
            //Consider consolidating tuples and list parsing into just parse_expr now that it includes them.
            switch(token.type){
                case "LPAREN":
                case "LBRACE":
                case "NUMBER":
                case "FLOAT":
                case "TRUE":
                case "FALSE":
                case "APOSTROPHE":
                case "QUOTE": 
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
    }else if(token.type === "COMMA"){ //a,b,c,d = 1,2,3,4
        //TO DO
        //Account for tuple assignment
        program = ungetToken(program, multi_token);
        parse_multi_val_assign_stmt();      
    }else if(token.type === "PERIOD"){ //TO DO: function call
        
    }else if(token.type === "END_OF_LINE" || token.type === "SEMICOLON"){ //end of assign stmt recursion expected
        //do nothing
    }else{
        syntax_error("INVALID_ASSIGNMENT");
    }
}

//TO DO
//Consider how to handle this tuple case: t = (1,2,3); a,b,c = t; a,b,c = (1,2,3)
//Might need to add a case in parse_multi_val_assign_stmt(); to accomdate.
//That, or find a way to differentiate between the two.
function parse_multi_val_assign_stmt(){ //a,b,c,d = 1,2,3,4
    expect("ID");
    //TO DO cont.
    //This is most likely a syntax error.
    //This function will likely need a parameter to count the number of variables being set
    //and compare that to the number of values being used to set those variables.
    //Could return a value denoting whether there were not enough, or too many, values received (i.e. positive/negative integer value).
    //If the value is equal to 0 then we can say that this was a valid assignment.
    var token = peek();
    if(token.type === "ASSIGN_EQUALS"){
        expect("ASSIGN_EQUALS");
        token = peek();
        var applicable = ["FLOAT","NUMBER","ID", "TRUE", "FALSE", "LPAREN", "LBRACKET", "LBRACE", "APOSTROPHE", "QUOTE"];  
        if(applicable.includes(token.type)){
            //TO DO
            //
            parse_expr();
        }else{
            syntax_error("INVALID_ASSIGNMENT");
        }
    }else if(token.type === "COMMA"){
        expect("COMMA");
        parse_multi_val_assign_stmt();
        token = peek();
        //TO DO cont.
        //Processing...
        if(token.type === "COMMA"){
            expect("COMMA");
            token = peek();
            var applicable = ["FLOAT","NUMBER","ID", "TRUE", "FALSE", "LPAREN", "LBRACKET", "LBRACE", "APOSTROPHE", "QUOTE"];
            if(applicable.includes(token.type)){
                parse_expr();
            }else{
                syntax_error("INVALID_ASSIGNMENT");
            }
        }else{
            syntax_error("INVALID_ASSIGNMENT");
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
    var primaries = ["ID", "NUMBER", "FLOAT", "TRUE", "FALSE", "QUOTE", "APOSTROPHE"];
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
            case "QUOTE": parse_string();
                break;
            default: syntax_error("INVALID_PRIMARY");
                break;
        }
    }else{
        syntax_error("INVALID_PRIMARY");
    }
}

//TO DO
function parse_string(){
    var token = peek();
    //document.write(token.type + "<br><br>");
    if(token.type === "QUOTE"){
        expect("QUOTE");
        token = peek();
        while(token.type !== "QUOTE"){
            //document.write(token.type + "<br><br>");
            expect(token.type);
            token = peek();
        }
        expect("QUOTE");
    }else if(token.type === "APOSTROPHE"){
        expect("APOSTROPHE");
        token = peek();
        while(token.type !== "APOSTROPHE"){
            //document.write(token.type + "<br><br>");
            expect(token.type);
            token = peek();
        }
        expect("APOSTROPHE");
    }
}

/*function parse_valid_printables(){
    var token = peek();
    while(token.type !== "QUOTE"){
        //document.write(token.type + "<br><br>");
        expect(token.type);
        token = peek();
    }
}*/

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
            }//TO DO: double check the below else if statement.
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
        parse_string();
        string_content = string_content.substring(0,string_content.indexOf(program));
        document.write(string_content + "<br>");
        
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
    }else{
        parse_primary();
    }
    
    token = peek();
    var operations = ["PLUS", "MINUS", "MULT", "DIV", "MOD", "EXPO", "IN", "NOTIN", "IS", "ISNOT"];
    var compare_ops = ["COMPARE_EQUALS", "NOT_EQUAL", "LESS_THAN", "LESS_THAN_EQUAL", "GREATER_THAN", "GREATER_THAN_EQUAL"];
    if(operations.includes(token.type)){
        parse_op();
        parse_expr();
    }else if(compare_ops.includes(token.type)){
        parse_comparison_operator();
        parse_expr();
    }//else do nothing
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
        case "EXPO": expect("EXPO");
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
        //document.write("hi<br>");
        if(string_content.includes("{") || string_content.includes("}")){
            validate_format_string(string_content, parameterCount, namedParameters);
            document.write("hi2<br>");
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

function parse_input_stmt(){
    expect("INPUT");
    expect("LPAREN");
    var token = peek();
    var primaries = ["FLOAT", "NUMBER", "ID", "TRUE", "FALSE", "LPAREN", "LBRACKET", "LBRACE", "APOSTROPHE", "QUOTE"];
    if(token.type === "RPAREN"){
        expect("RPAREN");
    }else if(primaries.includes(token.type)){
        parse_expr();
        expect("RPAREN");
    }else{
        syntax_error("INVALID_INPUT");
    }
}

function parse_comment(){
    expect("HASH_TAG");
    var token = peek();
    while(token.type !== "END_OF_LINE"){
        expect(token.type);
        token = peek();
    }
}

function syntax_error(errorType){
    if (errorType === "UNKNOWN_SYMBOL"){
        alert("Program contains unknown symbols!");
        exit();
    }else if (errorType === "INVALID_STATEMENT"){
        alert("Invalid statement!");
        exit();
    }else if (errorType === "INDENTATION_ERROR"){
        alert("Indentation error detected!");
        exit();
    }else if (errorType === "INVALID_COND_OPERATOR"){
        alert("Invalid conditional operator!");
        exit();
    }else if (errorType === "INVALID_COMP_OPERATOR"){
        alert("Invalid comparison operator!");
        exit();
    }else if (errorType === "INVALID_LINK"){
        alert("Invalid comparison link!");
        exit();
    }else if (errorType === "INVALID_RANGE"){
        alert("Invalid ranged specified!");
        exit();
    }else if (errorType === "INVALID_RHS"){
        alert("Invalid right-hand side value/variable");
        exit();
    }else if (errorType === "INVALID_ASSIGNMENT"){
        alert("Invalid assignment operation!");
        exit();
    }else if (errorType === "INVALID_ASSIGN_OPERATOR"){
        alert("Invalid assignment operator!");
        exit();
    }else if (errorType === "INVALID_PRIMARY"){
        alert("Invalid primary type!");
        exit();
    }else if (errorType === "NON_FORMAT_ERROR"){
        alert("Only format() allowed!");
        exit();
    }else if (errorType === "INVALID_OPERATOR"){
        alert("Invalid arithmetic operator!");
        exit();
    }else if (errorType === "ERROR_MISSING_RIGHT_PARENTHESIS"){
        alert("Expecting right parenthesis!");
        exit();
    }else if (errorType === "ERROR_FORMAT_VIOLATION"){
        alert("format() violation detected!");
        exit();
    }else if (errorType === "INVALID_INPUT"){
        alert("Invalid input!");
        exit();
    }else{
        //document.write("Unspecified Error<br>");
        alert("Unspecified Error");
        exit();
    }
    
}