
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
function pushInstr(inst, result, cmd, lineN, nextL){ //INSTR = abs of -1, result = resolves to 1
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

function getVarType(index){
    return varList[index].type;
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
function resolveQueue(index, queue, resolution, prefixLength, suffixLength){
    
    queue[index].token.id = resolution.result; //update value in the queue
    queue[index].token.type = resolution.type; // update type
    queue[index].priority = -1; //after any operation it should not be replaced with another operation
    
    if(index + suffixLength < queue.length) //don' slice off what isn't there
        queue.splice(index + 1, suffixLength); //go to next token & slice off the related tokens to the operation
   
    if(index - prefixLength > -1) //don't slice off what isn't there
        queue.splice(index - prefixLength, prefixLength); //slice off preceding tokens related to the operation
    
}

var lineTokens = new Array(); //honestly, fuck the fact array.push() adds a pointer so updates to that data type are retroactive the array
function appendTokenList(item){ //because lexeme is dynamically updated in a list
    var temp = item;
    lineTokens.push(temp);
}

function skipEmptyLines(input){
    var token = getToken(input, false);
    var token2;
    if(token.type === "SPACE" || token.type === "SEMICOLON"){
        input = input.slice(token.length); //slice off the spaces
        token2 = getToken(input, false);
        if(token2.type === "END_OF_LINE"){ //if next is line break, its ok
            readEmptyLines();
        }else{ //some keyword was read & the spaces could be indent that need to be read
            if(token.type === "SPACE"){
                for(i = 0; i < token.length; i++){
                    input = " " + input;
                }
                //increase_indent();
            }else{
                input = token.id + "" + input; //add spliced id back to front of program
            }
        }
    }else if(token.type === "END_OF_LINE"){
        input = input.slice(token.length);
        readEmptyLines();
    }
    return input;
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
            case "SEMICOLON": //usually sliced at end of instruction lnie, this catches ";;"
            case "SPACE":
            case "END_OF_LINE": input = skipEmptyLines(input);
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
                case "AND":
                case "OR": tempPriority = 1 + priorityMod;
                    break;
                case "NOT": tempPriority = 2 + priorityMod;
                    break;
                case "COMPARE_EQUALS": //operations can have comparators, for some reason
                case "LESS_THAN_EQUAL":
                case "LESS_THAN":
                case "GREATER_THAN_EQUAL":
                case "GREATER_THAN":
                case "NOT_EQUAL": tempPriority = 3 + priorityMod;
                    break;
                case "PLUS":
                case "MINUS": tempPriority = 4 + priorityMod;
                    break;
                case "MULT":
                case "DIV": tempPriority = 5 + priorityMod;
                    break;
                case "MOD":
                case "EXPONENTIAL": tempPriority = 6 + priorityMod;
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
                    dontQueue = true; //don't push Parens to the Queue
                    break;
                case "RPAREN": priorityMod -= 10;
                    dontQueue = true;
                    break;
                case "COMMA": dontQueue = true; //function will have commas, but we dont really care, ex. max(1,2,3)
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
    var val1, val2;
    var prefixLength = 0;
    var suffixLength = 0;
    var hasPrefixLength, hasSuffixLength, tmpIndex;
    var validOp = false; //used to check for misunderstandings in the tokens before operating
    var resolution;
    var mathOps = ["PLUS", "MINUS", "MULT", "DIV", "MOD"]; //list of operations that can be resolved in an assign statement before assigning
    var compareOps = ["COMPARE_EQUALS", "LESS_THAN", "LESS_THAN_EQUAL", "GREAT_THAN", "GREATER_THAN_EQUAL", "NOT_EQUAL"];
    var logicalOps = ["AND", "OR", "NOT"];
    while(instrQueue.length > 1){ //assignments should resolve down to a single vlaue remaining (and it is what was assigned to a variable)
        // get the tokens operated on
        //get the next priority operation
        opIndex = priorityPop(instrQueue);
        currentOp = instrQueue[opIndex].token;
        
        val1 = val2 = null; //reset these to help catch errors
        prefixLength = suffixLength = 0; //reset these lengths
        hasPrefixLength = hasSuffixLength = false;
        validOp = false;
        //get all tokens before this operation pertaining to its execution
        tmpIndex = opIndex - 1; //go 1 to the left in the instrQueue
        //console.log("OP " + instrQueue[opIndex].token.id);
        //console.log("Prefix " +tmpIndex + " & " + prefixLength);
        while(!hasPrefixLength){ //skims backwards to get the start index & length of val 1
            if(tmpIndex > -1 && instrQueue[tmpIndex].priority === -1){ //stay in array bounds & don't look at operations
                prefixLength++; //looked at token is part of prefix
                tmpIndex--; //decrement to next token in instrQueue
            }else{ //has reached end of instrQueue or preceding operation
                hasPrefixLength = true;
                tmpIndex++; //increment back up to last valid token in the prefix
            }
        }
        //console.log("Prefix " +tmpIndex + " & " + prefixLength);
        if(prefixLength !== 0){
            val1 = instrQueue[tmpIndex].token;
            //resolve any preceding negatives on these value
            if(val1.id.charAt(0) === "+" || val1.id.charAt(0) === "-"){
                let newVal = resolvePrecedingOperators(val1); //pass token, return string to update the value
                val1.id = newVal;
            }
        }
        
        //get all tokens after the operation pertaining to its execution
        tmpIndex = opIndex + 1;
        //console.log("Suffix " +tmpIndex + " & " + suffixLength);
        while(!hasSuffixLength){
            if(tmpIndex < instrQueue.length && instrQueue[tmpIndex].priority === -1){//still in instrQueue bounds & looking at non-operator tokens
                suffixLength++;
                tmpIndex++;
            }else{
                hasSuffixLength = true;
                tmpIndex--; //decrement back to last valid token
            }
        }
        //console.log("Suffix " +tmpIndex + " & " + suffixLength);
        if(suffixLength !== 0){
            val2 = instrQueue[opIndex + 1].token;
            //resolve preceding operations on the token
            if(val2.id.charAt(0) === "+" || val2.id.charAt(0) === "-"){
                let newVal = resolvePrecedingOperators(val2); //pass token, return string to update the value
                val2.id = newVal;
            }
        }
        
        //need to check there isn't an instance of 3 + --(-2), because the "-" in "+--" is seens a subtraction w/out operators & should be concat to -2
        if(prefixLength === 0 && suffixLength === 0){
            //we need to resolve the instrQueue to account for incorrect - & + before a number
            tmpIndex = opIndex + 1;
            hasSuffixLength = false;
            let unassignedOps = ""; //these will be concat to the front of the next id/number token
            //TODO
        }else{ //there was a prefix or suffix to perform the operation upon
            validOp = true;
        }
        
        //perform the operation
        if(validOp){
            if(mathOps.includes(currentOp.type)){ //if the next prioritized operation is math, go to resolve Math
                if((currentOp.type === "PLUS" || currentOp.type === "MINUS") && prefixLength === 0){ //special check case of -(-2) where the "-" outside paren is seen as a minus
                    val2.id = currentOp.id + val2.id; //concat the op to the front of the value
                    let newVal = resolvePrecedingOperators(val2); //resolve it like a normal -- or -+ instance
                    val2.id = newVal;
                    resolution = {
                        result: val2.id + "",
                        type: val2.type
                    };
                }else
                    resolution = resolveMath(val1, currentOp, val2);
            }else if(compareOps.includes(currentOp.type)){ //check if it is a comparator
                resolution = resolveCompare(val1, currentOp, val2);
            }else if(logicalOps.includes(currentOp.type)){
                resolution = resolveLogicalOp(val1, currentOp, val2);
                if(currentOp.type === "NOT")
                    prefixLength = 0; //even if a valid token was in front of "not" it didn't actually perform in this operation
            }else{ //else it assumed to be an assignment statement
                resolution = resolveAssign(val1, currentOp, val2);
            }
        }
        //regardless of op validity, a resolution is needed
        resolveQueue(opIndex, instrQueue, resolution, prefixLength, suffixLength); //remove these tokens & replace with ID for the resolution
        
        //for debugging purposes
        for(var x = 0; x < instrQueue.length; x++){
            document.getElementById("outputField").value += instrQueue[x].token.id + " ";
        }
        document.getElementById("outputField").value += "\n";
        for(var x = 0; x < instrQueue.length; x++){
            document.getElementById("outputField").value += instrQueue[x].priority.toString() + " ";
        }
        document.getElementById("outputField").value += "\n";
        
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
                case "AND":
                case "OR":
                case "NOT": tempPriority = 1 + priorityMod;
                    break;
                case "COMPARE_EQUALS": //operations can have comparators, for some reason
                case "LESS_THAN_EQUAL":
                case "LESS_THAN":
                case "GREATER_THAN_EQUAL":
                case "GREATER_THAN":
                case "NOT_EQUAL": tempPriority = 2 + priorityMod; //compares are that last things executed in this kind of operation
                    break;
                case "PLUS":
                case "MINUS": tempPriority = 3 + priorityMod;
                    break;
                case "MULT":
                case "DIV": tempPriority = 4 + priorityMod;
                    break;
                case "MOD":
                case "EXPONENTIAL": tempPriority = 5 + priorityMod;
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
    var logicalOps = ["AND", "OR", "NOT"];
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
        }else if(logicalOps.includes(currentOp.type)){
            resolution = resolveLogicalOp(val1, currentOp, val2);
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
            var valueType = getVarType(index);
            if(valueType === "TRUE"){
                value = 1;
                result = "True";
            }else if(valueType === "FALSE"){
                value = 0;
                result = "False";
            }else if(valueType === "FLOAT"){
                value = Number.parseFloat(getVarValue(index));
                result = value;
            }else{
                value = Number.parseInt(getVarValue(index), 10);//assumes to be an int at this point
                result = value;
            }
        }else{//new variable, but it can't be declared here
            //Undecalred variable error to put here
        }
        pushInstr("Variable " + instr, " is resolved to " + result, cmdCount, token.line_no, 0);
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
            case "TRUE":
                value = 1;
                break;
            case "FALSE":
                value = 0;
                break;
        }
        //push hex, oct, & binary conversion
        if(token.type === "BINARY" || token.type === "OCTAL" || token.type === "HEX"){ //nothing to really show on that conversion
            result = value;
            pushInstr("Value " + instr, " is resolved to " + result, cmdCount, token.line_no, 0);
        }
    }
    return value;
}

