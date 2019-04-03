
var instrList = new Array(); //global list of instructions
var funcList = new Array(); //list of callable functions
var varList = new Array(); //list of declared variables
var cmdCount = 1; //this is the instruction on, (instr); or (instr)\n should increment this value

//this cleans all the arrays & is called by testFile at start of a main call
function instrMaker_cleanUp(){
    instrList = [];
    funcList = [];
    varList = [];
    cmdCount = 1;
}

//instruction list operations
function pushInstr(inst, result, cmd, lineN, nextL){
    var instruction = {
        instr: inst, //atmoic instruction occuring
        result: result, //output of that instruction
        command: cmd, //for a next line button since next line might point to the same line
        lineNum: lineN, //line currently being run
        nextLine: nextL //where the next code line to run is
    };
    instrList.push(instruction);
}

//custom function list operations, will be updated once parser has full design
function pushFunc(fName){
    var Cust_Func = {
        name: fName, //name of function
        paramType: ["void"], //can be re-decalred later by doing "paramType.length = 0"
        returnType: "void"
    };
    funcList.push(Cust_Func);
}

//declare a new custom function and push it to the list of call-able functions
function pushFunc(fName, rType){
    var Cust_Func = {
        name: fName, //name of function
        paramType: ["void"], //can be re-decalred later by doing "paramType.length = 0"
        returnType: rType
    };
    funcList.push(Cust_Func);
}

function addParam(fName, param){ //refences function by name & updates its parameter list
    var index = -1;
    for(var x = 0; x < funcList.length; x++){
        if(funcList[x].name === fName)
            index = x;
    }
    if(index !== -1){
        if(funcList[index].paramType[0] === "void")
            funcList[index].paramType.length = 0; //declaring a none void param should be passed
        funcList[index].paramType.push(param);
    }
    return index; //used with addParamIndex to reduce search time
}

function addParamIndex(index, param){ //refences function by name & updates its parameter list when index is known
    if(funcList[index].paramType[0] === "void")
        funcList[index].paramType.length = 0; //declaring a none void param should be passed
    funcList[index].paramType.push(param);
}

//variable list operations
//check if a vairable name exists for operations
function varIsDeclared(vName){ //used to decide if a var should be declared or updated
    var index = -1;
    for(var x = 0; x < varList.length; x++){
        if(varList[x].id === vName)
            index = x;
    }
    return index;
}

//on new variable create it & push it to the list of variables
function pushVar(vName, vType, vValue, vFuncScope, vIndentScope){
    var Variable = {
        id: vName + "",
        type: vType + "",
        value: vValue + "",
        funcScope: "global",//name of function declared in (will be global, main, or some cust_func
        indentScope: vIndentScope //indent count when declared (cannot be referenced from smaller #
        //after decrementing the indent stack, remove any variables with same func scope & larger indent scope
    };
    varList.push(Variable);
}

//get the string value stored at the index under vValue
function getVarValue(index){
    return varList[index].value;
}

//push new string to the given index vValue
function updateVarValue(index, newVal){
    varList[index].value = newVal;
}

//priority queue operations
//finds the index of the largest priority operation & returns that index
function priorityPop(queue){
    var index = -1;
    var priority = -1;
    for(var x = 0; x < queue.length; x++){
        if(queue[x].priority > priority){
            index = x;
            priority = queue[x].priority;
        }
    }
    return index;
}

//takes an index (typically the one from priority pop), a queue, and a token resolution
//it will go to the token left of the passed index & update the various fields of that token to match the passed one
//and then it removes the index & index+1 token. Efefctively replacing the operated tokens with their resolution
function resolveQueue(index, queue, resolution){ 
    queue[index - 1].token.id = resolution.result; //update value
    queue[index - 1].token.type = resolution.type;
    queue.splice(index, 2); //remove the index & next index
}

var lineTokens = new Array(); //honestly, fuck the fact array.push() adds a pointer so updates to that data type are retroactive the array
function appendTokenList(item){ //because lexeme is dynamically updated in a list
    var temp = item;
    lineTokens.push(temp);
}

