window.getData = async function(){
    // var lsData = localStorage.getItem("idea-variation-data");
    // if(lsData){
    //     return JSON.parse(lsData);
    // }
    return await Promise.all([
        fetch("Ideas.euobj").then(x => x.text()),
        fetch("Policies.euobj").then(x => x.text())
    ]).then((resp) => {
        var ideasObj = parse(resp[0]);
        var policiesObj = parse(resp[1]);
        var processedPolicies = processPolicies(policiesObj);
        var processedIdeas = processIdeas(ideasObj);
        var data = {
            ideas: processedIdeas[0],
            ideaBonuses: processedIdeas[1],
            policies: processedPolicies[0],
            policyBonuses: processedPolicies[1],
        };
        localStorage.setItem("idea-variation-data", JSON.stringify(data));
        return data;
    });
    
}

function parse(s){
    var lines = s.split('\n');
    var objBuffers = [{}];
    var nameBuffer = [''];
    var orderBuffer = [0];
    var bufferDepth = 0;
    var valueBuffer = '';
    var valueRegex = /[\w\_\-\.\/]/;
    var repeatNameBuffer = [{}];
    var nameSet = false;
    for(var i = 0; i < lines.length; i++){
        var line = lines[i].trim();
        if(line.length == 0 || line[0] === '#'){
            continue;
        }
        for(var j = 0; j < line.length; j++){
            var char = line[j];
            if(char === '#'){
                break;
            }
            if(char === ' ' || char === '\t'){
                continue;
            }
            if(char === '{'){
                orderBuffer[bufferDepth]++;
                bufferDepth++;
                objBuffers[bufferDepth] = {};
                nameBuffer[bufferDepth] = '';
                orderBuffer[bufferDepth] = 0;
                repeatNameBuffer[bufferDepth] = {};
            }
            if(char === '}'){
                var theObj = objBuffers[bufferDepth];
                bufferDepth--;
                theObj._order = orderBuffer[bufferDepth];
                orderBuffer[bufferDepth + 1] = 0;
                var name = window.replaceName(nameBuffer[bufferDepth]);
                if(repeatNameBuffer[bufferDepth][name] !== undefined){
                    repeatNameBuffer[bufferDepth][name]++;
                    name = name + "__" + repeatNameBuffer[bufferDepth][name];
                    
                } else {
                    repeatNameBuffer[bufferDepth][name] = 0;
                }
                objBuffers[bufferDepth][name] = theObj;
                nameBuffer[bufferDepth] = '';
                objBuffers[bufferDepth + 1] = undefined;
                repeatNameBuffer[bufferDepth+1] = {};
            }
            if(valueRegex.test(char)){
                if(!nameSet){
                    nameBuffer[bufferDepth] += char;
                } else {
                    valueBuffer += char;
                }
            }
            if(char === '='){
                nameSet = true;
            }
        }
        // finished the line
        if(valueBuffer !== ''){
            var name = window.replaceName(nameBuffer[bufferDepth]);
            if(repeatNameBuffer[bufferDepth][name] !== undefined){
                repeatNameBuffer[bufferDepth][name]++;
                name = name + "__" + repeatNameBuffer[bufferDepth][name];
                
            } else {
                repeatNameBuffer[bufferDepth][name] = 0;
            }
            objBuffers[bufferDepth][name] = window.replaceName(valueBuffer);
            nameBuffer[bufferDepth] = '';
            valueBuffer = '';
            
        }
        nameSet = false;
    }
    return objBuffers[0];
}

function processIdeas(ideasObj){
    var output = [];
    var bonuses = [];
    var keys = Object.getOwnPropertyNames(ideasObj);
    for(var i = 0; i < keys.length; i++){
        var idea = {};
        idea.bonuses = [];
        var ideaName = keys[i];
        idea.name = ideaName;
        idea.exclusiveCategory = getIdeaGroupExclusiveCategory(ideaName);
        var ideaValue = ideasObj[ideaName];
        var ideaPropKeys = Object.getOwnPropertyNames(ideaValue);
        for(var j = 0; j < ideaPropKeys.length; j++){
            var ideaPropName = ideaPropKeys[j];
            var ideaPropValue = ideaValue[ideaPropName];
            if(ideaPropName == 'category'){
                idea.category = ideaPropValue.toUpperCase();
            } else if(ideaPropName == 'trigger')
            {
                idea.triggers = processTrigger(ideaPropValue);
            }else if(ideaPropName == 'important' || ideaPropName == 'ai_will_do' || ideaPropName == '_order'){

            }
             else{
                idea.bonuses.push({
                    'name': ideaPropName,
                    'bonus': ideaPropValue,
                    'order': ideaPropName == 'bonus' ? 9999 : ideaPropValue._order
                });
                var bonusNames = Object.getOwnPropertyNames(ideaPropValue);
                for(var k = 0; k < bonusNames.length; k++){
                    if(bonusNames[k] !== '_order'){
                        bonuses.push(bonusNames[k].indexOf("__") > -1 ? bonusNames[k].split("__")[0]: bonusNames[k]);
                    }
                }
            }
        }
        idea.bonuses.sort((x, y) => x.order < y.order ? -1 : 1);
        output.push(idea);
    }
    return [output, bonuses.filter((x, i) => bonuses.indexOf(x) === i)];
}

