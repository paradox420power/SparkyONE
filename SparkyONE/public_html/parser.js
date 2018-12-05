//added INPUT in bgnTokens for testing purposes for now
var bgnTokens = ["IMPORT", "IF", "FOR", "WHILE", "ID", "PRINT", "INPUT"];
var program = "";

//print parsing error
function error_expected_not_matching(expected, received, line_no){
    document.write("Expected Token: " + expected + "<br>Received Token: " + received + "<br>At line " + line_no + "<br>");
}

function syntax_error(){
    document.write("Unspecified Syntax Error<br>");
}

//used to remove unwanted spaces
function skipSpaces(){
    var token = getToken(program);
    if(token.type === "SPACE"){
        program = program.slice(token.length);
    }
    //else do nothing
}

//TO DO
//Consider using saveSpaces as a way to help with the potential danger of peek_2_ahead
//used to save potentially useful spaces
/*function saveSpaces(){
    var token = getToken(program);
    if(token.type === "SPACE"){
        return token.id;
    }
}*/

//reads & returns next token, ignoring spaces
function peek(){
    skipSpaces();
    var token = getToken(program);
    return token;
}

//use very carefully because if the first token peeked is a line break, skip spaces when peeking a second time might alter indents
function peek_2_ahead(){ //necessary for a few location is parser
    skipSpaces();
    var token = getToken(program);
    program = program.slice(token.length);
    var returnToken = peek();
    program = token.id + " " + program; //return skipped token & arbitrary space skipped by peek
    return returnToken;
}

 //reads next token, throws an error if they don't match
 // & splices token from input, ignoring spaces
function expect(tokenType){
    skipSpaces();
    var token = getToken(program);
    if(token.type === tokenType){
        program = program.slice(token.length);
        if(token.type === "END_OF_LINE"){
            incrementCodeLine();
            readEmptyLines();
            //check correct indents (stack issue)
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
    var token = getToken(program);
    var token2;
    if(token.type === "SPACE"){
        program = program.slice(token.length); //slice off the spaces
        token2 = getToken(program);
        if(token2.type === "END_OF_LINE") //if next is line break, its ok
            readEmptyLines();
        else //some keyword was read & the spaces could be indent that need to be read
            program = token.id + "" + program; //add spliced id back to front of program
    }else if(token.type === "END_OF_LINE"){
        program = program.slice(token.length);
        incrementCodeLine();
        readEmptyLines();
    }
}

function parse_begin_program(input){
    program = input;
    var token = peek();
    //TO DO
    //Could just call read empty lines directly instead 
    if(token.type === "END_OF_LINE")
        expect("END_OF_LINE"); //this will precede to read all empty lines
    token = peek();
    if(bgnTokens.includes(token.type)){
        if(token.type === "IMPORT")
            parse_import_list();
        var token = peek(); //if above if doesn't run this just peeks the same token
        if(token.type !== "END_OF_FILE")
            parse_program(); //this will run on any non-empty program
        expect("END_OF_FILE");
    }else if(token.type === "END_OF_FILE"){
        //nothing to parse
    }else{
        syntax_error();
    }
    
}

function parse_import_list(){
    parse_import_stmt();
    var token = peek();
    if(token.type === "IMPORT")
        parse_import_list();
}

function parse_import_stmt(){
    expect("IMPORT");
    expect("ID");
    var token = peek();
    if(token.type !== "END_OF_FILE"){ //some statements are the end of the program & won't have a line break
        if(token.type === "END_OF_LINE")
            expect("END_OF_LINE");
        else{
            expect("SEMICOLON"); //this will throw error if invalid follow-up read
            token = peek(); //sometimes a semicolon is followed by a line break
            if(token.type === "END_OF_LINE")
                expect("END_OF_LINE");
        }
    }
}

function parse_program(){
    var token = peek();
    if(bgnTokens.includes(token.type)){
        if(token.type === "DEF")
            parse_function_full(); //won't actully be implemented
        else
            parse_stmt_list();
        token = peek();
        if(token.type !== "END_OF_FILE")
            parse_program();
    }else{
        syntax_error();
    }
}

function parse_function_full(){
    //we aren't handling function calls
}

/*function parse_function_def(){
    
}

function parse_parameter_list(){
    
}

function parse_parameter(){
    
}*/

/*function parse_new_body(){
    
}

function parse_body(){
    
}

function parse_body_no_indent(){
    
}*/

function parse_stmt_list(){
    parse_stmt();
    var token = peek();
    if(token.type !== "END_OF_FILE"){//some statements are the end of the program & won't have a line break
        if(token.type === "END_OF_LINE")
            expect("END_OF_LINE");
        else{
            expect("SEMICOLON");
            token = peek(); //sometimes a semicolon is followed by a line break
            if(token.type === "END_OF_LINE")
                expect("END_OF_LINE");
        }
    }
    var stmt_Starts = ["IF", "FOR" , "WHILE", "ID", "PRINT"];
    token = peek();
    if(stmt_Starts.includes(token.type)) //this stmt is followed by a statement
        parse_stmt_list();
}

function parse_stmt(){
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
                //add comment stmt check
            default: syntax_error();
                break;
        }
    }
}