//unrefined starting class that directs instruction to their according method for complete resolution, currently only directs to assign statements
function create_instructions(input){
    //proof of concept
    var lineEnds = ["SEMICOLON", "END_OF_LINE", "END_OF_FILE"];
    var lexeme;
    while(input.length > 0){
        lineTokens = []; //reset array 
        let instr_line = " ";
        lexeme = getToken(input, true);
        instr_line += lexeme.id + " ";
        appendTokenList(lexeme);
        input = input.slice(lexeme.length);
        switch(lexeme.type){ //switch to find out which method to jump to, based off CFG
            case "BINARY": //all of these should cascade to math operation or comparison
            case "OCTAL":
            case "HEX":
            case "NUMBER":
            case "FLOAT":
            case "STRING":
            case "ID": //some assign statement or function call
                while(!lineEnds.includes(lexeme.type)){
                    lexeme = getToken(input, true);
                    if(!lineEnds.includes(lexeme.type)){ //don't push a line end token to the list getting resolved, but it will be sliced
                        instr_line += lexeme.id + " ";
                        appendTokenList(lexeme);
                    }
                    input = input.slice(lexeme.length);
                }
                pushInstr("Instruction" + instr_line, "", cmdCount, lexeme.line_no, 0); //this pushes the line being resolved before actualy step wise resolution
                order_assign_statement(lineTokens);
                lineTokens = [];
                break;
            case "WHILE":
                while(lexeme.type !== "COLON"){
                    lexeme = getToken(input, true);
                    if(lexeme.type !== "COLON"){
                        instr_line += lexeme.id + " ";
                        appendTokenList(lexeme);
                    }
                    input = input.slice(lexeme.length);
                }
                instr_line += lexeme.id + " "; //we want to see : on the instruction, but not he following line break
                appendTokenList(lexeme);
                input = input.slice(lexeme.length);
                lexeme = getToken(input, true); //next should be a linebreak that we don't want on the input
                input = input.slice(lexeme.length);
                
                pushInstr("Instruction" + instr_line, "", cmdCount, lexeme.line_no, 0); //this pushes the line being resolved before actualy step wise resolution
                order_while_loop(lineTokens);
                lineTokens = [];
                break;
            case "IF":
                break;
            default: document.write("Error ");
                input = input.slice(1);
                break;
        }
        cmdCount++;
    }
    return instrList;
}

/*
 This will convert the passed tokens into a priority queue of atomic operations. It will then iterate
through the operations and resolve them 1 at a time, pushing them to the instruction queue that gets returned
until there is only 1 token left to resolve. This method does not push the instructions, but calls methods that
push the appropriate syntax for operations. While it's called assign it can also handle standalone ops, like 3+3 or 4 == 5
 */
function order_assign_statement(passedTokens){
    var priorityMod = 0; //used to scope priority of () operations
    var instrQueue = new Array();
    var tempToken;
    var tempPriority;
    var dontQueue = false;
    for(var x = 0; x < passedTokens.length; x++){ //add passed tokens to instruction queue & priority
        if(passedTokens[x].type !== "SPACE"){
            tempToken = passedTokens[x];
            dontQueue = false;
            switch(passedTokens[x].type){//used to assign priority
                case "COMPARE_EQUALS": //operations can have comparators, for some reason
                case "LESS_THAN_EQUAL":
                case "LESS_THAN":
                case "GREATER_THAN_EQUAL":
                case "GREATER_THAN":
                case "NOT_EQUAL": tempPriority = 1 + priorityMod; //compares are that last things executed
                    break;
                case "PLUS":
                case "MINUS": tempPriority = 2 + priorityMod;
                    break;
                case "MULT":
                case "DIV": tempPriority = 3 + priorityMod;
                    break;
                case "MOD":
                case "EXPONENTIAL": tempPriority = 4 + priorityMod;
                    break;
                case "ADD_ASSIGN":
                case "SUB_ASSIGN":
                case "MULT_ASSIGN":
                case "DIV_ASSIGN":
                case "MOD_ASSIGN":
                case "ASSIGN_EQUALS": tempPriority = 0 + priorityMod;
                    priorityMod++; //assigns need to be read right to left, so we increment priority mod for each type assign
                    break;
                case "LPAREN": priorityMod += 10; //all parenthised operations need to be executed before a higher priority external instr.
                    dontQueue = true;
                    break;
                case "RPAREN": priorityMod -= 10;
                    dontQueue = true;
                    break;
                case "SEMICOLON": //these shouldn't be passed at all, but we want to really avoid treating them as instr. by this point
                case "END_OF_LINE":
                case "END_OF_FILE": dontQueue = true;
                    break;
                default: //ID, number, float, binary, octal, hex
                    tempPriority = -1;
                    break;

            }
            let rawInstr = { //let has scope only within if statement
                token: tempToken,
                priority: tempPriority
            };
            if(!dontQueue){
                instrQueue.push(rawInstr);//add the instr to the queue of operations getting resolved
            }
        }
    }
    
    for(var x = 0; x < instrQueue.length; x++){
        document.getElementById("outputField").value += instrQueue[x].token.id + " ";
    }
    document.getElementById("outputField").value += "\n";
    for(var x = 0; x < instrQueue.length; x++){
        document.getElementById("outputField").value += instrQueue[x].priority.toString() + " ";
    }
    document.getElementById("outputField").value += "\n";
    
    var opIndex = 1;
    var currentOp;
    var val1;
    var val2;
    var resolution;
    var mathOps = ["PLUS", "MINUS", "MULT", "DIV", "MOD"]; //list of operations that can be resolved in an assign statement before assigning
    var compareOps = ["COMPARE_EQUALS", "LESS_THAN", "LESS_THAN_EQUAL", "GREAT_THAN", "GREATER_THAN_EQUAL", "NOT_EQUAL"];
    while(instrQueue.length > 1){ //assignments should resolve down to a single vlaue remaining (and it is what was assigned to a variable)
        // get the 3 tokens operated on
        opIndex = priorityPop(instrQueue);
        val1 = instrQueue[opIndex-1].token;
        currentOp = instrQueue[opIndex].token;
        val2 = instrQueue[opIndex+1].token;
        //resolve any preceding negatives on these values
        if(val1.id.charAt(0) === "+" || val1.id.charAt(0) === "-"){
            let newVal = resolvePrecedingOperators(val1); //pass token, return string to update the value
            val1.id = newVal;
        }
        if(val2.id.charAt(0) === "+" || val2.id.charAt(0) === "-"){
            let newVal = resolvePrecedingOperators(val2); //pass token, return string to update the value
            val2.id = newVal;
        }
        //perform the operation
        if(mathOps.includes(currentOp.type)){ //if the next prioritized operation is math, go to resolve Math
            resolution = resolveMath(val1, currentOp, val2);
        }else if(compareOps.includes(currentOp.type)){ //check if it is a comparator
            resolution = resolveCompare(val1, currentOp, val2);
        }else{ //else it assumed to be an assignment statement
            resolution = resolveAssign(val1, currentOp, val2);
        }
        resolveQueue(opIndex, instrQueue, resolution); //remove these 3 tokens & replace with ID for the resolution
    }
    instrQueue = []; //for added measure, there should only be 1 token in the queue but it never hurts to empty it at conclusion
}

