
var instrList = new Array(); //global list of instructions
var funcList = new Array(); //list of callable functions
var varList = new Array(); //list of declared variables
var cmdCount = 1; //this is the instruction on, (instr); or (instr)\n should increment this value

var reservedWords = ["abs", "and", "as", "ascii", "assert", "bin", "bool", "break", "ceil", "chr", "class", "cos", 
    "continue", "def", "del", "elif", "else", "except", "float", "floor", "finally", "for", "from", "global", "hex",
    "if", "import", "in", "input", "int", "is", "lambda", "len", "max", "min", "my_range", "nonlocal", "not", "oct", "or", "ord", "pass", "print",
    "raise", "randint", "random", "range", "return", "round", "seed", "sin", "str", "sqrt", "tan", "try", "type", "while", "with", "xrange", "yield", "format", "input"];

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

function updateVarType(index, newVarType){
    varList[index].type = newVarType;
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
            input = skipEmptyLines(input);
        }else{ //some keyword was read & the spaces could be indent that need to be read
            if(token.type === "SPACE"){
                for(var i = 0; i < token.length; i++){
                    input = " " + input;
                }
            }else{
                input = token.id + "" + input; //add spliced id back to front of program
            }
        }
    }else if(token.type === "END_OF_LINE"){
        input = input.slice(token.length);
        input = skipEmptyLines(input);
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
        let openParenCount = 0;
        switch(lexeme.type){ //switch to find out which method to jump to, based off CFG
            case "BINARY": //all of these should cascade to math operation or comparison
            case "OCTAL":
            case "HEX":
            case "NUMBER":
            case "FLOAT":
            case "STRING":
            case "ID": //some assign statement or function call
                openParenCount = 0;
                while(!lineEnds.includes(lexeme.type) || openParenCount !== 0){ //a line can be "a = ( 6 + \n 6) a still be treated as a single instruction
                    lexeme = getToken(input, true);
                    if(!lineEnds.includes(lexeme.type)){ //don't push a line end token to the list getting resolved, but it will be sliced
                        instr_line += lexeme.id + " ";
                        appendTokenList(lexeme);
                        if(lexeme.type === "LPAREN")
                            openParenCount++;
                        if(lexeme.type === "RPAREN")
                            openParenCount--;
                    }
                    input = input.slice(lexeme.length);
                }
                pushInstr("Instruction" + instr_line, "", cmdCount, lexeme.line_no, 0); //this pushes the line being resolved before actualy step wise resolution
                order_assign_statement(lineTokens);
                lineTokens = [];
                break;
            case "IF":
            case "ELIF":
            case "ELSE":
            case "WHILE":
                openParenCount = 0;
                while(lexeme.type !== "COLON" || openParenCount !== 0){
                    lexeme = getToken(input, true);
                    if(lexeme.type !== "COLON"){
                        instr_line += lexeme.id + " ";
                        appendTokenList(lexeme);
                        if(lexeme.type === "LPAREN")
                            openParenCount++;
                        if(lexeme.type === "RPAREN")
                            openParenCount--;
                    }
                    input = input.slice(lexeme.length);
                }
                instr_line += lexeme.id + " "; //we want to see : on the instruction, but not he following line break
                appendTokenList(lexeme);
                input = input.slice(lexeme.length);
                
                pushInstr("Instruction" + instr_line, "", cmdCount, lexeme.line_no, 0); //this pushes the line being resolved before actualy step wise resolution
                if(lineTokens[0].type === "WHILE")
                    input = order_while_loop(lineTokens, input);
                else if(lineTokens[0].type === "IF" || lineTokens[0].type === "ELIF" || lineTokens[0].type === "ELSE")
                    input = order_if_statement(lineTokens, input);
                else if(lineTokens[0].type === "DEF")
                    input = order_cust_function(lineTokens, input);
                lineTokens = [];
                break;
            case "PRINT":
                let isQuote = false;
                let isApost = false;
                openParenCount = 0;
                openParenCount = 0;
                while(!lineEnds.includes(lexeme.type) || openParenCount !== 0){ //a line can be "a = ( 6 + \n 6) a still be treated as a single instruction
                    lexeme = getToken(input, true);
                    if(!lineEnds.includes(lexeme.type)){ //don't push a line end token to the list getting resolved, but it will be sliced
                        instr_line += lexeme.id + " ";
                        appendTokenList(lexeme);
                        if(!isApost && lexeme.type === "QUOTE")
                            isQuote = !isQuote;
                        if(!isQuote && lexeme.type === "APOSTROPHE")
                            isApost = !isApost;
                        if(!isApost && !isQuote){
                            if(lexeme.type === "LPAREN")
                                openParenCount++;
                            if(lexeme.type === "RPAREN")
                                openParenCount--;
                        }
                    }
                    input = input.slice(lexeme.length);
                }
                pushInstr("Instruction" + instr_line, "", cmdCount, lexeme.line_no, 0); //this pushes the line being resolved before actualy step wise resolution
                order_print_statement(lineTokens);
                lineTokens = [];
                break;
            case "IMPORT"://not fully implemented yet, treated like a comment for now
            case "HASH_TAG": //free floating comments, slice off entire line
            case "QUOTE":
                while(!lineEnds.includes(lexeme.type) || lexeme.type === "SEMICOLON"){ //a line can be "a = ( 6 + \n 6) a still be treated as a single instruction
                    lexeme = getToken(input, true);
                    input = input.slice(lexeme.length);
                }
                lineTokens = [];
                break;
            case "SEMICOLON": //usually sliced at end of instruction lnie, this catches ";;"
            case "SPACE":
            case "END_OF_LINE": input = skipEmptyLines(input);
                break;
            default: console.log("Error");
                console.log(lexeme.id + " " + lexeme.type);
                input = input.slice(1);
                break;
        }
        cmdCount++;
    }
    return instrList;
}

