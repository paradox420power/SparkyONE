/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var indents = new Stack();

//For whatever reason, bgnStmtWord as a global won't work??
//var bgnStmtWord = ["IMPORT", "IF", "FOR", "WHILE", "ID", "PRINT"];
//var input = "for   ():\n    a=5";

function checkSpace(input){
    var token = getToken(input);
    
    if(token.type === "SPACE"){
        return token;
    }
    else{
        return "";
    }
    
}

function ignoreSpace(input){
    var token = getToken(input);
    
    if(token.type === "SPACE"){
        var revisedInput = input.slice(token.length);
        return revisedInput;
    }
    else{
        return input;
    }
}

/*
 * Used to evaluate lines that only have whitespace characters.
 * 
 */
function parse_empty_lines(input){
    var token1 = getToken(input);
    
    if(token1.type === "SPACE"){
        var revisedInput = ignoreSpace(input);                //Ignore the spaces that occured at the beginning of this line
        var token2 = getToken(revisedInput);
        
        if(token2.type === "END_OF_LINE"){                    //If the revised input has a newline after those spaces, check to see if there are more empty lines
            revisedInput = revisedInput.slice(token2.length); //Get rid of the newline character from the input that still needs to be parsed
            return parse_empty_lines(revisedInput);
        }
        else{
            return input; //return the original input if spaces were read, but there was no newline after them
        }
    }
    else if(token1.type === "END_OF_LINE"){
        var revisedInput = input.slice(token1.length);
        return parse_empty_lines(revisedInput);
    }
    else{
        return input;
    }
}

function parse_program(input){
    var bgnStmtWord = ["IMPORT", "IF", "FOR", "WHILE", "ID", "PRINT"];
    var revisedInput = parse_empty_lines(input);
    var token1 = getToken(revisedInput);
    
    if(bgnStmtWord.includes(token1.type)){
        
        revisedInput = parse_stmt_list(revisedInput);
        revisedInput = parse_empty_lines(revisedInput);
        revisedInput = ignoreSpace(revisedInput);
        
        var token2 = getToken(revisedInput); //Could probably just call getToken in the if statement instead
        
        if(token2.type === "END_OF_FILE"){
            document.write("<br><br>Success.<br><br>");
        }
        else{
            document.write("<br><br>Something may have gone wrong.<br><br>");
        }
    }
    else{
        syntax_error();
    }
}

function parse_stmt_list(input){
    var bgnStmtWord = ["IMPORT", "IF", "FOR", "WHILE", "ID", "PRINT"];
        
    var indent = checkSpace(input);             //Counts spaces from indentation
    var revisedInput = ignoreSpace(input);      //Current input minus the previous spaces token
    var token1 = getToken(revisedInput);        //Get beginning token of a statement
    
    if(bgnStmtWord.includes(token1.type)){
        revisedInput = ungetToken(revisedInput, indent); //Unget spaces token to assure correct spacing is kept throughout parsing process
        
        revisedInput = parse_stmt(revisedInput);    //Set revisedInput to the input that remains after parsing the previous statement in the stmt_list
        
        revisedInput = parse_empty_lines(revisedInput);
        //need to implement a check for a new statement being on the previous line of another statement
        indent = checkSpace(revisedInput);          //Check for spacing and skip those spaces if in scope.
        revisedInput = ignoreSpace(revisedInput);
        var token2 = getToken(revisedInput);
        
        if(bgnStmtWord.includes(token2.type)){      //Check if there's another statement in the input, otherwise return the current input to parse_program
            revisedInput = ungetToken(revisedInput, indent);
            revisedInput = parse_stmt_list(revisedInput);
        }
        return revisedInput;  
    }
    else if(token1.type === "END_OF_FILE"){
        return revisedInput;
    }
    else{
        return syntax_error();
    }  
}


