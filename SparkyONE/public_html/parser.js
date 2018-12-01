
var bgnTokens = ["IMPORT", "IF", "FOR", "WHILE", "ID", "PRINT"];
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

//reads & returns next token, ignoring spaces
function peek(){
    skipSpaces();
    var token = getToken(program);
    return token;
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
        document.write(token.type + " read at line " + token.line_no + "<br>"); //comment this out when not trouble shooting
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
    var compare_ops = ["COMPARE_EQUALS", "NOT_EQUALS", "LESS_THAN", "LESS_THAN_EQUAL", "GREATER_THAN", "GREATER_THAN_EQUAL"];
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
    var compare_ops = ["COMPARE_EQUALS", "NOT_EQUALS", "LESS_THAN", "LESS_THAN_EQUAL", "GREATER_THAN", "GREATER_THAN_EQUAL"];
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
    expect("ID");
    var token = peek();
}

function parse_assign_op(){
    
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
    
}

function parse_op(){
    
}

function parse_print_stmt(){
    
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

function parse_var_recursive(){
    
}

function parse_ordered_format(){
    
}

function parse_string_non_recursive(){
    
}

function parse_var_non_recursive(){
    
}

function parse_input_stmt(){
    
}