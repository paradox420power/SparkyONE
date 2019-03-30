/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

function main(){
 
    lexer_cleanUp();
    instrMaker_cleanUp(); //reset from any prior code inputs, such as code_line & character ranges
    
    var input =document.getElementById("inputField").value;
    document.getElementById("outputField").value = "";
    var output;
    var lexeme; //used in lexer debugging
    
    output = "Input Code: " + input + "\n";
    
 
    output += "Lexer:  \n";

    var tmpInput = input;
    while(tmpInput.length > 0){
        lexeme = getToken(tmpInput, true);
        tmpInput = tmpInput.slice(lexeme.length);
        if(lexeme.type !== "SPACE")
           output += ("ID: " + lexeme.id + ", Type: " + lexeme.type + ", Length: " + lexeme.length + ", Line: " + lexeme.line_no + ", Uses characters " + lexeme.charStart + "-" + lexeme.charEnd + "\n" );
    }
    
    //document.getElementById("outputField").value = output;
    
    output += "\nParser:  \n" ;
    
    output += "\nRuntime:  \n";

    var instrList = new Array();
    instrList = create_instructions(input);
    for(var x = 0; x < instrList.length; x++){
        output += ((x+1) + ") " + instrList[x].instr + " " + instrList[x].result + "\n");
    }
    
    document.getElementById("outputField").value = output;
}