function parse_stmt(input){
    //var indent = checkSpace(input);
    var revisedInput = ignoreSpace(input);
    var token1 = getToken(revisedInput);
    document.write("<br><br>"+ revisedInput +"<br><br>");
    
    switch(token1.type){
        case "IMPORT":
            revisedInput = parse_import_stmt(input);
            break;
        case "IF":
            revisedInput = parse_if_stmt(input);
            break;
        case "FOR":
            revisedInput = parse_for_stmt(input);
            break;
        case "WHILE":
            revisedInput = parse_while_stmt(input);
            break;
        case "PRINT":
            revisedInput = parse_print_stmt(input);
            break;
        case "ID":
            revisedInput = parse_assign_stmt(input);
            break;
        default:
            return syntax_error();
    }
    
    return revisedInput;
        
}

function parse_assign_stmt(input){
    var indent = checkSpace(input); //For indent stack when implemented
    var revisedInput = ignoreSpace(input);
    var token1 = getToken(revisedInput);
    
    if(token1.type === "ID"){
        revisedInput = revisedInput.slice(token1.length); //GET ID TOKEN

        var space1 = checkSpace(revisedInput);
        revisedInput = ignoreSpace(revisedInput);
        var token2 = getToken(revisedInput);

        if(token2.type === "ASSIGN_EQUALS"){
            revisedInput = revisedInput.slice(token2.length); //GET ASSIGN_EQUALS TOKEN
            
            var space2 = checkSpace(revisedInput);
            revisedInput = ignoreSpace(revisedInput);
            var token3 = getToken(revisedInput);
            
            switch(token3.type){
                case "NUMBER":
                case "FLOAT":
                    
                    revisedInput = revisedInput.slice(token3.length); //GET NUMBER TOKEN
                    
                    var space3 = checkSpace(revisedInput);
                    revisedInput = ignoreSpace(revisedInput);
                    var token4 = getToken(revisedInput);
                    
                    var arith_ops = ["PLUS", "MINUS","MULT", "DIV", "MOD", "EXPO", "//"];
                    var cmpr_ops = ["COMPARE_EQUALS", "NOT_EQUAL","LESS_THAN_EQUAL", "LESS_THAN", "GREATER_THAN", "GREATER_THAN_EQUAL"];
                    
                    if(arith_ops.includes(token4.type) || cmpr_ops.includes(token4.type)){
                        
                        revisedInput = ungetToken(revisedInput, space3);
                        revisedInput = ungetToken(revisedInput, token3);
                        revisedInput = ungetToken(revisedInput, space2);
                        
                        revisedInput = parse_expr(revisedInput);
                    }
                    else{
                        document.write("Assign Number!<br>");
                    }
                    
                    return revisedInput;
                case "TRUE":
                case "FALSE":
                    
                    revisedInput = revisedInput.slice(token3.length); //GET NUMBER TOKEN
                    
                    var space3 = checkSpace(revisedInput);
                    revisedInput = ignoreSpace(revisedInput);
                    var token4 = getToken(revisedInput);
                    
                    var arith_ops = ["PLUS", "MINUS","MULT", "DIV", "MOD", "EXPO", "//"];
                    var cmpr_ops = ["COMPARE_EQUALS", "NOT_EQUAL","LESS_THAN_EQUAL", "LESS_THAN", "GREATER_THAN", "GREATER_THAN_EQUAL"];
                    
                    if(arith_ops.includes(token4.type) || cmpr_ops.includes(token4.type)){
                        
                        revisedInput = ungetToken(revisedInput, space3);
                        revisedInput = ungetToken(revisedInput, token3);
                        revisedInput = ungetToken(revisedInput, space2);
                        
                        revisedInput = parse_expr(revisedInput);
                    }
                    else{
                        document.write("Assign Boolean!<br>");
                    }
                    
                    return revisedInput;
                case "ID":
                    revisedInput = revisedInput.slice(token3.length); //GET NUMBER TOKEN
                    
                    var space3 = checkSpace(revisedInput);
                    revisedInput = ignoreSpace(revisedInput);
                    var token4 = getToken(revisedInput);
                    
                    var arith_ops = ["PLUS", "MINUS","MULT", "DIV", "MOD", "EXPO", "//"];
                    var cmpr_ops = ["COMPARE_EQUALS", "NOT_EQUAL","LESS_THAN_EQUAL", "LESS_THAN", "GREATER_THAN", "GREATER_THAN_EQUAL"];
                    
                    if(arith_ops.includes(token4.type) || cmpr_ops.includes(token4.type)){
                        
                        revisedInput = ungetToken(revisedInput, space3);
                        revisedInput = ungetToken(revisedInput, token3);
                        revisedInput = ungetToken(revisedInput, space2);
                        
                        revisedInput = parse_expr(revisedInput);
                    }
                    else if(token4.type === "ASSIGN_EQUALS"){
                        revisedInput = ungetToken(revisedInput, space3);
                        revisedInput = ungetToken(revisedInput, token3);
                        revisedInput = ungetToken(revisedInput, space2);
                        
                        revisedInput = parse_assign_stmt(revisedInput);
                        document.write("Assign Same Value to Multiple Variables!<br>");
                    }
                    else{
                        document.write("Assign to Variable Value!<br>");
                    }
                    
                    return revisedInput;
                case "LBRACE":
                    //revisedInput = parse_list(input);
                    break;
                case "LBRACKET":
                    //revisedInput = parse_dictionary(input);
                    //revisedInput = parse_set(input);
                    break;
                case "LPAREN":
                    //revisedInput = parse_tuple(input);
                    break;
                case "STRING":
                    revisedInput = revisedInput.slice(token3.length);
                    
                    var space3 = checkSpace(revisedInput);
                    revisedInput = ignoreSpace(revisedInput);
                    var token4 = getToken(revisedInput);
                    
                    var arith_ops = ["PLUS", "MINUS","MULT", "DIV", "MOD", "EXPO", "//"];
                    var cmpr_ops = ["COMPARE_EQUALS", "NOT_EQUAL","LESS_THAN_EQUAL", "LESS_THAN", "GREATER_THAN", "GREATER_THAN_EQUAL"];
                    
                    if(arith_ops.includes(token4.type) || cmpr_ops.includes(token4.type)){
                        
                        revisedInput = ungetToken(revisedInput, space3);
                        revisedInput = ungetToken(revisedInput, token3);
                        revisedInput = ungetToken(revisedInput, space2);
                        
                        revisedInput = parse_expr(revisedInput);
                    }
                    else{
                        document.write("Assign to String Value!<br>");
                    }
                    break;
                case "APOSTROPHE":
                    //revisedInput = parse_string(input);
                    break;
                default:
                    return syntax_error();
            }
        }
        else if(token2.type === "ADD_ASSIGN" || token2.type === "SUBTRACT_ASSIGN"){
            
        }
        else if(token2.type === "COMMA"){
            revisedInput = ungetToken(revisedInput, space1);
            revisedInput = ungetToken(revisedInput, token1);
            revisedInput = parse_multi_assign_stmt(revisedInput); //could just be input from parameter instead
            //revisedInput = ungetToken(revisedInput, indent); //pop indent stack after
        }
        else{
            return syntax_error();
        }
        
        return revisedInput;
    }
    else{
        return syntax_error();
    }
}

