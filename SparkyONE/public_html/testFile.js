/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */



function main(){
    var input = "for   ()";
    var lexeme = getToken(input);
    document.write(input + "<br><br>");
    
    while(input.length > 0){
        lexeme = getToken(input);
        input = input.slice(lexeme.length);
        document.write("ID: " + lexeme.id + ", Type: " + lexeme.type + ", Length: " + lexeme.length + ", Line: " + lexeme.line_no + "<br><br>");
    }
    document.write("END_OF_FILE");
}