//This method takes in 2 tokens & compares their type and what operation i performed between them
//it then returns a string that is the type of the rseulting token
//It will also catch type mismatch operations
function getResultType(token1, operation, token2){
    var resultType;
    if(token1.type === "ID"){//resolve variable type by checking declared variables
        let index = varIsDeclared(token1.id);
        if(index !== -1){//varialbe is declared
            type1 = getVarType(index);
        }else{
            //undeclared variable error to go here
        }
    }
    if(token2.type === "ID"){//resolve variable type by checking declared variables
        let index = varIsDeclared(token2.id);
        if(index !== -1){//varialbe is declared
            type2 = getVarType(index);
        }else{
            //undeclared variable error to go here
        }
    }
    
    var mathOps = ["PLUS", "MINUS", "MULT", "DIV", "MOD"]; //list of operations that can be resolved in an assign statement before assigning
    //boolean operations (such as "==" of "and") are handled in the resolve Method
    var incompatTypes = [];
    if(mathOps.includes(operation.type)){
        if(token1.type === "FLOAT" || token2.type === "FLOAT"){
            incompatTypes = ["STRING"];
            if(! (incompatTypes.includes(token1.type) || incompatTypes.includes(token2.type)) ){ //cannot math op a float & string
                resultType = "FLOAT";
            }else{
                //ERROR, type mismatch
            }
        }else if(token1.type === "STRING" || token2.type === "STRING"){
            incompatTypes = ["FLOAT", "NUMBER", "BINARY", "OCTAL", "HEX", "TRUE", "FALSE"];
            if(! (incompatTypes.includes(token1.type) || incompatTypes.includes(token2.type)) ){ //cannot math op a float & string
                resultType = "STRING";
            }else{
                //ERROR, type mismatch
            }
            //TODO
        }else{ //all other math ops should resolve to a number
            resultType = "NUMBER";
        }
        
    }//no else, but should circumstance demand this can be expanded
    
    return resultType;
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
    var resultType = getResultType(val1, op, val2); //check result type & if passed types are comapatible with that operation
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
    var resultType = "FALSE"; //boolean is not a lexer type, only True or False
    if(resolved === "True")
        resultType = "TRUE";
    var resolution = {
        result: resolved + "",
        type: resultType
    };
    return resolution;
}