function order_while_loop(passedTokens){
    var priorityMod = 0; //used to scope priority of operations
    var instrQueue = new Array();
    var tempToken;
    var tempPriority;
    var dontQueue = false;
    for(var x = 0; x < passedTokens.length; x++){ //add passed tokens to instruction queue & priority
        if(passedTokens[x].type !== "SPACE"){
            tempToken = passedTokens[x];
            dontQueue = false;
            switch(passedTokens[x].type){//used to assign priority
                case "COMPARE_EQUALS": //operations can have comparators, for some reason
                case "LESS_THAN_EQUAL":
                case "LESS_THAN":
                case "GREATER_THAN_EQUAL":
                case "GREATER_THAN":
                case "NOT_EQUAL": tempPriority = 1 + priorityMod; //compares are that last things executed in this kind of operation
                    break;
                case "PLUS":
                case "MINUS": tempPriority = 2 + priorityMod;
                    break;
                case "MULT":
                case "DIV": tempPriority = 3 + priorityMod;
                    break;
                case "MOD":
                case "EXPONENTIAL": tempPriority = 4 + priorityMod;
                    break;
                case "LPAREN": priorityMod += 10; //all parenthised operations need to be executed before a higher priority external instr.
                    dontQueue = true;
                    break;
                case "RPAREN": priorityMod -= 10;
                    dontQueue = true;
                    break;
                case "COLON": //this should be passed, but it does'nt need to be queued
                case "END_OF_LINE": dontQueue = true; //this shouldn't be passed to begin with, but ensure it isn't queued
                    break;
                default: //ID, number, boolean, While, etc.
                    tempPriority = -1;
                    break;

            }
            let rawInstr = { //let has scope only within if statement
                token: tempToken,
                priority: tempPriority
            };
            if(!dontQueue){
                instrQueue.push(rawInstr);//add the instr to the queue of operations getting resolved
            }
        }
    }
    
    for(var x = 0; x < instrQueue.length; x++){
        document.getElementById("outputField").value += instrQueue[x].token.id + " ";
    }
    document.getElementById("outputField").value += "\n";
    for(var x = 0; x < instrQueue.length; x++){
        document.getElementById("outputField").value += instrQueue[x].priority.toString() + " ";
    }
    document.getElementById("outputField").value += "\n";
    
    var opIndex = 1;
    var currentOp;
    var val1;
    var val2;
    var resolution;
    var mathOps = ["PLUS", "MINUS", "MULT", "DIV", "MOD"]; //list of operations that can be resolved in an assign statement before assigning
    var compareOps = ["COMPARE_EQUALS", "LESS_THAN", "LESS_THAN_EQUAL", "GREAT_THAN", "GREATER_THAN_EQUAL", "NOT_EQUAL"];
    while(instrQueue.length > 2){ //while loops should boil down to "while ____" (the unfilled should be some boolean or value)
        // get the 3 tokens operated on
        opIndex = priorityPop(instrQueue);
        val1 = instrQueue[opIndex-1].token;
        currentOp = instrQueue[opIndex].token;
        val2 = instrQueue[opIndex+1].token;
        //resolve any preceding negatives on these values
        if(val1.id.charAt(0) === "+" || val1.id.charAt(0) === "-"){
            let newVal = resolvePrecedingOperators(val1); //pass token, return string to update the value
            val1.id = newVal;
        }
        if(val2.id.charAt(0) === "+" || val2.id.charAt(0) === "-"){
            let newVal = resolvePrecedingOperators(val2); //pass token, return string to update the value
            val2.id = newVal;
        }
        //perform the operation
        if(mathOps.includes(currentOp.type)){ //if the next prioritized operation is math, go to resolve Math
            resolution = resolveMath(val1, currentOp, val2);
        }else if(compareOps.includes(currentOp.type)){ //check if it is a comparator
            resolution = resolveCompare(val1, currentOp, val2);
        }//else a potential error
        resolveQueue(opIndex, instrQueue, resolution); //remove these 3 tokens & replace with ID for the resolution
    }
    //resolve the state of the while loop
    val1 = instrQueue[1].token; //at this point its only "while ____";
    var takeBranch = resolve_value_True_or_False(val1);
    if(takeBranch){
        pushInstr("The While loop evaluated to True, take the path", "" , cmdCount, val1.line_no, 0);
        //read & store nested instructions
    }else{
        pushInstr("The While loop evaluated to False, don't take the path", "" , cmdCount, val1.line_no, 0);
        //skip nested instructions
    }
    //check conditional & possibly loop again
    
}

