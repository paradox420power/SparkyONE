/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */



function main(){
   //var input = prompt("INPUT:")
    
    var input =
"a = 3 - -4\n\
b = a+4";
    var lexeme; //used in lexer debugging
    
    document.write("Input Code: " + input + "<br><br>");
    
    //below is code for testing lexer token identification
    document.write("<b>Lexer:</b><br>");
    var tmpInput = input;
    while(tmpInput.length > 0){
        lexeme = getToken(tmpInput);
        tmpInput = tmpInput.slice(lexeme.length);
        if(lexeme.type !== "SPACE")
            document.write("ID: " + lexeme.id + ", Type: " + lexeme.type + ", Length: " + lexeme.length + ", Line: " + lexeme.line_no + "<br>");
    }
    
    document.write("<br><b>Parser:</b><br>");
    parse_begin_program(input); //ensure code is syntactically legal first
    document.write("<br><b>Runtime:</b><br>");
    var instrList = new Array();
    instrList = create_instructions(input);
    for(var x = 0; x < instrList.length; x++){
        document.write((x+1) + ") Operation " + instrList[x].instr + " resolves to " + instrList[x].result + "<br>");
    }
    
    
    document.write("<br>End of Program");
}
