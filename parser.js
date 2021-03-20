(function (){
    const ObjectStart = "{";
    const ObjectEnd = "}";
    const KeyValueSeperator = "=";
    const Comment = "#";
    const NewLine = "\n";
    const NameValRegex = /[\w\_\-\.\/]/

    window.parse = function(){
        fetch("Policies.euobj").then(x => x.text())
            .then(parser)
            .then(console.log);
    }

    function parser(s){
        // The buffer for the property name
        var buffers = new Buffers();
        var outputObj = {};
        for(var i = 0; i < s.length; i++){
            var bufferState = buffers.getBufferState();
            var char = s[i];
            if(1 < 1000){
                console.log(char, bufferState);
            }
            
            
            if(char === ' '  || char === '\t'){
                continue;
            }
            if(char === Comment){
                i = i + s.substring(i).indexOf(NewLine);
                continue;
            }
            if(NameValRegex.test(char)){
                if(!bufferState.propSide){
                    buffers.setPropName(bufferState.propName + char);
                    continue;
                } else{
                    buffers.setVal(bufferState.propVal + char);
                    continue;
                }
            }
            if(char === KeyValueSeperator){
                buffers.setPropSide(true);
            }
            if(char === ObjectStart){
                buffers.setVal({});
                buffers.goDeeper();
            }
            // Newline is a valid prop seperator, like , in json
            if(char === NewLine){
                buffers.setPropSide(false);
                // There is a value in this level of buffer, add to obj
                if(typeof(bufferState.propVal) === "string"){
                    var lastBufferState = buffers.getBufferState(1);
                    lastBufferState.propVal[bufferState.propName] = bufferState.propVal;
                }
            }
            if(char === ObjectEnd){
                var bufferState = buffers.comeUp();
                var newBufferState = buffers.getBufferState();
                //console.log(bufferState, newBufferState);
                if(!newBufferState.depth){
                    outputObj[newBufferState.propName] = newBufferState.propVal;
                } else {
                    var upperBufferState = buffers.getBufferState(1);
                    buffers.setVal(Object.assign({}, upperBufferState.propVal, {
                        [newBufferState.propName]: newBufferState.propVal
                    }), 1);
                }
            }
        }
        return outputObj;
    }

    function Buffers(){
    
        var propNameBuffer = [];
        var propValBuffer = [];

        var repeatNameBuffer = [];
        var propSideBuffer = [];

        propNameBuffer.push('');
        propValBuffer.push('');
        repeatNameBuffer.push({});
        propSideBuffer.push(false);

        var currentBufferDepth = 0;
        var self = this;
        this.getBuffer = function(type){
            switch(type.toLowerCase()){
                case 'propname':
                    return propNameBuffer[currentBufferDepth];
                case 'propval':
                    return propValBuffer[currentBufferDepth];
                case 'repeatname':
                    return repeatNameBuffer[currentBufferDepth];
                case 'propside':
                    return propSideBuffer[currentBufferDepth];
                default:
                    throw new Error(type + " is not defined");
            }
        };
        this.getBufferState= function(offset){
            if(!offset){offset = 0;}
            return {
                propName: self.getBuffer('propName')[currentBufferDepth-offset],
                propVal: self.getBuffer('propVal')[currentBufferDepth-offset],
                repeatName: self.getBuffer('repeatName')[currentBufferDepth-offset],
                propSide: self.getBuffer('propSide')[currentBufferDepth-offset],
                depth: currentBufferDepth
            };
        };
        this.setVal= function(val, offset){
            if(!offset){offset = 0;}
            propValBuffer[currentBufferDepth - offset] = val;
        };
        this.setPropSide= function(propSide){
            propSideBuffer[currentBufferDepth] = propSide;
        };
        this.setPropName= function(propName){
            propNameBuffer[currentBufferDepth] = propName;
        };
        this.goDeeper= function(){
            currentBufferDepth++;
            propNameBuffer.push('');
            propValBuffer.push('');
            repeatNameBuffer.push({});
            propSideBuffer.push(false);
        };
        this.comeUp= function(){
            currentBufferDepth--;
            return {
                propName: propNameBuffer.pop(),
                propVal: propValBuffer.pop(),
                repeatName: repeatNameBuffer.pop(),
                propSide: propSideBuffer.pop(),
                depth: currentBufferDepth + 1,
            };
        };    
    }
}())