function resolvePrecedingOperators(resolveToken){ //step by step resolution of "++--+#"
    var resolved;
    var instr = "";
    var result = "";
    var isNeg = false; // used to encompass a value as -(#) or as #, since -(-#) becomes # but -(#) is just -#
    var numbers = /^[0-9]+$/;
    var notResolved = true; //check to keep goingi until reaching the start of a number
    while(notResolved){
        //read "+"
        if(resolveToken.id.charAt(0) === "+"){
            if(resolveToken.id.charAt(1).match(numbers) || resolveToken.id.charAt(1) === "."){ //+# becomes #
                notResolved = false;
                instr = resolveToken.id;
                result = resolveToken.id.slice(1); //slice off the '+'
                if(isNeg) //indicate the whole number & its result are negative
                    pushInstr("Value -(" + instr + ")", " is resolved to -(" + result + ")", cmdCount, resolveToken.line_no, 0);
                else
                    pushInstr("Value " + instr, " is resolved to " + result, cmdCount, resolveToken.line_no, 0);
                resolved = result;
            }else{ //more +/-
                instr = resolveToken.id;
                result = resolveToken.id.slice(1); //slice off the '+'
                if(isNeg)
                    pushInstr("Value -(" + instr + ")", " is resolved to -(" + result + ")", cmdCount, resolveToken.line_no, 0);
                else
                    pushInstr("Value " + instr, " is resolved to " + result, cmdCount, resolveToken.line_no, 0);
                resolveToken.id = result;
            }
        //read "-"
        }else if(resolveToken.id.charAt(0) === '-'){//next is a negative & isNeg will be flipped
            if(resolveToken.id.charAt(1).match(numbers) || resolveToken.id.charAt(1) === "."){
                notResolved = false;
                if(isNeg)
                    instr = "-(" + resolveToken.id + ")";
                else
                    instr = resolveToken.id;
                result = resolveToken.id.slice(1); //slice off the '-'
                isNeg = !isNeg;
                if(!isNeg) //only push an instruction of --# to #
                    pushInstr("Value " + instr, " is resolved to " + result, cmdCount, resolveToken.line_no, 0);
                //we do slice off the - even if it is the last -, but there is not need to say -# resolves to -(#)
                resolved = result;
            }else{ //more +/-
                if(isNeg)
                    instr = "-(" + resolveToken.id + ")";
                else
                    instr = resolveToken.id;
                result = resolveToken.id.slice(1); //slice off the '-'
                isNeg = !isNeg;
                if(isNeg)
                    pushInstr("Value " + instr, " is resolved to -(" + result + ")", cmdCount, resolveToken.line_no, 0);
                else
                    pushInstr("Value " + instr, " is resolved to " + result, cmdCount, resolveToken.line_no, 0);
                resolveToken.id = result;
            }
        }
    }
    if(isNeg) //last resolution was -# resolves to -(#), but we sliced off the - and need to put it back
        resolved = "-" + resolved; //add the - outisde parantheses to the official return
    return resolved;
}

