
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

function resolveQueue(index, queue, result){ 
    queue[index - 1].token.id = result; //update value
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

var instrQueue = new Array(); //honestly, fuck the fact array.push() adds a pointer so pdates to that data type are retroactive the array
function appendPQueue(token, pToken){ //because lexeme is dynamically updated in a list
    var rawInstr = {
        token: token,
        priority: pToken
    };
    instrQueue.push(rawInstr);
}


function order_assign_statement(passedTokens){
    var priorityMod = 0; //used to scope priority of () operations
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
                case "EXPONENTIAL": tempPriority = 3 + priorityMod;
                    break;
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
            if(!dontQueue){
                appendPQueue(tempToken, tempPriority);
            }
        }
    }
    
    var instr = "";
    var result = "";
    var lineN;
    var nextL = 0;
    
    /*for(var x = 0; x < instrQueue.length; x++){
        document.write(instrQueue[x].token.id + "    ");
    }
    document.write("<br>");
    for(var x = 0; x < instrQueue.length; x++){
        document.write(instrQueue[x].priority.toString() + "    ");
    }*/
    
    var opIndex = 1;
    var currentOp;
    var val1;
    var val2;
    var resolution;
    var mathOps = ["PLUS", "MINUS", "MULT", "DIV"];
    while(instrQueue.length > 1){
        opIndex = priorityPop(instrQueue);
        val1 = instrQueue[opIndex-1].token;
        currentOp = instrQueue[opIndex].token;
        val2 = instrQueue[opIndex+1].token;
        instr = val1.id + " " + currentOp.id + " " + val2.id;
        if(mathOps.includes(currentOp.type)){
            resolution = resolveMath(val1, currentOp, val2);
        }else{
            resolution = resolveAssign(val1, currentOp, val2);
        }
        lineN = currentOp.line_no;
        pushInstr(instr, resolution, cmdCount, lineN, nextL);
        resolveQueue(opIndex, instrQueue, resolution); //remove these 3 tokens & replace with ID for the resolution
    }
    instrQueue = [];
    
    //pushInstr(inst, result, cmd, lineN, nextL)
}


function resolveMath(val1, op, val2){
    var resolved;
    var num1, num2;
    var index;
    if(val1.type === "ID"){
        index = varIsDeclared(val1.id);
        if(index !== -1){//not a new variable
            num1 = Number.parseInt(getVarValue(index), 10);//assumes to be an int at this point
        }else{//new variable, but it can't be declared here
            
        }
    }else{
        num1 = Number.parseInt(val1.id, 10);
    }
    if(val2.type === "ID"){
        index = varIsDeclared(val2.id);
        if(index !== -1){//not a new variable
            num2 = Number.parseInt(getVarValue(index), 10);
        }else{//new variable, but it can't be declared here
            
        }
    }else{
        num2 = Number.parseInt(val2.id, 10);
    }
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
        
    }
    return resolved + "";
}

function resolveAssign(val1, op, val2){
    var resolved;
    var index;
    switch(op.type){
        case "ASSIGN_EQUALS":
            resolved = val2.id + " assigned to " + val1.id;
            break;
        case "ADD_EQUALS":
            
            break;
    }
    if(val1.type === "ID"){
        index = varIsDeclared(val1.id);
        if(index === -1){//new variable
            //pushVar(vName, vType, vValue, vFuncScope, vIndentScope)
            pushVar(val1.id, val2.type, val2.id, "global", 0);
        }else{ //update existing
            updateVarValue(index, val2.id);
        }
    }//else this is an invalid assignment statement
    return resolved + "";
}