function parse_if_stmt(){
    expect("IF");
    parse_conditional();
    expect("COLON");
    expect("END_OF_LINE");
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
        parse_conditional();
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
        if(link_ops.includes(token.type) ){
            parse_comparison_link();
            parse_conditional();
        }
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
            default: syntax_error();
                break;
        }
    }else
        syntax_error();
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
            default: syntax_error();
                break;
        }
    }else
        syntax_error();
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
            expect("COMMA");
            expect("NUMBER");
            expect("RPAREN");
            expect("COLON");
            parse_new_body();
            break;
        case "XRANGE":
            break;
        case "MY_RANGE":
            break;
        case "ID":
            break;
        default: syntax_error();
            break;
    }
}

function parse_while_stmt(){
    
}

function parse_assign_stmt(){
    var multi_token = peek(); //used in the case we need to unget the ID, for the multi_val_assign_stmt
    expect("ID");
    var token = peek();
    var math_assigns = ["ADD_ASSIGN", "SUB_ASSIGN", "MULT_ASSIGN", "DIV_ASSIGN", "MOD_ASSIGN"];
    if(math_assigns.includes(token.type)){ //calc & assign statements
        parse_assign_op();
        token = peek();
        parse_expr();
    }else if(token.type === "ASSIGN_EQUALS"){ // simply assigning, but could be a multi assign statement
        expect("ASSIGN_EQUALS");
        token = peek();
        var token2 = peek_2_ahead();
        if(token.type === "ID"){
            if(token2.type === "ASSIGN_EQUALS" || token2.type === "END_OF_LINE" || token2.type === "SEMICOLON"){ //2nd tokens indicative of an assign stmt
                parse_assign_stmt();
            }else //else an id should be a primary/expression
                parse_expr();
        }else{
            switch(token.type){
                case "NUMBER":
                case "FLOAT":
                case "TRUE":
                case "FALSE": parse_expr();
                    break;
                case "LPAREN": parse_tuple();
                    break;
                case "LBRACE": parse_list();
                    break;
                //case String TODO
                case "INPUT": parse_input_stmt();
                    break;
                default: syntax_error();
                    break;
            }
        }
    }else if(token.type === "COMMA"){ //a,b,c,d = 1,2,3,4
        program = ungetToken(program, multi_token);
        parse_multi_val_assign_stmt();      
    }else if(token.type === "PERIOD"){ //function call
        
    }else if(token.type === "END_OF_LINE" || token.type === "SEMICOLON"){ //end of assign stmt recursion expected
        //do nothing
    }else
        syntax_error();
}

function parse_multi_val_assign_stmt(){ //a,b,c,d = 1,2,3,4
    expect("ID");
    var token = peek();
    if(token.type === "ASSIGN_EQUALS"){
        expect("ASSIGN_EQUALS");
        token = peek();
        var applicable = ["FLOAT","NUMBER","ID", "TRUE", "FALSE"];  
        if(applicable.includes(token.type)){
            parse_expr();
        }else{
            syntax_error();
        }
    }else if(token.type === "COMMA"){
        expect("COMMA");
        parse_multi_val_assign_stmt();
        token = peek();
        if(token.type === "COMMA"){
            expect("COMMA");
            token = peek();
            var applicable = ["FLOAT","NUMBER","ID", "TRUE", "FALSE"];
            if(applicable.includes(token.type)){
                parse_expr();
            }else{
                syntax_error();
            }
        }else{
            syntax_error();
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
            default: syntax_error();
                break;
        }
    }else
            syntax_error();
}