//this will take whatever token is passed and get its vValue, be it a raw number and its number or a variable and its number
//converts bin, oct, & hex to their numerical equivalents
function convertTokenToValue(token){
    var value;
    var instr, result;
    instr = token.id;
    var index;
    var isNeg = false;
    if(token.id.charAt(0) === "-"){
        isNeg =true;
        token.id = token.id.slice(1);
    }
    if(token.type === "ID"){
        instr = "\"" + instr + "\""; //when pushing conversion instruction it will read "Value "var" "
        index = varIsDeclared(token.id);
        if(index !== -1){//not a new variable
            value = Number.parseInt(getVarValue(index), 10);//assumes to be an int at this point
        }else{//new variable, but it can't be declared here
            
        }
    }else{
        switch(token.type){
            case "FLOAT":
                if(isNeg)
                    token.id = "-" + token.id;
                value = Number.parseFloat(token.id);
                break;
            case "NUMBER":
                if(isNeg)
                    token.id = "-" + token.id;
                value = Number.parseInt(token.id, 10);
                break;
            case "BINARY":
                token.id = token.id.slice(2); //slice off 0b for conversion
                if(isNeg)
                    token.id = "-" + token.id;
                value = Number.parseInt(token.id, 2);
                break;
            case "OCTAL":
                token.id = token.id.slice(2); //slice off 0o for conversion
                if(isNeg)
                    token.id = "-" + token.id;
                value = Number.parseInt(token.id, 8);
                break;
            case "HEX":
                token.id = token.id.slice(2); //slice off 0x for conversion
                if(isNeg)
                    token.id = "-" + token.id;
                value = Number.parseInt(token.id, 16);
                break;
            case "STRING":
                if(isNeg)
                    token.id = "-" + token.id;
                value = token.id;
                break;
            case "True":
                value = 1;
                break;
            case "False":
                value = 0;
                break;
        }
    }
    result = value;
    //push any conversion instruction, such as a variable to its vValue or a binary to its base 10 equivalent
    if(token.type !== "NUMBER" && token.type !== "FLOAT" && token.type !== "True" && token.type !== "False"){ //nothing to really show on that conversion
        pushInstr("Value " + instr, " is resolved to " + result, cmdCount, token.line_no, 0);
    }
    return value;
}

function resolveMath(val1, op, val2){
    var instr, resolved, lineN;
    lineN = op.line_no;
    var num1, num2;
    num1 = convertTokenToValue(val1);
    num2 = convertTokenToValue(val2);
    switch(op.type){
        case "PLUS":
            resolved = num1 + num2;
            break;
        case "MINUS":
            resolved = num1 - num2;
            break;
        case "MULT":
            resolved = num1 * num2;
            break;
        case "DIV":
            resolved = num1 / num2;
            break;
        case "MOD":
            resolved = num1 % num2;
            break;
    }
    instr = num1 + " " + op.id + " " + num2;
    //push the math operation performed
    pushInstr("Operation " + instr, " is resolved to " + resolved, cmdCount, lineN, 0);
    var resultType = "NUMBER"; //determined later
    var resolution = {
        result: resolved + "",
        type: resultType
    };
    return resolution;
}

function resolveCompare(val1, op, val2){
    var instr, resolved, lineN;
    lineN = op.line_no;
    var num1, num2;
    num1 = convertTokenToValue(val1);
    num2 = convertTokenToValue(val2);
    switch(op.type){
        case "COMPARE_EQUALS":
            if(num1 === num2)
                resolved = "True";
            else
                resolved = "False";
            break;
        case "LESS_THAN":
            if(num1 < num2)
                resolved = "True";
            else
                resolved = "False";
            break;
        case "LESS_THAN_EQUAL":
            if(num1 <= num2)
                resolved = "True";
            else
                resolved = "False";
            break;
        case "GREATER_THAN":
            if(num1 > num2)
                resolved = "True";
            else
                resolved = "False";
            break;
        case "GREATER_THAN_EQUAL":
            if(num1 >= num2)
                resolved = "True";
            else
                resolved = "False";
            break;
        case "NOT_EQUAL":
            if(num1 !== num2)
                resolved = "True";
            else
                resolved = "False";
            break;
    }
    instr = num1 + " " + op.id + " " + num2;
    //push the math operation performed
    pushInstr("Comparison " + instr, " is resolved to " + resolved, cmdCount, lineN, 0);
    var resultType = "False"; //boolean is not a lexer type, only True or False
    if(resolved === "True")
        resultType = "True";
    var resolution = {
        result: resolved + "",
        type: resultType
    };
    return resolution;
}

