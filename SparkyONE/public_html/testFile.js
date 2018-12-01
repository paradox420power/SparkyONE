/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */



function main(){
    var input =
"\
\n\
\n\
if a <= assign:  \n\
    a *= a * a - 7 % True / False\n\
    a = a += 4 - 5\n\
else b != a:\n\
    b =b         = c = false; a = a==a;";
    var lexeme;
    
    document.write(input + "<br><br>");
    
    parse_begin_program(input);
    
    /*while(input.length > 0){
        lexeme = getToken(input);
        input = input.slice(lexeme.length);
        document.write("ID: " + lexeme.id + ", Type: " + lexeme.type + ", Length: " + lexeme.length + ", Line: " + lexeme.line_no + "<br><br>");
    }*/
    document.write("END_OF_FILE");
}
