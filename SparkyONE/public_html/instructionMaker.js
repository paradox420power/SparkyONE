
var instrList = new Array(); //global list of instructions
var funcList = new Array(); //list of callable functions
var varList = new Array(); //list of declared variables
var cmdCount = 1;

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

//custom function list operations
function pushFunc(fName){
    var Cust_Func = {
        name: fName, //name of function
        paramType: ["void"], //can be re-decalred later by doing "paramType.length = 0"
        returnType: "void"
    };
    funcList.push(Cust_Func);
}

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
function varIsDeclared(vName){ //used to decide if a var should be declared or updated
    var index = -1;
    for(var x = 0; x < varList.length; x++){
        if(varList[x].id === vName)
            index = x;
    }
    return index;
}

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

function getVarValue(index){
    return varList[index].value;
}

function updateVarValue(index, newVal){
    varList[index].value = newVal;
}

//priority queue operations
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

function create_instructions(input){
    //proof of concept
    var lineEnds = ["SEMICOLON", "END_OF_LINE", "END_OF_FILE"];
    var lexeme;
    while(input.length > 0){
        lineTokens = []; //reset array 
        lexeme = getToken(input, true);
        appendTokenList(lexeme);
        input = input.slice(lexeme.length);
        switch(lexeme.type){
            case "ID": //some assign statement or function call
                while(!lineEnds.includes(lexeme.type)){
                    lexeme = getToken(input, true);
                    appendTokenList(lexeme);
                    input = input.slice(lexeme.length);
                }
                order_assign_statement(lineTokens);
                lineTokens = [];
                break;
            default: document.write("Error ");
                input = input.slice(1);
                break;
        }
        cmdCount++;
    }
    return instrList;
}

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
                case "PLUS":
                case "MINUS": tempPriority = 1 + priorityMod;
                    break;
                case "MULT":
                case "DIV": tempPriority = 2 + priorityMod;
                    break;
                case "MOD":
                case "EXPONENTIAL": tempPriority = 3 + priorityMod;
                    break;
                case "ADD_ASSIGN":
                case "SUB_ASSIGN":
                case "MULT_ASSIGN":
                case "DIV_ASSIGN":
                case "MOD_ASSIGN":
                case "ASSIGN_EQUALS": tempPriority = 0;
                    break;
                case "LPAREN": priorityMod += 10;
                    dontQueue = true;
                    break;
                case "RPAREN": priorityMod -= 10;
                    dontQueue = true;
                    break;
                case "SEMICOLON":
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
                instrQueue.push(rawInstr);
            }
        }
    }
    
    var instr = "";
    var result = "";
    var lineN;
    var nextL = 0;
    
    for(var x = 0; x < instrQueue.length; x++){
        document.write(instrQueue[x].token.id + "    ");
    }
    document.write("<br>");
    /*for(var x = 0; x < instrQueue.length; x++){
        document.write(instrQueue[x].priority.toString() + "    ");
    }
    document.write("<br>");*/
    
    var opIndex = 1;
    var currentOp;
    var val1;
    var val2;
    var resolution;
    var mathOps = ["PLUS", "MINUS", "MULT", "DIV", "MOD"];
    while(instrQueue.length > 1){
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
        if(mathOps.includes(currentOp.type)){
            resolution = resolveMath(val1, currentOp, val2);
        }else{
            resolution = resolveAssign(val1, currentOp, val2);
        }
        resolveQueue(opIndex, instrQueue, resolution); //remove these 3 tokens & replace with ID for the resolution
    }
    instrQueue = [];
    
    //pushInstr(inst, result, cmd, lineN, nextL)
}