function resolveAssign(val1, op, val2){
    var instr, resolved, lineN, intermediateRes;
    var index, newVal;
    let tmpOp = op;
    switch(op.type){
        case "ASSIGN_EQUALS":
            instr = val1.id + " " + op.id + " " + val2.id;
            newVal = val2.id;
            resolved = val2.id + " assigned to variable \"" + val1.id + "\"";
            break;
        case "ADD_ASSIGN":
            tmpOp.id = "+";
            tmpOp.type = "PLUS";
            intermediateRes = resolveMath(val1, tmpOp, val2); //perform the + in += as its own atomic operation
            newVal = intermediateRes.result; //store the result
            instr = val1.id + " = " + newVal; //treat the result as the # being assigned
            resolved = intermediateRes.result + " assigned to variable \"" + val1.id + "\"";
            break;
        case "SUB_ASSIGN":
            tmpOp.id = "-";
            tmpOp.type = "MINUS";
            intermediateRes = resolveMath(val1, tmpOp, val2);
            newVal = intermediateRes.result;
            instr = val1.id + " = " + newVal;
            resolved = intermediateRes.result + " assigned to variable " + val1.id;
            break;
        case "MULT_ASSIGN":
            tmpOp.id = "*";
            tmpOp.type = "MULT";
            intermediateRes = resolveMath(val1, tmpOp, val2);
            newVal = intermediateRes.result;
            instr = val1.id + " = " + newVal;
            resolved = intermediateRes.result + " assigned to variable \"" + val1.id + "\"";
            break;
        case "DIV_ASSIGN":
            tmpOp.id = "/";
            tmpOp.type = "DIV";
            intermediateRes = resolveMath(val1, tmpOp, val2);
            newVal = intermediateRes.result;
            instr = val1.id + " = " + newVal;
            resolved = intermediateRes.result + " assigned to variable \"" + val1.id + "\"";
            break;
        case "MOD_ASSIGN":
            tmpOp.id = "%";
            tmpOp.type = "MOD";
            intermediateRes = resolveMath(val1, tmpOp, val2);
            newVal = intermediateRes.result;
            instr = val1.id + " = " + newVal;
            resolved = intermediateRes.result + " assigned to variable \"" + val1.id + "\"";
            break;
    }
    if(val1.type === "ID"){ //update the variable that had a nmuber assigned to it
        index = varIsDeclared(val1.id);
        if(index === -1){//new variable
            //pushVar(vName, vType, vValue, vFuncScope, vIndentScope)
            pushVar(val1.id, val2.type, newVal, "global", 0);
        }else{ //update existing
            updateVarValue(index, newVal);
        }
    }//else this is an invalid assignment statement
    pushInstr("Assignment " + instr, " resolved to value " + resolved, cmdCount, lineN, 0);
    var resultType = "ID"; //assign should always go to ID, 4 = 5
    var resolution = {
        result: newVal + "",
        type: resultType
    };
    return resolution;
}

//called on conditionals, such as if, elif, or while
function resolve_value_True_or_False(passedVal){
    var tokenValue = convertTokenToValue(passedVal);
    var isTrue = true;
    if(tokenValue === 0)
        isTrue = false;
    return isTrue;
}

function resolve_abs(token)
{
    var tokenVal = Math.abs(convertTokenToValue(token));
    push_Instr("abs(" + token.id + ") ", "resolves to ", tokenVal + "", cmdCount, 0, 0);
    
    var resolution = {
        result: tokenVal + "",
        type: token.type
    };
    
    return resolution;
}

function resolve_bin(token)
{
    var tokenVal = convertTokenToValue(token);
    
    if (tokenVal < 0)
    {
        tokenVal = tokenVal.toString(2);
        var newVal = tokenVal.slice(0,1) + "0b" + tokenVal.slice(1);
    }

    else
    {
        var newVal = "0b" + tokenVal.toString(2);
    }
    
    push_Instr("bin(" + token.id + ") ", "resolves to ", newVal + "", cmdCount, 0, 0);
    
    var resolution = {
        result: newVal + "",
        type: "BINARY"
    };
    
    return resolution;
}