function parse_expr(input){
    var space1 = checkSpace(input);
    var revisedInput = ignoreSpace(input);
    var token1 = getToken(revisedInput);
    
    var expr_types = ["NUMBER", "FLOAT", "ID", "STRING", "TRUE", "FALSE"];
    
    if(expr_types.includes(token1.type)){
        revisedInput = revisedInput.slice(token1.length);
        
        var space2 = checkSpace(revisedInput);
        revisedInput = ignoreSpace(revisedInput);
        var token2 = getToken(revisedInput);
    
        var arith_ops = ["PLUS", "MINUS","MULT", "DIV", "MOD", "EXPO", "//"];
        var cmpr_ops = ["COMPARE_EQUALS", "NOT_EQUAL","LESS_THAN_EQUAL", "LESS_THAN", "GREATER_THAN", "GREATER_THAN_EQUAL"];

        if(arith_ops.includes(token2.type) || cmpr_ops.includes(token2.type)){
            revisedInput = revisedInput.slice(token2.length);

            var space3 = checkSpace(revisedInput);
            revisedInput = ignoreSpace(revisedInput);
            var token3 = getToken(revisedInput);
            
            if(expr_types.includes(token3.type)){
                revisedInput = revisedInput.slice(token3.length);
                
                var space4 = checkSpace(revisedInput);
                revisedInput = ignoreSpace(revisedInput);
                var token4 = getToken(revisedInput);
                
                if(arith_ops.includes(token4.type) || cmpr_ops.includes(token4.type)){
                    revisedInput = ungetToken(revisedInput, space4);
                    revisedInput = ungetToken(revisedInput, token3);
                    revisedInput = ungetToken(revisedInput, space3);
                    
                    revisedInput = parse_expr(revisedInput);
                }
                else{
                    document.write("<br><br>Assign Expression!<br><br>");
                }
                
                return revisedInput;
            }
            else{
                syntax_error();
            }
        }
        else{
           syntax_error(); 
        }
    }
    else{
        syntax_error();
    }
    
}