function resolvePrecedingOperators(resolveToken){ //step by step resolution of "++--+#"
    var resolved;
    var instr = "";
    var result = "";
    var isNeg = false;
    var numbers = /^[0-9]+$/;
    var notResolved = true;
    while(notResolved){
        if(resolveToken.id.charAt(0) === "+"){
            if(resolveToken.id.charAt(1).match(numbers) || resolveToken.id.charAt(1) === "."){ //+# becomes #
                notResolved = false;
                instr = resolveToken.id;
                result = resolveToken.id.slice(1); //slice off the '+'
                if(isNeg) //indicate the whole number & its result are negative
                    pushInstr("-(" + instr + ")", "-(" + result + ")", cmdCount, resolveToken.line_no, 0);
                else
                    pushInstr(instr, result, cmdCount, resolveToken.line_no, 0);
                resolved = result;
            }else{ //more +/-
                instr = resolveToken.id;
                result = resolveToken.id.slice(1); //slice off the '+'
                if(isNeg)
                    pushInstr("-(" + instr + ")", "-(" + result + ")", cmdCount, resolveToken.line_no, 0);
                else
                    pushInstr(instr, result, cmdCount, resolveToken.line_no, 0);
                resolveToken.id = result;
            }
        }else if(resolveToken.id.charAt(0) === '-'){
            if(resolveToken.id.charAt(1).match(numbers) || resolveToken.id.charAt(1) === "."){
                notResolved = false;
                if(isNeg)
                    instr = "-(" + resolveToken.id + ")";
                else
                    instr = resolveToken.id;
                result = resolveToken.id.slice(1); //slice off the '-'
                isNeg = !isNeg;
                if(!isNeg) //only push an instruction of --# to #
                    pushInstr(instr, result, cmdCount, resolveToken.line_no, 0);
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
                    pushInstr(instr, "-(" + result + ")", cmdCount, resolveToken.line_no, 0);
                else
                    pushInstr(instr, result, cmdCount, resolveToken.line_no, 0);
                resolveToken.id = result;
            }
        }
    }
    if(isNeg)
        resolved = "-" + resolved; //add the - outisde parantheses to tthe official return
    return resolved;
}

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
        instr = "\"" + instr + "\"";
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
        }
    }
    result = value;
    if(token.type !== "NUMBER" && token.type !== "FLOAT"){ //nothing to really show on that conversion
        pushInstr(instr, result, cmdCount, token.line_no, 0);
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
    pushInstr(instr, resolved, cmdCount, lineN, 0);
    var resultType = "NUMBER"; //determined later
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
            resolved = val2.id + " assigned to " + val1.id;
            break;
        case "ADD_ASSIGN":
            tmpOp.id = "+";
            tmpOp.type = "PLUS";
            intermediateRes = resolveMath(val1, tmpOp, val2);
            newVal = intermediateRes.result;
            instr = val1.id + " = " + newVal;
            resolved = intermediateRes.result + " assigned to " + val1.id;
            break;
        case "SUB_ASSIGN":
            tmpOp.id = "-";
            tmpOp.type = "MINUS";
            intermediateRes = resolveMath(val1, tmpOp, val2);
            newVal = intermediateRes.result;
            instr = val1.id + " = " + newVal;
            resolved = intermediateRes.result + " assigned to " + val1.id;
            break;
        case "MULT_ASSIGN":
            tmpOp.id = "*";
            tmpOp.type = "MULT";
            intermediateRes = resolveMath(val1, tmpOp, val2);
            newVal = intermediateRes.result;
            instr = val1.id + " = " + newVal;
            resolved = intermediateRes.result + " assigned to " + val1.id;
            break;
        case "DIV_ASSIGN":
            tmpOp.id = "/";
            tmpOp.type = "DIV";
            intermediateRes = resolveMath(val1, tmpOp, val2);
            newVal = intermediateRes.result;
            instr = val1.id + " = " + newVal;
            resolved = intermediateRes.result + " assigned to " + val1.id;
            break;
        case "MOD_ASSIGN":
            tmpOp.id = "%";
            tmpOp.type = "MOD";
            intermediateRes = resolveMath(val1, tmpOp, val2);
            newVal = intermediateRes.result;
            instr = val1.id + " = " + newVal;
            resolved = intermediateRes.result + " assigned to " + val1.id;
            break;
    }
    if(val1.type === "ID"){
        index = varIsDeclared(val1.id);
        if(index === -1){//new variable
            //pushVar(vName, vType, vValue, vFuncScope, vIndentScope)
            pushVar(val1.id, val2.type, newVal, "global", 0);
        }else{ //update existing
            updateVarValue(index, newVal);
        }
    }//else this is an invalid assignment statement
    pushInstr(instr, resolved, cmdCount, lineN, 0);
    var resultType = "ID"; //assign should always go to ID
    var resolution = {
        result: resolved + "",
        type: resultType
    };
    return resolution;
}