function resolve_bool(token)
{  
    if (token !== Null)
    {
        var tokenVal = resolve_value_True_or_False(token);  
        if (tokenVal)
        {
            var resolution = {
                result: "True",
                type: "TRUE"
            };

            push_Instr("bool(" + token.id + ") ", "resolves to True", cmdCount, 0, 0);
            return resolution;
        }

        else
        {
            var resolution = {
                result: "False",
                type: "FALSE"
            };

            push_Instr("bool(" + token.id + ") ", "resolves to False", cmdCount, 0, 0);
            return resolution;
        }
    }
    
    else
    {
        var resolution = {
            result: "False",
            type: "FALSE"
        };
        push_Instr("bool(" + token.id + ") ", "resolves to False", cmdCount, 0, 0);
        return resolution;
    }
}

function resolve_chr(token)
{
    var tokenVal = convertTokenToValue(token);
    var newVal = String.fromCharCode(tokenVal);
    
    var resolution = {
        result: newVal + "",
        type: "ASCII"
    };
    
    push_Instr("chr(" + token.id + ") ", "resolves to ", cmdCount, 0, 0);
    return resolution;
}

function resolve_float(token)
{
    var tokenVal = convertTokenToValue(token);
    
    if (Number.isInteger(tokenVal))
    {
        var newVal = tokenVal + ".0";
        
        var resolution = {
            result: newVal + "",
            type: "FLOAT"
        };
        push_Instr("float(" + token.id + ") ", "resolves to ", newVal + "", cmdCount, 0, 0);
        
        return resolution;
    }
    
    else if (Number.isFloat(tokenVal))
    {
        var newVal = tokenVal;
        
        var resolution = {
            result: newVal + "",
            type: "FLOAT"
        };
        push_Instr("float(" + token.id + ") ", "resolves to ", newVal + "", cmdCount, 0, 0);
        
        return resolution;
    }
    
    else if (tokenVal === "Infinity")
    {
        var newVal = tokenVal;
        
        var resolution = {
            result: "inf",
            type: "FLOAT"
        };
        push_Instr("float(" + token.id + ") ", "resolves to inf", cmdCount, 0, 0);
        
        return resolution;
    }
    
    else if (tokenVal === "-Infinity")
    { 
        var resolution = {
            result: "-inf",
            type: "FLOAT"
        };
        push_Instr("float(" + token.id + ") ", "resolves to -inf", cmdCount, 0, 0);
        
        return resolution;
    }
    
    else
    {
        var resolution = {
            result: "Unknown",
            type: "ERROR"
        };
        push_Instr("float(" + token.id + ") ", "resolves to Unknown", cmdCount, 0, 0);
        
        return resolution;
    }
}

function resolve_hex(token)
{
    var tokenVal = convertTokenToValue(token);
    
    if (tokenVal < 0)
    {
        tokenVal = tokenVal.toString(16);
        var newVal = tokenVal.slice(0,1) + "0x" + tokenVal.slice(1);
        
        push_Instr("hex(" + token.id + ") ", "resolves to ", newVal, cmdCount, 0, 0);
    }

    else
    {
        var newVal = "0x" + tokenVal.toString(16);
        
        push_Instr("hex(" + token.id + ") ", "resolves to ", newVal, cmdCount, 0, 0);
    }
    
    var resolution = {
        result: newVal + "",
        type: "ASCII"
    };
    
    return resolution;
}

function resolve_len(token)
{
    var tokenVal = convertTokenToValue(token);
    
    if (typeof tokenVal === "string")
    {
        var newVal = tokenVal.length;
        var resolution = {
            result: newVal + "",
            type: "ID"
        };
        
        push_Instr("len(" + token.id + ") ", "resolves to ", newVal + "", cmdCount, 0, 0);  
    }
    
    else
    {       
        var resolution = {
            result: "Unknown",
            type: "ERROR"
        };        
        
        push_Instr("len(" + token.id + ") ", "resolves to Unknown", cmdCount, 0, 0);  
    }
        
    return resolution;   
}

function resolve_oct(token)
{
    var tokenVal = convertTokenToValue(token);
    
    if (tokenVal < 0)
    {
        tokenVal = tokenVal.toString(8);
        var newVal = tokenVal.slice(0,1) + "0o" + tokenVal.slice(1);
        
        push_Instr("oct(" + token.id + ") ", "resolves to ", newVal, cmdCount, 0, 0);
    }

    else
    {
        var newVal = "0o" + tokenVal.toString(8);
        
        push_Instr("oct(" + token.id + ") ", "resolves to ", newVal, cmdCount, 0, 0);
    }
 
    var resolution = {
        result: newVal + "",
        type: "ID"
    };
    
    return resolution;
}