function parse_primary(){
    var token = peek();
    var primaries = ["ID", "NUMBER", "FLOAT", "TRUE", "FALSE"];
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
            default: syntax_error();
                break;
        }
    }else{
        syntax_error();
    }
}

function parse_string(){
    
}

function parse_string_list(){
    
}

function parse_list(){
    
}

function parse_tuple(){
    
}

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
                syntax_error();
            }
        }
        //otherwise just parse the ID primary and continue parsing potential expression
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
        default: syntax_error();
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
            parse_print_multi_val();
            token = peek();
            if(token.type === "RPAREN"){
                expect("RPAREN");
            }else{
                syntax_error();
            }
            break;
    }
}

//TO DO
//Need to address implementation for String type eventually.
//Currently this will account for every way to print with single input, or multiple inputs for the print function
function parse_print_multi_val(){
    var token = peek();
    var primaries = ["ID", "NUMBER", "FLOAT", "TRUE", "FALSE"];
    if(primaries.includes(token.type)){
        parse_expr();
        var token = peek();
        if(token.type === "COMMA"){
            expect("COMMA");
            parse_print_multi_val();
        }
    }
}

//TO DO
//might be renamed to reflect it being specifically variable parsing instead of combining future String implementation
function parse_format_function(){
    var token = peek();
    var token2;
    if(token.type === "ID"){
       expect("ID");
       expect("PERIOD");
       //need to add format to keywords (alternatively a different array) in order to get the token.
       //That, or add a token equal to peek() and use an if statement to check that the token.id equals format
       //then do expect() using the token that was set.
       expect("FORMAT");
       expect("LPAREN");
       token = peek();
       var nameFmtUsed = false;
       var parameterCount = 0;//will be useful when grabbing the value stored inside a variable
       while(token.type !== "RPAREN"){
           token = peek();
           token2 = peek_2_ahead();
           if(!nameFmtUsed){//named parameters have not occured yet, meaning primaries and expressions can be used as well
                if(token.type === "ID" && token2.type === "ASSIGN_EQUALS"){//asd.format(a=5)
                   nameFmtUsed = true;
                   expect("ID");
                   expect("ASSIGN_EQUALS");
                   parse_expr();
                   parameterCount++;
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
                           syntax_error();
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
                           syntax_error();
                       }
                   }
               }
           }else{//Only named paramters can appear after they've been used once
               if(token.type === "ID" && token2.type === "ASSIGN_EQUALS"){ //asd.format(..., a=5, b=6, variable=...)
                   expect("ID");
                   expect("ASSIGN_EQUALS");
                   parse_expr();
                   parameterCount++;
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
                           syntax_error();
                       }
                   }
               }else{//There was a violation as only the named format can be used now.
                   syntax_error();
                   break;
               }
           }
       }
   }
}

function parse_print_type(){
    
}

function parse_string_print(){
    
}

function parse_valid_printables(){
    
}

function parse_var_print(){
    
}

function parse_format_print(){
    
}

function parse_unordered_print(){
    
}

function parse_string_recursive(){
    
}

//Should just be included with string recursive
function parse_var_recursive(){
    
}

function parse_ordered_format(){
    
}

function parse_string_non_recursive(){
    
}

function parse_var_non_recursive(){
    
}

function parse_input_stmt(){
    expect("INPUT");
    expect("LPAREN");
    var token = peek();
    var primaries = ["FLOAT","NUMBER","ID", "TRUE", "FALSE"];
    if(token.type === "RPAREN"){
        expect("RPAREN");
    }else if(primaries.includes(token.type)){
        parse_expr();
        expect("RPAREN");
    }else{
        syntax_error();
    }
}
