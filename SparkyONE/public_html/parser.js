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
        var revisedInput = ignoreSpace(input);  //Ignore the spaces that occured at the beginning of this line
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
        
        revisedInput = parse_stmt_list(revisedInput, false);
        revisedInput = parse_empty_lines(revisedInput);
        revisedInput = ignoreSpace(revisedInput);
        
        var token2 = getToken(revisedInput); //Could probably just call getToken in the if statement instead
                
        if(token2.type === "END_OF_FILE"){
            document.write("<br>Success.<br>");
        }
        else{
            document.write("<br>Something may have gone wrong.<br>");
        }
    }
    else{
        syntax_error();
    }
}

function parse_stmt_list(input, sameLine){
    var bgnStmtWord = ["IMPORT", "IF", "FOR", "WHILE", "ID", "PRINT"];
    var indent = "";
    
    if(!sameLine){ //The statement is on a newline, and thus has its own indentation 
        indent = checkSpace(input); //Counts spaces from indentation
        //Check that it fits the conditions of the indent stack
    }
    else{//Otherwise the statement is on the same line as another statement, meaning it has the same indentation as the previous statement
        //indent = indentStack.peek() //Should equal the top of the indent stack, as the previous statement should be correct with regards to the indent stack conditions
    }
    
    var revisedInput = ignoreSpace(input);      //Current input minus the previous spaces token
    var token1 = getToken(revisedInput);        //Get beginning token of a statement
    
    if(bgnStmtWord.includes(token1.type)){
        revisedInput = ungetToken(revisedInput, indent); //Unget spaces token to assure correct spacing is kept throughout parsing process
        
        revisedInput = parse_stmt(revisedInput);    //Set revisedInput to the input that remains after parsing the previous statement in the stmt_list
        
        revisedInput = parse_empty_lines(revisedInput);
        
        var indentOrSpace1 = checkSpace(revisedInput); //Check for spacing and skip those spaces if in scope.
        revisedInput = ignoreSpace(revisedInput);
        var token2 = getToken(revisedInput);
        
        //May need to check to make sure semicolon is on the same line as currStmtLine
        if(token2.type === "SEMICOLON"){
            revisedInput = revisedInput.slice(token2.length);
            
            revisedInput = parse_empty_lines(revisedInput);
            
            var indentOrSpace2 = checkSpace(revisedInput);
            revisedInput = ignoreSpace(revisedInput);
            var token3 = getToken(revisedInput);
            
            //This is technically valid no matter what.
            if(bgnStmtWord.includes(token3.type)){
                if(token1.line_no === token3.line_no){ //The new statement is on the same line after a semicolon, and indentation won't matter
                    revisedInput = parse_stmt_list(revisedInput, true);
                }
                else if(token1.line_no !== token3.line_no){ //The new statement is on a different line after the semicolon, and indentation matters
                    revisedInput = ungetToken(revisedInput, indentOrSpace2);
                    revisedInput = parse_stmt_list(revisedInput, false);
                }
                else{
                    
                    return syntax_error();
                }
            }
            else{
                return syntax_error();
            }
        }
        else if(bgnStmtWord.includes(token2.type)){      //Check if there's another statement in the input, otherwise return the current input to parse_program
            
            if(token1.line_no !== token2.line_no){ //A statement does not have a semicolon, and appears on its own line after the previous one.
                revisedInput = ungetToken(revisedInput, indentOrSpace1);             
                revisedInput = parse_stmt_list(revisedInput, false);
            }
            else{
                
                var specialCases = [];
                if(specialCases.includes(token2.type)){
                    //TO DO
                    //Consider how to address special cases that
                    //For now throw syntax error
                }
                else{
                    return syntax_error();
                }
            }   
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
    document.write("<br>"+ revisedInput + "<br>");
    //Could probably check for indentation in this function instead, but will need to consider the impact
    //of multiple statements on the same line (delimited by semicolon).
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

        if(token2.type === "ASSIGN_EQUALS" || token2.type === "ADD_ASSIGN" || token2.type === "SUBTRACT_ASSIGN"){
            revisedInput = revisedInput.slice(token2.length); //GET ASSIGN_EQUALS TOKEN
            
            var space2 = checkSpace(revisedInput);
            revisedInput = ignoreSpace(revisedInput);
            var token3 = getToken(revisedInput);
            //There's some commonanilty with some of these cases, maybe I should consider changing 
            //the case organization 
            switch(token3.type){
                case "NUMBER":
                case "FLOAT":
                    
                    revisedInput = revisedInput.slice(token3.length); //GET NUMBER TOKEN
                    
                    var space3 = checkSpace(revisedInput);
                    revisedInput = ignoreSpace(revisedInput);
                    var token4 = getToken(revisedInput);
                    
                    var arith_ops = ["PLUS", "MINUS","MULTIPLY", "DIVIDE", "MODULO"];
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
                    
                    var arith_ops = ["PLUS", "MINUS","MULTIPLY", "DIVIDE", "MODULO"];
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
                    revisedInput = revisedInput.slice(token3.length);
                    
                    var space3 = checkSpace(revisedInput);
                    revisedInput = ignoreSpace(revisedInput);
                    var token4 = getToken(revisedInput);
                    
                    var arith_ops = ["PLUS", "MINUS","MULTIPLY", "DIVIDE", "MODULO"];
                    var cmpr_ops = ["COMPARE_EQUALS", "NOT_EQUAL","LESS_THAN_EQUAL", "LESS_THAN", "GREATER_THAN", "GREATER_THAN_EQUAL"];
                    
                    if(arith_ops.includes(token4.type) || cmpr_ops.includes(token4.type)){
                        
                        revisedInput = ungetToken(revisedInput, space3);
                        revisedInput = ungetToken(revisedInput, token3);
                        revisedInput = ungetToken(revisedInput, space2);
                        
                        revisedInput = parse_expr(revisedInput);
                    }
                    else if(token4.type === "ASSIGN_EQUALS" && token4.type !== "ADD_ASSIGN" && token4.type !== "SUBTRACT_ASSIGN"){
                        revisedInput = ungetToken(revisedInput, space3);
                        revisedInput = ungetToken(revisedInput, token3);
                        revisedInput = ungetToken(revisedInput, space2);
                        
                        revisedInput = parse_assign_stmt(revisedInput);
                        document.write("Assign Same Value to Multiple Variables!<br>");
                    }
                    else if(token4.type === "PERIOD"){ //used for potential function operations on a variable
                            //NEEDS TO BE ADDED
                            //NEEDS TO CHECK THAT VARIABLE TYPE IS STRING
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
                    
                    var arith_ops = ["PLUS", "MINUS","MULTIPLY", "DIVIDE", "MODULO"];
                    var cmpr_ops = ["COMPARE_EQUALS", "NOT_EQUAL","LESS_THAN_EQUAL", "LESS_THAN", "GREATER_THAN", "GREATER_THAN_EQUAL"];
                    
                    if(arith_ops.includes(token4.type) || cmpr_ops.includes(token4.type)){
                        
                        revisedInput = ungetToken(revisedInput, space3);
                        revisedInput = ungetToken(revisedInput, token3);
                        revisedInput = ungetToken(revisedInput, space2);
                        
                        revisedInput = parse_expr(revisedInput);
                    }
                    else if(token4.type === "PERIOD"){ //used for potential function operations on a string
                        revisedInput = revisedInput.slice(token4.length);

                        var space4 = checkSpace(revisedInput);
                        revisedInput = ignoreSpace(revisedInput);
                        var token5 = getToken(revisedInput);

                        if(token5.id === "format"){
                            revisedInput = ungetToken(revisedInput, space4);
                            revisedInput = ungetToken(revisedInput, token4);
                            revisedInput = ungetToken(revisedInput, space3);
                            revisedInput = ungetToken(revisedInput, token3);

                            revisedInput = parse_format_string(revisedInput);

                            //Do I need to add parse_expr right after??
                        }

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
    
        var arith_ops = ["PLUS", "MINUS","MULTIPLY", "DIVIDE", "MODULO"];
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
                //TO DO
                //Maybe add the format() function statement here instead...or actually more likely in addition to the one below
                //consider just using revisedInput set to another variable, then use parse_format()
                //with the current revisedInput. Create an if statement to see if the parsing caused
                //a syntax error and, if it hasn't, pass that variable that was set to the previous revisedInput
                //into the parse_expr() function after checking if there's another operator Token to be had 
                //using the current revisedInput. Also make sure to do the below section as well, as it handles base case.
                else{
                    document.write("<br>Expression!<br>");
                }
                
                return revisedInput;
            }
            else{
                syntax_error();
            }
        }
        //Possible function call on componenet of the first expression
        else if(token2.type === "PERIOD" && (token1.type === "STRING" || token1.type === "ID")){
            //Right now this will only account for the format function on a Variable or String
            
        }
        else{
           syntax_error(); 
        }
    }
    else{
        syntax_error();
    }
    
}

/* TO DO 
 * Account for format()
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

            var applicable = ["FLOAT","NUMBER","ID","STRING", "TRUE", "FALSE"];

            if(applicable.includes(token3.type)){ //String, still needs to account for apostrophe as well
                revisedInput = revisedInput.slice(token3.length);
                
                var space = checkSpace(revisedInput);
                revisedInput = ignoreSpace(revisedInput);
                var token4 = getToken(revisedInput);
                
                var arith_ops = ["PLUS", "MINUS","MULTIPLY", "DIVIDE", "MODULO"];
                var cmpr_ops = ["COMPARE_EQUALS", "NOT_EQUAL","LESS_THAN_EQUAL", "LESS_THAN", "GREATER_THAN", "GREATER_THAN_EQUAL"];

                if(cmpr_ops.includes(token4.type)|| arith_ops.includes(token4.type)){
                    revisedInput = ungetToken(revisedInput, space);
                    revisedInput = ungetToken(revisedInput, token3.id);
                    
                    revisedInput = parse_expr(revisedInput);
                }
                 
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
                    
                    var space = checkSpace(revisedInput);
                    revisedInput = ignoreSpace(revisedInput);
                    var token5 = getToken(revisedInput);

                    var arith_ops = ["PLUS", "MINUS","MULTIPLY", "DIVIDE", "MODULO"];
                    var cmpr_ops = ["COMPARE_EQUALS", "NOT_EQUAL","LESS_THAN_EQUAL", "LESS_THAN", "GREATER_THAN", "GREATER_THAN_EQUAL"];

                    if(cmpr_ops.includes(token5.type)|| arith_ops.includes(token5.type)){
                        revisedInput = ungetToken(revisedInput, space);
                        revisedInput = ungetToken(revisedInput, token4.id);

                        revisedInput = parse_expr(revisedInput);
                    }
                    
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
function parse_for_stmt(input){
    
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
            document.write("Import Statement<br>");

            return revisedInput;
        } 
        return syntax_error();
    }
    
}

function parse_print_stmt(input){
    var indent = checkSpace(input);
    var revisedInput = ignoreSpace(input);
    var token1 = getToken(input); //Get PRINT token
    
    if(token1.type === "PRINT"){
        var revisedInput = revisedInput.slice(token1.length);
        
        revisedInput = ignoreSpace(revisedInput);
        var token2 = getToken(revisedInput); //Get LPAREN token

        if(token2.type === "LPAREN"){
            revisedInput = revisedInput.slice(token2.length);

            revisedInput = ignoreSpace(revisedInput);
            var token3 = getToken(revisedInput); //Get RPAREN, STRING, ID, NUMBER, FLOAT, TRUE, or FALSE token
            
            switch(token3.type){ //All should account for expressions used inside the print statement
                case "RPAREN": //print() case
                    revisedInput = revisedInput.slice(token3.length);
                    return revisedInput;
                case "STRING":
                    revisedInput = revisedInput.slice(token3.length);
                    
                    var space1 = checkSpace(revisedInput);
                    revisedInput = ignoreSpace(revisedInput);
                    var token4 = getToken(revisedInput);
                    
                    var arith_ops = ["PLUS", "MINUS","MULTIPLY", "DIVIDE", "MODULO"];
                    var cmpr_ops = ["COMPARE_EQUALS", "NOT_EQUAL","LESS_THAN_EQUAL", "LESS_THAN", "GREATER_THAN", "GREATER_THAN_EQUAL"];
                    
                    if(arith_ops.includes(token4.type) || cmpr_ops.includes(token4.type)){
                        revisedInput = ungetToken(revisedInput, space1);
                        revisedInput = ungetToken(revisedInput, token3);
                                    
                        revisedInput = parse_expr(revisedInput);
                    }
                    else if(token4.type === "PERIOD"){ //used for potential function operations on a string
                        revisedInput = revisedInput.slice(token4.length);

                        var space2 = checkSpace(revisedInput);
                        revisedInput = ignoreSpace(revisedInput);
                        var token5 = getToken(revisedInput);

                        if(token5.id === "format"){
                            revisedInput = ungetToken(revisedInput, space2);
                            revisedInput = ungetToken(revisedInput, token4);
                            revisedInput = ungetToken(revisedInput, space1);
                            revisedInput = ungetToken(revisedInput, token3);
							
                            var placeHolder = revisedInput; //holds at least "someString".format and the remaining input in case an expression needs to be parsed
							
                            revisedInput = parse_format_string(revisedInput); //returns the remaining input after parsing the format function call
																			  //Or returns a syntax_error
                            var space3 = checkSpace(revisedInput);
                            revisedInput = ignoreSpace(revisedInput);
                            var token6 = getToken(revisedInput);
                            //TO DO
                            //See the TO DO in parse_expr functino. That same insight should help.
                            //Might be done for now?
                            if(arith_ops.includes(token6.type) || cmpr_ops.includes(token6.type)){
                                revisedInput = parse_expr(placeHolder);
                            }
                        }
                    }
                    break;
                case "ID":
                    break;
                case "NUMBER":
                case "FLOAT":
                case "TRUE":
                case "FALSE":
                    revisedInput = revisedInput.slice(token3.length);
                    
                    var space = checkSpace(revisedInput);
                    revisedInput = ignoreSpace(revisedInput);
                    var token4 = getToken(revisedInput);
                    
                    var arith_ops = ["PLUS", "MINUS","MULTIPLY", "DIVIDE", "MODULO"];
                    var cmpr_ops = ["COMPARE_EQUALS", "NOT_EQUAL","LESS_THAN_EQUAL", "LESS_THAN", "GREATER_THAN", "GREATER_THAN_EQUAL"];

                    if(cmpr_ops.includes(token4.type)|| arith_ops.includes(token4.type)){
                        revisedInput = ungetToken(revisedInput, space);
                        revisedInput = ungetToken(revisedInput, token3.id);
                        
                        revisedInput = parse_expr(revisedInput);
                    }
                    else{
                        revisedInput = revisedInput.slice(token4.id);
                    }
                    break;
                default:
                    return syntax_error();
            }
            
            revisedInput = ignoreSpace(revisedInput);
            var token4 = getToken(revisedInput);
            
            if(token4.type === "RPAREN"){ //Anything that is not print(), but is valid syntax
                revisedInput = revisedInput.slice(token4.length);
                document.write("<br>Print " + token3.type + " Statement<br>");
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

//The format() function only needs as many parameters/arguments as the number of bracket pairings that are in the string it evaluates
function parse_format_string(input){
    //Use the length of the STRING token in order to obtain the ending quotation mark
    //Then get rid of the beginning and ending quotation marks to evaluate the content of the string
    var token1 = getToken(input);
    
    if(token1.type === "STRING"){
        var revisedInput = revisedInput.slice(token1.length);
        
        var space1 = checkSpace(revisedInput);
        revisedInput = ignoreSpace(revisedInput);
        var token2 = getToken(revisedInput);
        
	var stringContent = (token1.id).substring(1,token1.length-1);
        
        if(token2.type === "PERIOD"){ //used for potential function operations on a string
            revisedInput = revisedInput.slice(token2.length);

            var space2 = checkSpace(revisedInput);
            revisedInput = ignoreSpace(revisedInput);
            var token3 = getToken(revisedInput);

            if(token3.id === "format"){
                revisedInput = revisedInput.slice(token3.length);
                var space3 = checkSpace(revisedInput);
                revisedInput = ignoreSpace(revisedInput);
                var token4 = getToken(revisedInput);
                
                if(token4.id === "LPAREN"){
                    revisedInput = revisedInput.slice(token4.length);
                    
                    var space4 = checkSpace(revisedInput);
                    revisedInput = ignoreSpace(revisedInput);
                    var token5 = getToken(revisedInput);
                    
                    /*
                    *Use the some_format_occurs methods to determine some information about the contents of the STRING token
                    *
                    *Remember, the only thing that the STRING section dictates on the format() function
                    *is the number of arguments based on {}, {NUMBER}, and {namedArguement}s that appear in the STRING.
                    *
                    *So if we get the total number of format occurances from either {} + {namedArguement}s
                    *or {NUMBER} + {namedArguement} then we should be able to get the minimum number of parameters
                    *needed within the format() function.
                    *
                    *
                    *
                    */
                    
                    if(token5.type === "RPAREN"){
                        revisedInput = revisedInput.slice(token5.length);
                    }
                    else{
                        var applicable = ["FLOAT","NUMBER","ID","STRING", "TRUE", "FALSE"];

                        var isRPAREN = false;
                        var nameFmtOccurs = false;
                        
                        //define possible tokens to default outside of while loop
                        var token6 = token4;
                        var token7 = token4;

                        while(!isRPAREN){
                            revisedInput = ignoreSpace(revisedInput);
                            token5 = getToken(revisedInput);
                            
                            if(applicable.includes(token5.type)){
                                revisedInput = revisedInput.slice(token5.length);

                                revisedInput = ignoreSpace(revisedInput);
                                token6 = getToken(revisedInput);

                                if(token6.type === "COMMA"){
                                    revisedInput = revisedInput.slice(token6.length);

                                    revisedInput = ignoreSpace(revisedInput);
                                    token7 = getToken(revisedInput);

                                    if(token7.type === "RPAREN"){ //"someString".format("bob", 9,)
                                        revisedInput = revisedInput.slice(token7.length);

                                        isRPAREN = true; //Exit while loop as RPAREN has been read
                                    }
                                    //Otherwise a loop will occur setting token5 to the value of token7
                                    //If it's a PRIMARY token after the COMMA then this loop will continue until it hits a RPAREN token

                                }
                                else if(token5.type === "ID" && token6.type === "ASSIGN_EQUALS"){
                                    //TO DO
                                    //CHECK IF SINGLE ASSIGNMENT, OR EXPRESSION
                                    //THEN CHECK FOR ANOTHER COMMA
                                    //Then make while loop to loop through probably after the LPAREN token comparison
                                }
                            }
                            else{
                                revisedInput = syntax_error();
                                isRPAREN = true;
                            }
                        }
                    }
                    
                    return revisedInput;
                    
                }
            }
        }
    }
    else if(token1.type === "ID"){
        //TO DO
        //NEED WAY TO STORE VARIABLES AND THEIR DATA AS INPUT IS BEING PARSED
        //CAN STILL TECHNICALLY DO NOW, AND LEAVE FOR RUN TIME ISSUE
    }
    //The stringContent should have already been evaluated as being valid when the string token was created.
    //So checking it again for valid printable characters is unneeded, instead we can just look for symbols that
    //denote important syntax of a format statement.
    
    //If the string content contains {} or {NUMBER} then commit to the corresponding format
    //If both are used, then there's an error as both formats cannot be used together.
    //However {namedArgument} can be used with either format, so this will also have to be accounted for in some way.
    //In addition to accounting for this, all {namedArgument}s must be list at the end of the list of parameters for the format() function call
    if(True){
        //TO DO
    }
}

//"Test #{} For {} Strings".format(1, "Format")
//"Test #{} For {type} Strings".format(1, type = "Format")
function auto_format_occurs(string){
    var subStr = "{}";
    var numOfOccurs = 0;
    //TO DO
	
    
    return [numOfOccurs, numOfOccurs>0];
}

//"Test #{0} For {1} Strings".format(1, "Format")
//"Test #{number) For {0} Strings".format("Format", number = 1)
function manual_num_format_occurs(string){
    var numOfOccurs = 0;
    //TO DO
    
    return [numOfOccurs, numOfOccurs>0];
}

//"Test #{number} For {type} Strings".format(number = 1, type = "Format")
//Potentially create this function to return all values inside the bracket pairs and then check those values against
//the ID tokens used withing the paranthesis of the format() function call.
function manual_named_format_occurs(string){
    var numOfOccurs = 0;
    var namedArguements = [];
    //TO DO
    
    return [numOfOccurs, namedArguements];
}

function parse_input_stmt(input){
    //TO DO
}
function syntax_error(){
    document.write("<br>Syntax Error.<br>");
    return "";
}