function resolve_ord(token)
{
    var tokenID = token.id;
    
    if ((typeof tokenID === "string") && (tokenID.length === 1))
    {
        var newVal = tokenID.charCodeAt();
        
        var resolution = {
            result: newVal + "",
            type: "INTEGER"
        }; 
        
        push_Instr("ord(" + token.id + ") ", "resolves to ", newVal + "", cmdCount, 0, 0);
    }
    
    else
    {       
        var resolution = {
            result: "Unknown",
            type: "ERROR"
        };        
        
        push_Instr("ord(" + token.id + ") ", "resolves to Unknown", cmdCount, 0, 0);
    }
    
    return resolution; 
}

function resolve_str(token)
{
    var tokenVal = convertTokenToValue(token);
    
    var newVal = tokenVal.toString();
    
    var resolution = {
        result: newVal,
        type: "STRING"
    }; 
    
    push_Instr("str(" + token.id + ") ", "resolves to ", newVal, cmdCount, 0, 0);
}

function resolve_type(token)
{
    var tokenVal = convertTokenToValue(token);
    
    var newVal = typeof tokenVal;
    
    var resolution = {
        result: newVal,
        type: "STRING"
    }; 
  
    push_Instr("type(" + token.id + ") ", "resolves to ", newVal, cmdCount, 0, 0);
}

function resolve_ceil(token)
{
    var tokenVal = convertTokenToValue(token);
    
    if (Number.isInteger(tokenVal) || Number.isFloat(tokenVal))
    {
        var newVal = Math.ceil(tokenVal);
        
        var resolution = {
            result: newVal + "",
            type: "ID"
        };        
    }
    
    else
    {
         var resolution = {
            result: "Unknown",
            type: "ID"
        };       
    }
       
    push_Instr("ceil(" + token.id + ") ", "resolves to ", cmdCount, 0, 0);
    return resolution;
}

function resolve_floor(token)
{
    var tokenVal = convertTokenToValue(token);
    
    if (Number.isInteger(tokenVal) || Number.isFloat(tokenVal))
    {
        var newVal = Math.ceil(tokenVal);
        
        var resolution = {
            result: newVal + "",
            type: "ID"
        };        
    }
    
    else
    {
        var resolution = {
            result: "Unknown",
            type: "ID"
        };       
    }
       
    push_Instr("floor(" + token.id + ") ", "resolves to ", cmdCount, 0, 0);
    return resolution;
}

function resolve_sqrt(token)
{
    var tokenVal = convertTokenToValue(token);
    
    var newVal = Math.sqrt(tokenVal);
    var resolution = {
        result: newVal + "",
        type: "FLOAT"
    };
    
    push_Instr("sqrt(" + token.id + ") ", "resolves to ", cmdCount, 0, 0);
    return resolution;
}

function resolve_cos(token)
{
    var tokenVal = convertTokenToValue(token);
    
    var newVal = Math.cos(tokenVal);
    
    var resolution = {
        result: newVal + "",
        type: "FLOAT"
    };    
    
    push_Instr("cos(" + token.id + ") ", "resolves to ", cmdCount, 0, 0);
    return resolution;
}

function resolve_sin(token)
{
    var tokenVal = convertTokenToValue(token);
    
    var newVal = Math.sin(tokenVal);
    
    var resolution = {
        result: newVal + "",
        type: "FLOAT"
    };    
    
    push_Instr("sin(" + token.id + ") ", "resolves to ", cmdCount, 0, 0);
    return resolution;   
}

function resolve_built_ins(token)
{
    var res;
    switch (token.id){
        case "abs":
            res = resolve_abs(token);
            break;
        case "bin":
            res = resolve_bin(token);
            break;
        case "bool":
            res = resolve_bool(token);
            break;
        case "chr":
            res = resolve_chr(token);
            break;
        case "float":
            res = resolve_float(token);
            break;
        case "hex":
            res = resolve_hex(token);
            break;
        case "len":
            res = resolve_len(token);
            break;
        case "oct":
            res = resolve_oct(token);
            break;
        case "ord":
            res = resolve_ord(token);
            break;
        case "str":
            res = resolve_str(token);
            break;
        case "type":
            res = resolve_type(token);
            break;
        case "cell":
            res = resolve_cell(token);
            break;
        case "floor":
            res = resolve_floor(token);
            break;
        case "sqrt":
            res = resolve_sqrt(token);
            break;
        case "cos":
            res = resolve_cos(token);
            break;
        case "sin":
            res = resolve_sin(token);
            break;
    }
}
