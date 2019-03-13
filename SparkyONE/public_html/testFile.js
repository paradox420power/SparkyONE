/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */



function main(){


    
    var input =document.getElementById("inputField").value
    var output
    /*
"a = 3 + 2\n\
a += 3";*/
    var lexeme; //used in lexer debugging
    
    output = "Input Code: " + input + "\n";
    
 
    output += "Lexer:  \n";

    var tmpInput = input;
    while(tmpInput.length > 0){
        lexeme = getToken(tmpInput, true);
        tmpInput = tmpInput.slice(lexeme.length);
        if(lexeme.type !== "SPACE")
           output += ("ID: " + lexeme.id + ", Type: " + lexeme.type + ", Length: " + lexeme.length + ", Line: " + lexeme.line_no + "\n" );
    }
    
    output += "Parser:  \n" ;

    output += "Runtime:  \n";

    document.getElementById("outputField").value = output

    var instrList = new Array();
    instrList = create_instructions(input);
    for(var x = 0; x < instrList.length; x++){
        output += ((x+1) + ") Operation " + instrList[x].instr + " resolves to " + instrList[x].result + "\n");
    }
    
}
