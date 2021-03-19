(function (){
    const ObjectStart = "{";
    const ObjectEnd = "{";
    const KeyValueSeperator = "=";
    const Comment = "#";
    const NewLine = "\n";
    const NameValRegex = /[\w\_\-\.\/]/

    window.parse = function(){
        fetch("Policies.euobj").then(x => x.text())
            .then(parser)
            .then(console.log)
    }

    function parser(s){
        // The buffer for the property name
        var buffers = getBuffers();
        var outputObj = {};
        for(var i = 0; i < s.length; i++){
            var bufferState = buffers.getBufferState();
            var char = s[i];
            if(char === ' '  || char === '\t'){
                continue;
            }
            if(char === Comment){
                var findNextRes = findNext(s, NewLine, i);
                i = findNextRes[0];
                continue;
            }
            if(NameValRegex.test(char)){
                if(!bufferState.propSide){
                    var findNextRes = findNext(s, KeyValueSeperator, i);
                    var nextIndex = findNextRes[i];
                    var propValue = findNextRes[j];
                    buffers.setPropName(propValue);
                    i = nextIndex;
                    continue;
                } else{
                    var findNextRes = findNext(s, ObjectStart + NewLine + ObjectEnd, i);
                    var nextIndex = findNextRes[i];
                    var propValue = findNextRes[j];
                    buffers.setPropValue(propValue);
                    i = nextIndex;
                    continue;
                }
                
            }
            if(char === KeyValueSeperator){
                buffers.setPropSide(true);
            }
            if(char === ObjectStart){
                buffers.setValBuffer({});
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

    function getBuffers(){
        return (function(){
            var propNameBuffer = [];
            var propValBuffer = [];

            var repeatNameBuffer = [];
            var propSideBuffer = [];
            var currentBufferDepth = 0;

            var self = {
                getBuffer: function(type){
                    switch(type.toLowerCase()){
                        case 'propname':
                            return propNameBuffer[currentBufferDepth];
                        case 'propval':
                            return propValBuffer[currentBufferDepth];
                        case 'repeatname':
                            return repeatNameBuffer[currentBufferDepth];
                        case 'propside':
                            return propSideBuffer[currentBufferDepth];
                    }
                },
                getBufferState: function(offset){
                    if(!offset){offset = 0;}
                    return {
                        propName: self.getBuffer('propName')[currentBufferDepth-offset],
                        propVal: self.getBuffer('propVal')[currentBufferDepth-offset],
                        repeatName: self.getBuffer('repeatName')[currentBufferDepth-offset],
                        propSide: self.getBuffer('propSide')[currentBufferDepth-offset],
                        depth: currentBufferDepth
                    };
                },
                setVal: function(val, offset){
                    if(!offset){offset = 0;}
                    propValBuffer[currentBufferDepth - offset] = val;
                },
                setPropSide: function(propSide){
                    propSideBuffer[currentBufferDepth] = propSide;
                },
                setPropName: function(propName){
                    propNameBuffer[currentBufferDepth] = propName;
                },
                goDeeper: function(){
                    currentBufferDepth++;
                    self.getBuffer('propName').push('');
                    self.getBuffer('propVal').push('');
                    self.getBuffer('repeatName').push({});
                    self.getBuffer('propSide').push(false);
                },
                comeUp: function(){
                    currentBufferDepth--;
                    return {
                        propName: self.getBuffer('propName').pop(),
                        propVal: self.getBuffer('propVal').pop(),
                        repeatName: self.getBuffer('repeatName').pop(),
                        propSide: self.getBuffer('propSide').pop(),
                        depth: currentBufferDepth + 1,
                    };
                },
            };
            return self;
        }());
    }

    function findNext(whole, searchFor, currentIndex){
        var remaining = whole.substring(currentIndex+1);
        if(searchFor.length > 1){
            var nearest = searchFor.split('').sort((x, y) => {
                var nextX = remaining.indexOf(x);
                var nextY = remaining.indexOf(y);
                return nextX < nextY;
            });
            searchFor = nearest;
        } 
        var next = remaining.indexOf(searchFor);
        var until = remaining.substring(0, next);
        return [currentIndex + next + 1, until];
    }
}())