function createInstrQueue(passedTokens){
    var priorityMod = 0; //used to scope priority of () operations
    let instrQueue = new Array();
    var tempToken;
    var tempPriority;
    var dontQueue = false;
    var printComma = false;
    var functionParenScope = 0;
    var isFormat = false;
    for(var x = 0; x < passedTokens.length; x++){ //add passed tokens to instruction queue & priority
        if(passedTokens[x].type !== "SPACE"){
            tempToken = passedTokens[x];
            dontQueue = false;
            let strToken; //holder if a string token is found
            switch(passedTokens[x].type){//used to assign priority
                case "PRINT": printComma = true;
                case "DEF":
                case "IF":
                case "ELIF":
                case "ELSE":
                case "WHILE":
                case "ADD_ASSIGN":
                case "SUB_ASSIGN":
                case "MULT_ASSIGN":
                case "DIV_ASSIGN":
                case "MOD_ASSIGN":
                case "ASSIGN_EQUALS":
                    if(!isFormat){
                        tempPriority = 0 + priorityMod;
                        priorityMod++; //assigns need to be read right to left, so we increment priority mod for each type assign
                    }else
                        tempPriority = 0;
                    break;
                case "FORMAT": isFormat = true;
                case "AND":
                case "OR": tempPriority = 1 + priorityMod;
                    break;
                case "NOT": tempPriority = 2 + priorityMod;
                    break;
                case "COMPARE_EQUALS": 
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
                case "LPAREN": priorityMod += 10; //all parenthised operations need to be executed before a higher priority external instr.
                    if(!printComma)
                        functionParenScope++; //count the # of "max( 2, (( 3+4..."
                    dontQueue = true; //don't push Parens to the Queue
                    break;
                case "RPAREN": priorityMod -= 10;
                    if(!printComma)
                        functionParenScope--;
                    if(functionParenScope === 0){ //when this hits 0 we've returned to commas not related to the built in function & should continue to queue them
                        printComma = true;
                        isFormat = false;
                    }
                    dontQueue = true;
                    break;
                case "COMMA": 
                    if(!printComma) //only queue the commas dividing print segments
                        dontQueue = true; //function will have commas, but we dont really care, ex. max(1,2,3)
                    else
                        tempPriority = 0;
                    if(isFormat){ //comma cannot divide for both print & format, so we slightly modify the id to "f," to differentiate
                        tempToken.id = "f,";
                    }
                    break;
                case "PERIOD":
                case "COLON": //this should be passed, but it does'nt need to be queued
                case "SEMICOLON": //these shouldn't be passed at all, but we want to really avoid treating them as instr. by this point
                case "END_OF_LINE":
                case "END_OF_FILE": dontQueue = true;
                    break;
                case "APOSTROPHE": //we need to put the entire string in a single token instance
                    x++; //go to next token in the list
                    if(passedTokens[x].type !== "APOSTROPHE"){ //if this is true we read "", an empty string
                        strToken = passedTokens[x];
                        strToken.charStart--; //decrement this back 1 character so it can highlight the starting quote
                        strToken.type = "STRING"; //update the type
                        x++; //increment again
                        while(passedTokens[x].type !== "APOSTROPHE"){ //we only have to look for next " since we can assume the string declaration is syntactically correct from parser
                            strToken.id += passedTokens[x].id;
                            strToken.length += passedTokens[x].length;
                            x++; //don't forget to increment token looked at
                        }
                        strToken.charEnd = passedTokens[x].charEnd; //char range includes finishing quote
                    }else{
                        strToken = passedTokens[x];
                        strToken.charStart--; //decrement this back 1 character so it can highlight the starting quote
                        strToken.id = ""; //treat this as an empty string
                        strToken.length = 0;
                    }
                    tempToken = strToken; //replace what gets pushed to queue with the string
                    tempPriority = -1; //this is not an operating token
                    break;
                case "QUOTE": //we need to put the entire string in a single token instance
                    x++; //go to next token in the list
                    if(passedTokens[x].type !== "QUOTE"){ //if this is true we read "", an empty string
                        strToken = passedTokens[x];
                        strToken.charStart--; //decrement this back 1 character so it can highlight the starting quote
                        strToken.type = "STRING"; //update the type
                        x++; //increment again
                        while(passedTokens[x].type !== "QUOTE"){ //we only have to look for next " since we can assume the string declaration is syntactically correct from parser
                            strToken.id += passedTokens[x].id;
                            strToken.length += passedTokens[x].length;
                            x++; //don't forget to increment token looked at
                        }
                        strToken.charEnd = passedTokens[x].charEnd; //char range includes finishing quote
                    }else{
                        strToken = passedTokens[x];
                        strToken.charStart--; //decrement this back 1 character so it can highlight the starting quote
                        strToken.id = ""; //treat this as an empty string
                        strToken.length = 0;
                    }
                    tempToken = strToken; //replace what gets pushed to queue with the string
                    tempPriority = -1; //this is not an operating token
                    break;
                default: //ID, number, float, binary, octal, hex, or built-in
                    if(reservedWords.includes(passedTokens[x].id)){
                        tempPriority = 9 + priorityMod; //resolve these first
                        printComma = false;
                    }else{
                        tempPriority = -1;
                    }
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
    
    return instrQueue;
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

function stepThroughRawInstr(instrQueue){
    var takeBranch = false; //used for while, if, elif
    
    var opIndex = 1;
    var currentOp;
    //the variables being operated upon might take more than 1 token, such as "abs ( -3 )"
    var val1 = [];
    var val2 = [];
    var prefixLength = 0;
    var suffixLength = 0;
    var hasPrefixLength, hasSuffixLength, tmpIndex;
    var validOp = false; //used to check for misunderstandings in the tokens before operating
    var resolution;
    var mathOps = ["PLUS", "MINUS", "MULT", "DIV", "MOD", "EXPONENTIAL"]; //list of operations that can be resolved in an assign statement before assigning
    var compareOps = ["COMPARE_EQUALS", "LESS_THAN", "LESS_THAN_EQUAL", "GREATER_THAN", "GREATER_THAN_EQUAL", "NOT_EQUAL"];
    var logicalOps = ["AND", "OR", "NOT"];
    var assignOps = ["ADD_ASSIGN", "SUB_ASSIGN", "MULT_ASSIGN", "DIV_ASSIGN", "MOD_ASSIGN", "ASSIGN_EQUALS"];
    var branchOps = ["WHILE", "IF", "ELIF"];
    var numTypes = ["FLOAT", "NUMBER"];
    if(instrQueue[0].token.type !=="ELSE"){
        while(instrQueue.length > 1){ //assignments should resolve down to a single vlaue remaining (and it is what was assigned to a variable)
            // get the tokens operated on
            //get the next priority operation
            opIndex = priorityPop(instrQueue);
            currentOp = instrQueue[opIndex].token;

            val1 = []; //reset these to help catch errors
            val2 = [];
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
                    val1.unshift(instrQueue[tmpIndex].token); //push this token to head of val1 array
                    tmpIndex--; //decrement to next token in instrQueue
                }else{ //has reached end of instrQueue or preceding operation
                    hasPrefixLength = true;
                    tmpIndex++; //increment back up to last valid token in the prefix
                }
            }
            //console.log("Prefix " +tmpIndex + " & " + prefixLength);
            /*for(var y = 0; y < prefixLength; y++)
                console.log(val1[y].id);*/

            if(prefixLength !== 0){
                //resolve any preceding negatives on these value
                for(let y = 0; y < prefixLength; y++){ //iterate the operated tokens & resolve any strings of "--+-" before a value
                    if(val1[y].id.charAt(0) === "+" || val1[y].id.charAt(0) === "-"){
                        let newVal = resolvePrecedingOperators(val1[y]); //pass token, return string to update the value
                        val1[y].id = newVal;
                    }
                }
            }

            //get all tokens after the operation pertaining to its execution
            tmpIndex = opIndex + 1;
            //console.log("Suffix " +tmpIndex + " & " + suffixLength);
            while(!hasSuffixLength){
                if(tmpIndex < instrQueue.length && instrQueue[tmpIndex].priority === -1){//still in instrQueue bounds & looking at non-operator tokens
                    suffixLength++;
                    val2.push(instrQueue[tmpIndex].token); //push this new token to val2 list
                    tmpIndex++;
                }else{
                    hasSuffixLength = true;
                    tmpIndex--; //decrement back to last valid token
                }
            }
            //console.log("Suffix " +tmpIndex + " & " + suffixLength);
            /*for(var y = 0; y < suffixLength; y++)
                console.log(val2[y].id);*/

            if(suffixLength !== 0){
                //resolve preceding operations on the token
                for(let y = 0; y < suffixLength; y++){ //iterate through the suffix and resolve preceding "--+-" strings
                    if(val2[y].id.charAt(0) === "+" || val2[y].id.charAt(0) === "-"){
                        let newVal = resolvePrecedingOperators(val2[y]); //pass token, return string to update the value
                        val2[y].id = newVal;
                    }
                }
            }

            if((currentOp.type === "PLUS" || currentOp.type === "MINUS") && suffixLength === 0 && prefixLength === 0){ //special case of instance like "-(--(4))" where it is mistakenly seeing N/A - N/A
                //we need to resolve the instrQueue to account for incorrect - & + before a number
                console.log("Case A");
                validOp = false; //we are going to do some hands on changes that can't be sent to functions to do actual operations
                hasPrefixLength = hasSuffixLength = false;
                let precedeOp = ["+","-"];
                let unassignedOps = currentOp.id + ""; //these will be concat to the front of the next id/number token
                tmpIndex = opIndex + 1;
                while(!hasSuffixLength){ //retiterate over tokens after op token
                    if(tmpIndex < instrQueue.length){
                        if(precedeOp.includes(instrQueue[tmpIndex].token.id)){//found another +/-
                            suffixLength++;
                            unassignedOps += instrQueue[tmpIndex].token.id;
                            tmpIndex++;
                        }else if(instrQueue[tmpIndex].priority === -1){//found correct suffix op
                            suffixLength++;
                            val2.push(instrQueue[tmpIndex].token); //push this new token to val2 list
                            tmpIndex++;
                        }else{ //if niether, end of potential suffix
                            hasSuffixLength = true;
                            tmpIndex--; //decrement back to last valid token
                        }
                    }else{ //outside the length of the queue
                        hasSuffixLength = true;
                        tmpIndex--; //return to last legal index
                    }
                }
                let newToken;
                if(suffixLength > 0){
                    if(numTypes.includes(val2[0].type)){ //this checks if the new suffix is a token like "--2"
                        //in which case it isn't a built in function and we can append the missing +/- to the head and resolve
                        val2[0].id = unassignedOps + "" + val2[0].id;
                        val2[0].id = resolvePrecedingOperators(val2[0]);
                        newToken = convertTokenToValue(val2); //convert result to get resolution fields
                    }else{ //not a simple float or number, needs to be converted
                        newToken = convertTokenToValue(val2); //convert the token to a number (could be 0b10 or even abs(2))
                        let tmpToken = getToken(newToken.value + "", false); //convert that return to a token
                        val2 = [];
                        val2.push(tmpToken); //push this token val2
                        val2[0].id = unassignedOps + "" + val2[0].id; //resolve it like a number now
                        val2[0].id = resolvePrecedingOperators(val2[0]);
                        newToken = convertTokenToValue(val2);
                    }
                }//else error detected

                var resolution = {
                    result: newToken.value + "",
                    type: newToken.type
                };

                resolveQueue(opIndex, instrQueue, resolution, prefixLength, suffixLength); //remove these tokens & replace with ID for the resolution

            }else if((mathOps.includes(currentOp.type) || compareOps.includes(currentOp.type) || logicalOps.includes(currentOp.type) || assignOps.includes(currentOp.type))
                    && suffixLength === 0 && currentOp.type !== "NOT"){ //special case of instances like "3-(-(-4))" where it mistakenly sees 3 - N/A
                console.log("Case B");
                validOp = true; //this one is just getting the appropriate suffix & can then continue the operation
                hasSuffixLength = false;
                let precedeOp = ["+","-"];
                let unassignedOps = ""; //these will be concat to the front of the next id/number token
                tmpIndex = opIndex + 1;
                console.log(currentOp.type);
                while(!hasSuffixLength){ //retiterate over tokens after op token
                    if(tmpIndex < instrQueue.length){
                        if(precedeOp.includes(instrQueue[tmpIndex].token.id)){//found another +/-
                            suffixLength++;
                            unassignedOps += instrQueue[tmpIndex].token.id;
                            tmpIndex++;
                        }else if(instrQueue[tmpIndex].priority === -1){//found correct suffix op
                            suffixLength++;
                            val2.push(instrQueue[tmpIndex].token); //push this new token to val2 list
                            tmpIndex++;
                        }else{ //if niether, end of potential suffix
                            hasSuffixLength = true;
                            tmpIndex--; //decrement back to last valid token
                        }
                    }else{ //outside the length of the queue
                        hasSuffixLength = true;
                        tmpIndex--; //return to last legal index
                    }
                }
                let newToken, tmpToken;
                let isNeg = false;
                if(suffixLength > 0){
                    if(numTypes.includes(val2[0].type)){ //this checks if the new suffix is a token like "--2"
                        //in which case it isn't a built in function and we can append the missing +/- to the head and resolve
                        val2[0].id = unassignedOps + "" + val2[0].id;
                        val2[0].id = resolvePrecedingOperators(val2[0]);
                        if(val2[0].id.charAt(0) === "-"){
                            val2[0].id = val2[0].id.slice(1,val2[0].id.length); //if the "-" is left on it will return the wrong token in the next step
                            isNeg = true;
                        }
                        tmpToken = convertTokenToValue(val2);
                        newToken = getToken(tmpToken.value + "", false); //convert result to a token since we proceed with operation after this conversion
                    }else{ //not a simple float or number, needs to be converted
                        newToken = convertTokenToValue(val2); //convert the token to a number (could be 0b10 or even abs(2))
                        let tmpToken = getToken(newToken.value + "", false); //convert that return to a token
                        val2 = [];
                        val2.push(tmpToken); //push this token val2
                        val2[0].id = unassignedOps + "" + val2[0].id; //resolve it like a number now
                        val2[0].id = resolvePrecedingOperators(val2[0]);
                        if(val2[0].id.charAt(0) === "-"){
                            val2[0].id = val2[0].id.slice(1,val2[0].id.length); //if the "-" is left on it will return the wrong token in the next step
                            isNeg = true;
                        }
                        tmpToken = convertTokenToValue(val2);
                        newToken = getToken(tmpToken.value + "", false);
                    }
                }//else error detected
                if(isNeg) //return any "-" that was sliced off
                    newToken.id = "-" + newToken.id;
                val2 = []; //clear the val2 array
                val2.push(newToken); //push the new token genrated

            }else if((currentOp.type === "PLUS" || currentOp.type === "MINUS") && prefixLength === 0){ //instance where it reads something like "a = -(2)" and tries N/A - 2
                console.log("Case C");
                validOp = false;
                let precedeOp = ["+","-"];
                let unassignedOps = currentOp.id + "";
                let newToken;
                if(suffixLength > 0){
                    if(numTypes.includes(val2[0].type)){ //this checks if the new suffix is a token like "--2"
                        //in which case it isn't a built in function and we can append the missing +/- to the head and resolve
                        val2[0].id = unassignedOps + "" + val2[0].id;
                        val2[0].id = resolvePrecedingOperators(val2[0]);
                        newToken = convertTokenToValue(val2); //convert result to get resolution fields
                    }else{ //not a simple float or number, needs to be converted
                        newToken = convertTokenToValue(val2); //convert the token to a number (could be 0b10 or even abs(2))
                        let tmpToken = getToken(newToken.value + "", false); //convert that return to a token
                        val2 = [];
                        val2.push(tmpToken); //push this token val2
                        val2[0].id = unassignedOps + "" + val2[0].id; //resolve it like a number now
                        val2[0].id = resolvePrecedingOperators(val2[0]);
                        newToken = convertTokenToValue(val2);
                    }
                }//else error detected

                var resolution = {
                    result: newToken.value + "",
                    type: newToken.type
                };

                resolveQueue(opIndex, instrQueue, resolution, prefixLength, suffixLength); //remove these tokens & replace with ID for the resolution

            }else if(currentOp.type === "NOT" && suffixLength === 0){ //for sequences of "not not not ..."
                //this will be a sliding method, we know there is a string of nots and something to operate on at some point to the right,
                //we will slide the opIndex over to the not just before that value & increase its priority without doing a resolution, so on next iteration
                //the right most not will be resolved first
                let tempIndex = opIndex + 1;
                let hasOpIndex = false;
                while(!hasOpIndex && tempIndex < instrQueue.length){
                    if(instrQueue[tempIndex].priority !== -1){
                        tempIndex++; //just another not
                    }else{
                        hasOpIndex = true;
                        tempIndex--; //got back to preceding not
                    }
                }
                opIndex = tempIndex;
                instrQueue[opIndex].priority++;

            }else{ //there was a prefix or suffix to perform the operation upon
                validOp = true;
            }

            //standard, non-special case resolutions below
            //perform the operation
            let isPrint = false;
            if(validOp){
                if(mathOps.includes(currentOp.type)){ //if the next prioritized operation is math, go to resolve Math
                    resolution = resolveMath(val1, currentOp, val2);
                    
                }else if(compareOps.includes(currentOp.type)){ //check if it is a comparator
                    resolution = resolveCompare(val1, currentOp, val2);
                    
                }else if(logicalOps.includes(currentOp.type)){
                    resolution = resolveLogicalOp(val1, currentOp, val2);
                    if(currentOp.type === "NOT")
                        prefixLength = 0; //even if a valid token was in front of "not" it didn't actually perform in this operation
                    
                }else if(branchOps.includes(currentOp.type)){
                    resolution = resolve_value_True_or_False(val2);
                    takeBranch = resolution.result;
                    
                }else if(currentOp.type === "ELSE"){
                    var resolution = {
                        result: 1 + "",
                        type: "TRUE"
                    };
                    takeBranch = resolution.result;
                    
                }else if(assignOps.includes(currentOp.type)){ //else it assumed to be an assignment statement
                    resolution = resolveAssign(val1, currentOp, val2);
                    
                }else if(currentOp.type === "FORMAT"){
                    //we need to recompute the suffix to inclue all tokens within format(...)
                    tmpIndex = opIndex + 1;
                    suffixLength = 0;
                    hasSuffixLength = false;
                    val2 = [];
                    while(!hasSuffixLength){
                        //now we are bound by the lngth of the queue, the priority being -1, finding an assign equals (for cases of a="str"), and the "f," commas
                        if(tmpIndex < instrQueue.length && (instrQueue[tmpIndex].priority === -1 || instrQueue[tmpIndex].token.type === "ASSIGN_EQUALS" || instrQueue[tmpIndex].token.id === "f,")){//still in instrQueue bounds & looking at non-operator tokens
                            suffixLength++;
                            val2.push(instrQueue[tmpIndex].token); //push this new token to val2 list
                            tmpIndex++;
                        }else{
                            hasSuffixLength = true;
                            tmpIndex--; //decrement back to last valid token
                        }
                    }
                    resolution = formatString(val1, currentOp, val2);
                    
                }else if(currentOp.type === "PRINT"){
                    resolution = resolvePrint(instrQueue);
                    instrQueue = [];
                    isPrint = true;
                    
                }else if(reservedWords.includes(currentOp.id)){//catch 22 of all missed built-in functions
                    resolution = resolve_built_ins(currentOp, val2);
                    prefixLength = 0; //prefix shouldn't actually be accounted for in this resolution
                    
                }//else if "def"

                if(!isPrint)
                    resolveQueue(opIndex, instrQueue, resolution, prefixLength, suffixLength); //remove these tokens & replace with ID for the resolution
            }


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
    }
    
    return takeBranch;
}

/*
 This will convert the passed tokens into a priority queue of atomic operations. It will then iterate
through the operations and resolve them 1 at a time, pushing them to the instruction queue that gets returned
until there is only 1 token left to resolve. This method does not push the instructions, but calls methods that
push the appropriate syntax for operations. While it's called assign it can also handle standalone ops, like 3+3 or 4 == 5
 */
function order_assign_statement(passedTokens){
    
    
    let instrQueue = createInstrQueue(passedTokens);
        
    stepThroughRawInstr(instrQueue);
    
    instrQueue = []; //for added measure, there should only be 1 token in the queue but it never hurts to empty it at conclusion
}

function order_while_loop(passedTokens, input){
    let tokenHolder = new Array();
    for(var x = 0; x < passedTokens.length; x++){ //christ, why is JavaScript create a pointer to the same object when you do "var arr1 = arr2"
        let lexeme = {
            id: passedTokens[x].id,
            type: passedTokens[x].type,
            line_no: passedTokens[x].line_no,
            charStart: passedTokens[x].charStart,
            charEnd: passedTokens[x].charEnd
        };
        tokenHolder.push(lexeme);
    }
    let instrQueue = createInstrQueue(tokenHolder);
    var lineOfInsidence = instrQueue[0].token.line_no;//since the tokens are being dealt with in another method, we need to store the line they occur on
    
    var takeBranch = stepThroughRawInstr(instrQueue); //this method returns a boolean used to determine if we stay in the loop
    
    var inputIndentCode = skip_indented_lines(input);
    var indented = inputIndentCode.cut_off;
    var inputSlice = inputIndentCode.inputSlice;
    document.getElementById("outputField").value += "Indented:\n" +indented + "\nReturn:\n" + inputSlice;
    
    //resolve the state of the while loop
    while(takeBranch === "1"){
        pushInstr("The While loop evaluated to True, take the path", "" , cmdCount, lineOfInsidence, 0);
        create_instructions(indented); //do the indented code
        tokenHolder = [];
        for(var x = 0; x < passedTokens.length; x++){ //reset the tokenHolder for another loop
            let lexeme = {
                id: passedTokens[x].id,
                type: passedTokens[x].type,
                line_no: passedTokens[x].line_no,
                charStart: passedTokens[x].charStart,
                charEnd: passedTokens[x].charEnd
            };
            tokenHolder.push(lexeme);
        }
        instrQueue = createInstrQueue(tokenHolder);
        takeBranch = stepThroughRawInstr(instrQueue); //re=evaluate the loop condiiton
    }
    pushInstr("The While loop evaluated to False, don't take the path", "" , cmdCount, lineOfInsidence, 0);
    
    return inputSlice;
}

function order_if_statement(passedTokens, input){
    let instrQueue = createInstrQueue(passedTokens);
    var lineOfInsidence = instrQueue[0].token.line_no;//since the tokens are being dealt with in another method, we need to store the line they occur on
    
    var takeBranch = stepThroughRawInstr(instrQueue); //this method returns a boolean used to determine if we enter the indents
    
    //resolve the state of the while loop
    if(takeBranch === "1"){
        pushInstr("The statement evaluated to True, take the path", "" , cmdCount, lineOfInsidence, 0);
        //read & store nested instructions for operation
    }else{
        pushInstr("The statement evaluated to False, don't take the path", "" , cmdCount, lineOfInsidence, 0);
        //skip nested instructions
    }
    
}

function order_cust_Function(passedTokens, input){
    let instrQueue = createInstrQueue(passedTokens);
    var lineOfInsidence = instrQueue[0].token.line_no;//since the tokens are being dealt with in another method, we need to store the line they occur on
    
    var takeBranch = stepThroughRawInstr(instrQueue); //this method returns a boolean used to determine if we stay in the loop
    
}

function order_print_statement(passedTokens){
    
    let instrQueue = createInstrQueue(passedTokens);
    
    stepThroughRawInstr(instrQueue);
    
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
    var instr, result, opToken;
    opToken = token[0]; //array of 1, but its simpler to just convert to 1 token
    
    instr = opToken.id;
    var index, tempHold;
    var isNeg = false;
    if(opToken.id.charAt(0) === "-"){
        isNeg =true;
        opToken.id = opToken.id.slice(1);
    }
    if(opToken.type === "ID"){
        instr = "\"" + instr + "\""; //when pushing conversion instruction it will read "Value "var" "
        index = varIsDeclared(opToken.id);
        let printResult;
        if(index !== -1){//not a new variable
            var valueType = getVarType(index);
            if(valueType === "TRUE"){
                value = 1;
                result = "True";
                printResult = result;
            }else if(valueType === "FALSE"){
                value = 0;
                result = "False";
                printResult = result;
            }else if(valueType === "FLOAT"){
                value = Number.parseFloat(getVarValue(index));
                result = value;
                printResult = result;
            }else if(valueType === "STRING"){
                value = getVarValue(index);
                printResult = result;
                result = value;
            }else if(valueType === "BINARY"){
                tempHold = getVarValue(index);
                tempHold = tempHold.slice(2); //remove "0b" before parsing
                value = Number.parseInt(tempHold, 2);
                result = value;
                printResult = "0b" + tempHold;
            }else if(valueType === "OCTAL"){
                tempHold = getVarValue(index);
                tempHold = tempHold.slice(2);
                value = Number.parseInt(tempHold, 8);
                result = value;
                printResult = "0o" + tempHold;
            }else if(valueType === "HEX"){
                tempHold = getVarValue(index);
                tempHold = tempHold.slice(2);
                value = Number.parseInt(tempHold, 16);
                result = value;
                printResult = "0x" + tempHold;
            }else if(valueType === "NUMBER"){
                value = Number.parseInt(getVarValue(index), 10);//assumes to be an int at this point
                result = value;
                printResult = result;
            }
            opToken.type = valueType;
        }else{//new variable, but it can't be declared here
            runtime_error("UNDECLARED_VAR");
        }
        pushInstr("Variable " + instr, " is resolved to " + printResult, cmdCount, opToken.line_no, 0);
    }else{
        switch(opToken.type){
            case "FLOAT":
                if(isNeg)
                    opToken.id = "-" + opToken.id;
                value = Number.parseFloat(opToken.id);
                break;
            case "NUMBER":
                if(isNeg)
                    opToken.id = "-" + opToken.id;
                value = Number.parseInt(opToken.id, 10);
                break;
            case "BINARY":
                opToken.id = opToken.id.slice(2); //slice off 0b for conversion
                if(isNeg)
                    opToken.id = "-" + opToken.id;
                value = Number.parseInt(opToken.id, 2);
                break;
            case "OCTAL":
                opToken.id = opToken.id.slice(2); //slice off 0o for conversion
                if(isNeg)
                    opToken.id = "-" + opToken.id;
                value = Number.parseInt(opToken.id, 8);
                break;
            case "HEX":
                opToken.id = opToken.id.slice(2); //slice off 0x for conversion
                if(isNeg)
                    opToken.id = "-" + opToken.id;
                value = Number.parseInt(opToken.id, 16);
                break;
            case "STRING":
                if(isNeg)
                    opToken.id = "-" + opToken.id;
                value = opToken.id;
                break;
            case "TRUE":
                value = 1;
                break;
            case "FALSE":
                value = 0;
                break;
            case "STRING":
                value = opToken.id;
                break;
        }
    }
    var returnVal = {
        value: value,
        type: opToken.type
    };
    //console.log(returnVal.value + " " + returnVal.type);
    return returnVal;
}

//This method takes in 2 tokens & compares their type and what operation i performed between them
//it then returns a string that is the type of the rseulting token
//It will also catch type mismatch operations
function getResultType(token1, operation, token2){
    var resultType;
    var type1, type2;
    if(token1.type === "ID"){//resolve variable type by checking declared variables
        let index = varIsDeclared(token1.id);
        if(index !== -1){//varialbe is declared
            type1 = getVarType(index);
        }else{
            runtime_error("UNDECLARED_VAR");
        }
    }else{
        type1 = token1.type;
    }
    if(token2.type === "ID"){//resolve variable type by checking declared variables
        let index = varIsDeclared(token2.id);
        if(index !== -1){//varialbe is declared
            type2 = getVarType(index);
        }else{
            runtime_error("UNDECLARED_VAR");
        }
    }else{
        type2 = token2.type;
    }
    
    var mathOps = ["PLUS", "MINUS", "MULT", "DIV", "MOD", "EXPONENTIAL"]; //list of operations that can be resolved in an assign statement before assigning
    var compareOps = ["COMPARE_EQUALS", "LESS_THAN", "LESS_THAN_EQUAL", "GREATER_THAN", "GREATER_THAN_EQUAL", "NOT_EQUAL"];
    //boolean operations (such as "==" of "and") are handled in the resolve Method
    var incompatTypes = [];
    if(mathOps.includes(operation.type)){
        if(type1 === "BINARY" && type2 === "BINARY"){
            resultType = "BINARY";
        }else if(type1 === "OCTAL" && type2 === "OCTAL"){
            resultType = "OCTAL";
        }else if(type1 === "HEX" && type2 === "HEX"){
            resultType = "HEX";
        }else if(type1 === "FLOAT" || type2 === "FLOAT"){
            incompatTypes = ["STRING"];
            if(! (incompatTypes.includes(type1) || incompatTypes.includes(type2)) ){ //cannot math op a float & string
                resultType = "FLOAT";
            }else{
                //ERROR, type mismatch
                runtime_error("INCOMPATIBLE_TYPES");
            }
        }else if(type1 === "STRING" || type2 === "STRING"){
            incompatTypes = ["FLOAT", "NUMBER", "BINARY", "OCTAL", "HEX", "TRUE", "FALSE"];
            if(! (incompatTypes.includes(type1) || incompatTypes.includes(type2)) ){ //cannot math op a float & string
                resultType = "STRING";
                if(operation.type !== "PLUS") //strings can only do addition
                    runtime_error("INVALID_OP");
            }else{
                //ERROR, type mismatch
                runtime_error("INCOMPATIBLE_TYPES");
            }
            //TODO
        }else{ //all other math ops should resolve to a number
            resultType = "NUMBER";
        }
        
    }else if(compareOps.includes(operation.type)){
        if(type1 === "STRING" || type2 === "STRING") //if one is a string
            if(type1 !== "STRING" || type2 !== "STRING") //and the other isn't a string
                if(operation.type !== "COMPARE_EQUALS" && operation.type !== "NOT_EQUAL") //then it can only be equal/not-equal
                    runtime_error("INCOMPATIBLE_TYPES");
    }//and, or, & not are compatible with all op types encoded thus far
    
    return resultType;
}

function resolveMath(val1, op, val2){
    var instr, resolved, lineN;
    lineN = op.line_no;
    var num1, num2, tokenVal1, tokenVal2;
    tokenVal1 = convertTokenToValue(val1);
    tokenVal2 = convertTokenToValue(val2);
    //get result type before attempting op to avoid invalid operations
    var resultType = getResultType(tokenVal1, op, tokenVal2); //check result type & if passed types are comapatible with that operation
    num1 = tokenVal1.value;
    num2 = tokenVal2.value;
    if(tokenVal1.type !== "STRING" && tokenVal2.type !== "STRING"){
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
            case "EXPONENTIAL":
                resolved = Math.pow(num1, num2);
                break;
        }
    }else{ //both operations are a string, only addition is operable between 2 strings
        resolved = num1 + "" + num2; //num 1 & 2 might be a dated name sake...
    }
    instr = "";
    //if base notation of operation match, return to that notation
    if(tokenVal1.type === "BINARY" && tokenVal2.type === "BINARY"){
        resolved = "0b" + resolved.toString(2);
        instr = "0b" + num1.toString(2) + " " + op.id + " 0b" + num2.toString(2);
    }else if(tokenVal1.type === "OCTAL" && tokenVal2.type === "OCTAL"){
        resolved = "0o" + resolved.toString(8);
        instr = "0o" + num1.toString(8) + " " + op.id + " 0o" + num2.toString(8);
    }else if(tokenVal1.type === "HEX" && tokenVal2.type === "HEX"){
        resolved = "0x" + resolved.toString(16);
        instr = "0x" + num1.toString(16) + " " + op.id + " 0x" + num2.toString(16);
    }else{
        if(tokenVal1.type !== "TRUE" && tokenVal1.type !== "FALSE" && tokenVal1.type !== "NONE"){
            instr += num1 + " ";
        }else{
            instr += tokenVal1.type + " ";
        }
        instr += op.id + " ";
        if(tokenVal2.type !== "TRUE" && tokenVal2.type !== "FALSE" && tokenVal2.type !== "NONE"){
            instr += num2 + " ";
        }else{
            instr += tokenVal2.type + " ";
        }
    }
    
    //push the math operation performed
    pushInstr("Operation " + instr, " is resolved to " + resolved, cmdCount, lineN, 0);
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
    var token1 = convertTokenToValue(val1);
    var token2 = convertTokenToValue(val2);
    var resultType = getResultType(token1, op, token2); //best to ensure legal operation
    num1 = token1.value;
    num2 = token2.value;
    //don't need to worry about num1/2 type since the result of this operation should be boolean
    //string comparison in JavaScript has same returns as in Python, so no special cases for string comparisons
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
    instr = "";
    if(token1.type !== "TRUE" && token1.type !== "FALSE" && token1.type !== "NONE"){
        instr += num1 + " ";
    }else{
        instr += token1.type + " ";
    }
    instr += op.id + " ";
    if(token2.type !== "TRUE" && token2.type !== "FALSE" && token2.type !== "NONE"){
        instr += num2 + " ";
    }else{
        instr += token2.type + " ";
    }
    //push the math operation performed
    pushInstr("Comparison " + instr, "is resolved to " + resolved, cmdCount, lineN, 0);
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
    var prefix = "";
    var suffix = "";
    var index;
    //get the actual instruction before converting it to booleans
    for(index = 0; index < val1.length; index++)
        prefix += val1[index].id;
    for(index = 0; index < val2.length; index++)
        suffix += val2[index].id;
    
    var bool1, bool2;
    //convert the arguments to their boolean equivalent
    if(val2.length !== 0)
        bool2 = convertTokenToValue(val2);
    if(val1.length !== 0)
        bool1 = convertTokenToValue(val1);
    else //when doing not, bool1 will be undeclared but we want to avoid undeclared erros
        bool1 = bool2; //used to avoid undeclared bool1 error
    if(op.type !== "NOT") //NOT has no operating restrictions under current scope
        var resultType = getResultType(bool1, op, bool2); //best to ensure legal operation
    //perform the actual comparison & store it in the instr string
    if((bool2.type === "TRUE" || bool2.type === "FALSE" || bool2.value === 1 || bool2.value === 0) 
            && (bool1.type === "TRUE" || bool1.type === "FALSE" || bool1.value === 1 || bool1.value === 0)){ //simple numeric comparison, important to check bool2 first as bool1 might not be declared if using a not operation
        switch(op.type){
            case "AND": instr = "Comparing " + bool1.value + " " + op.id + " " + bool2.value + " ";
                        result = bool1.value && bool2.value; //(0|1) && (0|1)
                break;
            case "OR": instr = "Comparing " + bool1.value + " " + op.id + " " + bool2.value + " ";
                        result = bool1.value || bool2.value; //(0|1) || (0|1)
                break;
            case "NOT": instr = "Negating " + bool2.value + " ";
                        bool2.value++;
                        result = bool2.value; //since it is treating 1 as true and everything not 1 as false, this works
                break;
        }
        
        //the result is currently 1 or 0, convert that to a textual True/False
        if(result === 1){
            result = "True";
            resultType = "TRUE";
        }else{
            result = "False";
            resultType = "FALSE";
        }
    }else{//string special comparison
        switch(op.type){
            case "AND": instr = "Comparing " + bool1.value + " " + op.id + " " + bool2.value + " ";
                //Python and with a string always returns the 2nd input
                result = bool2.value;
                resultType = bool2.type;
                break;
            case "OR": instr = "Comparing " + bool1.value + " " + op.id + " " + bool2.value + " ";
                //Python or with a string always returns 1st input
                result = bool1.value;
                resultType = bool1.type;
                break;
            case "NOT": instr = "Negating " + suffix + " ";
                //not-ing a string is always false
                result = "False";
                resultType = "FALSE";
                break;
        }
        
        if(resultType === "TRUE" || resultType === "FALSE"){ //convet number booleans back to boolean readable values
            if(result === 1){
                result = "True";
            }else{
                result = "False";
            }
        }
    }
    
    //push the final result to the instruction queue
    pushInstr(instr, "is resolved to " + result, cmdCount, lineN, 0);
    var resolution = {
        result: result + "",
        type: resultType
    };
    return resolution;
}

function resolveAssign(val1, op, val2){
    var instr, resolved, lineN, intermediateRes;
    if(val1[0].type === "ID"){ //don't even try to assign to none variables
        var index, newVal, newVarType;
        let tmpOp = op;
        //when operating here, always assume val1 is a single index array with an ID token type. Anything else would be a syntax error
        switch(op.type){
            case "ASSIGN_EQUALS":
                var numToAssign = convertTokenToValue(val2); //hex, oct, & bin not always resolved prior in this case
                switch(numToAssign.type){
                    case "BINARY": numToAssign.value = "0b" + numToAssign.value.toString(2);
                        break;
                    case "OCTAL": numToAssign.value = "0o" + numToAssign.value.toString(8);
                        break;
                    case "HEX": numToAssign.value = "0x" + numToAssign.value.toString(16);
                        break;
                }
                instr = val1[0].id + " " + op.id + " " + numToAssign.value;
                newVal = numToAssign.value;
                newVarType = numToAssign.type;
                resolved = newVal + " assigned to variable \"" + val1[0].id + "\"";
                break;
            case "ADD_ASSIGN":
                tmpOp.id = "+";
                tmpOp.type = "PLUS";
                intermediateRes = resolveMath(val1, tmpOp, val2); //perform the + in += as its own atomic operation
                newVal = intermediateRes.result; //store the result
                newVarType = intermediateRes.type;
                instr = val1[0].id + " = " + newVal; //treat the result as the # being assigned
                resolved = intermediateRes.result + " assigned to variable \"" + val1[0].id + "\"";
                break;
            case "SUB_ASSIGN":
                tmpOp.id = "-";
                tmpOp.type = "MINUS";
                intermediateRes = resolveMath(val1, tmpOp, val2);
                newVal = intermediateRes.result;
                newVarType = intermediateRes.type;
                instr = val1[0].id + " = " + newVal;
                resolved = intermediateRes.result + " assigned to variable " + val1[0].id;
                break;
            case "MULT_ASSIGN":
                tmpOp.id = "*";
                tmpOp.type = "MULT";
                intermediateRes = resolveMath(val1, tmpOp, val2);
                newVal = intermediateRes.result;
                newVarType = intermediateRes.type;
                instr = val1[0].id + " = " + newVal;
                resolved = intermediateRes.result + " assigned to variable \"" + val1[0].id + "\"";
                break;
            case "DIV_ASSIGN":
                tmpOp.id = "/";
                tmpOp.type = "DIV";
                intermediateRes = resolveMath(val1, tmpOp, val2);
                newVal = intermediateRes.result;
                newVarType = intermediateRes.type;
                instr = val1[0].id + " = " + newVal;
                resolved = intermediateRes.result + " assigned to variable \"" + val1[0].id + "\"";
                break;
            case "MOD_ASSIGN":
                tmpOp.id = "%";
                tmpOp.type = "MOD";
                intermediateRes = resolveMath(val1, tmpOp, val2);
                newVal = intermediateRes.result;
                newVarType = intermediateRes.type;
                instr = val1[0].id + " = " + newVal;
                resolved = intermediateRes.result + " assigned to variable \"" + val1[0].id + "\"";
                break;
        }
        if(newVarType === "TRUE" || newVarType === "FALSE" || newVarType === "NONE"){
            instr = val1[0].id + " = " + newVarType;
            resolved = newVarType + " assigned to variable \"" + val1[0].id + "\"";
        }
        //update the variable that had a nmuber assigned to it
        index = varIsDeclared(val1[0].id);
        if(index === -1){//new variable
            //pushVar(vName, vType, vValue, vFuncScope, vIndentScope)
            pushVar(val1[0].id, newVarType, newVal, "global", 0);
        }else{ //update existing variable
            updateVarValue(index, newVal);
            updateVarType(index, newVarType);
        }
    }else{
        console.log(val1[0].type);
        runtime_error("INVALID_ASSIGNMENT");
    }
    pushInstr("Assignment " + instr, " resolved to value " + resolved, cmdCount, lineN, 0);
    var resultType = newVarType;
    var resolution = {
        result: newVal + "",
        type: resultType
    };
    return resolution;
}

//called on conditionals, such as if, elif, or while
function resolve_value_True_or_False(passedVal){
    var convertToken = convertTokenToValue(passedVal);
    
    var resolution = {
        result: convertToken.value + "",
        type: convertToken.type
    };
    
    return resolution;
}

function formatString(val1, opToken, val2){
    //used to temporarily store the values format is trying to replace in adjoining string
    var formattedString = val1[0].id;
    var forVarList = new Array(); //unlike normal variables, these exist solely in the scope of format
    
    
    var toResolve = new Array();
    var resolvedIndex, indexValue, indexType;
    for(var x = 0; x < val2.length; x++){ //get all the values being formatted into the string
        if(val2[x].id !== "f,"){ //skip over this token, it shouldn't be formatted
            let formatVar = { //make it a let in scope of the if, so when the for loop increments the last formatVar will be dropped from memory
                forName: "",
                forVal: ""
            };
            if(x+1 < val2.length){
                if(val2[x].type === "ID"){//creating a named format variable
                    toResolve.push(val2[x+2]); //push the token after the equal sign
                    resolvedIndex = convertTokenToValue(toResolve);
                    indexValue = resolvedIndex.value;
                    indexType = resolvedIndex.type;
                    switch(indexType){ //convert that value if necessary to its textual variant
                        case "BINARY": indexValue = "0b" + indexValue.toString(2);
                           break;
                        case "OCTAL": indexValue = "0o" + indexValue.toString(8);
                            break;
                        case "HEX": indexValue = "0x" + indexValue.toString(16);
                            break;
                    }
                    formatVar.forName = val2[x].id; //name is equal to token id
                    formatVar.forVal = indexValue; //value to replace is the converted token
                    x += 2; //increment past the managed values (the for loop will ++ to get to the next value)
                }else{//unnamed variable, only accessible in {} or {#}
                    toResolve.push(val2[x]); //push the token at that index
                    resolvedIndex = convertTokenToValue(toResolve);
                    indexValue = resolvedIndex.value;
                    indexType = resolvedIndex.type;
                    switch(indexType){ //convert that value if necessary to its textual variant
                        case "BINARY": indexValue = "0b" + indexValue.toString(2);
                           break;
                        case "OCTAL": indexValue = "0o" + indexValue.toString(8);
                            break;
                        case "HEX": indexValue = "0x" + indexValue.toString(16);
                            break;
                    }
                    formatVar.forName = indexValue; //name is not relevant in an unnamed format value
                    formatVar.forVal = indexValue; //value to replace is the converted token
                }
            }else{ //length does not allow for unnamed format variable
                toResolve.push(val2[x]); //push the token at that index
                resolvedIndex = convertTokenToValue(toResolve);
                indexValue = resolvedIndex.value;
                indexType = resolvedIndex.type;
                switch(indexType){ //convert that value if necessary to its textual variant
                    case "BINARY": indexValue = "0b" + indexValue.toString(2);
                       break;
                    case "OCTAL": indexValue = "0o" + indexValue.toString(8);
                        break;
                    case "HEX": indexValue = "0x" + indexValue.toString(16);
                        break;
                }
                formatVar.forName = indexValue; //name is not relevant in an unnamed format value
                formatVar.forVal = indexValue; //value to replace is the converted token
            }
            forVarList.push(formatVar); //push the calculated value
            toResolve = []; //empty the resolve list for next round
        }
    }
    
    for(var y = 0; y < forVarList.length; y++)
        console.log("Format Name " + forVarList[y].forName + " & Value " + forVarList[y].forVal);
    
    //case 1 is only has {}, case 2 is {#}, {varName} or a mix
    var replaceByIndex = "";
    var replaceByName = "";
    if(formattedString.includes("{}")){ //case 1 has no overlap
        for(var y = 0; y < forVarList.length; y++){
            if(formattedString.includes("{}")){
                formattedString = formattedString.replace("{}", forVarList[y].forVal + "");
                pushInstr("Format replaced {}", " with " + forVarList[y].forVal, cmdCount, 0, 0);
            }
        }
    }else{
        for(var y = 0; y < forVarList.length; y++){
            replaceByIndex = "{"+y+"}";
            replaceByName = "{"+forVarList[y].forName+"}";
            while(formattedString !== formattedString.replace(replaceByIndex, forVarList[y].forVal + "")){ //see if replace will change the string
                formattedString = formattedString.replace(replaceByIndex, forVarList[y].forVal + ""); //only operates once
                pushInstr("Format replaced " + replaceByIndex, " with " + forVarList[y].forVal, cmdCount, 0, 0);
            }
            while(formattedString !== formattedString.replace(replaceByName, forVarList[y].forVal + "")){
                formattedString = formattedString.replace(replaceByName, forVarList[y].forVal + "");
                pushInstr("Format replaced " + replaceByName, " with " + forVarList[y].forVal, cmdCount, 0, 0);
            }
        }
    }
    
    var resolution = {
        result: formattedString + "",
        type: "STRING"
    };
    
    return resolution;
    
}

//takes all tokens in the instrQueue, since print should be called last, and concats all non-commas into the string that gets displayed
function resolvePrint(val2){
    var toPrint = "";
    var toResolve = new Array();
    var numToPrint;
    
    for(var x = 1; x < val2.length; x++){
        if(val2[x].token.type !== "COMMA"){ //skip the delimiting commas
            toResolve.push(val2[x].token);
            numToPrint = convertTokenToValue(toResolve); //convert the token to its value, this helps gets variables
            switch(numToPrint.type){ //convert that value if necessary to its textual variant
                case "BINARY": toPrint += "0b" + numToPrint.value.toString(2);
                   break;
                case "OCTAL": toPrint += "0o" + numToPrint.value.toString(8);
                    break;
                case "HEX": toPrint += "0x" + numToPrint.value.toString(16);
                    break;
                default: toPrint += numToPrint.value + "";
                    break;
            }
            toResolve = []; //reset toResolve
        }
        toPrint += " ";
    }
    
    pushInstr("The final string print to Screen is \"", toPrint + " \"", cmdCount, 0, 0);
    
    var resolution = {
        result: toPrint + "",
        type: "STRING"
    };
    
    return resolution;
    
}


function resolve_abs(token) //this gets passed a single token for operation
{
    var tokenVal = Math.abs(convertTokenToValue(token).value);
    pushInstr("abs(" + token[0].id + ") ", "resolves to " + tokenVal, cmdCount, 0, 0);
    
    var resolution = {
        result: tokenVal + "",
        type: token[0].type
    };
    
    return resolution;
}

function resolve_bin(token)
{
    var tokenVal = convertTokenToValue(token).value;
    var newVal = "test";
    
    if (tokenVal < 0)
    {
        tokenVal = tokenVal.toString(2);
        newVal = tokenVal.slice(0,1) + "0b" + tokenVal.slice(1);
    }

    else
    {
        newVal = "0b" + tokenVal.toString(2);
    }
    pushInstr("bin(" + token[0].id + ") ", "resolves to " + newVal + "", cmdCount, 0, 0);
    
    var resolution = {
        result: newVal + "",
        type: "BINARY"
    };
    
    return resolution;
}

function resolve_bool(token)
{  
    if (token !== null)
    {
        var tokenVal = resolve_value_True_or_False(token);  
        if (tokenVal)
        {
            var resolution = {
                result: "True",
                type: "TRUE"
            };

            pushInstr("bool(" + token[0].id + ") ", "resolves to True", cmdCount, 0, 0);
            return resolution;
        }

        else
        {
            var resolution = {
                result: "False",
                type: "FALSE"
            };

            pushInstr("bool(" + token[0].id + ") ", "resolves to False", cmdCount, 0, 0);
            return resolution;
        }
    }
    
    else
    {
        var resolution = {
            result: "False",
            type: "FALSE"
        };
        pushInstr("bool(" + token[0].id + ") ", "resolves to False", cmdCount, 0, 0);
        return resolution;
    }
}

function resolve_chr(token)
{
    var tokenVal = convertTokenToValue(token).value;
    var newVal = String.fromCharCode(tokenVal);
    
    var resolution = {
        result: newVal + "",
        type: "STRING"
    };
    
    pushInstr("chr(" + token[0].id + ") ", "resolves to " + newVal, cmdCount, 0, 0);
    return resolution;
}

function resolve_float(token)
{
    var tokenVal = convertTokenToValue(token).value;
    
    if (Number.isInteger(tokenVal))
    {
        var newVal = tokenVal + ".0";
        
        var resolution = {
            result: newVal + "",
            type: "FLOAT"
        };
        pushInstr("float(" + token[0].id + ") ", "resolves to " + newVal + "", cmdCount, 0, 0);
        
        return resolution;
    }
    
    else if (Number.isFloat(tokenVal))
    {
        var newVal = tokenVal;
        
        var resolution = {
            result: newVal + "",
            type: "FLOAT"
        };
        pushInstr("float(" + token[0].id + ") ", "resolves to "+ newVal + "", cmdCount, 0, 0);
        
        return resolution;
    }
    
    else if (tokenVal === "Infinity")
    {
        var newVal = tokenVal;
        
        var resolution = {
            result: "inf",
            type: "FLOAT"
        };
        pushInstr("float(" + token[0].id + ") ", "resolves to inf", cmdCount, 0, 0);
        
        return resolution;
    }
    
    else if (tokenVal === "-Infinity")
    { 
        var resolution = {
            result: "-inf",
            type: "FLOAT"
        };
        pushInstr("float(" + token[0].id + ") ", "resolves to -inf", cmdCount, 0, 0);
        
        return resolution;
    }
    
    else
    {
        var resolution = {
            result: "Unknown",
            type: "ERROR"
        };
        pushInstr("float(" + token[0].id + ") ", "resolves to Unknown", cmdCount, 0, 0);
        
        return resolution;
    }
}

function resolve_hex(token)
{
    var tokenVal = convertTokenToValue(token).value;
    
    if (tokenVal < 0)
    {
        tokenVal = tokenVal.toString(16);
        var newVal = tokenVal.slice(0,1) + "0x" + tokenVal.slice(1);
        
        pushInstr("hex(" + token[0].id + ") ", "resolves to "+ newVal, cmdCount, 0, 0);
    }

    else
    {
        var newVal = "0x" + tokenVal.toString(16);
        
        pushInstr("hex(" + token[0].id + ") ", "resolves to "+ newVal, cmdCount, 0, 0);
    }
    
    var resolution = {
        result: newVal + "",
        type: "HEX"
    };
    
    return resolution;
}

function resolve_len(token)
{
    var temp = convertTokenToValue(token);
    var tokenVal = temp.value;
    var tokenType = temp.type;
    if (tokenType === "STRING")
    {
        var newVal = tokenVal.length;
        var resolution = {
            result: newVal + "",
            type: "NUMBER"
        };
        
        pushInstr("len(" + token[0].id + ") ", "resolves to "+ newVal + "", cmdCount, 0, 0);  
    }
    
    else
    {       
        var resolution = {
            result: "Unknown",
            type: "ERROR"
        };        
        
        pushInstr("len(" + token[0].id + ") ", "resolves to Unknown", cmdCount, 0, 0);  
    }
        
    return resolution;   
}

function resolve_oct(token)
{
    var tokenVal = convertTokenToValue(token).value;
    
    if (tokenVal < 0)
    {
        tokenVal = tokenVal.toString(8);
        var newVal = tokenVal.slice(0,1) + "0o" + tokenVal.slice(1);
        
        pushInstr("oct(" + token[0].id + ") ", "resolves to "+ newVal, cmdCount, 0, 0);
    }

    else
    {
        var newVal = "0o" + tokenVal.toString(8);
        
        pushInstr("oct(" + token[0].id + ") ", "resolves to "+ newVal, cmdCount, 0, 0);
    }
 
    var resolution = {
        result: newVal + "",
        type: "OCTAL"
    };
    
    return resolution;
}

function resolve_ord(token)
{
    var tokenID = convertTokenToValue(token).value;
    
    if ((typeof tokenID === "string") && (tokenID.length === 1))
    {
        var newVal = tokenID.charCodeAt();
        
        var resolution = {
            result: newVal + "",
            type: "NUMBER"
        }; 
        
        pushInstr("ord(" + token[0].id + ") ", "resolves to "+ newVal + "", cmdCount, 0, 0);
    }
    
    else
    {       
        var resolution = {
            result: "Unknown",
            type: "ERROR"
        };        
        
        pushInstr("ord(" + token[0].id + ") ", "resolves to Unknown", cmdCount, 0, 0);
    }
    
    return resolution; 
}

function resolve_str(token)
{
    var tokenVal = convertTokenToValue(token).value;
    
    var newVal = tokenVal.toString();
    
    var resolution = {
        result: newVal,
        type: "STRING"
    }; 
    
    pushInstr("str(" + token[0].id + ") ", "resolves to "+ newVal, cmdCount, 0, 0);
    
    return resolution;
}

function resolve_type(token)
{
    var tokenVal = convertTokenToValue(token).value;
    
    var newVal = typeof tokenVal;
    
    var resolution = {
        result: newVal,
        type: "STRING"
    }; 
  
    pushInstr("type(" + token[0].id + ") ", "resolves to "+ newVal, cmdCount, 0, 0);
    
    return resolution;
}

function resolve_ceil(token)
{
    var tokenVal = convertTokenToValue(token).value;
    var resolution;
    if (Number.isInteger(tokenVal) /*|| Number.isFloat(tokenVal)*/)
    {
        var newVal = Math.ceil(tokenVal);
        
        pushInstr("ceil(" + token[0].id + ") ", "resolves to " +newVal, cmdCount, 0, 0);
        
        resolution = {
            result: newVal + "",
            type: "NUMBER"
        };        
    }
    
    else
    {
        pushInstr("ceil(" + token[0].id + ") ", "resolves to unknown", cmdCount, 0, 0);
         resolution = {
            result: "Unknown",
            type: "ID"
        };       
    }
       
    
    
    return resolution;
}

function resolve_floor(token)
{
    var tokenVal = convertTokenToValue(token).value;
    
    if (Number.isInteger(tokenVal) || Number.isFloat(tokenVal))
    {
        var newVal = Math.ceil(tokenVal);
        
        pushInstr("floor(" + token[0].id + ") ", "resolves to " + newVal, cmdCount, 0, 0);
        var resolution = {
            result: newVal + "",
            type: "NUMBER"
        };        
    }
    
    else
    {
        pushInstr("floor(" + token[0].id + ") ", "resolves to unknown", cmdCount, 0, 0);
        var resolution = {
            result: "Unknown",
            type: "ID"
        };       
    }
       
    
    return resolution;
}

function resolve_sqrt(token)
{
    var tokenVal = convertTokenToValue(token).value;
    
    var newVal = Math.sqrt(tokenVal);
    var resolution = {
        result: newVal + "",
        type: "FLOAT"
    };
    
    pushInstr("sqrt(" + token[0].id + ") ", "resolves to " +newVal, cmdCount, 0, 0);
    return resolution;
}

function resolve_cos(token)
{
    var tokenVal = convertTokenToValue(token).value;
    
    var newVal = Math.cos(tokenVal);
    
    var resolution = {
        result: newVal + "",
        type: "FLOAT"
    };    
    
    pushInstr("cos(" + token[0].id + ") ", "resolves to " + newVal, cmdCount, 0, 0);
    return resolution;
}

function resolve_sin(token)
{
    var tokenVal = convertTokenToValue(token).value;
    
    var newVal = Math.sin(tokenVal);
    
    var resolution = {
        result: newVal + "",
        type: "FLOAT"
    };    
    
    pushInstr("sin(" + token[0].id + ") ", "resolves to " +newVal, cmdCount, 0, 0);
    return resolution;   
}

function resolve_built_ins(opToken, tokenList)
{
    var res;
    
    switch (opToken.id){
        case "abs":
            res = resolve_abs(tokenList);
            break;
        case "bin":
            res = resolve_bin(tokenList);
            break;
        case "bool":
            res = resolve_bool(tokenList);
            break;
        case "chr":
            res = resolve_chr(tokenList);
            break;
        case "float":
            res = resolve_float(tokenList);
            break;
        case "hex":
            res = resolve_hex(tokenList);
            break;
        case "len":
            res = resolve_len(tokenList);
            break;
        case "oct":
            res = resolve_oct(tokenList);
            break;
        case "ord":
            res = resolve_ord(tokenList);
            break;
        case "str":
            res = resolve_str(tokenList);
            break;
        case "type":
            res = resolve_type(tokenList);
            break;
        case "ceil":
            res = resolve_ceil(tokenList);
            break;
        case "floor":
            res = resolve_floor(tokenList);
            break;
        case "sqrt":
            res = resolve_sqrt(tokenList);
            break;
        case "cos":
            res = resolve_cos(tokenList);
            break;
        case "sin":
            res = resolve_sin(tokenList);
            break;
    }
    
    return res;
}

function skip_indented_lines(input){
    var inputSlice = input;
    inputSlice = skipEmptyLines(input);
    var token = getToken(inputSlice, false);
    var skip_length = token.length;
    var current_length = token.length;
    var cut_off = "";
    var start_line = token.line_no;
    
    while(current_length >= skip_length && token.type !== "END_OF_FILE"){
        var two_items = skip_one_line(inputSlice);
        inputSlice = two_items[0];
        cut_off = cut_off + two_items[1];
        //document.getElementById("outputField").value += "Portion Cut Off: \n" + cut_off + "\n";
        //document.getElementById("outputField").value += "Input Left: " + input + "\n\n\n";
        token = getToken(inputSlice, false);
        if(token.type === "SPACE"){
            current_length = token.length;
            var i;
            for(i = 0; i < token.length; i++){
                cut_off = cut_off + " ";
            }
            inputSlice = inputSlice.slice(token.length);
            token = getToken(inputSlice, false);
        } else if(token.type === "TAB"){
            current_length = token.length;
            inputSlice = inputSlice.slice(1);
            cut_off = cut_off + token.id;
            token = getToken(inputSlice, false);
        }else if(token.type === "END_OF_LINE"){ 
            //current_length = 0;
            cut_off = cut_off + token.id;
        } else {
            current_length = 0;
        }
    }
    
    var toReturn = {
        inputSlice: inputSlice,
        cut_off: cut_off,
        start_line: start_line
    };
    
    return toReturn;
}

function skip_one_line(input){
    var token = getToken(input, false);
    var multiLine = ["LPAREN", "LBRACE", "LBRACKET", "QUOTE", "TAB", "RPAREN", "RBRACE", "RBRACKET", "SPACE"];
    var lineEnds = ["END_OF_LINE", "END_OF_FILE"];
    
    var openParenCount = 0;
    var openBraceCount = 0;
    var openBracketCount = 0;
    
    var spliced_line = "";

    
    while(!lineEnds.includes(token.type) || openParenCount !== 0 || openBraceCount !== 0 || openBracketCount !== 0){
        if(multiLine.includes(token.type)){
            switch(token.type){
                case "LPAREN":
                    openParenCount++;
                    spliced_line = spliced_line + token.id;
                    input = input.slice(token.length);
                    token = getToken(input, false);
                    break;

                case "LBRACE":
                    openBraceCount++;
                    spliced_line = spliced_line + token.id;
                    input = input.slice(token.length);
                    token = getToken(input, false);
                    break;

                case "LBRACKET":
                    openBracketCount++;
                    spliced_line = spliced_line + token.id;
                    input = input.slice(token.length);
                    token = getToken(input, false);
                    break;

                case "QUOTE":
                    // slice off quotes in another function
                    spliced_line = spliced_line + token.id;
                    input = input.slice(token.length);
                    token = getToken(input, false);
                    var result = skip_quote(input);
                    input = result[0];
                    spliced_line = spliced_line + result[1];
                    document.getElementById("outputField").value +="skip_one_line: " + spliced_line +"\n";
                    
                    token = getToken(input, false);
                    document.getElementById("outputField").value +="skip_one_line: " + token.id +"\n";
                    break;

                case "TAB":
                    spliced_line = spliced_line + token.id;
                    input = input.slice(1);
                    token = getToken(input, false);
                    break;

                case "RPAREN":
                    openParenCount--;
                    spliced_line = spliced_line + token.id;
                    input = input.slice(token.length);
                    token = getToken(input, false);
                    break;

                case "RBRACE":
                    openBraceCount--;
                    spliced_line = spliced_line + token.id;
                    input = input.slice(token.length);
                    token = getToken(input, false);
                    break;

                case "RBRACKET":
                    openBracketCount--;
                    spliced_line = spliced_line + token.id;
                    input = input.slice(token.length);
                    token = getToken(input, false);
                    break;
                    
                case "SPACE":
                    var i;
                    for(i = 0; i < token.length; i++){
                        spliced_line = spliced_line += " ";
                    }
                    input = input.slice(token.length);
                    token = getToken(input, false);
                    break; 
                    
            } // end switch statement
        } else {
            // If not a character that needs to be handled just remove
            spliced_line = spliced_line + token.id;
            input = input.slice(token.length);
            token = getToken(input, false);
        } // end if
    } //end while
    
    if(token.type !== "END_OF_FILE"){
        spliced_line = spliced_line + token.id;
    }
    input = input.slice(token.length);
    return [input, spliced_line];
}

function skip_quote(input){
    //should have one quote at this point 
    var token = getToken(input, false);
    var spliced = token.id;
    var saved = token.id;
    document.getElementById("outputField").value += "skip_quote called\n";
    var match_found = false;
    
    if(token.type === "QUOTE"){
        //second quote
        input = input.slice(token.length);
        token = getToken(input, false);
        document.getElementById("outputField").value += "Two Quotes; Next Token: " + token.type + "\n";
        if(token.type === "QUOTE"){
            //third quote -> run until three quotes again
            saved = saved + token.id;
            while(!match_found){
                token = getToken(input, false);
                if(token.type === "QUOTE"){
                    //one quote
                    spliced = spliced + token.id;
                    input = input.slice(token.length);
                    token = getToken(input);
                    if(token.type === "QUOTE"){
                        spliced = spliced + token.id;
                        input = input.slice(token.length);
                        token = getToken(input);
                        if(token.type === "QUOTE"){
                            match_found = true;
                            spliced = spliced + token.id;
                            input = input.slice(token.length);
                        } else {
                            spliced = spliced + token.id;
                            input = input.slice(token.length);
                        } // end third quote if
                    } else {
                        spliced = spliced + token.id;
                        input = input.slice(token.length);
                    } // end second quote if
                } else {
                    spliced = spliced + token.id;
                    input = input.slice(token.length);
                } // end first quote if
            }// end while
        }// end if
        // if there are only two quotes, nothing needs to be done
    } else {
        // only one quote, run until matching quote then return
        input = input.slice(token.length);
        token = getToken(input, false);
        while(token.type !== "QUOTE"){
            spliced = spliced + token.id;
            input = input.slice(token.length);
            token = getToken(input, false);
        }
        input = input.slice(token.length);
        spliced = spliced + token.id;
    }
    
    return [input, spliced];
}


function runtime_error(errorType){ //TODO: flesh out types
    switch(errorType){
        case "UNDECLARED_VAR":
            alert("Undeclared variable used");
            exit();
            break;
        case "INCOMPATIBLE_TYPES":
            alert("Types incompatible for that operation");
            exit(); 
            break;
        case "INVALID_OP":
            alert("Operation incompatible for those types");
            exit();
            break;
        case "INVALID_ASSIGNMENT":
            alert("Cannot assign to that value");
            exit();
            break;
    }
}