function processPolicies(policiesObj){
    var output = [];
    var keys = Object.getOwnPropertyNames(policiesObj);
    var bonuses = [];
    for(var i = 0; i < keys.length; i++){
        var policy = {};
        policy.bonuses = [];
        var policyName = keys[i];
        var policyValue = policiesObj[policyName];
        var policyPropKeys = Object.getOwnPropertyNames(policyValue);
        for(var j = 0; j < policyPropKeys.length; j++){
            var policyPropName = policyPropKeys[j];
            var policyPropValue = policyValue[policyPropName];
            if(policyPropName == 'monarch_power'){
                policy.monarchPower = policyPropValue.toUpperCase();
            } else if(policyPropName == 'allow')
            {
                policy.allow = processAllow(policyPropValue);
            }else if(policyPropName == 'potential'){
                policy.potential = policyPropValue
            }
            else if(policyPropName == 'ai_will_do' || policyPropName == '_order'){

            }
             else{
                policy.bonuses.push({
                    'name': policyPropName,
                    'bonus': policyPropValue,
                });
                bonuses.push(policyPropName.indexOf('__') > -1
                    ? policyPropName.startsWith.split('__')[0]
                    : policyPropName);
            }
        }
        output.push(policy);
    }
    bonuses = bonuses.filter((x, i) => bonuses.indexOf(x) === i);
    return [output, bonuses];
}

var imperial = ["Imperial", "Imperial ambition"];
var ship = ["Heavy ship", "Light ship", "Galley"];
var army = ["Mercenary army", "Standing army", "Conscription"];
var government = ["Horde", "Theocracy", "Republic", "Monarchy", "Dictatorship"];
var damage = ["Shock", "Fire"];
var centralism = ["Centralism", "Decentralism"];
var religious = ["Religious","Catholic", "Protestant", "Reformed", "Orthodox", "Sunni", "Tengri", "Hindu", "Confucian", "Buddhist", "Norse", "Shinto", "Cathar", "Coptic", "Romuva", "Suomi", "Jewish", "Slav", "Hellanistic", "Manichean", "Animist", "Fetishist", "Zoroastrianism", "Anglican", "Nahuatl", "Mesoamerican", "Inti", "Totemism", "Shia", "Ibadi", "Hussite"];

function getIdeaGroupExclusiveCategory(ideaGroupName){
    
    if(imperial.indexOf(ideaGroupName) > -1){
        return "Imperial";
    }
    if(ship.indexOf(ideaGroupName) > -1){
        return "Ship";
    }
    if(army.indexOf(ideaGroupName) > -1){
        return "Army";
    }
    if(government.indexOf(ideaGroupName) > -1){
        return "Government";
    }
    if(damage.indexOf(ideaGroupName) > -1){
        return "Damage";
    }
    if(centralism.indexOf(ideaGroupName) > -1){
        return "Centralism";
    }
    if(religious.indexOf(ideaGroupName) > -1){
        return "Religious";
    }
    return "General";
}

function processAllow(allowObj){
    var output = {};
    var keys = Object.getOwnPropertyNames(allowObj);
    for(var i = 0; i < keys.length; i++){
        var key = keys[i];
        var value = allowObj[key];
        if(key == "hidden_trigger"){
            output["full_idea_group_990"] = "(Any incomplete)";
        }
        if(key.startsWith("OR")){
            if(Object.values(value).indexOf("Religious") > -1){
                key = "full_idea_group__997";
                value = "(Any Religious)";
            }
            if(Object.values(value).indexOf("Horde") > -1){
                if(Object.values(value).indexOf("Republic") === -1){
                    value = "(Any Government but republic)";
                } else{
                    value = "(Any Government)";
                }
                key = "full_idea_group__998";
                value = "(Any Government)";
            }
            if(Object.values(value).indexOf("Heavy ship") > -1){
                if(Object.values(value).indexOf("Light ship") === -1){
                    value = "(Heavy/Galley)";
                } else{
                    value = "(Heavy/Light/Galley)";
                }
                key = "full_idea_group__999";
                
            }
            if(Object.values(value).indexOf("Imperial") > -1){
                key = "full_idea_group__996";
                value = "(Imperial/Imperial Ambition)"
            }
            if(Object.values(value).indexOf("Standing Army") > -1){
                key = "full_idea_group__995";
                value = "(Standing Army/Conscription)"
            }
        }
        output[key] = value;
    }
    return output;
}

function processTrigger(triggerObj){
    var not = false;
    var or = false;
    if(triggerObj["NOT"]){
        not = true;
        triggerObj = triggerObj["NOT"];
    } 
    if(triggerObj["OR"]){
        or = true;
        triggerObj = triggerObj["OR"];
    }
    var triggers = [];
    var triggerKeys = Object.getOwnPropertyNames(triggerObj);
    for(var i = 0; i < triggerKeys.length; i++){
        triggers.push({
            type: triggerKeys[i].split('__')[0],
            value: triggerObj[triggerKeys[i]]
        });
    }
    return {
        not,
        or,
        triggers
    };
}