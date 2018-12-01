/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */



function main(){
    var input = "a=5;a=6+9;a=7;\nb=5     \nc += 89 + 45.85";
    /*var input1 = ""
    var lexeme = getToken(input1);
    
    //document.write(input + "<br><br>");
    //document.write("ID: " + lexeme.id + ", Type: " + lexeme.type + ", Length: " + lexeme.length + ", Line: " + lexeme.line_no + "<br><br>");
    
    while(input1.length > 0){
        lexeme = getToken(input1);
        input1 = input1.slice(lexeme.length);
        document.write("ID: " + lexeme.id + ", Type: " + lexeme.type + ", Length: " + lexeme.length + ", Line: " + lexeme.line_no + "<br><br>");
    }
    
    if(input1.length === 0){
        lexeme = getToken(input1);
        input1 = input1.slice(lexeme.length);
        document.write("ID: " + lexeme.id + ", Type: " + lexeme.type + ", Length: " + lexeme.length + ", Line: " + lexeme.line_no + "<br><br>");
    }*/
    
    parse_program(input);
    
    document.write("END_OF_FILE");
}