function resolveLogicalOp(val1, op, val2){
    var instr, result, lineN;
    lineN = op.lineNo;
    var bool1, bool2;
    if(val1 !== null)
        bool1 = convertTokenToValue(val1);
    if(val2 !== null)
        bool2 = convertTokenToValue(val2);
    switch(op.type){
        case "AND": instr = "Comparing " + val1.id + " " + op.id + " " + val2.id + " ";
                    result = bool1 && bool2; //(0|1) && (0|1)
            break;
        case "OR": instr = "Comparing " + val1.id + " " + op.id + " " + val2.id + " ";
                    result = bool1 || bool2; //(0|1) || (0|1)
            break;
        case "NOT": instr = "Negating " + val2.id + " ";
                    result++; //since it is treating 1 as true and everything not 1 as false, this works
            break;
    }
    var resultType;
    if(result === 1){
        result = "True";
        resultType = "TRUE";
    }else{
        result = "False";
        resultType = "FALSE";
    }
    pushInstr(instr, "is resolved to " + result, cmdCount, lineN, 0);
    console.log(result);
    var resolution = {
        result: result + "",
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
            var numToAssign = convertTokenToValue(val2); //hex, oct, & bin not always resolved prior in this case
            instr = val1.id + " " + op.id + " " + numToAssign;
            newVal = numToAssign;
            resolved = numToAssign + " assigned to variable \"" + val1.id + "\"";
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