/*
 * Need to account for expression as a possibility still
 * 
 * 
 */
function parse_multi_assign_stmt(input){
    //var indent = checkSpace(input); //For indent stack
    //var revisedInput = ignoreSpace(input);
    var token1 = getToken(input);
    
    if(token1.type === "ID"){
        var revisedInput = input.slice(token1.length); //Get ID token
        revisedInput = ignoreSpace(revisedInput);
        
        var token2 = getToken(revisedInput);
        
        if(token2.type === "ASSIGN_EQUALS"){
            revisedInput = revisedInput.slice(token2.length);
            revisedInput = ignoreSpace(revisedInput);

            var token3 = getToken(revisedInput);

            var applicable = ["FLOAT","NUMBER","ID","STRING"];

            if(applicable.includes(token3.type)){ //String, need to account for apostrophe as well
                revisedInput = revisedInput.slice(token3.length);
                revisedInput = ignoreSpace(revisedInput);
                return revisedInput;
            }
            else{
                return syntax_error();
            }

        }
        else if(token2.type === "COMMA"){
            revisedInput = revisedInput.slice(token2.length); //Get COMMA token
            revisedInput = ignoreSpace(revisedInput);
            revisedInput = parse_multi_assign_stmt(revisedInput);

            revisedInput = ignoreSpace(revisedInput);
            var token3 = getToken(revisedInput);

            if(token3.type === "COMMA"){
                revisedInput = revisedInput.slice(token3.length);
                revisedInput = ignoreSpace(revisedInput);

                var token4 = getToken(revisedInput);

                var applicable = ["FLOAT","NUMBER","ID","STRING"];

                if(applicable.includes(token4.type)){//Parse String, need to account for apostrophe as well
                    revisedInput = revisedInput.slice(token4.length);
                    revisedInput = ignoreSpace(revisedInput);
                    document.write("<br><br>Multi-Assigned-Statement!<br><br>");
                    
                    return revisedInput;
                }
                else{
                    return syntax_error();
                }

            }
            else{
                return syntax_error();
            }  

        }
        else{
            return syntax_error();
        }
        
    }
    else{
        return syntax_error();
    }
    
}

/*
 * function parse_for_stmt(input){
    
}

function parse_if_stmt(input){
    
}

function parse_elif_stmt(input){
    
}

function parse_else_stmt(input){
    
}
                            
function parse_while_stmt(input){
    
}                           
*/

function parse_import_stmt(input){
    //var indent = checkSpace(input);
    var revisedInput = ignoreSpace(input);
    var token1 = getToken(revisedInput);
    
    if(token1.type === "IMPORT"){
        revisedInput = revisedInput.slice(token1.length);
            
        revisedInput = ignoreSpace(revisedInput);
        var token2 = getToken(revisedInput);

        if(token2.type === "ID"){
            revisedInput = revisedInput.slice(token2.length);

            revisedInput = ignoreSpace(revisedInput);
            var token3 = getToken(revisedInput);

            if(token3.type === "SEMICOLON"){
                revisedInput = revisedInput.slice(token3.length);
                document.write("Import Statement with Semicolon<br><br>");
            }
            else{
                document.write("Import Statement<br>");
            }

            return revisedInput;
        } 
        return syntax_error();
    }
    
}

function parse_print_stmt(input){
    
}

function syntax_error(){
    document.write("<br><br>There was an issue.<br><br>");
    return "";
}