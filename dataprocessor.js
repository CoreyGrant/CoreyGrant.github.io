window.getData = function(){
    var ideasObj = parse(getIdeas());
    var policiesObj = parse(getPolicies());
    var processedPolicies = processPolicies(policiesObj);
    var processedIdeas = processIdeas(ideasObj);
    return {
        ideas: processedIdeas[0],
        ideaBonuses: processedIdeas[1],
        policies: processedPolicies
    };
}

// Assumes that any repeated keys will be in the deepest part
// of the object tree
// Doesn't care about parsing the ai_will_do
function parse(s){
    var lines = s.split('\n');
    var objBuffers = [{}];
    var nameBuffer = [''];
    var orderBuffer = [0];
    var bufferDepth = 0;
    var valueBuffer = '';
    var valueRegex = /[\w\_\-\.]/;
    var repeatName = {};
    var nameSet = false;
    for(var i = 0; i < lines.length; i++){
        var line = lines[i].trim();
        if(line.length == 0 || line[0] === '#'){
            continue;
        }
        for(var j = 0; j < line.length; j++){
            var char = line[j];
            if(char === ' ' || char === '\t'){
                continue;
            }
            if(char === '{'){
                orderBuffer[bufferDepth]++;
                bufferDepth++;
                objBuffers[bufferDepth] = {};
                nameBuffer[bufferDepth] = '';
                orderBuffer[bufferDepth] = 0;
                repeatName = {};
            }
            if(char === '}'){
                var theObj = objBuffers[bufferDepth];
                bufferDepth--;
                theObj._order = orderBuffer[bufferDepth];
                orderBuffer[bufferDepth + 1] = 0;
                objBuffers[bufferDepth][window.replaceName(nameBuffer[bufferDepth])] = theObj;
                nameBuffer[bufferDepth] = '';
                objBuffers[bufferDepth + 1] = undefined;
                repeatName = {};
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
            if(repeatName[name] !== undefined){
                repeatName[name]++;
                name = name + "__" + repeatName[name];
                
            } else {
                repeatName[name] = 0;
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
        var ideaValue = ideasObj[ideaName];
        var ideaPropKeys = Object.getOwnPropertyNames(ideaValue);
        for(var j = 0; j < ideaPropKeys.length; j++){
            var ideaPropName = ideaPropKeys[j];
            var ideaPropValue = ideaValue[ideaPropName];
            if(ideaPropName == 'category'){
                idea.category = ideaPropValue;
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
                    if(bonuses.indexOf(bonusNames[k]) === -1 && bonusNames[k] !== '_order'){
                        bonuses.push(bonusNames[k]);
                    }
                }
            }
        }
        idea.bonuses.sort((x, y) => x.order < y.order ? -1 : 1);
        output.push(idea);
    }
    return [output, bonuses];
}

function processPolicies(policiesObj){
    var output = [];
    var keys = Object.getOwnPropertyNames(policiesObj);
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
                policy.monarchPower = policyPropValue;
            } else if(policyPropName == 'allow')
            {
                policy.allow = policyPropValue;
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
            }
        }
        output.push(policy);
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

function getPolicies(){
    return `########################################################
    ###### Vanilla Policies changed by flogi
    ########################################################
    
    ########################################################
    ###### Adm
    ########################################################
    
    idea_variation_act_556 = {
        monarch_power = ADM
    
        potential = {
            has_idea_group = economic_ideas
            has_idea_group = quantity_ideas
            
        }
        
        allow = {
            full_idea_group = economic_ideas
            full_idea_group = quantity_ideas
        }		
        
        land_forcelimit_modifier = 0.15
    
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { army_size_percentage = 0.9 }
            }			
            modifier = {
                factor = 1.5
                army_size_percentage = 1.1
            }
            modifier = {
                factor = 1.5
                army_size_percentage = 1.5
            }
            modifier = {
                factor = 1.5
                army_size_percentage = 2
            }
            modifier = {
                factor = 1.5
                army_size_percentage = 2.5
            }		
        }
    
    }
    
    
    idea_variation_act_557 = {
    
        monarch_power = DIP
    
    
        potential = {
            has_idea_group = administrative_ideas
            has_idea_group = maritime_ideas
            
        }
        
        allow = {
            full_idea_group = administrative_ideas
            full_idea_group = maritime_ideas
        }
    
        navy_tradition = 2
    
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 20 }
            }		
        }
    
    }
        
    
    
    idea_variation_act_558 = {
        monarch_power = DIP
    
    
        potential = {
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            
        }
        
        allow = {
            full_idea_group = innovativeness_ideas
            full_idea_group = spy_ideas
        }
    
        global_spy_defence = 0.3
        spy_offence = 0.2
        
        
        ai_will_do = {
            factor = 1
        }
    }
    
    
    
    idea_variation_act_559 = {
        monarch_power = DIP  
    
    
        potential = {
            has_idea_group = spy_ideas 
            OR = {
            has_idea_group = aristo0
            has_idea_group = monarchie0
            has_idea_group = horde0
            }
            
        }
        allow = {
            full_idea_group = spy_ideas 
            OR = {
            full_idea_group = aristo0
            full_idea_group = monarchie0
            full_idea_group = horde0
            }
        }
    
        yearly_absolutism = 0.75
        yearly_corruption = -0.1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { cavalry_fraction = 0.2 }
            }			
            modifier = {
                factor = 1.5
                cavalry_fraction = 0.28
            }
            modifier = {
                factor = 1.5
                cavalry_fraction = 0.38
            }
            modifier = {
                factor = 1.5
                cavalry_fraction = 0.45
            }
        }
    }
     
    idea_variation_act_560 = {
        monarch_power = ADM
    
    
        potential = {
            has_idea_group = spy_ideas
            has_idea_group = defensive_ideas
            
        }
        
        allow = {
            full_idea_group = spy_ideas
            full_idea_group = defensive_ideas
        }
    
        defensiveness = 0.1
        
        ai_will_do = {
            factor = 1
        }
    
    }
     
    idea_variation_act_561 = {
        monarch_power = DIP
    
    
        potential = {
            has_idea_group = spy_ideas
            has_idea_group = economic_ideas
        
        }
        
        allow = {
            full_idea_group = spy_ideas
            full_idea_group = economic_ideas
        }
        
        diplomats = 1
        
        ai_will_do = {
            factor = 1
        }
    } 
    
    
    
    
    idea_variation_act_562 = {
        monarch_power = ADM
    
    
        potential = {
            has_idea_group = spy_ideas
            has_idea_group = quality_ideas
            
        }
        
        allow = {
            full_idea_group = spy_ideas
            full_idea_group = quality_ideas
        }
    
        army_tradition_decay = -0.01
        
        ai_will_do = {
            factor = 0.75
            modifier = {
                factor = 0
                NOT = { army_tradition = 2 }
            }			
            modifier = {
                factor = 1.5
                army_tradition = 30
            }
            modifier = {
                factor = 1.5
                army_tradition = 50
            }
            modifier = {
                factor = 1.5
                army_tradition = 80
            }
        }
    }
    
    idea_variation_act_563 = {
        monarch_power = ADM	
    
    
        potential = {
            has_idea_group = spy_ideas
            has_idea_group = quantity_ideas
            
        }
        
        allow = {
            full_idea_group = spy_ideas
            full_idea_group = quantity_ideas
        }
    
        mercenary_manpower = 0.15
        mercenary_cost = -0.25
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_564 = {
        monarch_power = ADM
    
    
        potential = {
            has_idea_group = spy_ideas
            has_idea_group = administrative_ideas
            
        }
        
        allow = {
            full_idea_group = spy_ideas
            full_idea_group = administrative_ideas
        }
    
        global_trade_goods_size_modifier = 0.15	
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_565 = {
        monarch_power = ADM
    
    
        potential = {
        
            has_idea_group = defensive_ideas
            
            OR = {
            has_idea_group = religious_ideas   
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = orthodox0
            has_idea_group = islam0
            has_idea_group = cathar0
            has_idea_group = shinto0
            has_idea_group = norse0
            has_idea_group = budda0
            has_idea_group = confuci0 
            has_idea_group = hindu0
            has_idea_group = tengri0
            has_idea_group = coptic0
            has_idea_group = helle0
            has_idea_group = slav0
            has_idea_group = jew0
            has_idea_group = suomi0
            has_idea_group = romuva0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = mane0
            has_idea_group = ancli0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = nahu0
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
        
            }
            
        }
        allow = {
            full_idea_group = defensive_ideas
            
            OR = {
                full_idea_group = religious_ideas 
                full_idea_group = katholisch0
                full_idea_group = protestant0
                full_idea_group = reformiert0
                full_idea_group = orthodox0
                full_idea_group = islam0
                full_idea_group = cathar0
                full_idea_group = shinto0
                full_idea_group = norse0
                full_idea_group = budda0
                full_idea_group = confuci0 
                full_idea_group = hindu0
                full_idea_group = tengri0
                full_idea_group = coptic0
                full_idea_group = helle0
                full_idea_group = slav0
                full_idea_group = jew0
                full_idea_group = suomi0
                full_idea_group = romuva0
                full_idea_group = animist0
                full_idea_group = feti0
                full_idea_group = zoro0
                full_idea_group = mane0
                full_idea_group = ancli0
                full_idea_group = mesoam0
                full_idea_group = inti0
                full_idea_group = tote0
                full_idea_group = nahu0
                full_idea_group = shia0
                full_idea_group = ibadi0
                full_idea_group = hussite0
            }
        }
    
    
        global_unrest = -1
        religious_unity = 0.2
    
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                religious_unity = 1
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.6 }
            }			
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.4 }
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.2 }
            }
            modifier = {
                factor = 1.5
                average_effective_unrest = 2
            }
            modifier = {
                factor = 1.5
                average_effective_unrest = 4
            }			
            modifier = {
                factor = 1.5
                average_effective_unrest = 6
            }
            modifier = {
                factor = 1.5
                average_effective_unrest = 8
            }		
        }
    
    }
    
    idea_variation_act_566 = {
        monarch_power = ADM
    
    
        potential = {
            has_idea_group = defensive_ideas
            has_idea_group = economic_ideas
            
        }
        
        allow = {
            full_idea_group = defensive_ideas
            full_idea_group = economic_ideas
            NOT = {
            calc_true_if = {
                amount = 2
                has_active_policy = idea_variation_act_23
                has_active_policy = idea_variation_act_153
                has_active_policy = idea_variation_act_169
                has_active_policy = idea_variation_act_238
                has_active_policy = idea_variation_act_302
                has_active_policy = idea_variation_act_340
                has_active_policy = idea_variation_act_92
                has_active_policy = idea_variation_act_566
                has_active_policy = idea_variation_act_532
                has_active_policy = idea_variation_act_528
                has_active_policy = idea_variation_act_514
                has_active_policy = idea_variation_act_503
                }
            }
        }
    
        development_cost = -0.1
        global_tax_modifier = 0.1
    
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 1.5
                NOT = { average_effective_unrest = 1 }
            }
            modifier = {
                factor = 1.5
                average_effective_unrest = 2
            }
            modifier = {
                factor = 1.5
                average_effective_unrest = 4
            }			
            modifier = {
                factor = 1.5
                average_effective_unrest = 6
            }
            modifier = {
                factor = 1.5
                average_effective_unrest = 8
            }	
        }
    }
    
    idea_variation_act_567 = {
        monarch_power = ADM
    
    
        potential = {
            has_idea_group = defensive_ideas
            has_idea_group = administrative_ideas
            
        }
        
        allow = {
            full_idea_group = defensive_ideas
            full_idea_group = administrative_ideas
        }
    
        yearly_corruption = -0.3
    
        ai_will_do = {
            factor = 1
        }
    }
    
    
    idea_variation_act_568 = {
        monarch_power = ADM
    
    
        potential = {
            has_idea_group = spy_ideas
            OR = {
            has_idea_group = religious_ideas   
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = orthodox0
            has_idea_group = islam0
            has_idea_group = cathar0
            has_idea_group = shinto0
            has_idea_group = norse0
            has_idea_group = budda0
            has_idea_group = confuci0 
            has_idea_group = hindu0
            has_idea_group = tengri0
            has_idea_group = coptic0
            has_idea_group = helle0
            has_idea_group = slav0
            has_idea_group = jew0
            has_idea_group = suomi0
            has_idea_group = romuva0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = mane0
            has_idea_group = ancli0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = nahu0
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
            }
                
        }
        allow = {
            full_idea_group = spy_ideas
            OR = {
                full_idea_group = religious_ideas 
                full_idea_group = katholisch0
                full_idea_group = protestant0
                full_idea_group = reformiert0
                full_idea_group = orthodox0
                full_idea_group = islam0
                full_idea_group = cathar0
                full_idea_group = shinto0
                full_idea_group = norse0
                full_idea_group = budda0
                full_idea_group = confuci0 
                full_idea_group = hindu0
                full_idea_group = tengri0
                full_idea_group = coptic0
                full_idea_group = helle0
                full_idea_group = slav0
                full_idea_group = jew0
                full_idea_group = suomi0
                full_idea_group = romuva0
                full_idea_group = animist0
                full_idea_group = feti0
                full_idea_group = zoro0
                full_idea_group = mane0
                full_idea_group = ancli0
                full_idea_group = mesoam0
                full_idea_group = inti0
                full_idea_group = tote0
                full_idea_group = nahu0
                full_idea_group = shia0
                full_idea_group = ibadi0
                full_idea_group = hussite0
            }	
        }
    
        global_missionary_strength = 0.02
        global_spy_defence = 0.2
    
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                religious_unity = 1
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.6 }
            }			
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.4 }
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.2 }
            }	
        }
    }
    
    
    idea_variation_act_569 = {
        monarch_power = ADM
    
        potential = {
            has_idea_group = spy_ideas
            has_idea_group = republik0
            
        }
        
        allow = {
            full_idea_group = spy_ideas
            full_idea_group = republik0
        }
    
        global_unrest = -1
        global_spy_defence = 0.2
    
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 1.5
                NOT = { average_effective_unrest = 1 }
            }
            modifier = {
                factor = 1.5
                average_effective_unrest = 2
            }
            modifier = {
                factor = 1.5
                average_effective_unrest = 4
            }			
            modifier = {
                factor = 1.5
                average_effective_unrest = 6
            }
            modifier = {
                factor = 1.5
                average_effective_unrest = 8
            }	
        }
    }
    
    
    idea_variation_act_570 = {
        monarch_power = MIL
    
        potential = {
            has_idea_group = offensive_ideas
            has_idea_group = administrative_ideas
            
        }
        
        allow = {
            full_idea_group = offensive_ideas
            full_idea_group = administrative_ideas
        }
    
        shock_damage = 0.1
    
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_571 = {
        monarch_power = DIP
        
        potential = {
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
                
        }
        allow = {
            full_idea_group = economic_ideas
            full_idea_group = exploration_ideas
        }
        
        global_tariffs = 0.25
        
        ai_will_do = {
            factor = 1
                    
        }
    }
    
    idea_variation_act_572 = {
        monarch_power = MIL
        
        potential = {
            has_idea_group = economic_ideas
            has_idea_group = quality_ideas
                
        }
        allow = {
            full_idea_group = economic_ideas
            full_idea_group = quality_ideas
        }
        
        discipline = 0.03
        
        ai_will_do = {
            factor = 10
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    
    idea_variation_act_573 = {
        monarch_power = DIP
        
        potential = {
            has_idea_group = administrative_ideas
            has_idea_group = exploration_ideas
                
        }
        allow = {
            full_idea_group = administrative_ideas
            full_idea_group = exploration_ideas
        }
        
        global_colonial_growth = 10
        colonist_placement_chance = 0.1
    
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { num_of_colonists = 1 }
            }
            modifier = {
                factor = 0.1
                NOT = { num_of_colonies = 1 }
            }
        }
    }
    
    
    
    idea_variation_act_574 = {
        monarch_power = DIP
        potential = {
            has_idea_group = administrative_ideas
            has_idea_group = dynasty0
            
        }
        
        allow = {
            full_idea_group = administrative_ideas
            full_idea_group = dynasty0
        }
    
        diplomats = 1
        diplomatic_reputation = 1
    
        ai_will_do = {
            factor = 1
        }
    }
    
    
    
    idea_variation_act_575 = {
        monarch_power = adm
    
        potential = {
            has_idea_group = offensive_ideas
            has_idea_group = expansion_ideas
            
        }
        
        allow = {
            full_idea_group = offensive_ideas
            full_idea_group = expansion_ideas
            
            NOT = {
            calc_true_if = {
                amount = 2
                has_active_policy = idea_variation_act_575
                has_active_policy = idea_variation_act_580
                has_active_policy = idea_variation_act_623
                has_active_policy = idea_variation_act_79
                has_active_policy = idea_variation_act_90
                has_active_policy = idea_variation_act_220
                has_active_policy = idea_variation_act_256
                }
            }
        }
    
        ae_impact = -0.15
        
        ai_will_do = {
            factor = 1
        }	
    }
    
    
    
    idea_variation_act_576 = {
        monarch_power = ADM
        potential = {
            has_idea_group = dynasty0
            OR = {
            has_idea_group = religious_ideas   
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = orthodox0
            has_idea_group = islam0
            has_idea_group = cathar0
            has_idea_group = shinto0
            has_idea_group = norse0
            has_idea_group = budda0
            has_idea_group = confuci0 
            has_idea_group = hindu0
            has_idea_group = tengri0
            has_idea_group = coptic0
            has_idea_group = helle0
            has_idea_group = slav0
            has_idea_group = jew0
            has_idea_group = suomi0
            has_idea_group = romuva0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = mane0
            has_idea_group = ancli0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = nahu0
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
            }
            
        }
        allow = {
            full_idea_group = dynasty0
            OR = {
                full_idea_group = religious_ideas 
                full_idea_group = katholisch0
                full_idea_group = protestant0
                full_idea_group = reformiert0
                full_idea_group = orthodox0
                full_idea_group = islam0
                full_idea_group = cathar0
                full_idea_group = shinto0
                full_idea_group = norse0
                full_idea_group = budda0
                full_idea_group = confuci0 
                full_idea_group = hindu0
                full_idea_group = tengri0
                full_idea_group = coptic0
                full_idea_group = helle0
                full_idea_group = slav0
                full_idea_group = jew0
                full_idea_group = suomi0
                full_idea_group = romuva0
                full_idea_group = animist0
                full_idea_group = feti0
                full_idea_group = zoro0
                full_idea_group = mane0
                full_idea_group = ancli0
                full_idea_group = mesoam0
                full_idea_group = inti0
                full_idea_group = tote0
                full_idea_group = nahu0
                full_idea_group = shia0
                full_idea_group = ibadi0
                full_idea_group = hussite0
            }	
        }
        
        religious_unity = 0.2
        global_missionary_strength = 0.01
     
    
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                religious_unity = 1
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.6 }
            }			
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.4 }
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.2 }
            }			
        }
    }
    
    
    idea_variation_act_577 = {
        monarch_power = DIP
        potential = {
            has_idea_group = spy_ideas
            has_idea_group = expansion_ideas
            
        }
        
        allow = {
            full_idea_group = spy_ideas
            full_idea_group = expansion_ideas
        }
        
        
        global_spy_defence = 0.35
     
    
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { average_autonomy_above_min = 1 }
            }
            modifier = {
                factor = 1.5
                average_autonomy_above_min = 20
            }
            modifier = {
                factor = 1.5
                average_autonomy_above_min = 40
            }			
            modifier = {
                factor = 1.5
                average_autonomy_above_min = 60
            }
            modifier = {
                factor = 1.5
                average_autonomy_above_min = 80
            }	
        }
    }
    
    
    
    
    idea_variation_act_578 = {
        monarch_power = ADM
        
        potential = {
            has_idea_group = humanist_ideas
            has_idea_group = trade_ideas
            
        }
        
        allow = {
            full_idea_group = humanist_ideas
            full_idea_group = trade_ideas
            
            NOT = {
            calc_true_if = {
                amount = 3
                has_active_policy = idea_variation_act_13
                has_active_policy = idea_variation_act_578
                has_active_policy = idea_variation_act_206
                has_active_policy = idea_variation_act_219
                has_active_policy = idea_variation_act_227
                has_active_policy = idea_variation_act_333
                has_active_policy = idea_variation_act_498
    
                }
            }
        }	
        
        idea_cost = -0.075
        
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_579 = {
        monarch_power = DIP
        
        potential = {
            has_idea_group = influence_ideas
            has_idea_group = economic_ideas
            
        }
        
        allow = {
            full_idea_group = influence_ideas
            full_idea_group = economic_ideas
        }	
        
        reduced_liberty_desire = 10
        
        ai_will_do = {
            factor = 1
                        
        }
    }
    
    idea_variation_act_580 = {
        monarch_power = DIP
        
        potential = {
            has_idea_group = influence_ideas
            has_idea_group = innovativeness_ideas
            
        }
        
        allow = {
            full_idea_group = influence_ideas
            full_idea_group = innovativeness_ideas
            
            NOT = {
            calc_true_if = {
                amount = 2
                has_active_policy = idea_variation_act_575
                has_active_policy = idea_variation_act_580
                has_active_policy = idea_variation_act_623
                has_active_policy = idea_variation_act_79
                has_active_policy = idea_variation_act_90
                has_active_policy = idea_variation_act_220
                has_active_policy = idea_variation_act_256
                }
            }
        }	
        
        ae_impact = -0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_581 = {
        monarch_power = ADM
        
        potential = {
            has_idea_group = influence_ideas
            has_idea_group = administrative_ideas
            
        }
        
        allow = {
            full_idea_group = influence_ideas
            full_idea_group = administrative_ideas
        }	
        
        diplomatic_annexation_cost = -0.15
        
        ai_will_do = {
            factor = 1
                    
        }
        
    }
    
    idea_variation_act_582 = {
        monarch_power = DIP
        
        potential = {
            has_idea_group = influence_ideas
            has_idea_group = expansion_ideas
            
        }
        
        allow = {
            full_idea_group = influence_ideas
            full_idea_group = expansion_ideas
        }	
        
        global_tariffs = 0.25
        
        ai_will_do = {
            factor = 1
                    
        }
    }
    
    
    
    idea_variation_act_583 = {
        monarch_power = ADM
        
        potential = {
            has_idea_group = humanist_ideas
            has_idea_group = offensive_ideas
            
        }
        
        allow = {
            full_idea_group = humanist_ideas
            full_idea_group = offensive_ideas
        }	
        
        global_unrest = -1
        years_of_nationalism = -5
        
        ai_will_do = {
            factor = 1
            
            modifier = {
                factor = 1.5
                average_effective_unrest = 2
            }
            modifier = {
                factor = 1.5
                average_effective_unrest = 4
            }			
            modifier = {
                factor = 1.5
                average_effective_unrest = 6
            }
            modifier = {
                factor = 1.5
                average_effective_unrest = 8
            }
        }
    }
    
    idea_variation_act_584 = {
        monarch_power = ADM
        
        potential = {
            has_idea_group = humanist_ideas
            has_idea_group = quality_ideas
            
        }
        
        allow = {
            full_idea_group = humanist_ideas
            full_idea_group = quality_ideas
        }	
        
        prestige = 1
        prestige_decay = -0.01
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_585 = {
        monarch_power = ADM
        
        potential = {
            has_idea_group = handel0
            has_idea_group = economic_ideas
            
        }
        
        allow = {
            full_idea_group = handel0
            full_idea_group = economic_ideas
        }	
        
        global_trade_goods_size_modifier = 0.1
        production_efficiency = 0.1
        
        ai_will_do = {
            factor = 0.6
            modifier = {
                factor = 0
                NOT = { production_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                production_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                production_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                production_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                production_income_percentage = 0.5
            }	
        }
    }
    
    idea_variation_act_586 = {
        monarch_power = DIP
        
        potential = {
            has_idea_group = administrative_ideas
            OR = {
            has_idea_group = handel0
            has_idea_group = galle0
            has_idea_group = gross0
            }
                
        }
        allow = {
            full_idea_group = administrative_ideas
            OR = {
            full_idea_group = handel0
            full_idea_group = galle0
            full_idea_group = gross0
            }
        }	
        
        trade_efficiency = 0.2
        global_ship_repair = 0.2
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }	
        }
    }
    
    idea_variation_act_587 = {
        monarch_power = DIP
        
        potential = {
            has_idea_group = expansion_ideas
            OR = {
            has_idea_group = handel0
            has_idea_group = galle0
            has_idea_group = gross0
            }
                
        }
        allow = {
            full_idea_group = expansion_ideas
            OR = {
            full_idea_group = handel0
            full_idea_group = galle0
            full_idea_group = gross0
            }
        }	
        
        global_tariffs = 0.2
        global_ship_repair = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    
    
    ########################################################
    ###### Dip
    ########################################################
    
    idea_variation_act_588 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            
        }
        
        allow = {
            full_idea_group = trade_ideas
            full_idea_group = economic_ideas
            
            NOT = {
            calc_true_if = {
                amount = 3
                has_active_policy = idea_variation_act_588
                has_active_policy = idea_variation_act_591
                has_active_policy = idea_variation_act_21
                has_active_policy = idea_variation_act_138
                has_active_policy = idea_variation_act_425
                has_active_policy = idea_variation_act_502
                has_active_policy = idea_variation_act_551
                has_active_policy = idea_variation_act_529
                has_active_policy = idea_variation_act_516
    
                }
            }
        }
    
        build_cost = -0.1
    
    
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0.6
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }
            
            modifier = {
                factor = 0.6
                NOT = { production_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                production_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                production_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                production_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                production_income_percentage = 0.5
            }
        }
    }
    
    
    idea_variation_act_589 = {
        monarch_power = DIP
    
        potential = {
            has_idea_group = maritime_ideas
            has_idea_group = economic_ideas
            
        }
        
        allow = {
            full_idea_group = maritime_ideas
            full_idea_group = economic_ideas
        }
        
        global_sailors_modifier = 0.25
        naval_maintenance_modifier = -0.1
        
        ai_will_do = {
            factor = 0.6
            modifier = {
                factor = 0
                NOT = { navy_size = 20 }
            }
            modifier = {
                factor = 1.5
                navy_size = 50
            }
            modifier = {
                factor = 1.5
                navy_size = 100
            }			
            modifier = {
                factor = 1.5
                navy_size = 150
            }
            modifier = {
                factor = 1.5
                navy_size = 200
            }		
        }	
    }
    
    
    
    idea_variation_act_590 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = maritime_ideas
            has_idea_group = offensive_ideas
            
        }
        
        allow = {
            full_idea_group = maritime_ideas
            full_idea_group = offensive_ideas
        }
        
        trade_efficiency = 0.3
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }
        }
    }
    
    idea_variation_act_591 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = dynasty0
            has_idea_group = economic_ideas
            
        }
        
        allow = {
            full_idea_group = dynasty0
            full_idea_group = economic_ideas
            
            NOT = {
            calc_true_if = {
                amount = 3
                has_active_policy = idea_variation_act_588
                has_active_policy = idea_variation_act_591
                has_active_policy = idea_variation_act_21
                has_active_policy = idea_variation_act_138
                has_active_policy = idea_variation_act_425
                has_active_policy = idea_variation_act_502
                has_active_policy = idea_variation_act_551
                has_active_policy = idea_variation_act_529
                has_active_policy = idea_variation_act_516
    
                }
            }
        }
        
        build_cost = -0.1
    
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0.6
                NOT = { tax_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                tax_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                tax_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                tax_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                tax_income_percentage = 0.5
            }
            
            modifier = {
                factor = 0.6
                NOT = { average_autonomy_above_min = 1 }
            }
            modifier = {
                factor = 1.5
                average_autonomy_above_min = 20
            }
            modifier = {
                factor = 1.5
                average_autonomy_above_min = 40
            }			
            modifier = {
                factor = 1.5
                average_autonomy_above_min = 60
            }
            modifier = {
                factor = 1.5
                average_autonomy_above_min = 80
            }	
        }
    }
    
    
    
    
    
    
    idea_variation_act_592 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = maritime_ideas
            has_idea_group = defensive_ideas
            
        }
        
        allow = {
            full_idea_group = maritime_ideas
            full_idea_group = defensive_ideas
        }
        global_ship_recruit_speed = -0.33	
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 20 }
            }				
        }
    }
    
    
    idea_variation_act_593 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = trade_ideas
            has_idea_group = administrative_ideas
                
        }
        allow = {
            full_idea_group = trade_ideas
            full_idea_group = administrative_ideas
        }
        
        trade_efficiency = 0.25
        
        ai_will_do = {
            factor = 1.2
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }
        }
    }
    
    idea_variation_act_594 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = expansion_ideas
            has_idea_group = exploration_ideas
            
        }
        
        allow = {
            full_idea_group = expansion_ideas
            full_idea_group = exploration_ideas
        }		
    
        global_colonial_growth = 20
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { num_of_colonists = 1 }
            }
            modifier = {
                factor = 0.1
                NOT = { num_of_colonies = 1 }
            }
        }
    }
    
    
    idea_variation_act_595 = {
    
        monarch_power = DIP
    
    
        potential = {
            has_idea_group = exploration_ideas
            has_idea_group = innovativeness_ideas
        
        }
        
        allow = {
            full_idea_group = exploration_ideas
            full_idea_group = innovativeness_ideas
        }
    
        colonist_placement_chance = 0.1
        global_trade_power = 0.15
    
    
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0.6
                NOT = { num_of_colonists = 1 }
            }
            modifier = {
                factor = 0.6
                NOT = { num_of_colonies = 1 }
            }
            
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }
        }
    }
    
    
    
    idea_variation_act_596 = {
        monarch_power = DIP
    
        potential = {
            has_idea_group = exploration_ideas
            OR = {
            has_idea_group = religious_ideas   
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = orthodox0
            has_idea_group = islam0
            has_idea_group = cathar0
            has_idea_group = shinto0
            has_idea_group = norse0
            has_idea_group = budda0
            has_idea_group = confuci0 
            has_idea_group = hindu0
            has_idea_group = tengri0
            has_idea_group = coptic0
            has_idea_group = helle0
            has_idea_group = slav0
            has_idea_group = jew0
            has_idea_group = suomi0
            has_idea_group = romuva0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = mane0
            has_idea_group = ancli0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = nahu0
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
            }
                
        }
        allow = {
            full_idea_group = exploration_ideas
            OR = {
                full_idea_group = religious_ideas 
                full_idea_group = katholisch0
                full_idea_group = protestant0
                full_idea_group = reformiert0
                full_idea_group = orthodox0
                full_idea_group = islam0
                full_idea_group = cathar0
                full_idea_group = shinto0
                full_idea_group = norse0
                full_idea_group = budda0
                full_idea_group = confuci0 
                full_idea_group = hindu0
                full_idea_group = tengri0
                full_idea_group = coptic0
                full_idea_group = helle0
                full_idea_group = slav0
                full_idea_group = jew0
                full_idea_group = suomi0
                full_idea_group = romuva0
                full_idea_group = animist0
                full_idea_group = feti0
                full_idea_group = zoro0
                full_idea_group = mane0
                full_idea_group = ancli0
                full_idea_group = mesoam0
                full_idea_group = inti0
                full_idea_group = tote0
                full_idea_group = nahu0
                full_idea_group = shia0
                full_idea_group = ibadi0
                full_idea_group = hussite0
            }	
        }
    
    
    
        global_tariffs = 0.1
        religious_unity = 0.2
    
        ai_will_do = {
            factor = 1
            
            modifier = {
                factor = 0
                religious_unity = 1
            }
            modifier = {
                factor = 1.25
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 1.25
                NOT = { religious_unity = 0.6 }
            }			
            modifier = {
                factor = 1.25
                NOT = { religious_unity = 0.4 }
            }
            modifier = {
                factor = 1.25
                NOT = { religious_unity = 0.2 }
            }			
        }
    }
    
    
    
    
    idea_variation_act_597 = {
        monarch_power = DIP
    
    
        potential = {
            has_idea_group = maritime_ideas
            has_idea_group = expansion_ideas
            
        }
        
        allow = {
            full_idea_group = maritime_ideas
            full_idea_group = expansion_ideas
        }
    
    
        naval_forcelimit_modifier = 0.33
    
    
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size_percentage = 0.9 }
            }			
            modifier = {
                factor = 1.5
                navy_size_percentage = 1.1
            }
            modifier = {
                factor = 1.5
                navy_size_percentage = 1.5
            }
            modifier = {
                factor = 1.5
                navy_size_percentage = 2
            }
            modifier = {
                factor = 1.5
                navy_size_percentage = 2.5
            }				
        }
    }
    
    idea_variation_act_598 = {
        monarch_power = DIP
    
    
        potential = {
            has_idea_group = innovativeness_ideas
            has_idea_group = dynasty0
            
        }
        
        allow = {
            full_idea_group = innovativeness_ideas
            full_idea_group = dynasty0
        }
    
    
        diplomatic_reputation = 2
    
    
        ai_will_do = {
            factor = 1
        }
    }
    
    
    idea_variation_act_599 = {
        monarch_power = DIP
    
    
        potential = {
            has_idea_group = innovativeness_ideas
            has_idea_group = trade_ideas
            
        }
        
        allow = {
            full_idea_group = innovativeness_ideas
            full_idea_group = trade_ideas
        }
            
        trade_efficiency = 0.3	
    
    
            ai_will_do = {
            factor = 1.5
                    
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }
        }
    }
    
    idea_variation_act_600 = {
        monarch_power = MIL
        potential = {
            has_idea_group = innovativeness_ideas
            has_idea_group = maritime_ideas
            
        }
        
        allow = {
            full_idea_group = innovativeness_ideas
            full_idea_group = maritime_ideas
        }
    
        heavy_ship_power = 0.15
    
    
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 20 }
            }
        }
    }
    
    
    idea_variation_act_601 = {
        monarch_power = DIP
        potential = {
            has_idea_group = trade_ideas
            OR = {
            has_idea_group = aristo0
            has_idea_group = monarchie0
            has_idea_group = horde0
            }
            
        }
        allow = {
            full_idea_group = trade_ideas
            OR = {
            full_idea_group = aristo0
            full_idea_group = monarchie0
            full_idea_group = horde0
            }
        }
    
        global_foreign_trade_power = 0.3
    
        ai_will_do = {
            factor = 0.8		
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }
        }
    }
    
    idea_variation_act_602 = {
        monarch_power = DIP
        potential = {
            has_idea_group = exploration_ideas
            OR = {
            has_idea_group = aristo0
            has_idea_group = monarchie0
            has_idea_group = horde0
            }
                
        }
        allow = {
            full_idea_group = exploration_ideas
            OR = {
            full_idea_group = aristo0
            full_idea_group = monarchie0
            full_idea_group = horde0
            }
        }
    
        diplomats = 1
        diplomatic_reputation = 1
    
        ai_will_do = {
            factor = 0.8
        }
    }
    
    idea_variation_act_603 = {
        monarch_power = DIP
        potential = {
            has_idea_group = maritime_ideas
            OR = {
            has_idea_group = aristo0
            has_idea_group = monarchie0
            has_idea_group = horde0
            }
            
        }
        allow = {
            full_idea_group = maritime_ideas
            OR = {
            full_idea_group = aristo0
            full_idea_group = monarchie0
            full_idea_group = horde0
            }
        }
    
        navy_tradition_decay = -0.02
    
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 20 }
            }		
        }
    }
    
    
    
    idea_variation_act_604 = {
        monarch_power = DIP
        potential = {
            has_idea_group = exploration_ideas
            has_idea_group = defensive_ideas
            
        }
        
        allow = {
            full_idea_group = exploration_ideas
            full_idea_group = defensive_ideas
        }
    
        naval_morale = 0.15
    
        ai_will_do = {
            factor = 1
        }
    }
    
    
    
    idea_variation_act_605 = {
        monarch_power = MIL	
        potential = {
            has_idea_group = maritime_ideas
            has_idea_group = quantity_ideas
            
        }
        
        allow = {
            full_idea_group = maritime_ideas
            full_idea_group = quantity_ideas
        }
        
        galley_power = 0.15
    
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { num_of_galley = 10 }
            }		
        }	
    
    }
    
    idea_variation_act_606 = {
        monarch_power = DIP
        potential = {
            has_idea_group = trade_ideas
            has_idea_group = quality_ideas
            
        }
        
        allow = {
            full_idea_group = trade_ideas
            full_idea_group = quality_ideas
        }
        trade_efficiency = 0.25
    
        ai_will_do = {
            factor = 1.2
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }
        }
    }
    
    
    
    idea_variation_act_607 = {
        monarch_power = DIP
        potential = {
            has_idea_group = trade_ideas
            has_idea_group = quantity_ideas
            
        }
        
        allow = {
            full_idea_group = trade_ideas
            full_idea_group = quantity_ideas
        }
        global_trade_goods_size_modifier = 0.15
     
    
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_608 = {
        monarch_power = DIP
        potential = {
            has_idea_group = trade_ideas
            has_idea_group = expansion_ideas
            
        }
        
        allow = {
            full_idea_group = trade_ideas
            full_idea_group = expansion_ideas
        }
        
        trade_efficiency = 0.15
        trade_steering = 0.15
     
    
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 20 }
            }		
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }
        }
    }
    
    idea_variation_act_609 = {
        monarch_power = DIP
        potential = {
            has_idea_group = dynasty0
            has_idea_group = expansion_ideas
            
        }
        
        allow = {
            full_idea_group = dynasty0
            full_idea_group = expansion_ideas
        }
        
        global_trade_power = 0.15		
        diplomatic_reputation = 1
    
        ai_will_do = {
            factor = 0.8		
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }
        }
    }
    
    idea_variation_act_610 = {
        monarch_power = DIP
        potential = {
            has_idea_group = republik0
            has_idea_group = trade_ideas
            
        }
        
        allow = {
            full_idea_group = republik0
            full_idea_group = trade_ideas
        }
        
        global_foreign_trade_power = 0.3
    
        ai_will_do = {
            factor = 0.6
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }
        }
    }
    
    idea_variation_act_611 = {
        monarch_power = DIP
        potential = {
            has_idea_group = dynasty0
            has_idea_group = republik0
            
        }
        
        allow = {
            full_idea_group = dynasty0
            full_idea_group = republik0
            
            NOT = {
            calc_true_if = {
                amount = 2
                has_active_policy = idea_variation_act_611
                has_active_policy = idea_variation_act_617
                has_active_policy = idea_variation_act_620
                has_active_policy = idea_variation_act_50
                has_active_policy = idea_variation_act_152
                has_active_policy = idea_variation_act_215
                has_active_policy = idea_variation_act_491
                has_active_policy = idea_variation_act_500
    
                }
            }
        }
        
        diplomatic_reputation = 2
        improve_relation_modifier = 0.1		
        
    
        ai_will_do = {
            factor = 1
        }
    }
    
    
    idea_variation_act_612 = {
        monarch_power = DIP
        potential = {
            has_idea_group = dynasty0
            has_idea_group = quality_ideas
            
        }
        
        allow = {
            full_idea_group = dynasty0
            full_idea_group = quality_ideas
        }
        
        diplomatic_reputation = 2
        
    
        ai_will_do = {
            factor = 1
        }
    
    }
    
    
    
    idea_variation_act_613 = {
        monarch_power = DIP
        potential = {
            has_idea_group = exploration_ideas
            has_idea_group = republik0
            
        }
        
        allow = {
            full_idea_group = exploration_ideas
            full_idea_group = republik0
        }
        
        range = 0.25
        global_colonial_growth = 10
    
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { num_of_colonists = 1 }
            }
            modifier = {
                factor = 0.6
                NOT = { num_of_colonies = 1 }
            }
        }
    }
    
    idea_variation_act_614 = {
        monarch_power = MIL
        potential = {
            has_idea_group = maritime_ideas
            has_idea_group = republik0
            
        }
        
        allow = {
            full_idea_group = maritime_ideas
            full_idea_group = republik0
        }
        
        light_ship_cost = -0.15
        light_ship_power = 0.15
    
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { num_of_light_ship = 10 }
            }
        }
    }
    
    
    idea_variation_act_615 = {
    
        monarch_power = ADM
        potential = {
            has_idea_group = trade_ideas
            OR = {
            has_idea_group = religious_ideas   
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = orthodox0
            has_idea_group = islam0
            has_idea_group = cathar0
            has_idea_group = shinto0
            has_idea_group = norse0
            has_idea_group = budda0
            has_idea_group = confuci0 
            has_idea_group = hindu0
            has_idea_group = tengri0
            has_idea_group = coptic0
            has_idea_group = helle0
            has_idea_group = slav0
            has_idea_group = jew0
            has_idea_group = suomi0
            has_idea_group = romuva0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = mane0
            has_idea_group = ancli0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = nahu0
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
            }
            
        }
        allow = {
            full_idea_group = trade_ideas
            OR = {
                full_idea_group = religious_ideas 
                full_idea_group = katholisch0
                full_idea_group = protestant0
                full_idea_group = reformiert0
                full_idea_group = orthodox0
                full_idea_group = islam0
                full_idea_group = cathar0
                full_idea_group = shinto0
                full_idea_group = norse0
                full_idea_group = budda0
                full_idea_group = confuci0 
                full_idea_group = hindu0
                full_idea_group = tengri0
                full_idea_group = coptic0
                full_idea_group = helle0
                full_idea_group = slav0
                full_idea_group = jew0
                full_idea_group = suomi0
                full_idea_group = romuva0
                full_idea_group = animist0
                full_idea_group = feti0
                full_idea_group = zoro0
                full_idea_group = mane0
                full_idea_group = ancli0
                full_idea_group = mesoam0
                full_idea_group = inti0
                full_idea_group = tote0
                full_idea_group = nahu0
                full_idea_group = shia0
                full_idea_group = ibadi0
                full_idea_group = hussite0
            }	
        }
        
        global_trade_goods_size_modifier = 0.1
        global_missionary_strength = 0.02
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                religious_unity = 1
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.6 }
            }			
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.4 }
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.2 }
            }			
        }
        
    
    }
    
    idea_variation_act_616 = {
    
        monarch_power = MIL
        potential = {
            has_idea_group = maritime_ideas
            OR = {
            has_idea_group = religious_ideas   
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = orthodox0
            has_idea_group = islam0
            has_idea_group = cathar0
            has_idea_group = shinto0
            has_idea_group = norse0
            has_idea_group = budda0
            has_idea_group = confuci0 
            has_idea_group = hindu0
            has_idea_group = tengri0
            has_idea_group = coptic0
            has_idea_group = helle0
            has_idea_group = slav0
            has_idea_group = jew0
            has_idea_group = suomi0
            has_idea_group = romuva0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = mane0
            has_idea_group = ancli0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = nahu0
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
            }
                
        }
        allow = {
            full_idea_group = maritime_ideas
            OR = {
                full_idea_group = religious_ideas 
                full_idea_group = katholisch0
                full_idea_group = protestant0
                full_idea_group = reformiert0
                full_idea_group = orthodox0
                full_idea_group = islam0
                full_idea_group = cathar0
                full_idea_group = shinto0
                full_idea_group = norse0
                full_idea_group = budda0
                full_idea_group = confuci0 
                full_idea_group = hindu0
                full_idea_group = tengri0
                full_idea_group = coptic0
                full_idea_group = helle0
                full_idea_group = slav0
                full_idea_group = jew0
                full_idea_group = suomi0
                full_idea_group = romuva0
                full_idea_group = animist0
                full_idea_group = feti0
                full_idea_group = zoro0
                full_idea_group = mane0
                full_idea_group = ancli0
                full_idea_group = mesoam0
                full_idea_group = inti0
                full_idea_group = tote0
                full_idea_group = nahu0
                full_idea_group = shia0
                full_idea_group = ibadi0
                full_idea_group = hussite0
            }	
        }
        
        naval_morale = 0.1
        recover_navy_morale_speed = 0.1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_617 = {
        monarch_power = DIP
        
        potential = {
            has_idea_group = humanist_ideas
            has_idea_group = dynasty0
            
        }
        
        allow = {
            full_idea_group = humanist_ideas
            full_idea_group = dynasty0
            
            NOT = {
            calc_true_if = {
                amount = 2
                has_active_policy = idea_variation_act_611
                has_active_policy = idea_variation_act_617
                has_active_policy = idea_variation_act_620
                has_active_policy = idea_variation_act_50
                has_active_policy = idea_variation_act_152
                has_active_policy = idea_variation_act_215
                has_active_policy = idea_variation_act_491
                has_active_policy = idea_variation_act_500
    
                }
            }
        }	
        
        num_accepted_cultures = 1
        improve_relation_modifier = 0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_618 = {
        monarch_power = DIP
        
        potential = {
            has_idea_group = humanist_ideas
            has_idea_group = exploration_ideas
            
        }
        
        allow = {
            full_idea_group = humanist_ideas
            full_idea_group = exploration_ideas
        }	
        
        global_colonial_growth = 20
        tolerance_heathen = 1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { num_of_colonists = 1 }
            }
            modifier = {
                factor = 0.1
                NOT = { num_of_colonies = 1 }
            }
        }
    }
    
    idea_variation_act_619 = {
        monarch_power = ADM
        
        potential = {
            has_idea_group = humanist_ideas
            has_idea_group = spy_ideas
            
        }
        
        allow = {
            full_idea_group = humanist_ideas
            full_idea_group = spy_ideas
        }	
        
        
        global_unrest = -2
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { average_effective_unrest = 1 }
            }
            modifier = {
                factor = 1.5
                average_effective_unrest = 2
            }
            modifier = {
                factor = 1.5
                average_effective_unrest = 4
            }			
            modifier = {
                factor = 1.5
                average_effective_unrest = 6
            }
            modifier = {
                factor = 1.5
                average_effective_unrest = 8
            }
        }
    }
    
    idea_variation_act_620 = {
        monarch_power = DIP
        
        potential = {
            has_idea_group = humanist_ideas
            has_idea_group = influence_ideas
            
        }
        
        allow = {
            full_idea_group = humanist_ideas
            full_idea_group = influence_ideas
            
            NOT = {
            calc_true_if = {
                amount = 2
                has_active_policy = idea_variation_act_611
                has_active_policy = idea_variation_act_617
                has_active_policy = idea_variation_act_620
                has_active_policy = idea_variation_act_50
                has_active_policy = idea_variation_act_152
                has_active_policy = idea_variation_act_215
                has_active_policy = idea_variation_act_491
                has_active_policy = idea_variation_act_500
    
                }
            }
        }	
        
        improve_relation_modifier = 0.1		
        diplomatic_reputation = 1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_621 = {
        monarch_power = DIP
        
        potential = {
            has_idea_group = influence_ideas
            OR = {
            has_idea_group = religious_ideas   
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = orthodox0
            has_idea_group = islam0
            has_idea_group = cathar0
            has_idea_group = shinto0
            has_idea_group = norse0
            has_idea_group = budda0
            has_idea_group = confuci0 
            has_idea_group = hindu0
            has_idea_group = tengri0
            has_idea_group = coptic0
            has_idea_group = helle0
            has_idea_group = slav0
            has_idea_group = jew0
            has_idea_group = suomi0
            has_idea_group = romuva0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = mane0
            has_idea_group = ancli0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = nahu0
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
            }
                
        }
        allow = {
            full_idea_group = influence_ideas
            OR = {
                full_idea_group = religious_ideas 
                full_idea_group = katholisch0
                full_idea_group = protestant0
                full_idea_group = reformiert0
                full_idea_group = orthodox0
                full_idea_group = islam0
                full_idea_group = cathar0
                full_idea_group = shinto0
                full_idea_group = norse0
                full_idea_group = budda0
                full_idea_group = confuci0 
                full_idea_group = hindu0
                full_idea_group = tengri0
                full_idea_group = coptic0
                full_idea_group = helle0
                full_idea_group = slav0
                full_idea_group = jew0
                full_idea_group = suomi0
                full_idea_group = romuva0
                full_idea_group = animist0
                full_idea_group = feti0
                full_idea_group = zoro0
                full_idea_group = mane0
                full_idea_group = ancli0
                full_idea_group = mesoam0
                full_idea_group = inti0
                full_idea_group = tote0
                full_idea_group = nahu0
                full_idea_group = shia0
                full_idea_group = ibadi0
                full_idea_group = hussite0
            }	
        }	
        
        culture_conversion_cost = -0.25
        
        ai_will_do = {
            factor = 1
        }
    }
    
    
    idea_variation_act_622 = {
        monarch_power = DIP
        
        potential = {
            has_idea_group = humanist_ideas
            has_idea_group = maritime_ideas
            
        }
        
        allow = {
            full_idea_group = humanist_ideas
            full_idea_group = maritime_ideas
        }	
        
        naval_attrition = -0.5
        
        ai_will_do = {
            factor = 0
        }
    }
    
    idea_variation_act_623 = {
        monarch_power = DIP
        
        potential = {
            has_idea_group = handel0
            has_idea_group = diktatur0
            
        }
        
        allow = {
            full_idea_group = handel0
            full_idea_group = diktatur0
            
            NOT = {
            calc_true_if = {
                amount = 2
                has_active_policy = idea_variation_act_575
                has_active_policy = idea_variation_act_580
                has_active_policy = idea_variation_act_623
                has_active_policy = idea_variation_act_79
                has_active_policy = idea_variation_act_90
                has_active_policy = idea_variation_act_220
                has_active_policy = idea_variation_act_256
                }
            }
        }	
            
        ae_impact = -0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_624 = {
        monarch_power = DIP
        
        potential = {
            has_idea_group = handel0
            has_idea_group = republik0
            
        }
        
        allow = {
            full_idea_group = handel0
            full_idea_group = republik0
        }	
        
        range = 0.25
        trade_range_modifier = 0.5
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0.6
                NOT = { num_of_colonists = 1 }
            }
            modifier = {
                factor = 0.6
                NOT = { num_of_colonies = 1 }
            }
        }
    }
    
    idea_variation_act_625 = {
        monarch_power = DIP
        
        potential = {
            has_idea_group = handel0
            has_idea_group = staatsverwaltung0
            
        }
        
        allow = {
            full_idea_group = handel0
            full_idea_group = staatsverwaltung0
        }	
        
        global_foreign_trade_power = 0.2
        trade_efficiency = 0.1
        
        ai_will_do = {
            factor = 0.9
            modifier = {
                factor = 0.6
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }
        }
    }
    
    idea_variation_act_626 = {
        monarch_power = ADM
        
        potential = {
            has_idea_group = influence_ideas
            has_idea_group = quality_ideas
            
        }
        
        allow = {
            full_idea_group = influence_ideas
            full_idea_group = quality_ideas
        }	
        
        
        global_institution_spread = 0.25
        
        ai_will_do = {
            factor = 1
                        
        }
    }
    
    idea_variation_act_627 = {
        monarch_power = DIP
        
        potential = {
            has_idea_group = handel0
            has_idea_group = festung0
            
        }
        
        allow = {
            full_idea_group = handel0
            full_idea_group = festung0
        }	
        
        caravan_power = 0.25
        
        ai_will_do = {
            factor = 0.7
            modifier = {
                factor = 0.6
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 0.6
                NOT = { trade_income_percentage = 0.2 }
            }
        }
    }
    
    idea_variation_act_628 = {
        monarch_power = DIP
        
        potential = {
            has_idea_group = republik0
            has_idea_group = influence_ideas
            
        }
        
        allow = {
            full_idea_group = republik0
            full_idea_group = influence_ideas
        }	
        
        diplomatic_annexation_cost = -0.1
        global_unrest = -1
        
        ai_will_do = {
            factor = 0.9
            modifier = {
                factor = 0
                AND = {
                    NOT = { average_effective_unrest = 1 }
                    
                }
            }
            modifier = {
                factor = 1.5
                average_effective_unrest = 2
            }
            modifier = {
                factor = 1.5
                average_effective_unrest = 4
            }			
            modifier = {
                factor = 1.5
                average_effective_unrest = 6
            }
            modifier = {
                factor = 1.5
                average_effective_unrest = 8
            }
        }
    }
    
    
    ########################################################
    ###### Mil
    ########################################################
    
    
    
    idea_variation_act_629 = {
        monarch_power = ADM
    
        potential = {
            has_idea_group = administrative_ideas
            has_idea_group = quantity_ideas
            
        }
        
        allow = {
            full_idea_group = administrative_ideas
            full_idea_group = quantity_ideas
        }
            
        manpower_recovery_speed = 0.25
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
        
    }
    
    idea_variation_act_630 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = expansion_ideas
            has_idea_group = quality_ideas
                
        }
        allow = {
            full_idea_group = expansion_ideas
            full_idea_group = quality_ideas
        }
        
        leader_land_fire = 2
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_631 = {
    
        monarch_power = ADM
        
        
        potential = {
            has_idea_group = quality_ideas
            has_idea_group = administrative_ideas
            
        }
        
        allow = {
            full_idea_group = quality_ideas
            full_idea_group = administrative_ideas
        }	
        
        state_maintenance_modifier = -0.75
    
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_632 = {
        monarch_power = MIL
        
        potential = {
            has_idea_group = offensive_ideas
            has_idea_group = economic_ideas
            
        }
        
        allow = {
            full_idea_group = offensive_ideas
            full_idea_group = economic_ideas
        }
        artillery_power = 0.15
    
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { artillery_fraction = 0.2 }
            }			
            modifier = {
                factor = 1.5
                artillery_fraction = 0.28
            }
            modifier = {
                factor = 1.5
                artillery_fraction = 0.38
            }
            modifier = {
                factor = 1.5
                artillery_fraction = 0.45
            }
        }
    }
    
    idea_variation_act_633 = {
        monarch_power = DIP
        
        potential = {
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            
        }
        
        allow = {
            full_idea_group = defensive_ideas
            full_idea_group = trade_ideas
        }
        
        trade_steering = 0.15
        merchants = 1
    
        ai_will_do = {
            factor = 0.6
            modifier = {
                factor = 0.6
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }
        }
    }
    
    idea_variation_act_634 = {
        monarch_power = MIL
        
        potential = {
            has_idea_group = offensive_ideas
            has_idea_group = trade_ideas
            
        }
        
        allow = {
            full_idea_group = offensive_ideas
            full_idea_group = trade_ideas
        }
        
        infantry_power = 0.15
    
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0.6
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }
        }
    
    }
    
    idea_variation_act_635 = {
        monarch_power = DIP		# Marine
        
        potential = {
            has_idea_group = quality_ideas
            has_idea_group = maritime_ideas
            
        }
        
        allow = {
            full_idea_group = quality_ideas
            full_idea_group = maritime_ideas
        }
        
        naval_morale = 0.15
    
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_636 = {
        monarch_power = ADM			
        
        potential = {
            has_idea_group = quality_ideas
            has_idea_group = exploration_ideas
            
        }
        
        allow = {
            full_idea_group = quality_ideas
            full_idea_group = exploration_ideas
            
            NOT = {
            calc_true_if = {
                amount = 3
                has_active_policy = idea_variation_act_636
                has_active_policy = idea_variation_act_660
                has_active_policy = idea_variation_act_12
                has_active_policy = idea_variation_act_31
                has_active_policy = idea_variation_act_324
        
                }
            }
        }
        
        manpower_recovery_speed = 0.1
        land_attrition = -0.1
    
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    
    idea_variation_act_637 = {
        monarch_power = ADM
        
        potential = {
            has_idea_group = innovativeness_ideas
            has_idea_group = offensive_ideas
            
        }
        
        allow = {
            full_idea_group = innovativeness_ideas
            full_idea_group = offensive_ideas
        }
        
        siege_ability = 0.1	
    
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_638 = {
        monarch_power = ADM
        
        potential = {
            has_idea_group = innovativeness_ideas
            has_idea_group = defensive_ideas
            
        }
        
        allow = {
            full_idea_group = innovativeness_ideas
            full_idea_group = defensive_ideas
        }
        
        defensiveness = 0.1
    
    
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_639 = {
        monarch_power = ADM
        
        potential = {
            has_idea_group = innovativeness_ideas
            has_idea_group = quality_ideas
            
        }
        
        allow = {
            full_idea_group = innovativeness_ideas
            full_idea_group = quality_ideas
        }
        
        production_efficiency = 0.15
        trade_efficiency = 0.15
    
        ai_will_do = {
            factor = 1.2		
            modifier = {
                factor = 1.5
                infantry_fraction = 0.28
            }
            modifier = {
                factor = 1.5
                infantry_fraction = 0.38
            }
            modifier = {
                factor = 1.5
                infantry_fraction = 0.45
            }
        }
    }
    
    idea_variation_act_640 = {
        monarch_power = ADM
        
        potential = {
            has_idea_group = innovativeness_ideas
            has_idea_group = quantity_ideas
            
        }
        
        allow = {
            full_idea_group = innovativeness_ideas
            full_idea_group = quantity_ideas
        }
        
        fort_maintenance_modifier = -0.20
        garrison_size = 0.3
    
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_641 = {
        monarch_power = DIP
        
        potential = {
            has_idea_group = spy_ideas
            has_idea_group = offensive_ideas
            
        }
        
        allow = {
            full_idea_group = spy_ideas
            full_idea_group = offensive_ideas
        }
        
        cav_to_inf_ratio = 0.15	
    
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_642 = {
        monarch_power = ADM
        
        potential = {
            has_idea_group = offensive_ideas
            OR = {
            has_idea_group = religious_ideas   
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = orthodox0
            has_idea_group = islam0
            has_idea_group = cathar0
            has_idea_group = shinto0
            has_idea_group = norse0
            has_idea_group = budda0
            has_idea_group = confuci0 
            has_idea_group = hindu0
            has_idea_group = tengri0
            has_idea_group = coptic0
            has_idea_group = helle0
            has_idea_group = slav0
            has_idea_group = jew0
            has_idea_group = suomi0
            has_idea_group = romuva0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = mane0
            has_idea_group = ancli0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = nahu0
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
            }
                
        }
        allow = {
            full_idea_group = offensive_ideas
            OR = {
                full_idea_group = religious_ideas 
                full_idea_group = katholisch0
                full_idea_group = protestant0
                full_idea_group = reformiert0
                full_idea_group = orthodox0
                full_idea_group = islam0
                full_idea_group = cathar0
                full_idea_group = shinto0
                full_idea_group = norse0
                full_idea_group = budda0
                full_idea_group = confuci0 
                full_idea_group = hindu0
                full_idea_group = tengri0
                full_idea_group = coptic0
                full_idea_group = helle0
                full_idea_group = slav0
                full_idea_group = jew0
                full_idea_group = suomi0
                full_idea_group = romuva0
                full_idea_group = animist0
                full_idea_group = feti0
                full_idea_group = zoro0
                full_idea_group = mane0
                full_idea_group = ancli0
                full_idea_group = mesoam0
                full_idea_group = inti0
                full_idea_group = tote0
                full_idea_group = nahu0
                full_idea_group = shia0
                full_idea_group = ibadi0
                full_idea_group = hussite0
            }	
        }
        
        religious_unity = 0.2
        global_heretic_missionary_strength = 0.03
    
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                religious_unity = 1
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.6 }
            }			
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.4 }
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.2 }
            }			
        }
    }
    
    idea_variation_act_643 = {
        monarch_power = MIL
        
        potential = {
            has_idea_group = quality_ideas
            OR = {
            has_idea_group = religious_ideas   
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = orthodox0
            has_idea_group = islam0
            has_idea_group = cathar0
            has_idea_group = shinto0
            has_idea_group = norse0
            has_idea_group = budda0
            has_idea_group = confuci0 
            has_idea_group = hindu0
            has_idea_group = tengri0
            has_idea_group = coptic0
            has_idea_group = helle0
            has_idea_group = slav0
            has_idea_group = jew0
            has_idea_group = suomi0
            has_idea_group = romuva0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = mane0
            has_idea_group = ancli0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = nahu0
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
            }
                
        }
        allow = {
            full_idea_group = quality_ideas
            OR = {
                full_idea_group = religious_ideas 
                full_idea_group = katholisch0
                full_idea_group = protestant0
                full_idea_group = reformiert0
                full_idea_group = orthodox0
                full_idea_group = islam0
                full_idea_group = cathar0
                full_idea_group = shinto0
                full_idea_group = norse0
                full_idea_group = budda0
                full_idea_group = confuci0 
                full_idea_group = hindu0
                full_idea_group = tengri0
                full_idea_group = coptic0
                full_idea_group = helle0
                full_idea_group = slav0
                full_idea_group = jew0
                full_idea_group = suomi0
                full_idea_group = romuva0
                full_idea_group = animist0
                full_idea_group = feti0
                full_idea_group = zoro0
                full_idea_group = mane0
                full_idea_group = ancli0
                full_idea_group = mesoam0
                full_idea_group = inti0
                full_idea_group = tote0
                full_idea_group = nahu0
                full_idea_group = shia0
                full_idea_group = ibadi0
                full_idea_group = hussite0
            }	
        }
        
        land_morale = 0.05
        siege_ability = 0.05
    
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_644 = {
        monarch_power = DIP
        
        potential = {
            has_idea_group = offensive_ideas
            has_idea_group = exploration_ideas
            
        }
        
        allow = {
            full_idea_group = offensive_ideas
            full_idea_group = exploration_ideas
        }
        
        privateer_efficiency = 1.0	
        
    
        
        ai_will_do = {
            factor = 0.6
            modifier = {
                factor = 0
                NOT = { num_of_light_ship = 20 }
            }
        }
    }
    
    idea_variation_act_645 = {
        monarch_power = MIL
    
        potential = {
            has_idea_group = quantity_ideas
            OR = {
            has_idea_group = religious_ideas   
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = orthodox0
            has_idea_group = islam0
            has_idea_group = cathar0
            has_idea_group = shinto0
            has_idea_group = norse0
            has_idea_group = budda0
            has_idea_group = confuci0 
            has_idea_group = hindu0
            has_idea_group = tengri0
            has_idea_group = coptic0
            has_idea_group = helle0
            has_idea_group = slav0
            has_idea_group = jew0
            has_idea_group = suomi0
            has_idea_group = romuva0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = mane0
            has_idea_group = ancli0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = nahu0
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
            }
            
        }
        allow = {
            full_idea_group = quantity_ideas
            OR = {
                full_idea_group = religious_ideas 
                full_idea_group = katholisch0
                full_idea_group = protestant0
                full_idea_group = reformiert0
                full_idea_group = orthodox0
                full_idea_group = islam0
                full_idea_group = cathar0
                full_idea_group = shinto0
                full_idea_group = norse0
                full_idea_group = budda0
                full_idea_group = confuci0 
                full_idea_group = hindu0
                full_idea_group = tengri0
                full_idea_group = coptic0
                full_idea_group = helle0
                full_idea_group = slav0
                full_idea_group = jew0
                full_idea_group = suomi0
                full_idea_group = romuva0
                full_idea_group = animist0
                full_idea_group = feti0
                full_idea_group = zoro0
                full_idea_group = mane0
                full_idea_group = ancli0
                full_idea_group = mesoam0
                full_idea_group = inti0
                full_idea_group = tote0
                full_idea_group = nahu0
                full_idea_group = shia0
                full_idea_group = ibadi0
                full_idea_group = hussite0
            }	
        }
    
        land_morale = 0.07
        
        ai_will_do = {
            factor = 1.2
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_646 = {
        monarch_power = DIP			
        potential = {
            has_idea_group = dynasty0
            has_idea_group = quantity_ideas
            
        }
        
        allow = {
            full_idea_group = dynasty0
            full_idea_group = quantity_ideas
        }
        
        diplomatic_reputation = 1
        land_forcelimit_modifier = 0.15
    
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { army_size_percentage = 0.9 }
            }			
            modifier = {
                factor = 1.5
                army_size_percentage = 1.1
            }
            modifier = {
                factor = 1.5
                army_size_percentage = 1.5
            }
            modifier = {
                factor = 1.5
                army_size_percentage = 2
            }
            modifier = {
                factor = 1.5
                army_size_percentage = 2.5
            }
        }
    }
    
    idea_variation_act_647 = {
        monarch_power = MIL
        potential = {
            has_idea_group = dynasty0
            has_idea_group = defensive_ideas
            
        }
        
        allow = {
            full_idea_group = dynasty0
            full_idea_group = defensive_ideas
        }
        
        fire_damage_received = -0.075
        reinforce_speed = 0.25
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { num_of_cities = 10 }
            }		
        }
        
    }
    
    idea_variation_act_648 = {
        monarch_power = ADM
        potential = {
            has_idea_group = expansion_ideas
            has_idea_group = defensive_ideas
            
        }
        
        allow = {
            full_idea_group = expansion_ideas
            full_idea_group = defensive_ideas
        }
    
        global_regiment_cost = -0.25
    
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_649 = {
        monarch_power = DIP
        potential = {
            has_idea_group = dynasty0
            has_idea_group = offensive_ideas
        
        }
        
        allow = {
            full_idea_group = dynasty0
            full_idea_group = offensive_ideas
        }
        
        diplomatic_reputation = 2
    
        ai_will_do = {
            factor = 1
        }
    }
    
    
    idea_variation_act_650 = {
        monarch_power = MIL		
        potential = {
            has_idea_group = quantity_ideas
            has_idea_group = exploration_ideas
            
        }
        
        allow = {
            full_idea_group = quantity_ideas
            full_idea_group = exploration_ideas
        }
    
        global_manpower_modifier = 0.25
    
    
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
        
            
    idea_variation_act_651 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = dynasty0
            OR = {
            has_idea_group = aristo0
            has_idea_group = monarchie0
            has_idea_group = horde0
            }
            
        }
        allow = {
            full_idea_group = dynasty0
            OR = {
            full_idea_group = aristo0
            full_idea_group = monarchie0
            full_idea_group = horde0
            }
        }
    
        legitimacy = 2
        devotion = 1			
        horde_unity = 1
            
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                legitimacy = 95
            }		
            modifier = {
                factor = 1.5
                NOT = { legitimacy = 80 }
            }
            modifier = {
                factor = 1.5
                NOT = { legitimacy = 60 }
            }			
            modifier = {
                factor = 1.5
                NOT = { legitimacy = 40 }
            }
            modifier = {
                factor = 1.5
                NOT = { legitimacy = 20 }
            }			
        }	
        
    }
    
    idea_variation_act_652 = {
    
        monarch_power = DIP
    
    
        potential = {
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            
        }
        
        allow = {
            full_idea_group = quantity_ideas
            full_idea_group = expansion_ideas
        }
    
        land_forcelimit_modifier = 0.15		
        global_colonial_growth = 10
    
        ai_will_do = {
            factor = 0.8
            modifier = {
                factor = 0
                NOT = { num_of_colonists = 1 }
            }
            modifier = {
                factor = 0.1
                NOT = { num_of_colonies = 1 }
            }
        }
    }
    
    idea_variation_act_653 = {
        monarch_power = DIP
        
        potential = {
            has_idea_group = kriegsproduktion0
            OR = {
            has_idea_group = handel0
            has_idea_group = galle0
            has_idea_group = gross0
            }
            
        }
        allow = {
            full_idea_group = kriegsproduktion0
            OR = {
            full_idea_group = handel0
            full_idea_group = galle0
            full_idea_group = gross0
            }
        }	
        
        naval_forcelimit_modifier = 0.15
        embargo_efficiency = 0.25
        
        ai_will_do = {
            factor = 0.8
            modifier = {
                factor = 0
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_654 = {
        monarch_power = DIP		# Marine
        
        potential = {
            has_idea_group = handel0
            has_idea_group = quality_ideas
            
            
        }
        allow = {
            full_idea_group = handel0
            full_idea_group = quality_ideas
            
        }	
        
        light_ship_power = 0.15
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { num_of_light_ship = 10 }
            }
        }
    }
    
    idea_variation_act_655 = {
        monarch_power = DIP		# Marine
        
        potential = {
            has_idea_group = innovativeness_ideas
            OR = {
            has_idea_group = handel0
            has_idea_group = galle0
            full_idea_group = gross0
            }
                
        }
        allow = {
            full_idea_group = innovativeness_ideas
            OR = {
            full_idea_group = handel0
            full_idea_group = galle0
            full_idea_group = gross0
            }
        }	
        
        leader_naval_fire = 2
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_656 = {
        monarch_power = DIP			# Marine
        
        potential = {
    
            OR = {
            has_idea_group = handel0
            has_idea_group = galle0
            has_idea_group = gross0
            }
            
            OR = {
            has_idea_group = religious_ideas   
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = orthodox0
            has_idea_group = islam0
            has_idea_group = cathar0
            has_idea_group = shinto0
            has_idea_group = norse0
            has_idea_group = budda0
            has_idea_group = confuci0 
            has_idea_group = hindu0
            has_idea_group = tengri0
            has_idea_group = coptic0
            has_idea_group = helle0
            has_idea_group = slav0
            has_idea_group = jew0
            has_idea_group = suomi0
            has_idea_group = romuva0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = mane0
            has_idea_group = ancli0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = nahu0
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
            }
            
        }
        allow = {
            OR = {
                full_idea_group = handel0
                full_idea_group = galle0
                full_idea_group = gross0
                }
            OR = {
                full_idea_group = religious_ideas 
                full_idea_group = katholisch0
                full_idea_group = protestant0
                full_idea_group = reformiert0
                full_idea_group = orthodox0
                full_idea_group = islam0
                full_idea_group = cathar0
                full_idea_group = shinto0
                full_idea_group = norse0
                full_idea_group = budda0
                full_idea_group = confuci0 
                full_idea_group = hindu0
                full_idea_group = tengri0
                full_idea_group = coptic0
                full_idea_group = helle0
                full_idea_group = slav0
                full_idea_group = jew0
                full_idea_group = suomi0
                full_idea_group = romuva0
                full_idea_group = animist0
                full_idea_group = feti0
                full_idea_group = zoro0
                full_idea_group = mane0
                full_idea_group = ancli0
                full_idea_group = mesoam0
                full_idea_group = inti0
                full_idea_group = tote0
                full_idea_group = nahu0
                full_idea_group = shia0
                full_idea_group = ibadi0
                full_idea_group = hussite0
            }	
        }
        
        leader_naval_shock = 2
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_657 = {
        monarch_power = DIP 
        
        potential = {
            has_idea_group = influence_ideas
            OR = {
            has_idea_group = aristo0
            has_idea_group = monarchie0
            has_idea_group = horde0
            }
                
        }
        allow = {
            full_idea_group = influence_ideas
            OR = {
            full_idea_group = aristo0
            full_idea_group = monarchie0
            full_idea_group = horde0
            }
        }
        
        global_unrest = -1
        reduced_liberty_desire = 5	
        
        ai_will_do = {
            factor = 1
                
        }
    }
    
    idea_variation_act_658 = {
        monarch_power = MIL
        
        potential = {
            has_idea_group = humanist_ideas
            has_idea_group = quantity_ideas
            
        }
        
        allow = {
            full_idea_group = humanist_ideas
            full_idea_group = quantity_ideas
        }	
        
        leader_land_shock = 2
        
        ai_will_do = {
            factor = 1.2
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_659 = {
        monarch_power = DIP				# Marine
        
        potential = {
            has_idea_group = humanist_ideas 
            OR = {
            has_idea_group = handel0
            has_idea_group = galle0
            has_idea_group = gross0
            }
                
        }
        allow = {
            full_idea_group = humanist_ideas 
            OR = {
            full_idea_group = handel0
            full_idea_group = galle0
            full_idea_group = gross0
            }
        }	
        
        naval_morale = 0.15
        
        ai_will_do = {
            factor = 0.8
            modifier = {
                factor = 0
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_660 = {
        monarch_power = ADM
        
        potential = {
            has_idea_group = humanist_ideas
            has_idea_group = defensive_ideas
            
        }
        
        allow = {
            full_idea_group = humanist_ideas
            full_idea_group = defensive_ideas
            
            NOT = {
            calc_true_if = {
                amount = 3
                has_active_policy = idea_variation_act_636
                has_active_policy = idea_variation_act_660
                has_active_policy = idea_variation_act_12
                has_active_policy = idea_variation_act_31
                has_active_policy = idea_variation_act_324
        
                }
            }
        }	
        
        land_attrition = -0.15
        
        ai_will_do = {
            factor = 0.9
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_661 = {
        monarch_power = MIL
        
        potential = {
            has_idea_group = influence_ideas
            has_idea_group = defensive_ideas
            
        }
        
        allow = {
            full_idea_group = influence_ideas
            full_idea_group = defensive_ideas
        }	
        
        land_morale = 0.07
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_662 = {
        monarch_power = DIP		
        
        potential = {
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            
        }
        
        allow = {
            full_idea_group = influence_ideas
            full_idea_group = offensive_ideas
        }	
        
        reduced_liberty_desire = 10
        
        ai_will_do = {
            factor = 1
                
        }
    }
    
    idea_variation_act_663 = {
        monarch_power = MIL
        
        potential = {
            has_idea_group = influence_ideas
            has_idea_group = quantity_ideas
            
        }
        
        allow = {
            full_idea_group = influence_ideas
            full_idea_group = quantity_ideas
        }	
        
        shock_damage = 0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    
    
    ########################################################
    ###### Idea Variation Policies by flogi
    ########################################################
    
    ########################################################
    ###### State Administration
    ########################################################
    
    idea_variation_act_1 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = staatsverwaltung0
            has_idea_group = flottenbasis0
                
        }
        allow = {
            full_idea_group = staatsverwaltung0
            full_idea_group = flottenbasis0
        }
        
        naval_maintenance_modifier = -0.25
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_2 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = staatsverwaltung0
            has_idea_group = kolonialimperium0
            
            
        }
        allow = {
            full_idea_group = staatsverwaltung0
            full_idea_group = kolonialimperium0
        }
        
        global_colonial_growth = 15
        global_tariffs = 0.15
        
        ai_will_do = {
            factor = 1
                    
        }
    }
    
    idea_variation_act_3 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = staatsverwaltung0
            OR = {
            has_idea_group = galle0
            has_idea_group = gross0
            }
            
        }
        allow = {
            full_idea_group = staatsverwaltung0
            OR = {
            full_idea_group = galle0
            full_idea_group = gross0
            }
        }
        
        naval_forcelimit_modifier = 0.33
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_4 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = staatsverwaltung0
            has_idea_group = exploration_ideas
            
        }
        allow = {
            full_idea_group = staatsverwaltung0
            full_idea_group = exploration_ideas
        }
        
        colonists = 1
        colonist_placement_chance = 0.1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { num_of_colonists = 1 }
            }
            modifier = {
                factor = 0.1
                NOT = { num_of_colonies = 1 }
            }
        }
    }
    
    idea_variation_act_5 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = staatsverwaltung0
            has_idea_group = offensive_ideas
            
        }
        allow = {
            full_idea_group = staatsverwaltung0
            full_idea_group = offensive_ideas
        }
        
        core_creation = -0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_6 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = staatsverwaltung0
            has_idea_group = soldnerheer0 
                
        }
        allow = {
            full_idea_group = staatsverwaltung0
            full_idea_group = soldnerheer0  
        }
        
        mercenary_discipline = 0.05	
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_7 = {
    
        monarch_power = MIL				
    
        potential = {
            has_idea_group = staatsverwaltung0
            has_idea_group = kriegsproduktion0
            
        }
        allow = {
            full_idea_group = staatsverwaltung0
            full_idea_group = kriegsproduktion0
        }
        
        fire_damage = 0.1
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    
    idea_variation_act_8 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = staatsverwaltung0
            has_idea_group = nationalismus0
                
        }
        allow = {
            full_idea_group = staatsverwaltung0
            full_idea_group = nationalismus0
        }
        
        
        advisor_cost = -0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    ########################################################
    ###### Jurisprudence / Justiz
    ########################################################
    
    
    idea_variation_act_10 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = justiz0
            has_idea_group = assimilation0
                
        }
        allow = {
            full_idea_group = justiz0
            full_idea_group = assimilation0 
        }
        
        global_institution_spread = 0.2
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_11 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = justiz0
            has_idea_group = trade_ideas 
                
        }
        allow = {
            full_idea_group = justiz0
            full_idea_group = trade_ideas 
        }
        
        global_tax_modifier = 0.1
        production_efficiency = 0.1
        trade_efficiency = 0.1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }	
        }
    }
    
    idea_variation_act_12 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = justiz0
            has_idea_group = offensive_ideas
            
        }
        allow = {
            full_idea_group = justiz0
            full_idea_group = offensive_ideas
            
            NOT = {
            calc_true_if = {
                amount = 3
                has_active_policy = idea_variation_act_636
                has_active_policy = idea_variation_act_660
                has_active_policy = idea_variation_act_12
                has_active_policy = idea_variation_act_31
                has_active_policy = idea_variation_act_324
        
                }
            }
        }
        
        land_attrition = -0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_13 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = justiz0
            has_idea_group = gesellschaft0
            
        }
        allow = {
            full_idea_group = justiz0
            full_idea_group = gesellschaft0
            
            NOT = {
            calc_true_if = {
                amount = 3
                has_active_policy = idea_variation_act_13
                has_active_policy = idea_variation_act_578
                has_active_policy = idea_variation_act_206
                has_active_policy = idea_variation_act_219
                has_active_policy = idea_variation_act_227
                has_active_policy = idea_variation_act_333
                has_active_policy = idea_variation_act_498
    
                }
            }
        }
        
        idea_cost = -0.075
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_14 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = justiz0
            has_idea_group = kriegsproduktion0
                
        }
        allow = {
            full_idea_group = justiz0
            full_idea_group = kriegsproduktion0
        }
        
        global_trade_goods_size_modifier = 0.15
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }	
        }
    }
    
    
    idea_variation_act_664 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = handel0
            has_idea_group = waffenqualitat0
                
        }
        allow = {
            full_idea_group = handel0
            full_idea_group = waffenqualitat0
            
        }
        
        naval_morale = 0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_16 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = justiz0
            has_idea_group = influence_ideas 
                
        }
        allow = {
            full_idea_group = justiz0
            full_idea_group = influence_ideas 
            
        }
        
        diplomatic_reputation = 2
        
        ai_will_do = {
            factor = 1
        }
    }
    
    ########################################################
    ###### Development / Entwicklung
    ########################################################
    
    idea_variation_act_17 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = entwicklung0
            has_idea_group = waffenqualitat0
                
        }
        allow = {
            full_idea_group = entwicklung0
            full_idea_group = waffenqualitat0
        }
        
        discipline = 0.03
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_18 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = entwicklung0
            has_idea_group = trade_ideas 
                
        }
        allow = {
            full_idea_group = entwicklung0
            full_idea_group = trade_ideas 
        }
        
        merchants = 1
        global_trade_power = 0.1
    
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }	
        }
    }
    
    idea_variation_act_19 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = entwicklung0
            has_idea_group = maritime_ideas 
                
        }
        allow = {
            full_idea_group = entwicklung0
            full_idea_group = maritime_ideas 
        }
        
        global_ship_recruit_speed = -0.25
        naval_attrition = -0.25
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_20 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = entwicklung0
            has_idea_group = generalstab0
            
        }
        allow = {
            full_idea_group = entwicklung0
            full_idea_group = generalstab0
        }
        
        yearly_army_professionalism = 0.03
        drill_gain_modifier = 0.25
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_21 = {
    
        monarch_power = ADM			
    
        potential = {
            has_idea_group = entwicklung0
            has_idea_group = quantity_ideas
                
        }
        allow = {
            full_idea_group = entwicklung0
            full_idea_group = quantity_ideas
            
            NOT = {
            calc_true_if = {
                amount = 3
                has_active_policy = idea_variation_act_588
                has_active_policy = idea_variation_act_591
                has_active_policy = idea_variation_act_21
                has_active_policy = idea_variation_act_138
                has_active_policy = idea_variation_act_425
                has_active_policy = idea_variation_act_502
                has_active_policy = idea_variation_act_551
                has_active_policy = idea_variation_act_529
                has_active_policy = idea_variation_act_516
    
                }
            }
        }
        
        build_cost = -0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_22 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = entwicklung0
            
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
                
        }
        allow = {
            full_idea_group = entwicklung0
            
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
        }
        
        global_tax_modifier = 0.15
        production_efficiency = 0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_23 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = justiz0
            has_idea_group = propaganda0
            
        }
        allow = {
            full_idea_group = justiz0
            full_idea_group = propaganda0
            
            NOT = {
            calc_true_if = {
                amount = 2
                has_active_policy = idea_variation_act_23
                has_active_policy = idea_variation_act_153
                has_active_policy = idea_variation_act_169
                has_active_policy = idea_variation_act_238
                has_active_policy = idea_variation_act_302
                has_active_policy = idea_variation_act_340
                has_active_policy = idea_variation_act_92
                has_active_policy = idea_variation_act_566
                has_active_policy = idea_variation_act_532
                has_active_policy = idea_variation_act_528
                has_active_policy = idea_variation_act_514
                has_active_policy = idea_variation_act_503
                }
            }	
        }
        
        development_cost = -0.1 
        diplomatic_reputation = 1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_24 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = entwicklung0
            has_idea_group = quality_ideas
                
        }
        allow = {
            full_idea_group = entwicklung0
            full_idea_group = quality_ideas
        }
        
        defensiveness = 0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    ########################################################
    ###### Health/Gesundheit
    ########################################################
    
    idea_variation_act_25 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = gesundheit0
            has_idea_group = offensive_ideas
        
        }
        allow = {
            full_idea_group = gesundheit0
            full_idea_group = offensive_ideas
        }
        
        land_morale = 0.07
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_26 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = gesundheit0
            OR = {
            has_idea_group = stehendesheer0 
            has_idea_group = wehrpflicht0
            }
                
        }
        allow = {
            full_idea_group = gesundheit0
            OR = {
            full_idea_group = stehendesheer0 
            full_idea_group = wehrpflicht0
            }
        }
        
        manpower_recovery_speed = 0.25 
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_27 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = gesundheit0
            has_idea_group = gesellschaft0
            
        }
        allow = {
            full_idea_group = gesundheit0
            full_idea_group = gesellschaft0
        }
        
        global_tax_modifier = 0.15
        production_efficiency = 0.15
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { production_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                production_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                production_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                production_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                production_income_percentage = 0.5
            }		
        }
    }
    
    idea_variation_act_28 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = gesundheit0
            has_idea_group = festung0
                
        }
        allow = {
            full_idea_group = gesundheit0
            full_idea_group = festung0
        }
        
        embracement_cost = -0.25
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_29 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = gesundheit0
            has_idea_group = assimilation0
                
        }
        allow = {
            full_idea_group = gesundheit0
            full_idea_group = assimilation0
        }
        
        diplomatic_annexation_cost = -0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_30 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = gesundheit0
            has_idea_group = kolonialimperium0
                
        }
        allow = {
            full_idea_group = gesundheit0
            full_idea_group = kolonialimperium0
        }
        
        native_assimilation = 0.25
        native_uprising_chance = -0.25
        global_colonial_growth = 10
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { num_of_colonists = 1 }
            }
            modifier = {
                factor = 0.1
                NOT = { num_of_colonies = 1 }
            }
        }
    }
    
    idea_variation_act_31 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = gesundheit0
            has_idea_group = quality_ideas
            
        }
        allow = {
            full_idea_group = gesundheit0
            full_idea_group = quality_ideas
            
            NOT = {
            calc_true_if = {
                amount = 3
                has_active_policy = idea_variation_act_636
                has_active_policy = idea_variation_act_660
                has_active_policy = idea_variation_act_12
                has_active_policy = idea_variation_act_31
                has_active_policy = idea_variation_act_324
        
                }
            }
        }
        
        land_attrition = -0.15
        
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_32 = {
    
        monarch_power = MIL		# Marine
    
        potential = {
            has_idea_group = gesundheit0
            has_idea_group = maritime_ideas
                
        }
        allow = {
            full_idea_group = gesundheit0
            full_idea_group = maritime_ideas
        }
        
        
        naval_morale = 0.15
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    ########################################################
    ###### Dictatorship / Diktatur Ideen
    ########################################################
    
    idea_variation_act_33 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = diktatur0
            has_idea_group = nationalismus0
                
        }
        allow = {
            full_idea_group = diktatur0
            full_idea_group = nationalismus0
        }
        
        global_tax_modifier = 0.15
        production_efficiency = 0.15
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_34 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = diktatur0
            has_idea_group = assimilation0
                
        }
        allow = {
            full_idea_group = diktatur0
            full_idea_group = assimilation0
        }
        
        culture_conversion_cost = -0.1
        embracement_cost = -0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_35 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = diktatur0
            has_idea_group = propaganda0
            
        }
        allow = {
            full_idea_group = diktatur0
            full_idea_group = propaganda0
        }
        
        global_unrest = -1
        global_trade_goods_size_modifier = 0.1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }	
        }
    }
    
    idea_variation_act_36 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = diktatur0
            has_idea_group = gesellschaft0
                
        }
        allow = {
            full_idea_group = diktatur0
            full_idea_group = gesellschaft0
        }
        
        embracement_cost = -0.1
        global_institution_spread = 0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_37 = {
    
        monarch_power = ADM
    
        potential = {
            current_age = age_of_discovery
            has_idea_group = diktatur0
            has_idea_group = wehrpflicht0
                
        }
        allow = {
            current_age = age_of_discovery
            full_idea_group = diktatur0
            full_idea_group = wehrpflicht0
        }
        
        global_manpower = 5.0
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_37_1 = {
    
        monarch_power = ADM
    
        potential = {
            current_age = age_of_reformation
            has_idea_group = diktatur0
            has_idea_group = wehrpflicht0
                
        }
        allow = {
            current_age = age_of_reformation
            full_idea_group = diktatur0
            full_idea_group = wehrpflicht0
        }
        
        global_manpower = 10.0
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_37_2 = {
    
        monarch_power = ADM
    
        potential = {
            current_age = age_of_absolutism
            has_idea_group = diktatur0
            has_idea_group = wehrpflicht0
                
        }
        allow = {
            current_age = age_of_absolutism
            full_idea_group = diktatur0
            full_idea_group = wehrpflicht0
        }
        
        global_manpower = 15.0
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_37_3 = {
    
        monarch_power = ADM
    
        potential = {
            current_age = age_of_revolutions
            has_idea_group = diktatur0
            has_idea_group = wehrpflicht0
                
        }
        allow = {
            current_age = age_of_revolutions
            full_idea_group = diktatur0
            full_idea_group = wehrpflicht0
        }
        
        global_manpower = 20.0
        
        ai_will_do = {
            factor = 1
        }
    }
    
    #idea_variation_act_38 = {  # unused
    #}
    
    idea_variation_act_39 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = diktatur0
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
            
        }
        allow = {
            full_idea_group = diktatur0
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
        }
        
        state_maintenance_modifier = -0.75
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_40 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = diktatur0
            has_idea_group = quantity_ideas
                
        }
        allow = {
            full_idea_group = diktatur0
            full_idea_group = quantity_ideas
        }
        
        land_morale = 0.15
        discipline = -0.035
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    ########################################################
    ###### Colonial Empire / Kolonialimperium
    ########################################################
    
    idea_variation_act_41 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = kolonialimperium0
            has_idea_group = innovativeness_ideas
                
        }
        allow = {
            full_idea_group = kolonialimperium0
            full_idea_group = innovativeness_ideas
        }
        
        global_trade_power = 0.1
        merchants = 1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }	
        }
    }
    
    idea_variation_act_42 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = kolonialimperium0
            has_idea_group = republik0
                
        }
        allow = {
            full_idea_group = kolonialimperium0
            full_idea_group = republik0
        }
        
        range = 0.5
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { num_of_colonists = 1 }
            }
            modifier = {
                factor = 0.1
                NOT = { num_of_colonies = 1 }
            }
        }
    }
    
    idea_variation_act_43 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = kolonialimperium0
            OR = {
            has_idea_group = aristo0
            has_idea_group = monarchie0
            has_idea_group = horde0
            }
                
        }
        allow = {
            full_idea_group = kolonialimperium0
            OR = {
            full_idea_group = aristo0
            full_idea_group = monarchie0
            full_idea_group = horde0
            }
        }
        
        global_tariffs = 0.25
        
        ai_will_do = {
            factor = 1
                    
        }
    }
    
    idea_variation_act_44 = {
    
        monarch_power = DIP		# Marine
    
        potential = {
            has_idea_group = offensive_ideas
            has_idea_group = galle0
                
        }
        allow = {
            full_idea_group = offensive_ideas
            full_idea_group = galle0
        }
        
        privateer_efficiency = 0.25
        galley_power = 0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_45 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = quantity_ideas
            has_idea_group = gesundheit0
            
        }
        allow = {
            full_idea_group = quantity_ideas
            full_idea_group = gesundheit0
        }
        
        global_autonomy = -0.05
        global_unrest = -1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_46 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = kolonialimperium0
            has_idea_group = humanist_ideas 
                
        }
        allow = {
            full_idea_group = kolonialimperium0
            full_idea_group = humanist_ideas 
        }
        
        global_colonial_growth = 25
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { num_of_colonists = 1 }
            }
            modifier = {
                factor = 0.1
                NOT = { num_of_colonies = 1 }
            }
        }
    }
    
    idea_variation_act_47 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = kolonialimperium0
            has_idea_group = expansion_ideas
            
        }
        allow = {
            full_idea_group = kolonialimperium0
            full_idea_group = expansion_ideas
        }
        
        colonists = 1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { num_of_colonists = 1 }
            }
            modifier = {
                factor = 0.1
                NOT = { num_of_colonies = 1 }
            }
        }
    }
    
    ########################################################
    ###### Assimilation
    ########################################################
    
    idea_variation_act_48 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = assimilation0
            has_idea_group = festung0
                
        }
        allow = {
            full_idea_group = assimilation0
            full_idea_group = festung0
        }
        
        core_creation = -0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    
    
    
    idea_variation_act_49 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = assimilation0
            has_idea_group = staatsverwaltung0
                
        }
        allow = {
            full_idea_group = assimilation0
            full_idea_group = staatsverwaltung0
        }
        
        global_unrest = -3			
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_50 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = assimilation0
            OR = {
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = monarchie0
            has_idea_group = horde0
            }
                
        }
        allow = {
            full_idea_group = assimilation0
            OR = {
            full_idea_group = republik0 
            full_idea_group = aristo0
            full_idea_group = monarchie0
            full_idea_group = horde0
            }	
            
            NOT = {
            calc_true_if = {
                amount = 2
                has_active_policy = idea_variation_act_611
                has_active_policy = idea_variation_act_617
                has_active_policy = idea_variation_act_620
                has_active_policy = idea_variation_act_50
                has_active_policy = idea_variation_act_152
                has_active_policy = idea_variation_act_215
                has_active_policy = idea_variation_act_491
                has_active_policy = idea_variation_act_500
    
                }
            }
        }
        
        diplomatic_reputation = 1
        improve_relation_modifier = 0.1			
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_51 = {
    
        monarch_power = MIL
    
        potential = {
            current_age = age_of_discovery
            has_idea_group = assimilation0
            has_idea_group = wehrpflicht0
            
        }
        allow = {
            current_age = age_of_discovery
            full_idea_group = assimilation0
            full_idea_group = wehrpflicht0
        }
        
        global_manpower = 10.0
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_51_1 = {
    
        monarch_power = MIL
    
        potential = {
            current_age = age_of_reformation
            has_idea_group = assimilation0
            has_idea_group = wehrpflicht0
            
        }
        allow = {
            current_age = age_of_reformation
            full_idea_group = assimilation0
            full_idea_group = wehrpflicht0
        }
        
        global_manpower = 20.0
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_51_2 = {
    
        monarch_power = MIL
    
        potential = {
            current_age = age_of_absolutism
            has_idea_group = assimilation0
            has_idea_group = wehrpflicht0
            
        }
        allow = {
            current_age = age_of_absolutism
            full_idea_group = assimilation0
            full_idea_group = wehrpflicht0
        }
        
        global_manpower = 30.0
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_51_3 = {
    
        monarch_power = MIL
    
        potential = {
            current_age = age_of_revolutions
            has_idea_group = assimilation0
            has_idea_group = wehrpflicht0
            
        }
        allow = {
            current_age = age_of_revolutions
            full_idea_group = assimilation0
            full_idea_group = wehrpflicht0
        }
        
        global_manpower = 40.0
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_52 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = assimilation0
            has_idea_group = quality_ideas
                
        }
        allow = {
            full_idea_group = assimilation0
            full_idea_group = quality_ideas
        }
        
        infantry_power = 0.15
        
        ai_will_do = {
            factor = 15
        }
    }
    
    idea_variation_act_53 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = assimilation0
            has_idea_group = humanist_ideas 
                
        }
        allow = {
            full_idea_group = assimilation0
            full_idea_group = humanist_ideas 
        }
        
        years_of_nationalism = -5
        stability_cost_modifier = -0.25
        
        ai_will_do = {
            factor = 1
        }
    }
    
    ########################################################
    ###### Society / Gesellschaft 
    ########################################################
    
    
    idea_variation_act_54 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = gesellschaft0
            OR = {
            has_idea_group = religious_ideas   
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = orthodox0
            has_idea_group = islam0
            has_idea_group = cathar0
            has_idea_group = shinto0
            has_idea_group = norse0
            has_idea_group = budda0
            has_idea_group = confuci0 
            has_idea_group = hindu0
            has_idea_group = tengri0
            has_idea_group = coptic0
            has_idea_group = helle0
            has_idea_group = slav0
            has_idea_group = jew0
            has_idea_group = suomi0
            has_idea_group = romuva0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = mane0
            has_idea_group = ancli0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = nahu0
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
            }
            
        }
        allow = {
            full_idea_group = gesellschaft0
            OR = {
                full_idea_group = religious_ideas 
                full_idea_group = katholisch0
                full_idea_group = protestant0
                full_idea_group = reformiert0
                full_idea_group = orthodox0
                full_idea_group = islam0
                full_idea_group = cathar0
                full_idea_group = shinto0
                full_idea_group = norse0
                full_idea_group = budda0
                full_idea_group = confuci0 
                full_idea_group = hindu0
                full_idea_group = tengri0
                full_idea_group = coptic0
                full_idea_group = helle0
                full_idea_group = slav0
                full_idea_group = jew0
                full_idea_group = suomi0
                full_idea_group = romuva0
                full_idea_group = animist0
                full_idea_group = feti0
                full_idea_group = zoro0
                full_idea_group = mane0
                full_idea_group = ancli0
                full_idea_group = mesoam0
                full_idea_group = inti0
                full_idea_group = tote0
                full_idea_group = nahu0
                full_idea_group = shia0
                full_idea_group = ibadi0
                full_idea_group = hussite0
            }	
        }
        
        missionaries = 2
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                religious_unity = 1
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.6 }
            }			
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.4 }
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.2 }
            }			
        }
    }
    
    idea_variation_act_55 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = gesellschaft0
            OR = {
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = monarchie0
            has_idea_group = horde0
            }
            
        }
        allow = {
            full_idea_group = gesellschaft0
            OR = {
            full_idea_group = republik0 
            full_idea_group = aristo0
            full_idea_group = monarchie0
            full_idea_group = horde0
            }	
        }
        
        diplomatic_annexation_cost = -0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_56 = {
    
        monarch_power = MIL
        
        potential = {
            has_idea_group = gesellschaft0
            OR = {
            has_idea_group = stehendesheer0 
            has_idea_group = wehrpflicht0
            }
                
        }
        allow = {
            full_idea_group = gesellschaft0
            OR = {
            full_idea_group = stehendesheer0 
            full_idea_group = wehrpflicht0
            }
        }
        
        discipline = 0.03
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_57 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = gesellschaft0
            has_idea_group = waffenqualitat0
                
        }
        allow = {
            full_idea_group = gesellschaft0
            full_idea_group = waffenqualitat0
        }
        
        discipline = 0.03
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_58 = {
    
        monarch_power = MIL	# Marine
    
        potential = {
            has_idea_group = generalstab0
            has_idea_group = gross0
                
        }
        allow = {
            full_idea_group = generalstab0
            full_idea_group = gross0
    
        }
        
        leader_naval_fire = 1
        leader_naval_shock = 1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    ########################################################
    ###### Propaganda Ideas
    ########################################################
    
    idea_variation_act_59 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = propaganda0
            OR = {
            has_idea_group = aristo0
            has_idea_group = monarchie0
            has_idea_group = horde0
            }
                
        }
        allow = {
            full_idea_group = propaganda0
            OR = {
            full_idea_group = aristo0
            full_idea_group = monarchie0
            full_idea_group = horde0
            }
        }
        
        legitimacy = 2
        devotion = 1
        horde_unity = 1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_60 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = propaganda0
            has_idea_group = wehrpflicht0
                
        }
        allow = {
            full_idea_group = propaganda0
            full_idea_group = wehrpflicht0
        }
        
        land_maintenance_modifier = -0.2
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_61 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = propaganda0
            has_idea_group = offensive_ideas
                
        }
        allow = {
            full_idea_group = propaganda0
            full_idea_group = offensive_ideas
        }
        
        siege_ability = 0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_62 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = propaganda0
            has_idea_group = innovativeness_ideas
            
        }
        allow = {
            full_idea_group = propaganda0
            full_idea_group = innovativeness_ideas
        }
        
        production_efficiency = 0.3
        
        ai_will_do = {
            factor = 1
        }
    }
    
    ########################################################
    ###### Fleet Base / Flottenbasis
    ########################################################
    
    idea_variation_act_63 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = flottenbasis0
            has_idea_group = expansion_ideas
            
        }
        allow = {
            full_idea_group = flottenbasis0
            full_idea_group = expansion_ideas
        }
        
        global_ship_cost = -0.25
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_64 = {
    
        monarch_power = DIP		# Marine
    
        potential = {
    
            OR = {
            has_idea_group = galle0
            has_idea_group = gross0	
            }
            
            
            
            has_idea_group = waffenqualitat0
            
                
        }
        allow = {
            OR = {
                full_idea_group = galle0
                full_idea_group = gross0
                }
    
                full_idea_group = waffenqualitat0
                
            
        }
        
        heavy_ship_power = 0.075
        galley_power = 0.075
        light_ship_power = 0.075
        transport_power = 0.075
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    
    
    idea_variation_act_65 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = flottenbasis0
            has_idea_group = festung0
                
        }
        allow = {
            full_idea_group = flottenbasis0
            full_idea_group = festung0
        }
        
        land_maintenance_modifier = -0.1
        land_forcelimit_modifier = 0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_66 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = flottenbasis0
            has_idea_group = economic_ideas
                
        }
        allow = {
            full_idea_group = flottenbasis0
            full_idea_group = economic_ideas
        }
        
        trade_range_modifier = 0.25
        trade_steering = 0.25
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }	
        }
    }
    
    idea_variation_act_67 = {
    
        monarch_power = MIL				# Marine
    
        potential = {
            has_idea_group = flottenbasis0
            has_idea_group = generalstab0
                
        }
        allow = {
            full_idea_group = flottenbasis0
            full_idea_group = generalstab0
        }
        
    
        leader_naval_manuever = 2
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    ########################################################
    ###### Nationalism / Nationalismus
    ########################################################
    
    idea_variation_act_68 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = nationalismus0
            has_idea_group = generalstab0
            
        }
        allow = {
            full_idea_group = nationalismus0
            full_idea_group = generalstab0
        }
        
        leader_land_shock = 1
        leader_land_fire = 1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_69 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = nationalismus0
            has_idea_group = defensive_ideas
                
        }
        allow = {
            full_idea_group = nationalismus0
            full_idea_group = defensive_ideas
        }
        
        hostile_attrition = 2	
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_70 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = nationalismus0
            has_idea_group = festung0
            
        }
        allow = {
            full_idea_group = nationalismus0
            full_idea_group = festung0
        }
        
        defensiveness = 0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_71 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = nationalismus0
            has_idea_group = wehrpflicht0
            
        }
        allow = {
            full_idea_group = nationalismus0
            full_idea_group = wehrpflicht0
        }
        
        global_manpower_modifier = 0.25
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_72 = {
    
        monarch_power = MIL				
    
        potential = {
            has_idea_group = nationalismus0
            has_idea_group = kriegsproduktion0
                
        }
        allow = {
            full_idea_group = nationalismus0
            full_idea_group = kriegsproduktion0
        }
        
        production_efficiency = 0.1
        global_trade_goods_size_modifier = 0.1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }	
        }
    }
    
    idea_variation_act_73 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = nationalismus0
            has_idea_group = republik0
            
        }
        allow = {
            full_idea_group = nationalismus0
            full_idea_group = republik0
        }
        
        republican_tradition = 1.0
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_74 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = nationalismus0
            has_idea_group = administrative_ideas
                
        }
        allow = {
            full_idea_group = nationalismus0
            full_idea_group = administrative_ideas
        }
        
        global_unrest = -2
        
        ai_will_do = {
            factor = 1
        }
    }
    
    ########################################################
    ###### Imperialism / Imperialismus
    ########################################################
    
    idea_variation_act_75 = {
    
        monarch_power = MIL
    
        potential = {
        
            has_idea_group = soldnerheer0 
        
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
            
                
        }
        allow = {
        
        full_idea_group = soldnerheer0 
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
            
        }
        
        mercenary_manpower = 1.0
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_76 = {
    
        monarch_power = DIP
    
        potential = {
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
            
            OR = {
            has_idea_group = religious_ideas   
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = orthodox0
            has_idea_group = islam0
            has_idea_group = cathar0
            has_idea_group = shinto0
            has_idea_group = norse0
            has_idea_group = budda0
            has_idea_group = confuci0 
            has_idea_group = hindu0
            has_idea_group = tengri0
            has_idea_group = coptic0
            has_idea_group = helle0
            has_idea_group = slav0
            has_idea_group = jew0
            has_idea_group = suomi0
            has_idea_group = romuva0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = mane0
            has_idea_group = ancli0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = nahu0
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
            
            }
                
        }
        allow = {
            
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
            
            OR = {
                full_idea_group = religious_ideas 
                full_idea_group = katholisch0
                full_idea_group = protestant0
                full_idea_group = reformiert0
                full_idea_group = orthodox0
                full_idea_group = islam0
                full_idea_group = cathar0
                full_idea_group = shinto0
                full_idea_group = norse0
                full_idea_group = budda0
                full_idea_group = confuci0 
                full_idea_group = hindu0
                full_idea_group = tengri0
                full_idea_group = coptic0
                full_idea_group = helle0
                full_idea_group = slav0
                full_idea_group = jew0
                full_idea_group = suomi0
                full_idea_group = romuva0
                full_idea_group = animist0
                full_idea_group = feti0
                full_idea_group = zoro0
                full_idea_group = mane0
                full_idea_group = ancli0
                full_idea_group = mesoam0
                full_idea_group = inti0
                full_idea_group = tote0
                full_idea_group = nahu0
                full_idea_group = shia0
                full_idea_group = ibadi0
                full_idea_group = hussite0
            }	
        }
        
        religious_unity = 0.5
        
        ai_will_do = {
            factor = 1
        }
    }
    
    
    
    idea_variation_act_77 = {
    
        monarch_power = ADM
    
        potential = {
            
            has_idea_group = expansion_ideas
            
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
            
                
        }
        allow = {
        
            full_idea_group = expansion_ideas
            
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
        }
        
        core_creation = -0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_78 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = quantity_ideas
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
            
                
        }
        allow = {
        
            full_idea_group = quantity_ideas
            
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
            
        }
        
        land_maintenance_modifier = -0.2
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_79 = {
    
        monarch_power = DIP
    
        potential = {
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
            
            OR = {
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = monarchie0
            has_idea_group = horde0
            }
                
        }
        allow = {
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
            
            OR = {
            full_idea_group = republik0 
            full_idea_group = aristo0
            full_idea_group = monarchie0
            full_idea_group = horde0
            }
            
            NOT = {
            calc_true_if = {
                amount = 2
                has_active_policy = idea_variation_act_575
                has_active_policy = idea_variation_act_580
                has_active_policy = idea_variation_act_623
                has_active_policy = idea_variation_act_79
                has_active_policy = idea_variation_act_90
                has_active_policy = idea_variation_act_220
                has_active_policy = idea_variation_act_256
                }
            }
        }
        
        ae_impact = -0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_80 = {
    
        monarch_power = DIP
    
        potential = {
            
            has_idea_group = humanist_ideas
            
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
                
        }
        allow = {
        
            full_idea_group = humanist_ideas
            
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
            
        }
        
        diplomatic_annexation_cost = -0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    ########################################################
    ###### General Staff / Generalstab
    ########################################################
    
    idea_variation_act_81 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = generalstab0
            has_idea_group = innovativeness_ideas
                
        }
        allow = {
            full_idea_group = generalstab0
            full_idea_group = innovativeness_ideas
        }
        
        siege_ability = 0.1
    
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_82 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = generalstab0
            has_idea_group = propaganda0
                
        }
        allow = {
            full_idea_group = generalstab0
            full_idea_group = propaganda0
        }
        
        discipline = 0.03
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_83 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = generalstab0
            has_idea_group = gesellschaft0
                
        }
        allow = {
            full_idea_group = generalstab0
            full_idea_group = gesellschaft0
        }
        
        infantry_power = 0.075
        cavalry_power = 0.075
        artillery_power = 0.075
    
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_84 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = generalstab0
            has_idea_group = administrative_ideas
                
        }
        allow = {
            full_idea_group = generalstab0
            full_idea_group = administrative_ideas
        }
        
        infantry_power = 0.075
        cavalry_power = 0.075
        artillery_power = 0.075
        
        ai_will_do = {
            factor = 10
        }
    }
    
    idea_variation_act_85 = {
    
        monarch_power = MIL				
    
        potential = {
            has_idea_group = generalstab0
            has_idea_group = economic_ideas
                
        }
        allow = {
            full_idea_group = generalstab0
            full_idea_group = economic_ideas
        }
        
        land_maintenance_modifier = -0.1
        naval_maintenance_modifier = -0.1
        production_efficiency = 0.15
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }	
        }
    }
    
    ########################################################
    ###### Standing Army / Stehendes Heer
    ########################################################
    
    idea_variation_act_86 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = stehendesheer0
            OR = {
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = monarchie0
            has_idea_group = horde0
            }
                
        }
        allow = {
            full_idea_group = stehendesheer0
            OR = {
            full_idea_group = republik0 
            full_idea_group = aristo0
            full_idea_group = monarchie0
            full_idea_group = horde0
            }
        }
        
        discipline = 0.03
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_87 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = stehendesheer0
            has_idea_group = administrative_ideas
                
        }
        allow = {
            full_idea_group = stehendesheer0
            full_idea_group = administrative_ideas
        }
        
        land_maintenance_modifier = -0.2
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_88 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = stehendesheer0
            has_idea_group = nationalismus0
                
        }
        allow = {
            full_idea_group = stehendesheer0
            full_idea_group = nationalismus0
        }
        
        land_morale = 0.07
        
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_89 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_discovery
            has_idea_group = stehendesheer0
            OR = {
            has_idea_group = handel0
            has_idea_group = galle0
            has_idea_group = gross0
            }
                
        }
        allow = {
            current_age = age_of_discovery
            full_idea_group = stehendesheer0
            OR = {
            full_idea_group = handel0
            full_idea_group = galle0
            full_idea_group = gross0
            }
        }
        
        global_sailors = 5000
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_89_1 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_reformation
            has_idea_group = stehendesheer0
            OR = {
            has_idea_group = handel0
            has_idea_group = galle0
            has_idea_group = gross0
            }
                
        }
        allow = {
            current_age = age_of_reformation
            full_idea_group = stehendesheer0
            OR = {
            full_idea_group = handel0
            full_idea_group = galle0
            full_idea_group = gross0
            }
        }
        
        global_sailors = 10000
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_89_2 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_absolutism
            has_idea_group = stehendesheer0
            OR = {
            has_idea_group = handel0
            has_idea_group = galle0
            has_idea_group = gross0
            }
                
        }
        allow = {
            current_age = age_of_absolutism
            full_idea_group = stehendesheer0
            OR = {
            full_idea_group = handel0
            full_idea_group = galle0
            full_idea_group = gross0
            }
        }
        
        global_sailors = 15000
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_89_3 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_revolutions
            has_idea_group = stehendesheer0
            OR = {
            has_idea_group = handel0
            has_idea_group = galle0
            has_idea_group = gross0
            }
                
        }
        allow = {
            current_age = age_of_revolutions
            full_idea_group = stehendesheer0
            OR = {
            full_idea_group = handel0
            full_idea_group = galle0
            full_idea_group = gross0
            }
        }
        
        global_sailors = 20000
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_90 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = stehendesheer0
            has_idea_group = influence_ideas 
            
        }
        allow = {
            full_idea_group = stehendesheer0
            full_idea_group = influence_ideas 
            
            NOT = {
            calc_true_if = {
                amount = 2
                has_active_policy = idea_variation_act_575
                has_active_policy = idea_variation_act_580
                has_active_policy = idea_variation_act_623
                has_active_policy = idea_variation_act_79
                has_active_policy = idea_variation_act_90
                has_active_policy = idea_variation_act_220
                has_active_policy = idea_variation_act_256
                }
            }
        }
        
        ae_impact = -0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    ########################################################
    ###### Mercenary Army / S�ldnerheer
    ########################################################
    
    idea_variation_act_91 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = soldnerheer0 
            has_idea_group = expansion_ideas
                
        }
        allow = {
            full_idea_group = soldnerheer0 
            full_idea_group = expansion_ideas
        }
        
        merc_maintenance_modifier = -0.25
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_92 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = soldnerheer0 
            has_idea_group = economic_ideas
            
        }
        allow = {
            full_idea_group = soldnerheer0 
            full_idea_group = economic_ideas
            NOT = {
            calc_true_if = {
                amount = 2
                has_active_policy = idea_variation_act_23
                has_active_policy = idea_variation_act_153
                has_active_policy = idea_variation_act_169
                has_active_policy = idea_variation_act_238
                has_active_policy = idea_variation_act_302
                has_active_policy = idea_variation_act_340
                has_active_policy = idea_variation_act_92
                has_active_policy = idea_variation_act_566
                has_active_policy = idea_variation_act_532
                has_active_policy = idea_variation_act_528
                has_active_policy = idea_variation_act_514
                has_active_policy = idea_variation_act_503
                }
            }
        }
        
        global_tax_modifier = 0.1
        development_cost = -0.1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0.75
                NOT = { tax_income_percentage = 0.25 }
            }			
            modifier = {
                factor = 1.5
                tax_income_percentage = 0.45
            }
            modifier = {
                factor = 1.5
                tax_income_percentage = 0.7
            }
        }
    }
    
    idea_variation_act_93 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = soldnerheer0 
            has_idea_group = innovativeness_ideas
                
        }
        allow = {
            full_idea_group = soldnerheer0 
            full_idea_group = innovativeness_ideas
        }
        
        free_leader_pool = 2
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_94 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = soldnerheer0 
            has_idea_group = humanist_ideas 
                
        }
        allow = {
            full_idea_group = soldnerheer0 
            full_idea_group = humanist_ideas 
        }
        
        years_of_nationalism = -5
        prestige_from_land = 1.0
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_95 = {
    
        monarch_power = DIP			# Besonderer Fall
    
        potential = {
            has_idea_group = soldnerheer0 
            has_idea_group = trade_ideas 
                
        }
        allow = {
            full_idea_group = soldnerheer0 
            full_idea_group = trade_ideas 
        }
        
        mercenary_discipline = 0.035
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_96 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = soldnerheer0 
            has_idea_group = dynasty0
                
        }
        allow = {
            full_idea_group = soldnerheer0 
            full_idea_group = dynasty0
            
            NOT = {
            calc_true_if = {
                amount = 4
                has_active_policy = idea_variation_act_96
                has_active_policy = idea_variation_act_336
                has_active_policy = idea_variation_act_418
                has_active_policy = idea_variation_act_438
                has_active_policy = idea_variation_act_445
                has_active_policy = idea_variation_act_473
                }
            }
        }
        
        shock_damage_received = -0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    ########################################################
    ###### Conscription / Wehrpflicht
    ########################################################
    
    idea_variation_act_97 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = wehrpflicht0
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
                
        }
        allow = {
            full_idea_group = wehrpflicht0
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
        
        }
        
        infantry_power = 0.1
        land_morale = 0.05
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_98 = {
    
        monarch_power = DIP		# Marine
    
        potential = {
            has_idea_group = wehrpflicht0
            has_idea_group = flottenbasis0
            
        }
        allow = {
            full_idea_group = wehrpflicht0
            full_idea_group = flottenbasis0
        }
        
        naval_morale = 0.15
        navy_tradition = 1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_99 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = wehrpflicht0
            has_idea_group = kolonialimperium0
            
        }
        allow = {
            full_idea_group = wehrpflicht0
            full_idea_group = kolonialimperium0
        }
        
        global_manpower_modifier = 0.25
        
        ai_will_do = {
            factor = 1
        }
    }
    
    ########################################################
    ###### Weapon Quality / Waffenqualit�t
    ########################################################
    
    idea_variation_act_100 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = waffenqualitat0
            has_idea_group = economic_ideas
                
        }
        allow = {
            full_idea_group = waffenqualitat0
            full_idea_group = economic_ideas
        }
        
        infantry_power = 0.075
        cavalry_power = 0.075
        artillery_power = 0.075
        
        ai_will_do = {
            factor = 10
        }
    }
    
    idea_variation_act_101 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = propaganda0
            has_idea_group = festung0
                
        }
        allow = {
            full_idea_group = propaganda0
            full_idea_group = festung0
        }
        
        defensiveness = 0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_102 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = waffenqualitat0
            has_idea_group = spy_ideas
                
        }
        allow = {
            full_idea_group = waffenqualitat0
            full_idea_group = spy_ideas
        }
        
        siege_ability = 0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_103 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = waffenqualitat0
            has_idea_group = trade_ideas 
                
        }
        allow = {
            full_idea_group = waffenqualitat0
            full_idea_group = trade_ideas 
        }
        
        land_morale = 0.07
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    ########################################################
    ###### War Production / Kriegsproduktion
    ########################################################
    
    idea_variation_act_104 = {
    
        monarch_power = ADM				# Besonderer Fall
    
        potential = {
            has_idea_group = kriegsproduktion0
            has_idea_group = economic_ideas
                
        }
        allow = {
            full_idea_group = kriegsproduktion0
            full_idea_group = economic_ideas
        }
        
        artillery_power = 0.1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }	
        }
    }
    
    idea_variation_act_105 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = kriegsproduktion0
            has_idea_group = administrative_ideas
                
        }
        allow = {
            full_idea_group = kriegsproduktion0
            full_idea_group = administrative_ideas
            
            NOT = {
            calc_true_if = {
                amount = 3
                has_active_policy = idea_variation_act_105
                has_active_policy = idea_variation_act_144
                has_active_policy = idea_variation_act_214
                has_active_policy = idea_variation_act_229
                has_active_policy = idea_variation_act_248
                has_active_policy = idea_variation_act_334
                has_active_policy = idea_variation_act_397
                has_active_policy = idea_variation_act_513
                }
            }
        }
        
        inflation_reduction = 0.05
        interest = -1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_106 = {
    
        monarch_power = DIP 		# Besonderer Fall
    
        potential = {
            has_idea_group = kriegsproduktion0
            has_idea_group = trade_ideas 
            
        }
        allow = {
            full_idea_group = kriegsproduktion0
            full_idea_group = trade_ideas 
        }
        
        fire_damage = 0.075
        
        ai_will_do = {
            factor = 1
        }
    }
    
    ########################################################
    ###### Fortress / Festung
    ########################################################
    
    idea_variation_act_107 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = festung0
            OR = {
            has_idea_group = religious_ideas   
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = orthodox0
            has_idea_group = islam0
            has_idea_group = cathar0
            has_idea_group = shinto0
            has_idea_group = norse0
            has_idea_group = budda0
            has_idea_group = confuci0 
            has_idea_group = hindu0
            has_idea_group = tengri0
            has_idea_group = coptic0
            has_idea_group = helle0
            has_idea_group = slav0
            has_idea_group = jew0
            has_idea_group = suomi0
            has_idea_group = romuva0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = mane0
            has_idea_group = ancli0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = nahu0
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
            }
                
        }
        allow = {
            full_idea_group = festung0
            OR = {
                full_idea_group = religious_ideas 
                full_idea_group = katholisch0
                full_idea_group = protestant0
                full_idea_group = reformiert0
                full_idea_group = orthodox0
                full_idea_group = islam0
                full_idea_group = cathar0
                full_idea_group = shinto0
                full_idea_group = norse0
                full_idea_group = budda0
                full_idea_group = confuci0 
                full_idea_group = hindu0
                full_idea_group = tengri0
                full_idea_group = coptic0
                full_idea_group = helle0
                full_idea_group = slav0
                full_idea_group = jew0
                full_idea_group = suomi0
                full_idea_group = romuva0
                full_idea_group = animist0
                full_idea_group = feti0
                full_idea_group = zoro0
                full_idea_group = mane0
                full_idea_group = ancli0
                full_idea_group = mesoam0
                full_idea_group = inti0
                full_idea_group = tote0
                full_idea_group = nahu0
                full_idea_group = shia0
                full_idea_group = ibadi0
                full_idea_group = hussite0
            }	
        }
        
        defensiveness = 0.075
        siege_ability = 0.075
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_108 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = festung0
            has_idea_group = administrative_ideas
                
        }
        allow = {
            full_idea_group = festung0
            full_idea_group = administrative_ideas
            
            NOT = {
            calc_true_if = {
                amount = 5
                has_active_policy = idea_variation_act_108
                has_active_policy = idea_variation_act_114
                has_active_policy = idea_variation_act_132
                has_active_policy = idea_variation_act_409
                has_active_policy = idea_variation_act_419
                has_active_policy = idea_variation_act_450
                has_active_policy = idea_variation_act_470
                has_active_policy = idea_variation_act_488
                has_active_policy = idea_variation_act_497
                }
            }
        }
        
        fire_damage_received = -0.1	
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_109 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = festung0
            OR = {
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = monarchie0
            has_idea_group = horde0
            }
                
        }
        allow = {
            full_idea_group = festung0
            OR = {
            full_idea_group = republik0 
            full_idea_group = aristo0
            full_idea_group = monarchie0
            full_idea_group = horde0
            }
        }
        
        army_tradition = 1
        shock_damage_received = -0.075
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_110 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = festung0
            has_idea_group = gesellschaft0
                
        }
        allow = {
            full_idea_group = festung0
            full_idea_group = gesellschaft0
        }
        
        hostile_attrition = 2
        
        ai_will_do = {
            factor = 1
        }
    }
    
    
    #########################################################
    ######## Version 2.0 Politiken/Policies
    #########################################################
    
    
    idea_variation_act_111 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = kolonialimperium0
            has_idea_group = administrative_ideas
                
        }
        allow = {
            full_idea_group = kolonialimperium0
            full_idea_group = administrative_ideas
        }
        
        state_maintenance_modifier = -0.5
        years_of_nationalism = -5
        
        ai_will_do = {
            factor = 1
        }
    }
    
    
    idea_variation_act_112 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = kolonialimperium0
            OR = {
            has_idea_group = religious_ideas   
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = orthodox0
            has_idea_group = islam0
            has_idea_group = cathar0
            has_idea_group = shinto0
            has_idea_group = norse0
            has_idea_group = budda0
            has_idea_group = confuci0 
            has_idea_group = hindu0
            has_idea_group = tengri0
            has_idea_group = coptic0
            has_idea_group = helle0
            has_idea_group = slav0
            has_idea_group = jew0
            has_idea_group = suomi0
            has_idea_group = romuva0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = mane0
            has_idea_group = ancli0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = nahu0
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
            }
                
        }
        allow = {
            full_idea_group = kolonialimperium0
            OR = {
                full_idea_group = religious_ideas 
                full_idea_group = katholisch0
                full_idea_group = protestant0
                full_idea_group = reformiert0
                full_idea_group = orthodox0
                full_idea_group = islam0
                full_idea_group = cathar0
                full_idea_group = shinto0
                full_idea_group = norse0
                full_idea_group = budda0
                full_idea_group = confuci0 
                full_idea_group = hindu0
                full_idea_group = tengri0
                full_idea_group = coptic0
                full_idea_group = helle0
                full_idea_group = slav0
                full_idea_group = jew0
                full_idea_group = suomi0
                full_idea_group = romuva0
                full_idea_group = animist0
                full_idea_group = feti0
                full_idea_group = zoro0
                full_idea_group = mane0
                full_idea_group = ancli0
                full_idea_group = mesoam0
                full_idea_group = inti0
                full_idea_group = tote0
                full_idea_group = nahu0
                full_idea_group = shia0
                full_idea_group = ibadi0
                full_idea_group = hussite0
            }	
        }
        
        global_colonial_growth = 20
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { num_of_colonists = 1 }
            }
            modifier = {
                factor = 0.1
                NOT = { num_of_colonies = 1 }
            }
        }
    }
    
    
    idea_variation_act_113 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = kolonialimperium0
            has_idea_group = economic_ideas
                
        }
        allow = {
            full_idea_group = kolonialimperium0
            full_idea_group = economic_ideas
        }
        
        global_tariffs = 0.15
        trade_efficiency = 0.1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }	
        }
    }
    
    idea_variation_act_114 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = kolonialimperium0
            has_idea_group = defensive_ideas
                
        }
        allow = {
            full_idea_group = kolonialimperium0
            full_idea_group = defensive_ideas
            
            NOT = {
            calc_true_if = {
                amount = 5
                has_active_policy = idea_variation_act_108
                has_active_policy = idea_variation_act_114
                has_active_policy = idea_variation_act_132
                has_active_policy = idea_variation_act_409
                has_active_policy = idea_variation_act_419
                has_active_policy = idea_variation_act_450
                has_active_policy = idea_variation_act_470
                has_active_policy = idea_variation_act_488
                has_active_policy = idea_variation_act_497
                }
            }
        }
        
        fire_damage_received = -0.1	
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_115 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = kolonialimperium0
            has_idea_group = offensive_ideas
            
        }
        allow = {
            full_idea_group = kolonialimperium0
            full_idea_group = offensive_ideas
        }
        
        siege_ability = 0.1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_116 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = kolonialimperium0
            has_idea_group = quality_ideas
                
        }
        allow = {
            full_idea_group = kolonialimperium0
            full_idea_group = quality_ideas
        }
        
        colonist_placement_chance = 0.15
        global_colonial_growth = 10
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { num_of_colonists = 1 }
            }
            modifier = {
                factor = 0.1
                NOT = { num_of_colonies = 1 }
            }
        }
    }
    
    idea_variation_act_117 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = kolonialimperium0
            has_idea_group = quantity_ideas
                
        }
        allow = {
            full_idea_group = kolonialimperium0
            full_idea_group = quantity_ideas
        }
        
        colonists = 1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { num_of_colonists = 1 }
            }
            modifier = {
                factor = 0.1
                NOT = { num_of_colonies = 1 }
            }
        }
    }
    
    idea_variation_act_118 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = kolonialimperium0
            has_idea_group = entwicklung0
                
        }
        allow = {
            full_idea_group = kolonialimperium0
            full_idea_group = entwicklung0
        }
        
        colonist_placement_chance = 0.10			
        reduced_liberty_desire = 10
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_119 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = kolonialimperium0
            has_idea_group = diktatur0
                
        }
        allow = {
            full_idea_group = kolonialimperium0
            full_idea_group = diktatur0
        }
        
        global_colonial_growth = 15
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { num_of_colonists = 1 }
            }
            modifier = {
                factor = 0.1
                NOT = { num_of_colonies = 1 }
            }
        }
    }
    
    idea_variation_act_120 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = kolonialimperium0
            has_idea_group = justiz0
            
        }
        allow = {
            full_idea_group = kolonialimperium0
            full_idea_group = justiz0
        }
        
        global_unrest = -1
        global_autonomy = -0.05
        yearly_corruption = -0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_121 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = kolonialimperium0
            has_idea_group = generalstab0
            
        }
        allow = {
            full_idea_group = kolonialimperium0
            full_idea_group = generalstab0
        }
        
        free_leader_pool = 2
        
        ai_will_do = {
            factor = 1
        }
    }
    
    
    idea_variation_act_122 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = kolonialimperium0
            has_idea_group = stehendesheer0
                
        }
        allow = {
            full_idea_group = kolonialimperium0
            full_idea_group = stehendesheer0
        }
        
        land_forcelimit_modifier = 0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    
    idea_variation_act_123 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = kolonialimperium0
            has_idea_group = soldnerheer0 
            
        }
        allow = {
            full_idea_group = kolonialimperium0
            full_idea_group = soldnerheer0 
        }
        
        mercenary_manpower = 0.25
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_124 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = kolonialimperium0
            has_idea_group = waffenqualitat0
            
        }
        allow = {
            full_idea_group = kolonialimperium0
            full_idea_group = waffenqualitat0
        }
        
        reinforce_speed = 0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_125 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = kolonialimperium0
            has_idea_group = festung0
            
        }
        allow = {
            full_idea_group = kolonialimperium0
            full_idea_group = festung0
        }
        
        fort_maintenance_modifier = -0.25
        reduced_liberty_desire = 5
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_126 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = kolonialimperium0
            has_idea_group = kriegsproduktion0
            
        }
        allow = {
            full_idea_group = kolonialimperium0
            full_idea_group = kriegsproduktion0
        }
        
        infantry_power = 0.075
        cavalry_power = 0.075
        artillery_power = 0.075
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_127 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = flottenbasis0
            has_idea_group = administrative_ideas
                
        }
        allow = {
            full_idea_group = flottenbasis0
            full_idea_group = administrative_ideas
        }
        
        governing_capacity_modifier = 0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_128 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = flottenbasis0
            has_idea_group = humanist_ideas 
            
        }
        allow = {
            full_idea_group = flottenbasis0
            full_idea_group = humanist_ideas 
        }
        
        num_accepted_cultures = 1
        naval_forcelimit_modifier = 0.15
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_129 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = flottenbasis0
            has_idea_group = innovativeness_ideas
            
        }
        allow = {
            full_idea_group = flottenbasis0
            full_idea_group = innovativeness_ideas
        }
        
        state_maintenance_modifier = -0.75
    
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_130 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = flottenbasis0
            OR = {
            has_idea_group = religious_ideas   
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = orthodox0
            has_idea_group = islam0
            has_idea_group = cathar0
            has_idea_group = shinto0
            has_idea_group = norse0
            has_idea_group = budda0
            has_idea_group = confuci0 
            has_idea_group = hindu0
            has_idea_group = tengri0
            has_idea_group = coptic0
            has_idea_group = helle0
            has_idea_group = slav0
            has_idea_group = jew0
            has_idea_group = suomi0
            has_idea_group = romuva0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = mane0
            has_idea_group = ancli0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = nahu0
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
            }
            
        }
        allow = {
            full_idea_group = flottenbasis0
            OR = {
                full_idea_group = religious_ideas 
                full_idea_group = katholisch0
                full_idea_group = protestant0
                full_idea_group = reformiert0
                full_idea_group = orthodox0
                full_idea_group = islam0
                full_idea_group = cathar0
                full_idea_group = shinto0
                full_idea_group = norse0
                full_idea_group = budda0
                full_idea_group = confuci0 
                full_idea_group = hindu0
                full_idea_group = tengri0
                full_idea_group = coptic0
                full_idea_group = helle0
                full_idea_group = slav0
                full_idea_group = jew0
                full_idea_group = suomi0
                full_idea_group = romuva0
                full_idea_group = animist0
                full_idea_group = feti0
                full_idea_group = zoro0
                full_idea_group = mane0
                full_idea_group = ancli0
                full_idea_group = mesoam0
                full_idea_group = inti0
                full_idea_group = tote0
                full_idea_group = nahu0
                full_idea_group = shia0
                full_idea_group = ibadi0
                full_idea_group = hussite0
            }	
        }
        
        tolerance_heathen = 1
        tolerance_heretic = 1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_131 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = flottenbasis0
            OR = {
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = monarchie0
            has_idea_group = horde0
            }
                
        }
        allow = {
            full_idea_group = flottenbasis0
            OR = {
            full_idea_group = republik0 
            full_idea_group = aristo0
            full_idea_group = monarchie0
            full_idea_group = horde0
            }	
        }
        
        legitimacy = 2
        republican_tradition = 1
        devotion = 1
        horde_unity = 1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    
    idea_variation_act_132 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = flottenbasis0
            has_idea_group = defensive_ideas
                
        }
        allow = {
            full_idea_group = flottenbasis0
            full_idea_group = defensive_ideas
            
            NOT = {
            calc_true_if = {
                amount = 5
                has_active_policy = idea_variation_act_108
                has_active_policy = idea_variation_act_114
                has_active_policy = idea_variation_act_132
                has_active_policy = idea_variation_act_409
                has_active_policy = idea_variation_act_419
                has_active_policy = idea_variation_act_450
                has_active_policy = idea_variation_act_470
                has_active_policy = idea_variation_act_488
                has_active_policy = idea_variation_act_497
                }
            }
        }
        
        fire_damage_received = -0.1	
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    
    idea_variation_act_133 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = flottenbasis0
            has_idea_group = quality_ideas
            
        }
        allow = {
            full_idea_group = flottenbasis0
            full_idea_group = quality_ideas
        }
        
        
        naval_maintenance_modifier = -0.25
        
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_134 = {
    
        monarch_power = DIP				# Marine
    
        potential = {
            has_idea_group = flottenbasis0
            has_idea_group = offensive_ideas
            
        }
        allow = {
            full_idea_group = flottenbasis0
            full_idea_group = offensive_ideas
        }
        
        naval_morale = 0.15
        range = 0.2
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_135 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = flottenbasis0
            has_idea_group = quantity_ideas
    
            
        }
        allow = {
            full_idea_group = flottenbasis0
            full_idea_group = quantity_ideas
    
        }
        
        range = 0.5
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_136 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = flottenbasis0
            has_idea_group = justiz0
                
        }
        allow = {
            full_idea_group = flottenbasis0
            full_idea_group = justiz0
        }
        
        global_autonomy = -0.1
        global_unrest = -1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_137 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = flottenbasis0
            has_idea_group = gesundheit0
                
        }
        allow = {
            full_idea_group = flottenbasis0
            full_idea_group = gesundheit0
        }
        
        navy_tradition = 1
        range = 0.25
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_138 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = flottenbasis0
            has_idea_group = entwicklung0
                
        }
        allow = {
            full_idea_group = flottenbasis0
            full_idea_group = entwicklung0
            
            NOT = {
            calc_true_if = {
                amount = 3
                has_active_policy = idea_variation_act_588
                has_active_policy = idea_variation_act_591
                has_active_policy = idea_variation_act_21
                has_active_policy = idea_variation_act_138
                has_active_policy = idea_variation_act_425
                has_active_policy = idea_variation_act_502
                has_active_policy = idea_variation_act_551
                has_active_policy = idea_variation_act_529
                has_active_policy = idea_variation_act_516
    
                }
            }
        }
        
    
        build_cost = -0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_139 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = flottenbasis0
            has_idea_group = diktatur0
                
        }
        allow = {
            full_idea_group = flottenbasis0
            full_idea_group = diktatur0
        }
        
        global_sailors_modifier = 0.25
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_140 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = flottenbasis0
            has_idea_group = stehendesheer0
                
        }
        allow = {
            full_idea_group = flottenbasis0
            full_idea_group = stehendesheer0
        }
        
        global_manpower_modifier = 0.125
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_141 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = flottenbasis0
            has_idea_group = soldnerheer0 
                
        }
        allow = {
            full_idea_group = flottenbasis0
            full_idea_group = soldnerheer0 
        }
        
        mercenary_cost = -0.15
        mercenary_manpower = 0.15
        
        
        ai_will_do = {
            factor = 1
        }
    }
    
    
    idea_variation_act_142 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = flottenbasis0
            has_idea_group = waffenqualitat0
                
        }
        allow = {
            full_idea_group = flottenbasis0
            full_idea_group = waffenqualitat0
        }
        
        discipline = 0.03
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    
    idea_variation_act_143 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = flottenbasis0
            has_idea_group = kriegsproduktion0
            
        }
        allow = {
            full_idea_group = flottenbasis0
            full_idea_group = kriegsproduktion0
        }
        
        land_morale = 0.05
        infantry_power = 0.1
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_144 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = propaganda0
            has_idea_group = administrative_ideas
            
        }
        allow = {
            full_idea_group = propaganda0
            full_idea_group = administrative_ideas
            
            NOT = {
            calc_true_if = {
                amount = 3
                has_active_policy = idea_variation_act_105
                has_active_policy = idea_variation_act_144
                has_active_policy = idea_variation_act_214
                has_active_policy = idea_variation_act_229
                has_active_policy = idea_variation_act_248
                has_active_policy = idea_variation_act_334
                has_active_policy = idea_variation_act_397
                has_active_policy = idea_variation_act_513
                }
            }
        }
        
        global_tax_modifier = 0.15
        interest = -1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_145 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = propaganda0
            has_idea_group = humanist_ideas 
                
        }
        allow = {
            full_idea_group = propaganda0
            full_idea_group = humanist_ideas 
        }
        
        num_accepted_cultures = 1
        culture_conversion_cost = -0.25
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_146 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = propaganda0
            has_idea_group = expansion_ideas
                
        }
        allow = {
            full_idea_group = propaganda0
            full_idea_group = expansion_ideas
        }
        
        core_creation = -0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_147 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = propaganda0
            OR = {
            has_idea_group = religious_ideas   
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = orthodox0
            has_idea_group = islam0
            has_idea_group = cathar0
            has_idea_group = shinto0
            has_idea_group = norse0
            has_idea_group = budda0
            has_idea_group = confuci0 
            has_idea_group = hindu0
            has_idea_group = tengri0
            has_idea_group = coptic0
            has_idea_group = helle0
            has_idea_group = slav0
            has_idea_group = jew0
            has_idea_group = suomi0
            has_idea_group = romuva0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = mane0
            has_idea_group = ancli0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = nahu0
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
            }
                
        }
        allow = {
            full_idea_group = propaganda0
            OR = {
                full_idea_group = religious_ideas 
                full_idea_group = katholisch0
                full_idea_group = protestant0
                full_idea_group = reformiert0
                full_idea_group = orthodox0
                full_idea_group = islam0
                full_idea_group = cathar0
                full_idea_group = shinto0
                full_idea_group = norse0
                full_idea_group = budda0
                full_idea_group = confuci0 
                full_idea_group = hindu0
                full_idea_group = tengri0
                full_idea_group = coptic0
                full_idea_group = helle0
                full_idea_group = slav0
                full_idea_group = jew0
                full_idea_group = suomi0
                full_idea_group = romuva0
                full_idea_group = animist0
                full_idea_group = feti0
                full_idea_group = zoro0
                full_idea_group = mane0
                full_idea_group = ancli0
                full_idea_group = mesoam0
                full_idea_group = inti0
                full_idea_group = tote0
                full_idea_group = nahu0
                full_idea_group = shia0
                full_idea_group = ibadi0
                full_idea_group = hussite0
            }	
        }
        
        tolerance_own = 3
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_148 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = propaganda0
            has_idea_group = republik0
                
        }
        allow = {
            full_idea_group = propaganda0
            full_idea_group = republik0
        }
        
        republican_tradition = 1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_149 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = propaganda0
            has_idea_group = defensive_ideas
                
        }
        allow = {
            full_idea_group = propaganda0
            full_idea_group = defensive_ideas
        }
        
        defensiveness = 0.075
        war_exhaustion = -0.02
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_150 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_discovery
            has_idea_group = propaganda0
            has_idea_group = quantity_ideas
                
        }
        allow = {
            current_age = age_of_discovery
            full_idea_group = propaganda0
            full_idea_group = quantity_ideas
        }
        
        naval_forcelimit = 10
        land_forcelimit = 5
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_150_1 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_reformation
            has_idea_group = propaganda0
            has_idea_group = quantity_ideas
                
        }
        allow = {
            current_age = age_of_reformation
            full_idea_group = propaganda0
            full_idea_group = quantity_ideas
        }
        
        naval_forcelimit = 20
        land_forcelimit = 10
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_150_2 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_absolutism
            has_idea_group = propaganda0
            has_idea_group = quantity_ideas
                
        }
        allow = {
            current_age = age_of_absolutism
            full_idea_group = propaganda0
            full_idea_group = quantity_ideas
        }
        
        naval_forcelimit = 30
        land_forcelimit = 15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_150_3 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_revolutions
            has_idea_group = propaganda0
            has_idea_group = quantity_ideas
                
        }
        allow = {
            current_age = age_of_revolutions
            full_idea_group = propaganda0
            full_idea_group = quantity_ideas
        }
        
        naval_forcelimit = 40
        land_forcelimit = 20
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_151 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = propaganda0
            has_idea_group = quality_ideas
            
        }
        allow = {
            full_idea_group = propaganda0
            full_idea_group = quality_ideas
        }
        
        land_morale = 0.05
        army_tradition_decay = -0.01
        navy_tradition_decay = -0.01
        
        ai_will_do = {
            factor = 1
        }
    }
    
    
    idea_variation_act_152 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = propaganda0
            has_idea_group = justiz0
                
        }
        allow = {
            full_idea_group = propaganda0
            full_idea_group = justiz0
            
            NOT = {
            calc_true_if = {
                amount = 2
                has_active_policy = idea_variation_act_611
                has_active_policy = idea_variation_act_617
                has_active_policy = idea_variation_act_620
                has_active_policy = idea_variation_act_50
                has_active_policy = idea_variation_act_152
                has_active_policy = idea_variation_act_215
                has_active_policy = idea_variation_act_491
                has_active_policy = idea_variation_act_500
    
                }
            }
        }
        
        improve_relation_modifier = 0.2
        
        ai_will_do = {
            factor = 1
        }
    }
    
    
    idea_variation_act_153 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = propaganda0
            has_idea_group = entwicklung0
            
        }
        allow = {
            full_idea_group = propaganda0
            full_idea_group = entwicklung0
            
            NOT = {
            calc_true_if = {
                amount = 2
                has_active_policy = idea_variation_act_23
                has_active_policy = idea_variation_act_153
                has_active_policy = idea_variation_act_169
                has_active_policy = idea_variation_act_238
                has_active_policy = idea_variation_act_302
                has_active_policy = idea_variation_act_340
                has_active_policy = idea_variation_act_92
                has_active_policy = idea_variation_act_566
                has_active_policy = idea_variation_act_532
                has_active_policy = idea_variation_act_528
                has_active_policy = idea_variation_act_514
                has_active_policy = idea_variation_act_503
                }
            }
        }
        
        development_cost = -0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_154 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = propaganda0
            has_idea_group = staatsverwaltung0
                
        }
        allow = {
            full_idea_group = propaganda0
            full_idea_group = staatsverwaltung0
        }
        
        global_institution_spread = 0.1
        state_maintenance_modifier = -0.5
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_155 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = propaganda0
            has_idea_group = gesundheit0
                
        }
        allow = {
            full_idea_group = propaganda0
            full_idea_group = gesundheit0
        }
        
        global_institution_spread = 0.2
        embracement_cost = -0.25
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_156 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = propaganda0
            has_idea_group = stehendesheer0
                
        }
        allow = {
            full_idea_group = propaganda0
            full_idea_group = stehendesheer0
        }
        
        discipline = 0.03
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_157 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = economic_ideas
            has_idea_group = nationalismus0
                
        }
        allow = {
            full_idea_group = economic_ideas
            full_idea_group = nationalismus0
            
        }
        
        global_tax_modifier = 0.3
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0.75
                NOT = { tax_income_percentage = 0.25 }
            }			
            modifier = {
                factor = 1.5
                tax_income_percentage = 0.45
            }
            modifier = {
                factor = 1.5
                tax_income_percentage = 0.7
            }
        }
    }
    
    idea_variation_act_15 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = economic_ideas
            has_idea_group = propaganda0	
            
        }
        allow = {
        
            full_idea_group = economic_ideas
            full_idea_group = propaganda0 
            
        }
        
        global_tax_modifier = 0.3
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0.75
                NOT = { tax_income_percentage = 0.25 }
            }			
            modifier = {
                factor = 1.5
                tax_income_percentage = 0.45
            }
            modifier = {
                factor = 1.5
                tax_income_percentage = 0.7
            }
        }
    }
    
    idea_variation_act_158 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = propaganda0
            has_idea_group = soldnerheer0 
                
        }
        allow = {
            full_idea_group = propaganda0
            full_idea_group = soldnerheer0 
        }
        
        mercenary_discipline = 0.05	
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_159 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = propaganda0
            has_idea_group = waffenqualitat0
            
        }
        allow = {
            full_idea_group = propaganda0
            full_idea_group = waffenqualitat0
        }
        
        merchants = 1
        global_trade_power = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_160 = {
    
        monarch_power = MIL 		# Besonderer Fall
    
        potential = {
            has_idea_group = propaganda0
            has_idea_group = kriegsproduktion0
            
        }
        allow = {
            full_idea_group = propaganda0
            full_idea_group = kriegsproduktion0
        }
        
        global_trade_goods_size_modifier = 0.15
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }	
        }
    }
    
    idea_variation_act_161 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = nationalismus0
            has_idea_group = expansion_ideas
                
        }
        allow = {
            full_idea_group = nationalismus0
            full_idea_group = expansion_ideas
        }
        
        years_of_nationalism = -5
        
        ai_will_do = {
            factor = 1
        }
    }
    
    
    idea_variation_act_162 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = nationalismus0
            has_idea_group = humanist_ideas 
            
        }
        allow = {
            full_idea_group = nationalismus0
            full_idea_group = humanist_ideas 
        }
        
        enemy_core_creation = 0.5
        
        ai_will_do = {
            factor = 1
        }
    }
    
    
    idea_variation_act_163 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = nationalismus0
            has_idea_group = innovativeness_ideas
            
        }
        allow = {
            full_idea_group = nationalismus0
            full_idea_group = innovativeness_ideas
        }
        
        same_culture_advisor_cost = -0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    
    
    idea_variation_act_164 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = nationalismus0
            OR = {
            has_idea_group = aristo0
            has_idea_group = monarchie0
            has_idea_group = horde0
            }
            
        }
        allow = {
            full_idea_group = nationalismus0
            OR = {
            full_idea_group = aristo0
            full_idea_group = monarchie0
            full_idea_group = horde0
            }
        }
        
        global_autonomy = -0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_165 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = nationalismus0
            has_idea_group = offensive_ideas
                
        }
        allow = {
            full_idea_group = nationalismus0
            full_idea_group = offensive_ideas
        }
        
        land_morale = 0.07
    
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_166 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = nationalismus0
            has_idea_group = quality_ideas
            
        }
        allow = {
            full_idea_group = nationalismus0
            full_idea_group = quality_ideas
        }
        
        discipline = 0.03
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_167 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_discovery
            has_idea_group = nationalismus0
            has_idea_group = quantity_ideas
                
        }
        allow = {
            current_age = age_of_discovery
            full_idea_group = nationalismus0
            full_idea_group = quantity_ideas
        }
        
        global_manpower = 5
        global_sailors = 1500
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_167_1 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_reformation
            has_idea_group = nationalismus0
            has_idea_group = quantity_ideas
                
        }
        allow = {	
            current_age = age_of_reformation
            full_idea_group = nationalismus0
            full_idea_group = quantity_ideas
        }
        
        global_manpower = 10
        global_sailors = 3000
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_167_2 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_absolutism
            has_idea_group = nationalismus0
            has_idea_group = quantity_ideas
                
        }
        allow = {	
            current_age = age_of_absolutism
            full_idea_group = nationalismus0
            full_idea_group = quantity_ideas
        }
        
        global_manpower = 15
        global_sailors = 4500
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_167_3 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_revolutions
            has_idea_group = nationalismus0
            has_idea_group = quantity_ideas
                
        }
        allow = {	
            current_age = age_of_revolutions
            full_idea_group = nationalismus0
            full_idea_group = quantity_ideas
        }
        
        global_manpower = 20
        global_sailors = 6000
        
        ai_will_do = {
            factor = 1
        }
    }
    
    
    
    idea_variation_act_168 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = nationalismus0
            has_idea_group = justiz0
                
        }
        allow = {
            full_idea_group = nationalismus0
            full_idea_group = justiz0
        }
        
        governing_capacity_modifier = 0.25
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0.75
                NOT = { tax_income_percentage = 0.25 }
            }			
            modifier = {
                factor = 1.5
                tax_income_percentage = 0.45
            }
            modifier = {
                factor = 1.5
                tax_income_percentage = 0.7
            }
        }
    }
    
    idea_variation_act_169 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = nationalismus0
            has_idea_group = entwicklung0
                
        }
        allow = {
            full_idea_group = nationalismus0
            full_idea_group = entwicklung0
            
            NOT = {
            calc_true_if = {
                amount = 2
                has_active_policy = idea_variation_act_23
                has_active_policy = idea_variation_act_153
                has_active_policy = idea_variation_act_169
                has_active_policy = idea_variation_act_238
                has_active_policy = idea_variation_act_302
                has_active_policy = idea_variation_act_340
                has_active_policy = idea_variation_act_92
                has_active_policy = idea_variation_act_566
                has_active_policy = idea_variation_act_532
                has_active_policy = idea_variation_act_528
                has_active_policy = idea_variation_act_514
                has_active_policy = idea_variation_act_503
                }
            }
            
        }
        
        development_cost = -0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_170 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = nationalismus0
            has_idea_group = gesundheit0
            
        }
        allow = {
            full_idea_group = nationalismus0
            full_idea_group = gesundheit0
        }
        
        global_tax_modifier = 0.15
        production_efficiency = 0.15
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0.75
                NOT = { tax_income_percentage = 0.25 }
            }			
            modifier = {
                factor = 1.5
                tax_income_percentage = 0.45
            }
            modifier = {
                factor = 1.5
                tax_income_percentage = 0.7
            }
        }
    }
    
    idea_variation_act_171 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = nationalismus0
            has_idea_group = soldnerheer0 
                
        }
        allow = {
            full_idea_group = nationalismus0
            full_idea_group = soldnerheer0 
        }
        
        hostile_attrition = 2
        
        ai_will_do = {
            factor = 1
        }
    }
    
    
    idea_variation_act_172 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = nationalismus0
            has_idea_group = waffenqualitat0
                
        }
        allow = {
            full_idea_group = nationalismus0
            full_idea_group = waffenqualitat0
        }
        
        
        land_morale = 0.07
        
        ai_will_do = {
            factor = 1
        }
    }
    
    
    idea_variation_act_173 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = nationalismus0
            OR = {
            has_idea_group = religious_ideas   
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = orthodox0
            has_idea_group = islam0
            has_idea_group = cathar0
            has_idea_group = shinto0
            has_idea_group = norse0
            has_idea_group = budda0
            has_idea_group = confuci0 
            has_idea_group = hindu0
            has_idea_group = tengri0
            has_idea_group = coptic0
            has_idea_group = helle0
            has_idea_group = slav0
            has_idea_group = jew0
            has_idea_group = suomi0
            has_idea_group = romuva0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = mane0
            has_idea_group = ancli0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = nahu0
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
            }
                
        }
        allow = {
            full_idea_group = nationalismus0
            OR = {
                full_idea_group = religious_ideas 
                full_idea_group = katholisch0
                full_idea_group = protestant0
                full_idea_group = reformiert0
                full_idea_group = orthodox0
                full_idea_group = islam0
                full_idea_group = cathar0
                full_idea_group = shinto0
                full_idea_group = norse0
                full_idea_group = budda0
                full_idea_group = confuci0 
                full_idea_group = hindu0
                full_idea_group = tengri0
                full_idea_group = coptic0
                full_idea_group = helle0
                full_idea_group = slav0
                full_idea_group = jew0
                full_idea_group = suomi0
                full_idea_group = romuva0
                full_idea_group = animist0
                full_idea_group = feti0
                full_idea_group = zoro0
                full_idea_group = mane0
                full_idea_group = ancli0
                full_idea_group = mesoam0
                full_idea_group = inti0
                full_idea_group = tote0
                full_idea_group = nahu0
                full_idea_group = shia0
                full_idea_group = ibadi0
                full_idea_group = hussite0
            }	
        }
        
        missionaries = 1
        religious_unity = 0.25
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                religious_unity = 1
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.6 }
            }			
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.4 }
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.2 }
            }			
        }
    }
    
    idea_variation_act_174 = {
    
        monarch_power = ADM
    
        potential = {
                has_idea_group = gesellschaft0
                has_idea_group = staatsverwaltung0
                    
        }
        allow = {
            full_idea_group = gesellschaft0
            full_idea_group = staatsverwaltung0 
            
        }
        
        state_maintenance_modifier = -0.75
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_287 = {
    
        monarch_power = ADM
    
        potential = {
                has_idea_group = gesellschaft0
                has_idea_group = administrative_ideas
                
        }
        allow = {
            full_idea_group = gesellschaft0
            full_idea_group = administrative_ideas
            
        }
        
        state_maintenance_modifier = -0.75
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_175 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = gesellschaft0
            has_idea_group = economic_ideas
                
        }
        allow = {
            full_idea_group = gesellschaft0
            full_idea_group = economic_ideas
        }
        
        global_tax_modifier = 0.3
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0.75
                NOT = { tax_income_percentage = 0.25 }
            }			
            modifier = {
                factor = 1.5
                tax_income_percentage = 0.45
            }
            modifier = {
                factor = 1.5
                tax_income_percentage = 0.7
            }
        }
    }
    
    idea_variation_act_176 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = gesellschaft0
            has_idea_group = expansion_ideas
                
        }
        allow = {
            full_idea_group = gesellschaft0
            full_idea_group = expansion_ideas
        }
        
        religious_unity = 0.2
        tolerance_own = 2
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                religious_unity = 1
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.6 }
            }			
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.4 }
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.2 }
            }			
        }
    }
    
    idea_variation_act_177 = {
    
        monarch_power = DIP		# Besonderer Fall
    
        potential = {
            has_idea_group = gesellschaft0
            has_idea_group = humanist_ideas 
            
        }
        allow = {
            full_idea_group = gesellschaft0
            full_idea_group = humanist_ideas 
        }
        
        tolerance_heathen = 1
        tolerance_heretic = 1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_178 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = gesellschaft0
            has_idea_group = innovativeness_ideas
                
        }
        allow = {
            full_idea_group = gesellschaft0
            full_idea_group = innovativeness_ideas
        }
        
        global_institution_spread = 0.25
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_179 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = gesellschaft0
            has_idea_group = defensive_ideas
            
        }
        allow = {
            full_idea_group = gesellschaft0
            full_idea_group = defensive_ideas
        }
        
        defensiveness = 0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_180 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = gesellschaft0
            has_idea_group = offensive_ideas
                
        }
        allow = {
            full_idea_group = gesellschaft0
            full_idea_group = offensive_ideas
        }
        
        embracement_cost = -0.5
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_181 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = gesellschaft0
            has_idea_group = quality_ideas
                
        }
        allow = {
            full_idea_group = gesellschaft0
            full_idea_group = quality_ideas
        }
        
        artillery_power = 0.1
        cavalry_power = 0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    
    idea_variation_act_182 = {
    
        monarch_power = ADM
    
        potential = {
            current_age = age_of_discovery
            has_idea_group = gesellschaft0
            has_idea_group = quantity_ideas
                
        }
        allow = {
            current_age = age_of_discovery
            full_idea_group = gesellschaft0
            full_idea_group = quantity_ideas
        }
        
        land_forcelimit = 5
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_182_1 = {
    
        monarch_power = ADM
    
        potential = {
            current_age = age_of_reformation
            has_idea_group = gesellschaft0
            has_idea_group = quantity_ideas
                
        }
        allow = {
            current_age = age_of_reformation
            full_idea_group = gesellschaft0
            full_idea_group = quantity_ideas
        }
        
        land_forcelimit = 10
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_182_2 = {
    
        monarch_power = ADM
    
        potential = {
            current_age = age_of_absolutism
            has_idea_group = gesellschaft0
            has_idea_group = quantity_ideas
                
        }
        allow = {
            current_age = age_of_absolutism
            full_idea_group = gesellschaft0
            full_idea_group = quantity_ideas
        }
        
        land_forcelimit = 15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_182_3 = {
    
        monarch_power = ADM
    
        potential = {
            current_age = age_of_revolutions
            has_idea_group = gesellschaft0
            has_idea_group = quantity_ideas
                
        }
        allow = {
            current_age = age_of_revolutions
            full_idea_group = gesellschaft0
            full_idea_group = quantity_ideas
        }
        
        land_forcelimit = 20
        
        ai_will_do = {
            factor = 1
        }
    }
    
    
    idea_variation_act_183 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = gesellschaft0
            has_idea_group = entwicklung0
                
        }
        allow = {
            full_idea_group = gesellschaft0
            full_idea_group = entwicklung0
        }
        
        global_tariffs = 0.25
        
        ai_will_do = {
            factor = 1
                    
        }
    }
    
    idea_variation_act_184 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = gesellschaft0
            has_idea_group = kriegsproduktion0
            
        }
        allow = {
            full_idea_group = gesellschaft0
            full_idea_group = kriegsproduktion0
        }
        
        global_trade_goods_size_modifier = 0.05
        production_efficiency = 0.15
        
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_185 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = gesellschaft0
            has_idea_group = soldnerheer0 
            
        }
        allow = {
            full_idea_group = gesellschaft0
            full_idea_group = soldnerheer0 
        }
        
        discipline = 0.03
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_186 = {
    
        monarch_power = DIP	
    
        potential = {
            has_idea_group = assimilation0
            has_idea_group = administrative_ideas
            
        }
        allow = {
            full_idea_group = assimilation0
            full_idea_group = administrative_ideas
        }
        
        native_assimilation = 0.5
        diplomatic_annexation_cost = -0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_187 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = assimilation0
            has_idea_group = economic_ideas
            
        }
        allow = {
            full_idea_group = assimilation0
            full_idea_group = economic_ideas
        }
        
        advisor_cost = -0.15
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0.75
                NOT = { tax_income_percentage = 0.25 }
            }			
            modifier = {
                factor = 1.5
                tax_income_percentage = 0.45
            }
            modifier = {
                factor = 1.5
                tax_income_percentage = 0.7
            }
        }
    }
    
    idea_variation_act_188 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = assimilation0
            has_idea_group = expansion_ideas
                
        }
        allow = {
            full_idea_group = assimilation0
            full_idea_group = expansion_ideas
        }
        
        core_creation = -0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_189 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = assimilation0
            has_idea_group = innovativeness_ideas
            
        }
        allow = {
            full_idea_group = assimilation0
            full_idea_group = innovativeness_ideas
        }
        
        global_foreign_trade_power = 0.3		
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }	
        }
    }
    
    idea_variation_act_190 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = assimilation0
            OR = {
            has_idea_group = religious_ideas   
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = orthodox0
            has_idea_group = islam0
            has_idea_group = cathar0
            has_idea_group = shinto0
            has_idea_group = norse0
            has_idea_group = budda0
            has_idea_group = confuci0 
            has_idea_group = hindu0
            has_idea_group = tengri0
            has_idea_group = coptic0
            has_idea_group = helle0
            has_idea_group = slav0
            has_idea_group = jew0
            has_idea_group = suomi0
            has_idea_group = romuva0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = mane0
            has_idea_group = ancli0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = nahu0
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
            }
                
        }
        allow = {
            full_idea_group = assimilation0
            OR = {
                full_idea_group = religious_ideas 
                full_idea_group = katholisch0
                full_idea_group = protestant0
                full_idea_group = reformiert0
                full_idea_group = orthodox0
                full_idea_group = islam0
                full_idea_group = cathar0
                full_idea_group = shinto0
                full_idea_group = norse0
                full_idea_group = budda0
                full_idea_group = confuci0 
                full_idea_group = hindu0
                full_idea_group = tengri0
                full_idea_group = coptic0
                full_idea_group = helle0
                full_idea_group = slav0
                full_idea_group = jew0
                full_idea_group = suomi0
                full_idea_group = romuva0
                full_idea_group = animist0
                full_idea_group = feti0
                full_idea_group = zoro0
                full_idea_group = mane0
                full_idea_group = ancli0
                full_idea_group = mesoam0
                full_idea_group = inti0
                full_idea_group = tote0
                full_idea_group = nahu0
                full_idea_group = shia0
                full_idea_group = ibadi0
                full_idea_group = hussite0
            }	
        }
        
        global_missionary_strength = 0.03
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                religious_unity = 1
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.6 }
            }			
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.4 }
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.2 }
            }			
        }
    }
    
    idea_variation_act_191 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = assimilation0
            has_idea_group = defensive_ideas
            
        }
        allow = {
            full_idea_group = assimilation0
            full_idea_group = defensive_ideas
        }
        
        land_morale = 0.07
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    
    idea_variation_act_192 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = assimilation0
            has_idea_group = offensive_ideas
                
        }
        allow = {
            full_idea_group = assimilation0
            full_idea_group = offensive_ideas
        }
        
        global_missionary_strength = 0.02
        culture_conversion_cost = -0.1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                religious_unity = 1
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.6 }
            }			
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.4 }
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.2 }
            }			
        }
    }
    
    
    idea_variation_act_193 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = assimilation0
            has_idea_group = quantity_ideas
                
        }
        allow = {
            full_idea_group = assimilation0
            full_idea_group = quantity_ideas
        }
        
        cav_to_inf_ratio = 0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_194 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = assimilation0
            has_idea_group = entwicklung0
                
        }
        allow = {
            full_idea_group = assimilation0
            full_idea_group = entwicklung0
        }
        
        
        colonist_placement_chance = 0.25
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_195 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = assimilation0
            has_idea_group = generalstab0
            
        }
        allow = {
            full_idea_group = assimilation0
            full_idea_group = generalstab0
        }
        
        land_morale = 0.05
        free_leader_pool = 1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_196 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = assimilation0
            has_idea_group = stehendesheer0
            
        }
        allow = {
            full_idea_group = assimilation0
            full_idea_group = stehendesheer0
        }
        
        cavalry_power = 0.1
        cav_to_inf_ratio = 0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_197 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = assimilation0
            has_idea_group = soldnerheer0 
            
        }
        allow = {
            full_idea_group = assimilation0
            full_idea_group = soldnerheer0 
        }
        
        
        global_manpower_modifier = 0.25
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_198 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = assimilation0
            has_idea_group = waffenqualitat0
            
        }
        allow = {
            full_idea_group = assimilation0
            full_idea_group = waffenqualitat0
        }
        
        
        mil_tech_cost_modifier = -0.1
        trade_efficiency = 0.1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }	
        }
    }
    
    idea_variation_act_199 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = assimilation0
            has_idea_group = kriegsproduktion0
            
        }
        allow = {
            full_idea_group = assimilation0
            full_idea_group = kriegsproduktion0
        }
        
        global_trade_goods_size_modifier = 0.05
        production_efficiency = 0.15
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }	
        }
    }
    
    idea_variation_act_200 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = administrative_ideas
            
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
            
            
        }
        allow = {
            full_idea_group = administrative_ideas
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
            
        }
        
        governing_capacity_modifier = 0.25
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_201 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = economic_ideas
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
            
                
        }
        allow = {
            full_idea_group = economic_ideas
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
            
        }
        
        global_tax_modifier = 0.2
        inflation_action_cost = -0.25
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0.75
                NOT = { tax_income_percentage = 0.25 }
            }			
            modifier = {
                factor = 1.5
                tax_income_percentage = 0.45
            }
            modifier = {
                factor = 1.5
                tax_income_percentage = 0.7
            }
        }
    }
    
    idea_variation_act_202 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = innovativeness_ideas
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
            
                
        }
        allow = {
            full_idea_group = innovativeness_ideas
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
            
        }
        
        advisor_pool = 5
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_203 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = defensive_ideas
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
            
                
        }
        allow = {
            full_idea_group = defensive_ideas
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
            
        }
        
        defensiveness = 0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_204 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = offensive_ideas
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
            
            
        }
        allow = {
            full_idea_group = offensive_ideas
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
            
            
        }
        
        discipline = 0.03
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_205 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = quality_ideas
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
            
                
        }
        allow = {
            full_idea_group = quality_ideas
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
            
            
        }
        
        fire_damage = 0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_206 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = justiz0
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
            
                
        }
        allow = {
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
            
            full_idea_group = justiz0
            
            NOT = {
            calc_true_if = {
                amount = 3
                has_active_policy = idea_variation_act_13
                has_active_policy = idea_variation_act_578
                has_active_policy = idea_variation_act_206
                has_active_policy = idea_variation_act_219
                has_active_policy = idea_variation_act_227
                has_active_policy = idea_variation_act_333
                has_active_policy = idea_variation_act_498
    
                }
            }
        }
        
        idea_cost = -0.075
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_207 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = gesundheit0
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
            
                
        }
        allow = {
            full_idea_group = gesundheit0
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
            
            
        }
        
        global_institution_spread = 0.1
        innovativeness_gain = 0.25
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_208 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = staatsverwaltung0
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
        
                
        }
        allow = {
            full_idea_group = staatsverwaltung0
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
            
        }
        
        state_maintenance_modifier = -0.5
        yearly_corruption = -0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_209 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = generalstab0
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
    
            
                
        }
        allow = {
            full_idea_group = generalstab0
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
            
        }
        
        land_maintenance_modifier = -0.1
        land_forcelimit_modifier = 0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_210 = {
    
        monarch_power = MIL
    
        potential = {
            current_age = age_of_discovery
            has_idea_group = stehendesheer0
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
    
            
                
        }
        allow = {	
            current_age = age_of_discovery
            full_idea_group = stehendesheer0
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
            
            
        }
        
        global_manpower = 10
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_210_1 = {
    
        monarch_power = MIL
    
        potential = {
            current_age = age_of_reformation
            has_idea_group = stehendesheer0
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
    
            
                
        }
        allow = {	
            current_age = age_of_reformation
            full_idea_group = stehendesheer0
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
            
            
        }
        
        global_manpower = 20
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_210_2 = {
    
        monarch_power = MIL
    
        potential = {
            current_age = age_of_absolutism
            has_idea_group = stehendesheer0
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
    
            
                
        }
        allow = {	
            current_age = age_of_absolutism
            full_idea_group = stehendesheer0
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
            
            
        }
        
        global_manpower = 30
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_210_3 = {
    
        monarch_power = MIL
    
        potential = {
            current_age = age_of_revolutions
            has_idea_group = stehendesheer0
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
    
            
                
        }
        allow = {	
            current_age = age_of_revolutions
            full_idea_group = stehendesheer0
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
            
            
        }
        
        global_manpower = 40
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_211 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = waffenqualitat0
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
    
            
                
        }
        allow = {
            full_idea_group = waffenqualitat0
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
            
            
        }
        
        infantry_power = 0.1
        cavalry_power = 0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_212 = {
    
        monarch_power = DIP
    
        potential = {
        
        has_idea_group = festung0
        
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
    
                
        }
        allow = {
        
        full_idea_group = festung0
        
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
        
            
        }
        
        defensiveness = 0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_213 = {
    
        monarch_power = MIL
    
        potential = {
        
        has_idea_group = kriegsproduktion0
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
    
    
        
            
        }
        allow = {
        
        full_idea_group = kriegsproduktion0
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
        
            
        }
        
        infantry_power = 0.075
        cavalry_power = 0.075
        artillery_power = 0.075
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_214 = {
    
        monarch_power = DIP		# Besonderer Fall
    
        potential = {
            has_idea_group = dynasty0
            has_idea_group = justiz0
            
        }
        allow = {
            full_idea_group = dynasty0
            full_idea_group = justiz0
            
            NOT = {
            calc_true_if = {
                amount = 3
                has_active_policy = idea_variation_act_105
                has_active_policy = idea_variation_act_144
                has_active_policy = idea_variation_act_214
                has_active_policy = idea_variation_act_229
                has_active_policy = idea_variation_act_248
                has_active_policy = idea_variation_act_334
                has_active_policy = idea_variation_act_397
                has_active_policy = idea_variation_act_513
                }
            }
        }
        
        interest = -2				
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_215 = {
    
        monarch_power = ADM		# Besonderer Fall
    
        potential = {
            has_idea_group = dynasty0
            has_idea_group = entwicklung0
                
        }
        allow = {
            full_idea_group = dynasty0
            full_idea_group = entwicklung0
            
            NOT = {
            calc_true_if = {
                amount = 2
                has_active_policy = idea_variation_act_611
                has_active_policy = idea_variation_act_617
                has_active_policy = idea_variation_act_620
                has_active_policy = idea_variation_act_50
                has_active_policy = idea_variation_act_152
                has_active_policy = idea_variation_act_215
                has_active_policy = idea_variation_act_491
                has_active_policy = idea_variation_act_500
    
                }
            }
        }
        
        improve_relation_modifier = 0.1
        diplomatic_upkeep = 2
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_216 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = dynasty0
            has_idea_group = gesundheit0
                
        }
        allow = {
            full_idea_group = dynasty0
            full_idea_group = gesundheit0
        }
        
        reduced_liberty_desire = 10
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_217 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = dynasty0
            has_idea_group = diktatur0
                
        }
        allow = {
            full_idea_group = dynasty0
            full_idea_group = diktatur0
        }
        
        global_unrest = -2
        global_spy_defence = 0.2
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_218 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = dynasty0
            has_idea_group = staatsverwaltung0
                
        }
        allow = {
            full_idea_group = dynasty0
            full_idea_group = staatsverwaltung0
        }
        
        diplomats = 1
        diplomatic_annexation_cost = -0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_219 = {
    
        monarch_power = MIL		# Besonderer Fall
    
        potential = {
            has_idea_group = dynasty0
            has_idea_group = generalstab0
                
        }
        allow = {
            full_idea_group = dynasty0
            full_idea_group = generalstab0
            
            NOT = {
            calc_true_if = {
                amount = 3
                has_active_policy = idea_variation_act_13
                has_active_policy = idea_variation_act_578
                has_active_policy = idea_variation_act_206
                has_active_policy = idea_variation_act_219
                has_active_policy = idea_variation_act_227
                has_active_policy = idea_variation_act_333
                has_active_policy = idea_variation_act_498
    
                }
            }
        }
        
        idea_cost = -0.075
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_220 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = dynasty0
            has_idea_group = stehendesheer0
                
        }
        allow = {
            full_idea_group = dynasty0
            full_idea_group = stehendesheer0
            
            NOT = {
            calc_true_if = {
                amount = 2
                has_active_policy = idea_variation_act_575
                has_active_policy = idea_variation_act_580
                has_active_policy = idea_variation_act_623
                has_active_policy = idea_variation_act_79
                has_active_policy = idea_variation_act_90
                has_active_policy = idea_variation_act_220
                has_active_policy = idea_variation_act_256
                }
            }
        }
        
        ae_impact = -0.15
        
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_221 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = dynasty0
            has_idea_group = wehrpflicht0
            
        }
        allow = {
            full_idea_group = dynasty0
            full_idea_group = wehrpflicht0
        }
        
        global_manpower_modifier = 0.125
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_222 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = dynasty0
            has_idea_group = waffenqualitat0
                
        }
        allow = {
            full_idea_group = dynasty0
            full_idea_group = waffenqualitat0
        }
        
        mil_tech_cost_modifier = -0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_223 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = dynasty0
            has_idea_group = festung0
                
        }
        allow = {
            full_idea_group = dynasty0
            full_idea_group = festung0
        }
        
        diplomatic_reputation = 2
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_224 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = dynasty0
            has_idea_group = kriegsproduktion0
                
        }
        allow = {
            full_idea_group = dynasty0
            full_idea_group = kriegsproduktion0
        }
        
        land_morale = 0.05
        siege_ability = 0.05
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }	
        }
    }
    
    idea_variation_act_225 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = spy_ideas 
            has_idea_group = justiz0
                
        }
        allow = {
            full_idea_group = spy_ideas 
            full_idea_group = justiz0
        }
        
        global_spy_defence = 0.35
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_226 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = spy_ideas 
            has_idea_group = entwicklung0
                
        }
        allow = {
            full_idea_group = spy_ideas 
            full_idea_group = entwicklung0
        }
        
        spy_offence = 0.5
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_227 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = spy_ideas 
            has_idea_group = gesundheit0
                
        }
        allow = {
            full_idea_group = spy_ideas 
            full_idea_group = gesundheit0
            
            NOT = {
            calc_true_if = {
                amount = 3
                has_active_policy = idea_variation_act_13
                has_active_policy = idea_variation_act_578
                has_active_policy = idea_variation_act_206
                has_active_policy = idea_variation_act_219
                has_active_policy = idea_variation_act_227
                has_active_policy = idea_variation_act_333
                has_active_policy = idea_variation_act_498
    
                }
            }
        }
        
        idea_cost = -0.075
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_228 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = spy_ideas 
            has_idea_group = diktatur0
                
        }
        allow = {
            full_idea_group = spy_ideas 
            full_idea_group = diktatur0
        }
        
        technology_cost = -0.075
        diplomatic_reputation = -2
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_229 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = spy_ideas 
            has_idea_group = staatsverwaltung0
            
        }
        allow = {
            full_idea_group = spy_ideas 
            full_idea_group = staatsverwaltung0
            
            NOT = {
            calc_true_if = {
                amount = 3
                has_active_policy = idea_variation_act_105
                has_active_policy = idea_variation_act_144
                has_active_policy = idea_variation_act_214
                has_active_policy = idea_variation_act_229
                has_active_policy = idea_variation_act_248
                has_active_policy = idea_variation_act_334
                has_active_policy = idea_variation_act_397
                has_active_policy = idea_variation_act_513
                }
            }
        }
        
        interest = -1
        yearly_corruption = -0.2
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_230 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = spy_ideas 
            has_idea_group = generalstab0
            
        }
        allow = {
            full_idea_group = spy_ideas 
            full_idea_group = generalstab0
        }
        
        land_morale = 0.05
        siege_ability = 0.05
        
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_231 = {
    
        monarch_power = ADM
        potential = {
            has_idea_group = spy_ideas 
            has_idea_group = wehrpflicht0
                
        }
        allow = {
            full_idea_group = spy_ideas 
            full_idea_group = wehrpflicht0
        }
        
        manpower_recovery_speed = 0.25
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_232 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = spy_ideas 
            has_idea_group = stehendesheer0
            
        }
        allow = {
            full_idea_group = spy_ideas 
            full_idea_group = stehendesheer0
        }
        
        stability_cost_modifier = -0.5
        war_exhaustion_cost = -0.5
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_233 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = spy_ideas 
            has_idea_group = soldnerheer0 
            
        }
        allow = {
            full_idea_group = spy_ideas 
            full_idea_group = soldnerheer0 
        }
        
        war_exhaustion = -0.02
        merc_maintenance_modifier = -0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_234 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = spy_ideas 
            has_idea_group = festung0
            
        }
        allow = {
            full_idea_group = spy_ideas 
            full_idea_group = festung0
        }
        
        artillery_power = 0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_235 = {
    
        monarch_power = MIL		# Besonderer Fall
    
        potential = {
            has_idea_group = spy_ideas 
            has_idea_group = kriegsproduktion0
                
        }
        allow = {
            full_idea_group = spy_ideas 
            full_idea_group = kriegsproduktion0
        }
        
        production_efficiency = 0.3
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { production_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                production_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                production_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                production_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                production_income_percentage = 0.5
            }		
        }
    }
    
    idea_variation_act_236 = {
    
        monarch_power = ADM		# Besonderer Fall
    
        potential = {
            has_idea_group = exploration_ideas
            has_idea_group = justiz0
            
        }
        allow = {
            full_idea_group = exploration_ideas
            full_idea_group = justiz0
        }
        
        colonists = 1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { num_of_colonists = 1 }
            }
            modifier = {
                factor = 0.1
                NOT = { num_of_colonies = 1 }
            }
        }
    }
    
    idea_variation_act_237 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = exploration_ideas
            has_idea_group = gesundheit0
                
        }
        allow = {
            full_idea_group = exploration_ideas
            full_idea_group = gesundheit0
        }
        
        colonist_placement_chance = 0.15
        global_colonial_growth = 10
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { num_of_colonists = 1 }
            }
            modifier = {
                factor = 0.1
                NOT = { num_of_colonies = 1 }
            }
        }
    }
    
    idea_variation_act_238 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = exploration_ideas
            has_idea_group = entwicklung0
            
        }
        allow = {
            full_idea_group = exploration_ideas
            full_idea_group = entwicklung0
            
            NOT = {
            calc_true_if = {
                amount = 2
                has_active_policy = idea_variation_act_23
                has_active_policy = idea_variation_act_153
                has_active_policy = idea_variation_act_169
                has_active_policy = idea_variation_act_238
                has_active_policy = idea_variation_act_302
                has_active_policy = idea_variation_act_340
                has_active_policy = idea_variation_act_92
                has_active_policy = idea_variation_act_566
                has_active_policy = idea_variation_act_532
                has_active_policy = idea_variation_act_528
                has_active_policy = idea_variation_act_514
                has_active_policy = idea_variation_act_503
                }
            }
            
        }
        
        development_cost = -0.1
        dip_tech_cost_modifier = -0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_239 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = exploration_ideas
            has_idea_group = diktatur0
            
        }
        allow = {
            full_idea_group = exploration_ideas
            full_idea_group = diktatur0
        }
        
        global_colonial_growth = 15
        global_garrison_growth = 0.25
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { num_of_colonists = 1 }
            }
            modifier = {
                factor = 0.1
                NOT = { num_of_colonies = 1 }
            }
        }
    }
    
    idea_variation_act_240 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = exploration_ideas
            has_idea_group = generalstab0
                
        }
        allow = {
            full_idea_group = exploration_ideas
            full_idea_group = generalstab0
        }
        
        leader_naval_manuever = 1
        leader_land_manuever = 1
        leader_siege = 1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_241 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = exploration_ideas
            has_idea_group = wehrpflicht0
            
        }
        allow = {
            full_idea_group = exploration_ideas
            full_idea_group = wehrpflicht0
        }
        
        trade_efficiency = 0.20
        trade_range_modifier = 0.25
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }	
        }
    }
    
    idea_variation_act_242 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = exploration_ideas
            has_idea_group = stehendesheer0
                
        }
        allow = {
            full_idea_group = exploration_ideas
            full_idea_group = stehendesheer0
        }
        
        global_sailors_modifier = 0.25
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_243 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = exploration_ideas
            has_idea_group = soldnerheer0 
                
        }
        allow = {
            full_idea_group = exploration_ideas
            full_idea_group = soldnerheer0 
        }
        
        mercenary_manpower = 0.25
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_244 = {
    
        monarch_power = MIL		# Besonderer Fall
    
        potential = {
            has_idea_group = exploration_ideas
            has_idea_group = waffenqualitat0
            
        }
        allow = {
            full_idea_group = exploration_ideas
            full_idea_group = waffenqualitat0
        }
        
        infantry_cost = -0.25
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_245 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = exploration_ideas
            has_idea_group = festung0
                
        }
        allow = {
            full_idea_group = exploration_ideas
            full_idea_group = festung0
        }
        
        defensiveness = 0.075
        siege_ability = 0.075
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_246 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = exploration_ideas
            has_idea_group = kriegsproduktion0
                
        }
        allow = {
            full_idea_group = exploration_ideas
            full_idea_group = kriegsproduktion0
        }
        
    
        cavalry_power = 0.15
        cav_to_inf_ratio = 0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_247 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = influence_ideas 
            has_idea_group = entwicklung0
                
        }
        allow = {
            full_idea_group = influence_ideas 
            full_idea_group = entwicklung0
        }
        
        diplomatic_annexation_cost = -0.10
        diplomatic_reputation = 1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_248 = {
    
        monarch_power = DIP				
    
        potential = {
            has_idea_group = influence_ideas 
            has_idea_group = staatsverwaltung0
            
        }
        allow = {
            full_idea_group = influence_ideas 
            full_idea_group = staatsverwaltung0
            
            NOT = {
            calc_true_if = {
                amount = 3
                has_active_policy = idea_variation_act_105
                has_active_policy = idea_variation_act_144
                has_active_policy = idea_variation_act_214
                has_active_policy = idea_variation_act_229
                has_active_policy = idea_variation_act_248
                has_active_policy = idea_variation_act_334
                has_active_policy = idea_variation_act_397
                has_active_policy = idea_variation_act_513
                }
            }
        }
        
        heir_chance = 2
        interest = -1			
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_249 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = influence_ideas 
            has_idea_group = diktatur0
                
        }
        allow = {
            full_idea_group = influence_ideas 
            full_idea_group = diktatur0
        }
        
        years_of_nationalism = -10
        global_unrest = 3
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_250 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = influence_ideas 
            has_idea_group = gesundheit0
                
        }
        allow = {
            full_idea_group = influence_ideas 
            full_idea_group = gesundheit0
        }
        
        technology_cost = -0.05
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_251 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = influence_ideas 
            has_idea_group = generalstab0
            
        }
        allow = {
            full_idea_group = influence_ideas 
            full_idea_group = generalstab0
        }
        
        yearly_absolutism = 1.0
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_252 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = influence_ideas 
            has_idea_group = soldnerheer0 
                
        }
        allow = {
            full_idea_group = influence_ideas 
            full_idea_group = soldnerheer0 
        }
        
        mercenary_discipline = 0.05	
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_253 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = influence_ideas 
            has_idea_group = wehrpflicht0
            
        }
        allow = {
            full_idea_group = influence_ideas 
            full_idea_group = wehrpflicht0
        }
        
        global_manpower_modifier = 0.25
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_254 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_discovery
            has_idea_group = influence_ideas 
            has_idea_group = waffenqualitat0
            
        }
        allow = {
            current_age = age_of_discovery
            full_idea_group = influence_ideas 
            full_idea_group = waffenqualitat0
        }
        
        land_forcelimit = 5
        naval_forcelimit = 10
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_254_1 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_reformation
            has_idea_group = influence_ideas 
            has_idea_group = waffenqualitat0
            
        }
        allow = {
            current_age = age_of_reformation
            full_idea_group = influence_ideas 
            full_idea_group = waffenqualitat0
        }
        
        land_forcelimit = 10
        naval_forcelimit = 20
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_254_2 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_absolutism
            has_idea_group = influence_ideas 
            has_idea_group = waffenqualitat0
            
        }
        allow = {
            current_age = age_of_absolutism
            full_idea_group = influence_ideas 
            full_idea_group = waffenqualitat0
        }
        
        land_forcelimit = 15
        naval_forcelimit = 30
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_254_3 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_revolutions
            has_idea_group = influence_ideas 
            has_idea_group = waffenqualitat0
            
        }
        allow = {
            current_age = age_of_revolutions
            full_idea_group = influence_ideas 
            full_idea_group = waffenqualitat0
        }
        
        land_forcelimit = 20
        naval_forcelimit = 40
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_255 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = influence_ideas 
            has_idea_group = festung0
            
        }
        allow = {
            full_idea_group = influence_ideas 
            full_idea_group = festung0
        }
        
        fort_maintenance_modifier = -0.25
        garrison_size = 0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_256 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = influence_ideas 
            has_idea_group = kriegsproduktion0
                
        }
        allow = {
            full_idea_group = influence_ideas 
            full_idea_group = kriegsproduktion0
            
            NOT = {
            calc_true_if = {
                amount = 2
                has_active_policy = idea_variation_act_575
                has_active_policy = idea_variation_act_580
                has_active_policy = idea_variation_act_623
                has_active_policy = idea_variation_act_79
                has_active_policy = idea_variation_act_90
                has_active_policy = idea_variation_act_220
                has_active_policy = idea_variation_act_256
                }
            }
        }
        
        ae_impact = -0.15
        
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_257 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = maritime_ideas
            has_idea_group = justiz0
            
        }
        allow = {
            full_idea_group = maritime_ideas
            full_idea_group = justiz0
        }
        
        global_ship_cost = -0.15
        global_ship_recruit_speed = -0.25
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_258 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = maritime_ideas
            has_idea_group = diktatur0
                
        }
        allow = {
            full_idea_group = maritime_ideas
            full_idea_group = diktatur0
        }
        
        naval_forcelimit_modifier = 0.15
        naval_maintenance_modifier = -0.15
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_259 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = maritime_ideas
            has_idea_group = staatsverwaltung0
                
        }
        allow = {
            full_idea_group = maritime_ideas
            full_idea_group = staatsverwaltung0
        }
        
        development_cost = -0.05
        build_cost = -0.05
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_260 = {
    
        monarch_power = MIL	# Marine
    
        potential = {
            has_idea_group = maritime_ideas
            has_idea_group = generalstab0
                
        }
        allow = {
            full_idea_group = maritime_ideas
            full_idea_group = generalstab0
        }
        
        heavy_ship_power = 0.1
        galley_power = 0.1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_261 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = maritime_ideas
            has_idea_group = wehrpflicht0
                
        }
        allow = {
            full_idea_group = maritime_ideas
            full_idea_group = wehrpflicht0
        }
        
        sailors_recovery_speed = 0.25
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_263 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = maritime_ideas
            has_idea_group = stehendesheer0
                
        }
        allow = {
            full_idea_group = maritime_ideas
            full_idea_group = stehendesheer0
        }
        
        global_sailors_modifier = 0.25
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_264 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = maritime_ideas
            has_idea_group = soldnerheer0 
                
        }
        allow = {
            full_idea_group = maritime_ideas
            full_idea_group = soldnerheer0 
        }
        
        naval_maintenance_modifier = -0.25
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_265 = {
    
        monarch_power = DIP		# Marine
    
        potential = {
            has_idea_group = maritime_ideas
            has_idea_group = waffenqualitat0
                
        }
        allow = {
            full_idea_group = maritime_ideas
            full_idea_group = waffenqualitat0
        }
        
        heavy_ship_power = 0.075
        galley_power = 0.075
        light_ship_power = 0.075
        transport_power = 0.075
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_266 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = maritime_ideas
            has_idea_group = festung0
                
        }
        allow = {
            full_idea_group = maritime_ideas
            full_idea_group = festung0
        }
        
        heavy_ship_cost = -0.2
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_267 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = maritime_ideas
            has_idea_group = kriegsproduktion0
            
        }
        allow = {
            full_idea_group = maritime_ideas
            full_idea_group = kriegsproduktion0
        }
        
        global_ship_cost = -0.33
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_268 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = trade_ideas 
            has_idea_group = gesundheit0
            
        }
        allow = {
            full_idea_group = trade_ideas 
            full_idea_group = gesundheit0
        }
        
        merchants = 1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }	
        }
    }
    
    idea_variation_act_269 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = trade_ideas 
            has_idea_group = staatsverwaltung0
            
        }
        allow = {
            full_idea_group = trade_ideas 
            full_idea_group = staatsverwaltung0
        }
        
        caravan_power = 0.15
        trade_steering = 0.15
        embargo_efficiency = 0.25
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }	
        }
    }
    
    idea_variation_act_270 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = trade_ideas 
            has_idea_group = diktatur0
                
        }
        allow = {
            full_idea_group = trade_ideas 
            full_idea_group = diktatur0
        }
        
        trade_steering = 0.5
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }	
        }
    }
    
    idea_variation_act_271 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = trade_ideas 
            has_idea_group = generalstab0
            
        }
        allow = {
            full_idea_group = trade_ideas 
            full_idea_group = generalstab0
        }
        
        merchants = 1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }	
        }
    }
    
    idea_variation_act_272 = {
    
        monarch_power = DIP		
    
        potential = {
            has_idea_group = trade_ideas 
            has_idea_group = wehrpflicht0
        
        }
        allow = {
            full_idea_group = trade_ideas 
            full_idea_group = wehrpflicht0
        }
        
        global_prov_trade_power_modifier = 0.3
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }	
        }
    }
    
    idea_variation_act_273 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = trade_ideas 
            has_idea_group = stehendesheer0
                
        }
        allow = {
            full_idea_group = trade_ideas 
            full_idea_group = stehendesheer0
        }
        
        land_morale = 0.07
        
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_274 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = trade_ideas 
            has_idea_group = festung0
                
        }
        allow = {
            full_idea_group = trade_ideas 
            full_idea_group = festung0
        }
        
        trade_efficiency = 0.15
        light_ship_power = 0.15
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }	
        }
    }
    
    idea_variation_act_275 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = defensive_ideas
            has_idea_group = justiz0
                
        }
        allow = {
            full_idea_group = defensive_ideas
            full_idea_group = justiz0
        }
        
        discipline = 0.03
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_276 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = defensive_ideas
            has_idea_group = entwicklung0
                
        }
        allow = {
            full_idea_group = defensive_ideas
            full_idea_group = entwicklung0
        }
        
        defensiveness = 0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_277 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = defensive_ideas
            has_idea_group = gesundheit0
            
        }
        allow = {
            full_idea_group = defensive_ideas
            full_idea_group = gesundheit0
        }
        
        garrison_size = 0.5
        global_garrison_growth = 0.2
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_278 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = defensive_ideas
            has_idea_group = diktatur0
            
        }
        allow = {
            full_idea_group = defensive_ideas
            full_idea_group = diktatur0
        }
        
        land_morale = 0.07
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_279 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = defensive_ideas
            has_idea_group = staatsverwaltung0
            
        }
        allow = {
            full_idea_group = defensive_ideas
            full_idea_group = staatsverwaltung0
        }
        
        land_morale = 0.07
        
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_280 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = offensive_ideas
            has_idea_group = diktatur0
            
        }
        allow = {
            full_idea_group = offensive_ideas
            full_idea_group = diktatur0
        }
        
        land_morale = 0.15
        discipline = -0.05
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_281 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = offensive_ideas
            has_idea_group = entwicklung0
        
        }
        allow = {
            full_idea_group = offensive_ideas
            full_idea_group = entwicklung0
        }
        
        global_regiment_cost = -0.15
        global_regiment_recruit_speed = -0.2
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_282 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = quality_ideas
            has_idea_group = diktatur0
                
        }
        allow = {
            full_idea_group = quality_ideas
            full_idea_group = diktatur0
        }
        
        artillery_power = 0.20
        artillery_cost = 0.25
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_283 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = quality_ideas
            has_idea_group = justiz0
                
        }
        allow = {
            full_idea_group = quality_ideas
            full_idea_group = justiz0
        }
        
        global_autonomy = -0.2
    
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_284 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = quality_ideas
            has_idea_group = staatsverwaltung0
            
        }
        allow = {
            full_idea_group = quality_ideas
            full_idea_group = staatsverwaltung0
        }
        
        global_tax_modifier = 0.15
        production_efficiency = 0.15
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0.75
                NOT = { tax_income_percentage = 0.25 }
            }			
            modifier = {
                factor = 1.5
                tax_income_percentage = 0.45
            }
            modifier = {
                factor = 1.5
                tax_income_percentage = 0.7
            }
        }
    }
    
    idea_variation_act_285 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = quantity_ideas
            has_idea_group = justiz0
                
        }
        allow = {
            full_idea_group = quantity_ideas
            full_idea_group = justiz0
        }
        
        global_missionary_strength = 0.01
        missionaries = 1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                religious_unity = 1
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.6 }
            }			
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.4 }
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.2 }
            }			
        }
    }
    
    idea_variation_act_286 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = quantity_ideas
            has_idea_group = staatsverwaltung0
                
        }
        allow = {
            full_idea_group = quantity_ideas
            full_idea_group = staatsverwaltung0
        }
        
        state_maintenance_modifier = -0.75
        
        ai_will_do = {
            factor = 1
        }
    }
    
    #idea_variation_act_287 = {
    #
    #	monarch_power = MIL
    #
    #	potential = {
    #		has_idea_group = quantity_ideas
    #		has_idea_group = diktatur0
    #		
    #	}
    #	allow = {
    #		full_idea_group = quantity_ideas
    #		full_idea_group = diktatur0
    #	}
    #	
    #	
    #	
    #	ai_will_do = {
    #		factor = 1
    #	}
    #}
    
    idea_variation_act_288 = {
    
        monarch_power = ADM			# Besonderer Fall
    
        potential = {
            has_idea_group = generalstab0
            has_idea_group = expansion_ideas
                
        }
        allow = {
            full_idea_group = generalstab0
            full_idea_group = expansion_ideas
        }
        
        fire_damage = 0.025
        shock_damage = 0.025
        core_creation = -0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_289 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = generalstab0
            has_idea_group = humanist_ideas 
                
        }
        allow = {
            full_idea_group = generalstab0
            full_idea_group = humanist_ideas 
        }
        
        army_tradition = 1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_290 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = generalstab0
            OR = {
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = monarchie0
            has_idea_group = horde0
            }
                
        }
        allow = {
            full_idea_group = generalstab0
            OR = {
            full_idea_group = republik0 
            full_idea_group = aristo0
            full_idea_group = monarchie0
            full_idea_group = horde0
            }
        }
        
        free_leader_pool = 1
        advisor_pool = 3
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_291 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = generalstab0
            OR = {
            has_idea_group = religious_ideas   
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = orthodox0
            has_idea_group = islam0
            has_idea_group = cathar0
            has_idea_group = shinto0
            has_idea_group = norse0
            has_idea_group = budda0
            has_idea_group = confuci0 
            has_idea_group = hindu0
            has_idea_group = tengri0
            has_idea_group = coptic0
            has_idea_group = helle0
            has_idea_group = slav0
            has_idea_group = jew0
            has_idea_group = suomi0
            has_idea_group = romuva0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = mane0
            has_idea_group = ancli0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = nahu0
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
            }
            
        }
        allow = {
            full_idea_group = generalstab0
            OR = {
                full_idea_group = religious_ideas 
                full_idea_group = katholisch0
                full_idea_group = protestant0
                full_idea_group = reformiert0
                full_idea_group = orthodox0
                full_idea_group = islam0
                full_idea_group = cathar0
                full_idea_group = shinto0
                full_idea_group = norse0
                full_idea_group = budda0
                full_idea_group = confuci0 
                full_idea_group = hindu0
                full_idea_group = tengri0
                full_idea_group = coptic0
                full_idea_group = helle0
                full_idea_group = slav0
                full_idea_group = jew0
                full_idea_group = suomi0
                full_idea_group = romuva0
                full_idea_group = animist0
                full_idea_group = feti0
                full_idea_group = zoro0
                full_idea_group = mane0
                full_idea_group = ancli0
                full_idea_group = mesoam0
                full_idea_group = inti0
                full_idea_group = tote0
                full_idea_group = nahu0
                full_idea_group = shia0
                full_idea_group = ibadi0
                full_idea_group = hussite0
            }	
        }
        
        missionaries = 1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                religious_unity = 1
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.6 }
            }			
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.4 }
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.2 }
            }			
        }
    }
    
    idea_variation_act_292 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = generalstab0
            has_idea_group = justiz0
            
        }
        allow = {
            full_idea_group = generalstab0
            full_idea_group = justiz0
        }
        
        legitimacy = 2
        republican_tradition = 1
        devotion = 1
        horde_unity = 1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_293 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = generalstab0
            has_idea_group = gesundheit0
                
        }
        allow = {
            full_idea_group = generalstab0
            full_idea_group = gesundheit0
        }
        
        sailors_recovery_speed = 0.15
        manpower_recovery_speed = 0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_294 = {
    
        monarch_power = MIL
    
        potential = {
            current_age = age_of_discovery
            has_idea_group = generalstab0
            has_idea_group = diktatur0
                
        }
        allow = {
            current_age = age_of_discovery
            full_idea_group = generalstab0
            full_idea_group = diktatur0
        }
        
        global_manpower = 10
        global_unrest = 1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_294_1 = {
    
        monarch_power = MIL
    
        potential = {
            current_age = age_of_reformation
            has_idea_group = generalstab0
            has_idea_group = diktatur0
                
        }
        allow = {
            current_age = age_of_reformation
            full_idea_group = generalstab0
            full_idea_group = diktatur0
        }
        
        global_manpower = 20
        global_unrest = 1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_294_2 = {
    
        monarch_power = MIL
    
        potential = {
            current_age = age_of_absolutism
            has_idea_group = generalstab0
            has_idea_group = diktatur0
                
        }
        allow = {
            current_age = age_of_absolutism
            full_idea_group = generalstab0
            full_idea_group = diktatur0
        }
        
        global_manpower = 30
        global_unrest = 2
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_294_3 = {
    
        monarch_power = MIL
    
        potential = {
            current_age = age_of_revolutions
            has_idea_group = generalstab0
            has_idea_group = diktatur0
                
        }
        allow = {
            current_age = age_of_revolutions
            full_idea_group = generalstab0
            full_idea_group = diktatur0
        }
        
        global_manpower = 40
        global_unrest = 2
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_295 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = generalstab0
            has_idea_group = staatsverwaltung0
            
        }
        allow = {
            full_idea_group = generalstab0
            full_idea_group = staatsverwaltung0
        }
        
        reinforce_speed = 0.25
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_296 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = stehendesheer0
            has_idea_group = economic_ideas
                
        }
        allow = {
            full_idea_group = stehendesheer0
            full_idea_group = economic_ideas
        }
        
        land_maintenance_modifier = -0.2
        global_tax_modifier = 0.1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0.75
                NOT = { tax_income_percentage = 0.25 }
            }			
            modifier = {
                factor = 1.5
                tax_income_percentage = 0.45
            }
            modifier = {
                factor = 1.5
                tax_income_percentage = 0.7
            }
        }
    }
    
    idea_variation_act_297 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = stehendesheer0
            has_idea_group = humanist_ideas 
            
        }
        allow = {
            full_idea_group = stehendesheer0
            full_idea_group = humanist_ideas 
        }
        
        land_maintenance_modifier = -0.2
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_298 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = stehendesheer0
            has_idea_group = innovativeness_ideas
            
        }
        allow = {
            full_idea_group = stehendesheer0
            full_idea_group = innovativeness_ideas
        }
        
        infantry_power = 0.075
        cavalry_power = 0.075
        artillery_power = 0.075
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_299 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = stehendesheer0
            has_idea_group = expansion_ideas
                
        }
        allow = {
            full_idea_group = stehendesheer0
            full_idea_group = expansion_ideas
        }
        
        global_regiment_cost = -0.2
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_300 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = stehendesheer0
            OR = {
            has_idea_group = religious_ideas   
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = orthodox0
            has_idea_group = islam0
            has_idea_group = cathar0
            has_idea_group = shinto0
            has_idea_group = norse0
            has_idea_group = budda0
            has_idea_group = confuci0 
            has_idea_group = hindu0
            has_idea_group = tengri0
            has_idea_group = coptic0
            has_idea_group = helle0
            has_idea_group = slav0
            has_idea_group = jew0
            has_idea_group = suomi0
            has_idea_group = romuva0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = mane0
            has_idea_group = ancli0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = nahu0
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
            }
                
        }
        allow = {
            full_idea_group = stehendesheer0
            OR = {
                full_idea_group = religious_ideas 
                full_idea_group = katholisch0
                full_idea_group = protestant0
                full_idea_group = reformiert0
                full_idea_group = orthodox0
                full_idea_group = islam0
                full_idea_group = cathar0
                full_idea_group = shinto0
                full_idea_group = norse0
                full_idea_group = budda0
                full_idea_group = confuci0 
                full_idea_group = hindu0
                full_idea_group = tengri0
                full_idea_group = coptic0
                full_idea_group = helle0
                full_idea_group = slav0
                full_idea_group = jew0
                full_idea_group = suomi0
                full_idea_group = romuva0
                full_idea_group = animist0
                full_idea_group = feti0
                full_idea_group = zoro0
                full_idea_group = mane0
                full_idea_group = ancli0
                full_idea_group = mesoam0
                full_idea_group = inti0
                full_idea_group = tote0
                full_idea_group = nahu0
                full_idea_group = shia0
                full_idea_group = ibadi0
                full_idea_group = hussite0
            }	
        }
        
        
        missionaries = 1
        global_missionary_strength = 0.02
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                religious_unity = 1
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.6 }
            }			
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.4 }
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.2 }
            }			
        }
    }
    
    idea_variation_act_301 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = stehendesheer0
            has_idea_group = justiz0
                
        }
        allow = {
            full_idea_group = stehendesheer0
            full_idea_group = justiz0
        }
        
        global_unrest = -3
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_302 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = stehendesheer0
            has_idea_group = entwicklung0
                
        }
        allow = {
            full_idea_group = stehendesheer0
            full_idea_group = entwicklung0
            
            NOT = {
            calc_true_if = {
                amount = 2
                has_active_policy = idea_variation_act_23
                has_active_policy = idea_variation_act_153
                has_active_policy = idea_variation_act_169
                has_active_policy = idea_variation_act_238
                has_active_policy = idea_variation_act_302
                has_active_policy = idea_variation_act_340
                has_active_policy = idea_variation_act_92
                has_active_policy = idea_variation_act_566
                has_active_policy = idea_variation_act_532
                has_active_policy = idea_variation_act_528
                has_active_policy = idea_variation_act_514
                has_active_policy = idea_variation_act_503
                }
            }
            
        }
        
        development_cost = -0.1
        fort_maintenance_modifier = -0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_303 = {
    
        monarch_power = ADM
    
        potential = {
            current_age = age_of_discovery
            has_idea_group = stehendesheer0
            has_idea_group = diktatur0
            
        }
        allow = {
            current_age = age_of_discovery
            full_idea_group = stehendesheer0
            full_idea_group = diktatur0
        }
        
        land_forcelimit = 5
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_303_1 = {
    
        monarch_power = ADM
    
        potential = {
            current_age = age_of_reformation
            has_idea_group = stehendesheer0
            has_idea_group = diktatur0
            
        }
        allow = {
            current_age = age_of_reformation
            full_idea_group = stehendesheer0
            full_idea_group = diktatur0
        }
        
        land_forcelimit = 10
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_303_2 = {
    
        monarch_power = ADM
    
        potential = {
            current_age = age_of_absolutism
            has_idea_group = stehendesheer0
            has_idea_group = diktatur0
            
        }
        allow = {
            current_age = age_of_absolutism
            full_idea_group = stehendesheer0
            full_idea_group = diktatur0
        }
        
        land_forcelimit = 15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_303_3 = {
    
        monarch_power = ADM
    
        potential = {
            current_age = age_of_revolutions
            has_idea_group = stehendesheer0
            has_idea_group = diktatur0
            
        }
        allow = {
            current_age = age_of_revolutions
            full_idea_group = stehendesheer0
            full_idea_group = diktatur0
        }
        
        land_forcelimit = 20
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_304 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = stehendesheer0
            has_idea_group = staatsverwaltung0
                
        }
        allow = {
            full_idea_group = stehendesheer0
            full_idea_group = staatsverwaltung0
        }
        
        land_maintenance_modifier = -0.2
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_305 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = soldnerheer0 
            has_idea_group = administrative_ideas
            
        }
        allow = {
            full_idea_group = soldnerheer0 
            full_idea_group = administrative_ideas
        }
        
        mercenary_cost = -0.15
        merc_maintenance_modifier = -0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_306 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = soldnerheer0 
            OR = {
            has_idea_group = religious_ideas   
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = orthodox0
            has_idea_group = islam0
            has_idea_group = cathar0
            has_idea_group = shinto0
            has_idea_group = norse0
            has_idea_group = budda0
            has_idea_group = confuci0 
            has_idea_group = hindu0
            has_idea_group = tengri0
            has_idea_group = coptic0
            has_idea_group = helle0
            has_idea_group = slav0
            has_idea_group = jew0
            has_idea_group = suomi0
            has_idea_group = romuva0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = mane0
            has_idea_group = ancli0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = nahu0
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
            }
                
        }
        allow = {
            full_idea_group = soldnerheer0 
            OR = {
                full_idea_group = religious_ideas 
                full_idea_group = katholisch0
                full_idea_group = protestant0
                full_idea_group = reformiert0
                full_idea_group = orthodox0
                full_idea_group = islam0
                full_idea_group = cathar0
                full_idea_group = shinto0
                full_idea_group = norse0
                full_idea_group = budda0
                full_idea_group = confuci0 
                full_idea_group = hindu0
                full_idea_group = tengri0
                full_idea_group = coptic0
                full_idea_group = helle0
                full_idea_group = slav0
                full_idea_group = jew0
                full_idea_group = suomi0
                full_idea_group = romuva0
                full_idea_group = animist0
                full_idea_group = feti0
                full_idea_group = zoro0
                full_idea_group = mane0
                full_idea_group = ancli0
                full_idea_group = mesoam0
                full_idea_group = inti0
                full_idea_group = tote0
                full_idea_group = nahu0
                full_idea_group = shia0
                full_idea_group = ibadi0
                full_idea_group = hussite0
            }	
        }
        
        mercenary_manpower = 0.15
        mercenary_cost = -0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_307 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = soldnerheer0 
            OR = {
            has_idea_group = aristo0
            has_idea_group = monarchie0
            has_idea_group = horde0
            }
            
        }
        allow = {
            full_idea_group = soldnerheer0 
            OR = {
            full_idea_group = aristo0
            full_idea_group = monarchie0
            full_idea_group = horde0
            }
        }
        
        war_exhaustion = -0.05
        global_unrest = -2
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_308 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = soldnerheer0 
            has_idea_group = republik0
            
        }
        allow = {
            full_idea_group = soldnerheer0 
            full_idea_group = republik0
        }
        
        republican_tradition = 1
        
        ai_will_do = {
            factor = 1		
        }
    }
    
    idea_variation_act_309 = {
    
        monarch_power = MIL		# Besonderer Fall
    
        potential = {
            has_idea_group = soldnerheer0 
            has_idea_group = diktatur0
                
        }
        allow = {
            full_idea_group = soldnerheer0 
            full_idea_group = diktatur0
        }
        
        mercenary_manpower = 1.0
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_310 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = soldnerheer0 
            has_idea_group = justiz0
                
        }
        allow = {
            full_idea_group = soldnerheer0 
            full_idea_group = justiz0
        }
        
        yearly_corruption = -0.2
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_311 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = soldnerheer0 
            has_idea_group = gesundheit0
                
        }
        allow = {
            full_idea_group = soldnerheer0 
            full_idea_group = gesundheit0
        }
        
        discipline = 0.03
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_312 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = soldnerheer0 
            has_idea_group = entwicklung0
                
        }
        allow = {
            full_idea_group = soldnerheer0 
            full_idea_group = entwicklung0
        }
        
        siege_ability = 0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_313 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = wehrpflicht0
            OR = {
            has_idea_group = religious_ideas   
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = orthodox0
            has_idea_group = islam0
            has_idea_group = cathar0
            has_idea_group = shinto0
            has_idea_group = norse0
            has_idea_group = budda0
            has_idea_group = confuci0 
            has_idea_group = hindu0
            has_idea_group = tengri0
            has_idea_group = coptic0
            has_idea_group = helle0
            has_idea_group = slav0
            has_idea_group = jew0
            has_idea_group = suomi0
            has_idea_group = romuva0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = mane0
            has_idea_group = ancli0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = nahu0
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
            }
                
        }
        allow = {
            full_idea_group = wehrpflicht0
            OR = {
                full_idea_group = religious_ideas 
                full_idea_group = katholisch0
                full_idea_group = protestant0
                full_idea_group = reformiert0
                full_idea_group = orthodox0
                full_idea_group = islam0
                full_idea_group = cathar0
                full_idea_group = shinto0
                full_idea_group = norse0
                full_idea_group = budda0
                full_idea_group = confuci0 
                full_idea_group = hindu0
                full_idea_group = tengri0
                full_idea_group = coptic0
                full_idea_group = helle0
                full_idea_group = slav0
                full_idea_group = jew0
                full_idea_group = suomi0
                full_idea_group = romuva0
                full_idea_group = animist0
                full_idea_group = feti0
                full_idea_group = zoro0
                full_idea_group = mane0
                full_idea_group = ancli0
                full_idea_group = mesoam0
                full_idea_group = inti0
                full_idea_group = tote0
                full_idea_group = nahu0
                full_idea_group = shia0
                full_idea_group = ibadi0
                full_idea_group = hussite0
            }	
        }
        
        missionaries = 1			
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                religious_unity = 1
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.6 }
            }			
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.4 }
            }
            modifier = {
                factor = 1.5
                NOT = { religious_unity = 0.2 }
            }			
        }
    }
    
    idea_variation_act_314 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = wehrpflicht0
            OR = {
            has_idea_group = aristo0
            has_idea_group = monarchie0
            has_idea_group = horde0
            }
                
        }
        allow = {
            full_idea_group = wehrpflicht0 
            OR = {
            full_idea_group = aristo0
            full_idea_group = monarchie0
            full_idea_group = horde0
            }
        }
        
        global_manpower_modifier = 0.25
        
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_315 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = wehrpflicht0
            has_idea_group = administrative_ideas
            
        }
        allow = {
            full_idea_group = wehrpflicht0
            full_idea_group = administrative_ideas
        }
        
        global_regiment_cost = -0.10
        global_regiment_recruit_speed = -0.5
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_316 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = wehrpflicht0
            has_idea_group = economic_ideas
                
        }
        allow = {
            full_idea_group = wehrpflicht0
            full_idea_group = economic_ideas
        }
    
        trade_efficiency = 0.1
        global_tax_modifier = 0.1
        production_efficiency = 0.1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }	
        }
    }
    
    idea_variation_act_317 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = wehrpflicht0
            has_idea_group = expansion_ideas
                
        }
        allow = {
            full_idea_group = wehrpflicht0
            full_idea_group = expansion_ideas
        }
        
        years_of_nationalism = -3
        yearly_corruption = -0.2
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_318 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = wehrpflicht0
            has_idea_group = humanist_ideas 
                
        }
        allow = {
            full_idea_group = wehrpflicht0
            full_idea_group = humanist_ideas 
        }
        
        infantry_power = 0.075
        cavalry_power = 0.075
        artillery_power = 0.075
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_319 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = wehrpflicht0
            has_idea_group = innovativeness_ideas
            
        }
        allow = {
            full_idea_group = wehrpflicht0
            full_idea_group = innovativeness_ideas
        }
        
        discipline = 0.03
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_320 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = wehrpflicht0
            has_idea_group = republik0
                
        }
        allow = {
            full_idea_group = wehrpflicht0
            full_idea_group = republik0
        }
        
        infantry_power = 0.125
        cavalry_power = 0.075
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_321 = {
    
        monarch_power = ADM			# Besonderer Fall
    
        potential = {
            has_idea_group = wehrpflicht0
            has_idea_group = justiz0
                
        }
        allow = {
            full_idea_group = wehrpflicht0
            full_idea_group = justiz0
        }
        
        land_morale = 0.05
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_322 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = wehrpflicht0
            has_idea_group = entwicklung0
                
        }
        allow = {
            full_idea_group = wehrpflicht0
            full_idea_group = entwicklung0
        }
        
        land_forcelimit_modifier = 0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_323 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = wehrpflicht0
            has_idea_group = staatsverwaltung0
                
        }
        allow = {
            full_idea_group = wehrpflicht0
            full_idea_group = staatsverwaltung0
        }
        
        global_manpower_modifier = 0.125
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_324 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = waffenqualitat0
            has_idea_group = administrative_ideas
                
        }
        allow = {
            full_idea_group = waffenqualitat0
            full_idea_group = administrative_ideas
            
            NOT = {
            calc_true_if = {
                amount = 3
                has_active_policy = idea_variation_act_636
                has_active_policy = idea_variation_act_660
                has_active_policy = idea_variation_act_12
                has_active_policy = idea_variation_act_31
                has_active_policy = idea_variation_act_324
        
                }
            }
        }
        
        reinforce_speed = 0.1
        land_attrition = -0.1
        
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_325 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = waffenqualitat0
            OR = {
            has_idea_group = religious_ideas   
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = orthodox0
            has_idea_group = islam0
            has_idea_group = cathar0
            has_idea_group = shinto0
            has_idea_group = norse0
            has_idea_group = budda0
            has_idea_group = confuci0 
            has_idea_group = hindu0
            has_idea_group = tengri0
            has_idea_group = coptic0
            has_idea_group = helle0
            has_idea_group = slav0
            has_idea_group = jew0
            has_idea_group = suomi0
            has_idea_group = romuva0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = mane0
            has_idea_group = ancli0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = nahu0
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
            }
            
        }
        allow = {
            full_idea_group = waffenqualitat0
            OR = {
                full_idea_group = religious_ideas 
                full_idea_group = katholisch0
                full_idea_group = protestant0
                full_idea_group = reformiert0
                full_idea_group = orthodox0
                full_idea_group = islam0
                full_idea_group = cathar0
                full_idea_group = shinto0
                full_idea_group = norse0
                full_idea_group = budda0
                full_idea_group = confuci0 
                full_idea_group = hindu0
                full_idea_group = tengri0
                full_idea_group = coptic0
                full_idea_group = helle0
                full_idea_group = slav0
                full_idea_group = jew0
                full_idea_group = suomi0
                full_idea_group = romuva0
                full_idea_group = animist0
                full_idea_group = feti0
                full_idea_group = zoro0
                full_idea_group = mane0
                full_idea_group = ancli0
                full_idea_group = mesoam0
                full_idea_group = inti0
                full_idea_group = tote0
                full_idea_group = nahu0
                full_idea_group = shia0
                full_idea_group = ibadi0
                full_idea_group = hussite0
            }	
        }
        
        artillery_power = 0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_326 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = waffenqualitat0
            OR = {
            has_idea_group = aristo0
            has_idea_group = monarchie0
            has_idea_group = horde0
            }
            
        }
        allow = {
            full_idea_group = waffenqualitat0
            OR = {
            full_idea_group = aristo0
            full_idea_group = monarchie0
            full_idea_group = horde0
            }
        }
        
        leader_land_fire = 1
        leader_land_shock = 1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_327 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = waffenqualitat0
            has_idea_group = expansion_ideas
                
        }
        allow = {
            full_idea_group = waffenqualitat0
            full_idea_group = expansion_ideas
        }
        
        range = 0.5
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_328 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = waffenqualitat0
            has_idea_group = humanist_ideas 
                
        }
        allow = {
            full_idea_group = waffenqualitat0
            full_idea_group = humanist_ideas 
        }
        
        global_tax_modifier = 0.3
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_329 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = waffenqualitat0
            has_idea_group = innovativeness_ideas
                
        }
        allow = {
            full_idea_group = waffenqualitat0
            full_idea_group = innovativeness_ideas
        }
        
        global_institution_spread = 0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_330 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = waffenqualitat0
            has_idea_group = republik0
                
        }
        allow = {
            full_idea_group = waffenqualitat0
            full_idea_group = republik0
        }
        
        discipline = 0.03
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_331 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = waffenqualitat0
            has_idea_group = diktatur0
                
        }
        allow = {
            full_idea_group = waffenqualitat0
            full_idea_group = diktatur0
        }
        
        infantry_power = 0.1
        cavalry_power = 0.1
        artillery_power = 0.1
        global_unrest = 3
    
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_332 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = waffenqualitat0
            has_idea_group = justiz0
                
        }
        allow = {
            full_idea_group = waffenqualitat0
            full_idea_group = justiz0
        }
        
        embargo_efficiency = 0.25
        production_efficiency = 0.20
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { production_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                production_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                production_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                production_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                production_income_percentage = 0.5
            }		
        }
    }
    
    idea_variation_act_333 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = waffenqualitat0
            has_idea_group = gesundheit0
                
        }
        allow = {
            full_idea_group = waffenqualitat0
            full_idea_group = gesundheit0
            
            NOT = {
            calc_true_if = {
                amount = 3
                has_active_policy = idea_variation_act_13
                has_active_policy = idea_variation_act_578
                has_active_policy = idea_variation_act_206
                has_active_policy = idea_variation_act_219
                has_active_policy = idea_variation_act_227
                has_active_policy = idea_variation_act_333
                has_active_policy = idea_variation_act_498
    
                }
            }
        }
        
        idea_cost = -0.075
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_334 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = waffenqualitat0
            has_idea_group = staatsverwaltung0
                
        }
        allow = {
            full_idea_group = waffenqualitat0
            full_idea_group = staatsverwaltung0
            
            NOT = {
            calc_true_if = {
                amount = 3
                has_active_policy = idea_variation_act_105
                has_active_policy = idea_variation_act_144
                has_active_policy = idea_variation_act_214
                has_active_policy = idea_variation_act_229
                has_active_policy = idea_variation_act_248
                has_active_policy = idea_variation_act_334
                has_active_policy = idea_variation_act_397
                has_active_policy = idea_variation_act_513
                }
            }
        }
        
        interest = -2
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_335 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = festung0
            has_idea_group = economic_ideas
            
        }
        allow = {
            full_idea_group = festung0
            full_idea_group = economic_ideas
        }
        
        global_tax_modifier = 0.2
        fort_maintenance_modifier = -0.1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0.75
                NOT = { tax_income_percentage = 0.25 }
            }			
            modifier = {
                factor = 1.5
                tax_income_percentage = 0.45
            }
            modifier = {
                factor = 1.5
                tax_income_percentage = 0.7
            }
        }
    }
    
    idea_variation_act_336 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = festung0
            has_idea_group = expansion_ideas
            
        }
        allow = {
            full_idea_group = festung0
            full_idea_group = expansion_ideas
            
            NOT = {
            calc_true_if = {
                amount = 4
                has_active_policy = idea_variation_act_96
                has_active_policy = idea_variation_act_336
                has_active_policy = idea_variation_act_418
                has_active_policy = idea_variation_act_438
                has_active_policy = idea_variation_act_445
                has_active_policy = idea_variation_act_473
                }
            }
        }
        
        shock_damage_received = -0.1
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_337 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = festung0
            has_idea_group = humanist_ideas 
                
        }
        allow = {
            full_idea_group = festung0
            full_idea_group = humanist_ideas 
        }
        
        shock_damage_received = -0.05
        fire_damage_received = -0.05
        
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_338 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = festung0
            has_idea_group = innovativeness_ideas
                
        }
        allow = {
            full_idea_group = festung0
            full_idea_group = innovativeness_ideas
        }
        
        land_morale = 0.07
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    idea_variation_act_339 = {
    
        monarch_power = MIL			
    
        potential = {
            has_idea_group = festung0
            has_idea_group = justiz0
                
        }
        allow = {
            full_idea_group = festung0
            full_idea_group = justiz0
        }
        
        global_garrison_growth = 0.2
        global_manpower_modifier = 0.2
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_340 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = festung0
            has_idea_group = entwicklung0
            
        }
        allow = {
            full_idea_group = festung0
            full_idea_group = entwicklung0
            
            NOT = {
            calc_true_if = {
                amount = 2
                has_active_policy = idea_variation_act_23
                has_active_policy = idea_variation_act_153
                has_active_policy = idea_variation_act_169
                has_active_policy = idea_variation_act_238
                has_active_policy = idea_variation_act_302
                has_active_policy = idea_variation_act_340
                has_active_policy = idea_variation_act_92
                has_active_policy = idea_variation_act_566
                has_active_policy = idea_variation_act_532
                has_active_policy = idea_variation_act_528
                has_active_policy = idea_variation_act_514
                has_active_policy = idea_variation_act_503
                }
            }
        }
        
        fort_maintenance_modifier = -0.1
        development_cost = -0.1			
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_341 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = festung0
            has_idea_group = diktatur0
                
        }
        allow = {
            full_idea_group = festung0
            full_idea_group = diktatur0
        }
        
        defensiveness = 0.33
        global_unrest = 3
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_342 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = festung0
            has_idea_group = staatsverwaltung0
                
        }
        allow = {
            full_idea_group = festung0
            full_idea_group = staatsverwaltung0
        }
        
        state_maintenance_modifier = -0.5
        yearly_corruption = -0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_343 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = kriegsproduktion0
            has_idea_group = expansion_ideas
            
        }
        allow = {
            full_idea_group = kriegsproduktion0
            full_idea_group = expansion_ideas
        }
        
        global_trade_goods_size_modifier = 0.1
        production_efficiency = 0.1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }	
        }
    }
    
    idea_variation_act_344 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = kriegsproduktion0
            OR = {
            has_idea_group = religious_ideas   
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = orthodox0
            has_idea_group = islam0
            has_idea_group = cathar0
            has_idea_group = shinto0
            has_idea_group = norse0
            has_idea_group = budda0
            has_idea_group = confuci0 
            has_idea_group = hindu0
            has_idea_group = tengri0
            has_idea_group = coptic0
            has_idea_group = helle0
            has_idea_group = slav0
            has_idea_group = jew0
            has_idea_group = suomi0
            has_idea_group = romuva0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = mane0
            has_idea_group = ancli0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = nahu0
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
            }
            
        }
        allow = {
            full_idea_group = kriegsproduktion0
            OR = {
                full_idea_group = religious_ideas 
                full_idea_group = katholisch0
                full_idea_group = protestant0
                full_idea_group = reformiert0
                full_idea_group = orthodox0
                full_idea_group = islam0
                full_idea_group = cathar0
                full_idea_group = shinto0
                full_idea_group = norse0
                full_idea_group = budda0
                full_idea_group = confuci0 
                full_idea_group = hindu0
                full_idea_group = tengri0
                full_idea_group = coptic0
                full_idea_group = helle0
                full_idea_group = slav0
                full_idea_group = jew0
                full_idea_group = suomi0
                full_idea_group = romuva0
                full_idea_group = animist0
                full_idea_group = feti0
                full_idea_group = zoro0
                full_idea_group = mane0
                full_idea_group = ancli0
                full_idea_group = mesoam0
                full_idea_group = inti0
                full_idea_group = tote0
                full_idea_group = nahu0
                full_idea_group = shia0
                full_idea_group = ibadi0
                full_idea_group = hussite0
            }	
        }
        
        tolerance_heathen = 2
        tolerance_heretic = 2
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_345 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = kriegsproduktion0
            OR = {
            has_idea_group = aristo0
            has_idea_group = monarchie0
            has_idea_group = horde0
            }
            
        }
        allow = {
            full_idea_group = kriegsproduktion0
            OR = {
            full_idea_group = aristo0
            full_idea_group = monarchie0
            full_idea_group = horde0
            }
        }
        
        global_own_trade_power = 0.3
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }	
        }
    }
    
    idea_variation_act_346 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = kriegsproduktion0
            has_idea_group = humanist_ideas 
                
        }
        allow = {
            full_idea_group = kriegsproduktion0
            full_idea_group = humanist_ideas 
        }
        
        global_regiment_cost = -0.15
        global_regiment_recruit_speed = -0.3
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_347 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = kriegsproduktion0
            has_idea_group = innovativeness_ideas
                
        }
        allow = {
            full_idea_group = kriegsproduktion0
            full_idea_group = innovativeness_ideas
        }
        
        production_efficiency = 0.1
        global_trade_goods_size_modifier = 0.1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }	
        }
    }
    
    idea_variation_act_348 = {
    
        monarch_power = MIL				# Besonderer Fall
    
        potential = {
            has_idea_group = kriegsproduktion0
            has_idea_group = diktatur0
                
        }
        allow = {
            full_idea_group = kriegsproduktion0
            full_idea_group = diktatur0
        }
        
        global_trade_goods_size_modifier = 0.25
        global_unrest = 3
        global_autonomy = 0.05
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }	
        }
    }
    
    idea_variation_act_349 = {
    
        monarch_power = MIL				# Besonderer Fall
    
        potential = {
            has_idea_group = kriegsproduktion0
            has_idea_group = republik0
                
        }
        allow = {
            full_idea_group = kriegsproduktion0
            full_idea_group = republik0
        }
        
        global_trade_goods_size_modifier = 0.2
        global_tax_modifier = -0.1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.5
            }	
        }
    }
    
    idea_variation_act_350 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = kriegsproduktion0
            has_idea_group = gesundheit0
            
        }
        allow = {
            full_idea_group = kriegsproduktion0
            full_idea_group = gesundheit0
        }
        
        manpower_recovery_speed = 0.15
        sailors_recovery_speed = 0.15
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_351 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = kriegsproduktion0
            has_idea_group = entwicklung0
                
        }
        allow = {
            full_idea_group = kriegsproduktion0
            full_idea_group = entwicklung0
        }
        
        fire_damage = 0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_262 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = republik0
            has_idea_group = quality_ideas
            
        }
        allow = {
            full_idea_group = republik0
            full_idea_group = quality_ideas
        }
        
        discipline = 0.03
        
        ai_will_do = {
            factor = 5
            modifier = {
                factor = 1.5
                is_at_war = yes
            }
        }
    }
    
    
    idea_variation_act_352 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = republik0
            has_idea_group = quantity_ideas
            
        }
        allow = {
            full_idea_group = republik0
            full_idea_group = quantity_ideas
        }
        
        global_manpower_modifier = 0.25
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_353 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = republik0
            has_idea_group = offensive_ideas
                
        }
        allow = {
            full_idea_group = republik0
            full_idea_group = offensive_ideas
        }
        
        reinforce_speed = 0.1
        siege_ability = 0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_354 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = republik0
            has_idea_group = defensive_ideas
            
        }
        allow = {
            full_idea_group = republik0
            full_idea_group = defensive_ideas
        }
        
        defensiveness = 0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_355 = {
    
    monarch_power = DIP
    
        potential = {
            has_idea_group = wehrpflicht0
            OR = {
            has_idea_group = handel0
            has_idea_group = galle0
            has_idea_group = gross0
            }
                
        }
        allow = {
            full_idea_group = wehrpflicht0
            OR = {
            full_idea_group = handel0
            full_idea_group = galle0
            full_idea_group = gross0
            }
        }
        
        global_sailors_modifier = 0.25
        
        ai_will_do = {
            factor = 1
        }
    }
    
    
    idea_variation_act_356 = {
    
    monarch_power = ADM
    
        potential = {
            has_idea_group = gesundheit0
            OR = {
            has_idea_group = handel0
            has_idea_group = galle0
            has_idea_group = gross0
            }
                
        }
        allow = {
            full_idea_group = gesundheit0
            OR = {
            full_idea_group = handel0
            full_idea_group = galle0
            full_idea_group = gross0
            }
        }
        
        naval_attrition = -0.5
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_357 = {
    
    monarch_power = ADM
    
        potential = {
            has_idea_group = entwicklung0
            OR = {
            has_idea_group = handel0
            has_idea_group = galle0
            has_idea_group = gross0
            }
            
        }
        allow = {
            full_idea_group = entwicklung0
            OR = {
            full_idea_group = handel0
            full_idea_group = galle0
            full_idea_group = gross0
            }
        }
        
        global_ship_cost = -0.25
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_358 = {
    
    monarch_power = DIP
    
        potential = {
            has_idea_group = quantity_ideas
            OR = {
            has_idea_group = handel0
            has_idea_group = galle0
            has_idea_group = gross0
            }
                
        }
        allow = {
            full_idea_group = quantity_ideas
            OR = {
            full_idea_group = handel0
            full_idea_group = galle0
            full_idea_group = gross0
            }
        }
        
        naval_forcelimit_modifier = 0.33
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_359 = {
    
    monarch_power = ADM
    
            potential = {
    
            OR = {
            has_idea_group = galle0
            has_idea_group = gross0
            has_idea_group = handel0
            
            }
            
            OR = {
            has_idea_group = aristo0
            has_idea_group = monarchie0
            has_idea_group = horde0
            }
                
        }
        allow = {
            OR = {
                full_idea_group = galle0
                full_idea_group = gross0
                full_idea_group = handel0
                }
            OR = {
            full_idea_group = aristo0
            full_idea_group = monarchie0
            full_idea_group = horde0
            }	
        }
        
        legitimacy = 2
        devotion = 1
        horde_unity = 1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    
    idea_variation_act_360 = {
    
    monarch_power = DIP
    
            potential = {
            has_idea_group = soldnerheer0 
            OR = {
            has_idea_group = handel0
            has_idea_group = galle0
            has_idea_group = gross0
            }
                
        }
        allow = {
            full_idea_group = soldnerheer0 
            OR = {
            full_idea_group = handel0
            full_idea_group = galle0
            full_idea_group = gross0
            }
        }
        
        privateer_efficiency = 1
        naval_maintenance_modifier = -0.25
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_361 = {
    
    monarch_power = DIP
    
            potential = {
            has_idea_group = justiz0
            OR = {
            has_idea_group = handel0
            has_idea_group = galle0
            has_idea_group = gross0
            }
                
        }
        allow = {
            full_idea_group = justiz0
            OR = {
            full_idea_group = handel0
            full_idea_group = galle0
            full_idea_group = gross0
            }
        }
        
        naval_morale = 0.15				# Marine
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_362 = {
    
    monarch_power = DIP
    
            potential = {
            has_idea_group = defensive_ideas
            OR = {
            has_idea_group = handel0
            has_idea_group = galle0
            has_idea_group = gross0
            }
                
        }
        allow = {
            full_idea_group = defensive_ideas
            OR = {
            full_idea_group = handel0
            full_idea_group = galle0
            full_idea_group = gross0
            }
        }
        
        defensiveness = 0.1
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_363 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = handel0
            has_idea_group = offensive_ideas
                
        }
        allow = {
            full_idea_group = handel0
            full_idea_group = offensive_ideas
        }
        
        siege_blockade_progress = 1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_364 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = gross0
            has_idea_group = offensive_ideas
                
        }
        allow = {
            full_idea_group = gross0
            full_idea_group = offensive_ideas
        }
        
        heavy_ship_power = 0.15				# Marine
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_365 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = gross0
            has_idea_group = economic_ideas
                
        }
        allow = {
            full_idea_group = gross0
            full_idea_group = economic_ideas
        }
        
        global_tax_modifier = 0.2
        heavy_ship_cost = -0.1
    
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0.75
                NOT = { tax_income_percentage = 0.25 }
            }			
            modifier = {
                factor = 1.5
                tax_income_percentage = 0.45
            }
            modifier = {
                factor = 1.5
                tax_income_percentage = 0.7
            }
        }
    }
    
    idea_variation_act_366 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = gross0
            has_idea_group = republik0
                
        }
        allow = {
            full_idea_group = gross0
            full_idea_group = republik0
        }
    
        navy_tradition = 2
        republican_tradition = 0.5
    
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_367 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = gross0
            has_idea_group = diktatur0
                
        }
        allow = {
            full_idea_group = gross0
            full_idea_group = diktatur0
        }
        
        navy_tradition = 2
        prestige = 1
        
        
        ai_will_do = {
            factor = 1
        }
    }
    
    idea_variation_act_368 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = galle0
            has_idea_group = economic_ideas
                
        }
        allow = {
            full_idea_group = galle0
            full_idea_group = economic_ideas
        }
        
        production_efficiency = 0.20
        galley_cost = -0.1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { production_income_percentage = 0.1 }
            }			
            modifier = {
                factor = 1.5
                production_income_percentage = 0.2
            }
            modifier = {
                factor = 1.5
                production_income_percentage = 0.3
            }
            modifier = {
                factor = 1.5
                production_income_percentage = 0.4
            }
            modifier = {
                factor = 1.5
                production_income_percentage = 0.5
            }		
        }
    }
    
    idea_variation_act_369 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_discovery
            has_idea_group = galle0
            has_idea_group = republik0
                
        }
        allow = {
            current_age = age_of_discovery
            full_idea_group = galle0
            full_idea_group = republik0
        }
        
        navy_tradition = 1
        naval_forcelimit = 10
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_369_1 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_reformation
            has_idea_group = galle0
            has_idea_group = republik0
                
        }
        allow = {
            current_age = age_of_reformation
            full_idea_group = galle0
            full_idea_group = republik0
        }
        
        navy_tradition = 1
        naval_forcelimit = 20
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_369_2 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_absolutism
            has_idea_group = galle0
            has_idea_group = republik0
                
        }
        allow = {
            current_age = age_of_absolutism
            full_idea_group = galle0
            full_idea_group = republik0
        }
        
        navy_tradition = 1
        naval_forcelimit = 30
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_369_3 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_revolutions
            has_idea_group = galle0
            has_idea_group = republik0
                
        }
        allow = {
            current_age = age_of_revolutions
            full_idea_group = galle0
            full_idea_group = republik0
        }
        
        navy_tradition = 1
        naval_forcelimit = 40
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_370 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = galle0
            has_idea_group = diktatur0
                
        }
        allow = {
            full_idea_group = galle0
            full_idea_group = diktatur0
        }
        
        galley_power = 0.25				# Marine
        naval_morale = -0.1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_371 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = gross0
            has_idea_group = festung0
                
        }
        allow = {
            full_idea_group = gross0
            full_idea_group = festung0
        }
        
        heavy_ship_power = 0.15				# Marine
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    
    idea_variation_act_372 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = galle0
            has_idea_group = festung0
                
        }
        allow = {
            full_idea_group = galle0
            full_idea_group = festung0
        }
        
        galley_power = 0.075				# Marine
        capture_ship_chance = 0.075
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_373 = {
    
        monarch_power = MIL
    
        potential = {
            current_age = age_of_discovery
            has_idea_group = militarismus0
            has_idea_group = innovativeness_ideas
                
        }
        allow = {
            current_age = age_of_discovery
            full_idea_group = militarismus0
            full_idea_group = innovativeness_ideas
        }
        
        global_manpower = 10.0
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_373_1 = {
    
        monarch_power = MIL
    
        potential = {
            current_age = age_of_reformation
            has_idea_group = militarismus0
            has_idea_group = innovativeness_ideas
                
        }
        allow = {
            current_age = age_of_reformation
            full_idea_group = militarismus0
            full_idea_group = innovativeness_ideas
        }
        
        global_manpower = 20.0
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_373_2 = {
    
        monarch_power = MIL
    
        potential = {
            current_age = age_of_absolutism
            has_idea_group = militarismus0
            has_idea_group = innovativeness_ideas
                
        }
        allow = {
            current_age = age_of_absolutism
            full_idea_group = militarismus0
            full_idea_group = innovativeness_ideas
        }
        
        global_manpower = 30.0
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_373_3 = {
    
        monarch_power = MIL
    
        potential = {
            current_age = age_of_revolutions
            has_idea_group = militarismus0
            has_idea_group = innovativeness_ideas
                
        }
        allow = {
            current_age = age_of_revolutions
            full_idea_group = militarismus0
            full_idea_group = innovativeness_ideas
        }
        
        global_manpower = 40.0
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_374 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = militarismus0
            has_idea_group = economic_ideas
                
        }
        allow = {
            full_idea_group = militarismus0
            full_idea_group = economic_ideas
        }
        
        infantry_power = 0.075
        cavalry_power = 0.075
        artillery_power = 0.075
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_375 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = militarismus0
            has_idea_group = expansion_ideas
            
        }
        allow = {
            full_idea_group = militarismus0
            full_idea_group = expansion_ideas
        }
        
        discipline = 0.03
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_376 = {
    
        monarch_power = ADM				# Besonderer Fall
    
        potential = {
            has_idea_group = militarismus0
            has_idea_group = administrative_ideas
            
        }
        allow = {
            full_idea_group = militarismus0
            full_idea_group = administrative_ideas
        }
        
        land_morale = 0.05
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_377 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = militarismus0
            has_idea_group = humanist_ideas
                
        }
        allow = {
            full_idea_group = militarismus0
            full_idea_group = humanist_ideas
        }
        
        fire_damage = 0.05
        shock_damage = 0.05
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_378 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = militarismus0
            OR = {
            has_idea_group = religious_ideas   
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = orthodox0
            has_idea_group = islam0
            has_idea_group = cathar0
            has_idea_group = shinto0
            has_idea_group = norse0
            has_idea_group = budda0
            has_idea_group = confuci0 
            has_idea_group = hindu0
            has_idea_group = tengri0
            has_idea_group = coptic0
            has_idea_group = helle0
            has_idea_group = slav0
            has_idea_group = jew0
            has_idea_group = suomi0
            has_idea_group = romuva0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = mane0
            has_idea_group = ancli0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = nahu0
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
            }
                
        }
        allow = {
            full_idea_group = militarismus0
            OR = {
                full_idea_group = religious_ideas 
                full_idea_group = katholisch0
                full_idea_group = protestant0
                full_idea_group = reformiert0
                full_idea_group = orthodox0
                full_idea_group = islam0
                full_idea_group = cathar0
                full_idea_group = shinto0
                full_idea_group = norse0
                full_idea_group = budda0
                full_idea_group = confuci0 
                full_idea_group = hindu0
                full_idea_group = tengri0
                full_idea_group = coptic0
                full_idea_group = helle0
                full_idea_group = slav0
                full_idea_group = jew0
                full_idea_group = suomi0
                full_idea_group = romuva0
                full_idea_group = animist0
                full_idea_group = feti0
                full_idea_group = zoro0
                full_idea_group = mane0
                full_idea_group = ancli0
                full_idea_group = mesoam0
                full_idea_group = inti0
                full_idea_group = tote0
                full_idea_group = nahu0
                full_idea_group = shia0
                full_idea_group = ibadi0
                full_idea_group = hussite0
            }	
        }
        
        missionaries = 1
        global_unrest = -1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_379 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = militarismus0
            has_idea_group = justiz0
                
        }
        allow = {
            full_idea_group = militarismus0
            full_idea_group = justiz0
        }
        
        discipline = 0.03
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_380 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = militarismus0
            has_idea_group = entwicklung0
                
        }
        allow = {
            full_idea_group = militarismus0
            full_idea_group = entwicklung0
        }
        
        fort_maintenance_modifier = -0.1
        land_maintenance_modifier = -0.2
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_381 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = militarismus0
            has_idea_group = gesundheit0
                
        }
        allow = {
            full_idea_group = militarismus0
            full_idea_group = gesundheit0
        }
        
        global_trade_goods_size_modifier = 0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_382 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = militarismus0
            OR = {
            has_idea_group = aristo0
            has_idea_group = monarchie0
            has_idea_group = horde0
            }
                
        }
        allow = {
            full_idea_group = militarismus0
            OR = {
            full_idea_group = aristo0
            full_idea_group = monarchie0
            full_idea_group = horde0
            }
        }
        
        land_morale = 0.05
        shock_damage = 0.025
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_383 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = militarismus0
            has_idea_group = republik0
            
        }
        allow = {
            full_idea_group = militarismus0
            full_idea_group = republik0
        }
        
        land_forcelimit_modifier = 0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_384 = {
    
        monarch_power = ADM
    
        potential = {
            current_age = age_of_discovery
            has_idea_group = militarismus0
            has_idea_group = diktatur0
                
        }
        allow = {
            current_age = age_of_discovery
            full_idea_group = militarismus0
            full_idea_group = diktatur0
        }
        
        global_manpower = 5.0
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_384_1 = {
    
        monarch_power = ADM
    
        potential = {
            current_age = age_of_reformation
            has_idea_group = militarismus0
            has_idea_group = diktatur0
                
        }
        allow = {
            current_age = age_of_reformation
            full_idea_group = militarismus0
            full_idea_group = diktatur0
        }
        
        global_manpower = 10.0
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_384_2 = {
    
        monarch_power = ADM
    
        potential = {
            current_age = age_of_absolutism
            has_idea_group = militarismus0
            has_idea_group = diktatur0
                
        }
        allow = {
            current_age = age_of_absolutism
            full_idea_group = militarismus0
            full_idea_group = diktatur0
        }
        
        global_manpower = 15.0
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_384_3 = {
    
        monarch_power = ADM
    
        potential = {
            current_age = age_of_revolutions
            has_idea_group = militarismus0
            has_idea_group = diktatur0
                
        }
        allow = {
            current_age = age_of_revolutions
            full_idea_group = militarismus0
            full_idea_group = diktatur0
        }
        
        global_manpower = 20.0
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_385 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = militarismus0
            has_idea_group = staatsverwaltung0
                
        }
        allow = {
            full_idea_group = militarismus0
            full_idea_group = staatsverwaltung0
        }
        
        leader_land_fire = 1
        shock_damage_received = -0.025
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_386 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = militarismus0
            has_idea_group = spy_ideas 
                
        }
        allow = {
            full_idea_group = militarismus0
            full_idea_group = spy_ideas 
        }
        
        global_spy_defence = 0.35
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_387 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = militarismus0
            has_idea_group = dynasty0
                
        }
        allow = {
            full_idea_group = militarismus0
            full_idea_group = dynasty0
        }
        
        discipline = 0.03
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_388 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = militarismus0
            has_idea_group = influence_ideas 
                
        }
        allow = {
            full_idea_group = militarismus0
            full_idea_group = influence_ideas 
        }
        
        shock_damage = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_389 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = militarismus0
            has_idea_group = trade_ideas 
                
        }
        allow = {
            full_idea_group = militarismus0
            full_idea_group = trade_ideas 
        }
        
        fire_damage = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_390 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = militarismus0
            has_idea_group = exploration_ideas
                
        }
        allow = {
            full_idea_group = militarismus0
            full_idea_group = exploration_ideas
        }
        
        global_colonial_growth = 35
        native_uprising_chance = 0.5
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_391 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = militarismus0
            has_idea_group = maritime_ideas
                
        }
        allow = {
            full_idea_group = militarismus0
            full_idea_group = maritime_ideas
        }
        
        naval_morale = 0.15				# Marine
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_392 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = militarismus0
            has_idea_group = gross0
                
        }
        allow = {
            full_idea_group = militarismus0
            full_idea_group = gross0
        }
        
        heavy_ship_power = 0.15				# Marine
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_393 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = militarismus0
            has_idea_group = galle0
                
        }
        allow = {
            full_idea_group = militarismus0
            full_idea_group = galle0
        }
        
        galley_power = 0.15				# Marine
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_394 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = militarismus0
            has_idea_group = handel0
            
        }
        allow = {
            full_idea_group = militarismus0
            full_idea_group = handel0
        }
        
        light_ship_power = 0.15				# Marine
        transport_power = 0.15
        privateer_efficiency = 1.0
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_395 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = militarismus0
            has_idea_group = kolonialimperium0
                
        }
        allow = {
            full_idea_group = militarismus0
            full_idea_group = kolonialimperium0
        }
        
        infantry_power = 0.075
        global_manpower_modifier = 0.1
        
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_396 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = militarismus0
            has_idea_group = assimilation0
                
        }
        allow = {
            full_idea_group = militarismus0
            full_idea_group = assimilation0
        }
        
        global_manpower_modifier = 0.125
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_397 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = militarismus0
            has_idea_group = gesellschaft0
                
        }
        allow = {
            full_idea_group = militarismus0
            full_idea_group = gesellschaft0
            
            NOT = {
            calc_true_if = {
                amount = 3
                has_active_policy = idea_variation_act_105
                has_active_policy = idea_variation_act_144
                has_active_policy = idea_variation_act_214
                has_active_policy = idea_variation_act_229
                has_active_policy = idea_variation_act_248
                has_active_policy = idea_variation_act_334
                has_active_policy = idea_variation_act_397
                has_active_policy = idea_variation_act_513
                }
            }
        }
        
        interest = -1
        inflation_reduction = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_398 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = militarismus0
            has_idea_group = propaganda0
            
        }
        allow = {
            full_idea_group = militarismus0
            full_idea_group = propaganda0
        }
        
        war_exhaustion = -0.03
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_399 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = militarismus0
            has_idea_group = flottenbasis0
                
        }
        allow = {
            full_idea_group = militarismus0
            full_idea_group = flottenbasis0
        }
        
        defensiveness = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_400 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = militarismus0
            has_idea_group = nationalismus0
                
        }
        allow = {
            full_idea_group = militarismus0
            full_idea_group = nationalismus0
        }
        
        legitimacy = 2
        republican_tradition = 1
        devotion = 1
        horde_unity = 1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_401 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = militarismus0
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
    
    
                
        }
        allow = {
            full_idea_group = militarismus0
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
        }
        
        global_autonomy = -0.05
        imperial_authority = 0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_402 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = formation0
            has_idea_group = innovativeness_ideas
                
        }
        allow = {
            full_idea_group = formation0
            full_idea_group = innovativeness_ideas
        }
        
        manpower_recovery_speed = 0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_403 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = formation0
            has_idea_group = economic_ideas
                
        }
        allow = {
            full_idea_group = formation0
            full_idea_group = economic_ideas
        }
        
        global_institution_spread = 0.1
        embracement_cost = -0.2
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_404 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = formation0
            has_idea_group = expansion_ideas
                
        }
        allow = {
            full_idea_group = formation0
            full_idea_group = expansion_ideas
        }
        
        movement_speed = 0.25			
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_405 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = formation0
            has_idea_group = administrative_ideas
                
        }
        allow = {
            full_idea_group = formation0
            full_idea_group = administrative_ideas
        }
        
        shock_damage_received = -0.05
        fire_damage_received = -0.05
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_406 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = formation0
            has_idea_group = humanist_ideas
            
        }
        allow = {
            full_idea_group = formation0
            full_idea_group = humanist_ideas
        }
        
        discipline = 0.03
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_407 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = formation0
            OR = {
            has_idea_group = religious_ideas   
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = orthodox0
            has_idea_group = islam0
            has_idea_group = cathar0
            has_idea_group = shinto0
            has_idea_group = norse0
            has_idea_group = budda0
            has_idea_group = confuci0 
            has_idea_group = hindu0
            has_idea_group = tengri0
            has_idea_group = coptic0
            has_idea_group = helle0
            has_idea_group = slav0
            has_idea_group = jew0
            has_idea_group = suomi0
            has_idea_group = romuva0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = mane0
            has_idea_group = ancli0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = nahu0
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
            }
                
        }
        allow = {
            full_idea_group = formation0
            OR = {
                full_idea_group = religious_ideas 
                full_idea_group = katholisch0
                full_idea_group = protestant0
                full_idea_group = reformiert0
                full_idea_group = orthodox0
                full_idea_group = islam0
                full_idea_group = cathar0
                full_idea_group = shinto0
                full_idea_group = norse0
                full_idea_group = budda0
                full_idea_group = confuci0 
                full_idea_group = hindu0
                full_idea_group = tengri0
                full_idea_group = coptic0
                full_idea_group = helle0
                full_idea_group = slav0
                full_idea_group = jew0
                full_idea_group = suomi0
                full_idea_group = romuva0
                full_idea_group = animist0
                full_idea_group = feti0
                full_idea_group = zoro0
                full_idea_group = mane0
                full_idea_group = ancli0
                full_idea_group = mesoam0
                full_idea_group = inti0
                full_idea_group = tote0
                full_idea_group = nahu0
                full_idea_group = shia0
                full_idea_group = ibadi0
                full_idea_group = hussite0
            }	
        }
        
        shock_damage = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_408 = {
    
        monarch_power = ADM						# Besonderer Fall
    
        potential = {
            has_idea_group = formation0
            has_idea_group = justiz0
                
        }
        allow = {
            full_idea_group = formation0
            full_idea_group = justiz0
        }
        
        land_morale = 0.05					
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_409 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = formation0
            has_idea_group = entwicklung0
            
        }
        allow = {
            full_idea_group = formation0
            full_idea_group = entwicklung0
            
            NOT = {
            calc_true_if = {
                amount = 5
                has_active_policy = idea_variation_act_108
                has_active_policy = idea_variation_act_114
                has_active_policy = idea_variation_act_132
                has_active_policy = idea_variation_act_409
                has_active_policy = idea_variation_act_419
                has_active_policy = idea_variation_act_450
                has_active_policy = idea_variation_act_470
                has_active_policy = idea_variation_act_488
                has_active_policy = idea_variation_act_497
                }
            }
        }
        
        fire_damage_received = -0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_410 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = formation0
            has_idea_group = gesundheit0
                
        }
        allow = {
            full_idea_group = formation0
            full_idea_group = gesundheit0
        }
        
        manpower_recovery_speed = 0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_411 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = formation0
            OR = {
            has_idea_group = aristo0
            has_idea_group = monarchie0
            has_idea_group = horde0
            }
                
        }
        allow = {
            full_idea_group = formation0
            OR = {
            full_idea_group = aristo0
            full_idea_group = monarchie0
            full_idea_group = horde0
            }
        }
        
        infantry_power = 0.075
        shock_damage = 0.075
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_412 = {
    
        monarch_power = ADM
    
        potential = {
            current_age = age_of_discovery
            has_idea_group = formation0
            has_idea_group = republik0
                
        }
        allow = {
            current_age = age_of_discovery
            full_idea_group = formation0
            full_idea_group = republik0
        }
        
        land_forcelimit = 5
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_412_1 = {
    
        monarch_power = ADM
    
        potential = {
            current_age = age_of_reformation
            has_idea_group = formation0
            has_idea_group = republik0
                
        }
        allow = {
            current_age = age_of_reformation
            full_idea_group = formation0
            full_idea_group = republik0
        }
        
        land_forcelimit = 10
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_412_2 = {
    
        monarch_power = ADM
    
        potential = {
            current_age = age_of_absolutism
            has_idea_group = formation0
            has_idea_group = republik0
                
        }
        allow = {
            current_age = age_of_absolutism
            full_idea_group = formation0
            full_idea_group = republik0
        }
        
        land_forcelimit = 15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_412_3 = {
    
        monarch_power = ADM
    
        potential = {
            current_age = age_of_revolutions
            has_idea_group = formation0
            has_idea_group = republik0
                
        }
        allow = {
            current_age = age_of_revolutions	
            full_idea_group = formation0
            full_idea_group = republik0
        }
        
        land_forcelimit = 20
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_413 = {
    
        monarch_power = MIL
    
        potential = {
            current_age = age_of_discovery
            has_idea_group = formation0
            has_idea_group = diktatur0
                
        }
        allow = {
            current_age = age_of_discovery
            full_idea_group = formation0
            full_idea_group = diktatur0
        }
        
        global_manpower = 10.0
        shock_damage_received = 0.2
        shock_damage = 0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_413_1 = {
    
        monarch_power = MIL
    
        potential = {
            current_age = age_of_reformation
            has_idea_group = formation0
            has_idea_group = diktatur0
                
        }
        allow = {
            current_age = age_of_reformation
            full_idea_group = formation0
            full_idea_group = diktatur0
        }
        
        global_manpower = 20.0
        shock_damage_received = 0.2
        shock_damage = 0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_413_2 = {
    
        monarch_power = MIL
    
        potential = {
            current_age = age_of_absolutism
            has_idea_group = formation0
            has_idea_group = diktatur0
                
        }
        allow = {
            current_age = age_of_absolutism
            full_idea_group = formation0
            full_idea_group = diktatur0
        }
        
        global_manpower = 30.0
        shock_damage_received = 0.2
        shock_damage = 0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_413_3 = {
    
        monarch_power = MIL
    
        potential = {
            current_age = age_of_revolutions
            has_idea_group = formation0
            has_idea_group = diktatur0
                
        }
        allow = {
            current_age = age_of_revolutions
            full_idea_group = formation0
            full_idea_group = diktatur0
        }
        
        global_manpower = 40.0
        shock_damage_received = 0.2
        shock_damage = 0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_414 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = formation0
            has_idea_group = staatsverwaltung0
                
        }
        allow = {
            full_idea_group = formation0
            full_idea_group = staatsverwaltung0
        }
        
        fire_damage = 0.05
        fire_damage_received = -0.05
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_415 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = formation0
            has_idea_group = spy_ideas 
                
        }
        allow = {
            full_idea_group = formation0
            full_idea_group = spy_ideas 
        }
        
        shock_damage = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_416 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = formation0
            has_idea_group = dynasty0
                
        }
        allow = {
            full_idea_group = formation0
            full_idea_group = dynasty0
        }
        
        land_morale = 0.07
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_417 = {
    
        monarch_power = DIP				# Besonderer Fall
    
        potential = {
            has_idea_group = formation0
            has_idea_group = influence_ideas 
                
        }
        allow = {
            full_idea_group = formation0
            full_idea_group = influence_ideas 
        }
        
        land_morale = 0.05
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_418 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = formation0
            has_idea_group = trade_ideas 
                
        }
        allow = {
            full_idea_group = formation0
            full_idea_group = trade_ideas 
            
            NOT = {
            calc_true_if = {
                amount = 4
                has_active_policy = idea_variation_act_96
                has_active_policy = idea_variation_act_336
                has_active_policy = idea_variation_act_418
                has_active_policy = idea_variation_act_438
                has_active_policy = idea_variation_act_445
                has_active_policy = idea_variation_act_473
                }
            }
        }
        
        shock_damage_received = -0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_419 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = formation0
            has_idea_group = exploration_ideas
                
        }
        allow = {
            full_idea_group = formation0
            full_idea_group = exploration_ideas
            
            NOT = {
            calc_true_if = {
                amount = 5
                has_active_policy = idea_variation_act_108
                has_active_policy = idea_variation_act_114
                has_active_policy = idea_variation_act_132
                has_active_policy = idea_variation_act_409
                has_active_policy = idea_variation_act_419
                has_active_policy = idea_variation_act_450
                has_active_policy = idea_variation_act_470
                has_active_policy = idea_variation_act_488
                has_active_policy = idea_variation_act_497
                }
            }
        }
        
        fire_damage_received = -0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_420 = {
    
        monarch_power = DIP				# Marine
    
        potential = {
            has_idea_group = formation0
            has_idea_group = maritime_ideas
            
        }
        allow = {
            full_idea_group = formation0
            full_idea_group = maritime_ideas
        }
        
        galley_power = 0.075
        heavy_ship_power = 0.075
        light_ship_power = 0.075
        transport_power = 0.075
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_421 = {
    
        monarch_power = DIP				# Marine
    
        potential = {
            has_idea_group = formation0
            has_idea_group = gross0
                
        }
        allow = {
            full_idea_group = formation0
            full_idea_group = gross0
        }
        
        navy_tradition = 1
        naval_morale = 0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_422 = {
    
        monarch_power = DIP				# Marine
    
        potential = {
            has_idea_group = formation0
            has_idea_group = galle0
                
        }
        allow = {
            full_idea_group = formation0
            full_idea_group = galle0
        }
        
        galley_power = 0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_423 = {
    
        monarch_power = DIP				# Marine
    
        potential = {
            has_idea_group = formation0
            has_idea_group = handel0
                
        }
        allow = {
            full_idea_group = formation0
            full_idea_group = handel0
        }
        
        heavy_ship_power = 0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_424 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = formation0
            has_idea_group = kolonialimperium0
                
        }
        allow = {
            full_idea_group = formation0
            full_idea_group = kolonialimperium0
        }
        
        global_manpower_modifier = 0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_425 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = formation0
            has_idea_group = assimilation0
            
        }
        allow = {
            full_idea_group = formation0
            full_idea_group = assimilation0
            
            NOT = {
            calc_true_if = {
                amount = 3
                has_active_policy = idea_variation_act_588
                has_active_policy = idea_variation_act_591
                has_active_policy = idea_variation_act_21
                has_active_policy = idea_variation_act_138
                has_active_policy = idea_variation_act_425
                has_active_policy = idea_variation_act_502
                has_active_policy = idea_variation_act_551
                has_active_policy = idea_variation_act_529
                has_active_policy = idea_variation_act_516
    
                }
            }
        }
        
        build_cost = -0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_426 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = formation0
            has_idea_group = gesellschaft0
                
        }
        allow = {
            full_idea_group = formation0
            full_idea_group = gesellschaft0
        }
        
        global_tax_modifier = 0.3
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_427 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = formation0
            has_idea_group = propaganda0
                
        }
        allow = {
            full_idea_group = formation0
            full_idea_group = propaganda0
        }
        
        global_unrest = -3
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_428 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = formation0
            has_idea_group = flottenbasis0
                
        }
        allow = {
            full_idea_group = formation0
            full_idea_group = flottenbasis0
        }
        
        
        naval_morale = 0.1
        naval_forcelimit_modifier = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_429 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = formation0
            has_idea_group = nationalismus0
            
        }
        allow = {
            full_idea_group = formation0
            full_idea_group = nationalismus0
        }
        
        enemy_core_creation = 0.5
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_430 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = formation0
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
                
        }
        allow = {
            full_idea_group = formation0
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
        }
        
        num_accepted_cultures = 1
        trade_steering = 0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_431 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = offensive_ideas
            OR = {
            has_idea_group = aristo0
            has_idea_group = monarchie0
            has_idea_group = horde0
            }
                
        }
        allow = {
            full_idea_group = offensive_ideas
            OR = {
            full_idea_group = aristo0
            full_idea_group = monarchie0
            full_idea_group = horde0
            }
        }
        
        mercenary_discipline = 0.05
    
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_432 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = defensive_ideas
            OR = {
            has_idea_group = aristo0
            has_idea_group = monarchie0
            has_idea_group = horde0
            }
            
        }
        allow = {
            full_idea_group = defensive_ideas
            OR = {
            full_idea_group = aristo0
            full_idea_group = monarchie0
            full_idea_group = horde0
            }
        }
        
        global_own_trade_power = 0.2
        embargo_efficiency = 0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_433 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = quality_ideas
            OR = {
            has_idea_group = aristo0
            has_idea_group = monarchie0
            has_idea_group = horde0
            }
            
        }
        allow = {
            full_idea_group = quality_ideas
            OR = {
            full_idea_group = aristo0
            full_idea_group = monarchie0
            full_idea_group = horde0
            }
        }
        
        legitimacy = 2
        devotion = 1
        horde_unity = 1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_434 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = quantity_ideas
            OR = {
            has_idea_group = aristo0
            has_idea_group = monarchie0
            has_idea_group = horde0
            }
                
        }
        allow = {
            full_idea_group = quantity_ideas
            OR = {
            full_idea_group = aristo0
            full_idea_group = monarchie0
            full_idea_group = horde0
            }
        }
        
        land_morale = 0.05
        infantry_cost = -0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_435 = {
    
        monarch_power = DIP
    
        potential = {
    
            OR = {
            has_idea_group = galle0
            has_idea_group = gross0	
            }
            has_idea_group = quality_ideas
            
            
        }
        allow = {
            OR = {
                full_idea_group = galle0
                full_idea_group = gross0
                }
            
                full_idea_group = quality_ideas
                
            
        }
        
        
        naval_morale = 0.15				# Marine
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    
    idea_variation_act_436 = {
    
        monarch_power = MIL
    
        potential = {
    
            OR = {
            has_idea_group = galle0
            has_idea_group = handel0
            }
            has_idea_group = generalstab0
            
                
        }
        allow = {
            OR = {
                full_idea_group = galle0
                full_idea_group = handel0
                }
            
                full_idea_group = generalstab0
                
            
        }
        
        leader_naval_manuever = 1				# Marine
        leader_naval_shock = 1
        
        ai_will_do = {
            factor = 1
            modifier = {
                factor = 0
                NOT = { navy_size = 10 }
            }
            modifier = {
                factor = 0.6
                NOT = { navy_size = 20 }
            }
        }
    }
    
    idea_variation_act_437 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = kriegsproduktion0
            has_idea_group = propaganda0
            
        }
        allow = {
            full_idea_group = kriegsproduktion0
            full_idea_group = propaganda0
        }
        
        trade_efficiency = 0.1
        global_trade_goods_size_modifier = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_438 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = shock0
            OR = {
            has_idea_group = religious_ideas   
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = orthodox0
            has_idea_group = islam0
            has_idea_group = cathar0
            has_idea_group = shinto0
            has_idea_group = norse0
            has_idea_group = budda0
            has_idea_group = confuci0 
            has_idea_group = hindu0
            has_idea_group = tengri0
            has_idea_group = coptic0
            has_idea_group = helle0
            has_idea_group = slav0
            has_idea_group = jew0
            has_idea_group = suomi0
            has_idea_group = romuva0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = mane0
            has_idea_group = ancli0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = nahu0
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
            }
            
        }
        allow = {
            full_idea_group = shock0
            OR = {
                full_idea_group = religious_ideas 
                full_idea_group = katholisch0
                full_idea_group = protestant0
                full_idea_group = reformiert0
                full_idea_group = orthodox0
                full_idea_group = islam0
                full_idea_group = cathar0
                full_idea_group = shinto0
                full_idea_group = norse0
                full_idea_group = budda0
                full_idea_group = confuci0 
                full_idea_group = hindu0
                full_idea_group = tengri0
                full_idea_group = coptic0
                full_idea_group = helle0
                full_idea_group = slav0
                full_idea_group = jew0
                full_idea_group = suomi0
                full_idea_group = romuva0
                full_idea_group = animist0
                full_idea_group = feti0
                full_idea_group = zoro0
                full_idea_group = mane0
                full_idea_group = ancli0
                full_idea_group = mesoam0
                full_idea_group = inti0
                full_idea_group = tote0
                full_idea_group = nahu0
                full_idea_group = shia0
                full_idea_group = ibadi0
                full_idea_group = hussite0
            }
                
            NOT = {
            calc_true_if = {
                amount = 4
                has_active_policy = idea_variation_act_96
                has_active_policy = idea_variation_act_336
                has_active_policy = idea_variation_act_418
                has_active_policy = idea_variation_act_438
                has_active_policy = idea_variation_act_445
                has_active_policy = idea_variation_act_473
                }
            }	
        }
        
        shock_damage_received = -0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_439 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = shock0
            OR = {
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = monarchie0
            has_idea_group = horde0
            }
            
        }
        allow = {
            full_idea_group = shock0
            OR = {
            full_idea_group = republik0 
            full_idea_group = aristo0
            full_idea_group = monarchie0
            full_idea_group = horde0
            }	
        }
        
        shock_damage = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_440 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = shock0
            has_idea_group = innovativeness_ideas
            
        }
        allow = {
            full_idea_group = shock0
            full_idea_group = innovativeness_ideas
        }
        
        core_creation = -0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_441 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = shock0
            has_idea_group = spy_ideas
            
        }
        allow = {
            full_idea_group = shock0
            full_idea_group = spy_ideas
        }
        
        cav_to_inf_ratio = 0.15	
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_442 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = shock0
            has_idea_group = dynasty0
            
        }
        allow = {
            full_idea_group = shock0
            full_idea_group = dynasty0
        }
        
        shock_damage = 0.075
        leader_siege = 1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_443 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = shock0
            has_idea_group = influence_ideas
            
        }
        allow = {
            full_idea_group = shock0
            full_idea_group = influence_ideas
        }
        
        
        global_manpower_modifier = 0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_444 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = shock0
            has_idea_group = trade_ideas 
            
        }
        allow = {
            full_idea_group = shock0
            full_idea_group = trade_ideas 
        }
        
        embargo_efficiency = 0.25
        global_foreign_trade_power = 0.2
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_445 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = shock0
            has_idea_group = economic_ideas
            
        }
        allow = {
            full_idea_group = shock0
            full_idea_group = economic_ideas
            
            NOT = {
            calc_true_if = {
                amount = 4
                has_active_policy = idea_variation_act_96
                has_active_policy = idea_variation_act_336
                has_active_policy = idea_variation_act_418
                has_active_policy = idea_variation_act_438
                has_active_policy = idea_variation_act_445
                has_active_policy = idea_variation_act_473
                }
            }
        }
        
        shock_damage_received = -0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_446 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = shock0
            has_idea_group = exploration_ideas
            
        }
        allow = {
            full_idea_group = shock0
            full_idea_group = exploration_ideas
        }
        
        
        land_forcelimit_modifier = 0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_447 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = shock0
            has_idea_group = maritime_ideas
            
        }
        allow = {
            full_idea_group = shock0
            full_idea_group = maritime_ideas
        }
        
        heavy_ship_power = 0.075
        galley_power = 0.075				# Marine
        light_ship_power = 0.075
        transport_power = 0.075
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_448 = {
    
        monarch_power = ADM				# Besonderer Fall
    
        potential = {
            has_idea_group = shock0
            has_idea_group = expansion_ideas
            
        }
        allow = {
            full_idea_group = shock0
            full_idea_group = expansion_ideas
        }
        
        diplomatic_annexation_cost = -0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_449 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = shock0
            has_idea_group = administrative_ideas
            
        }
        allow = {
            full_idea_group = shock0
            full_idea_group = administrative_ideas
        }
        
        global_missionary_strength = 0.03
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_450 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = shock0
            has_idea_group = humanist_ideas
            
        }
        allow = {
            full_idea_group = shock0
            full_idea_group = humanist_ideas
            
            NOT = {
            calc_true_if = {
                amount = 5
                has_active_policy = idea_variation_act_108
                has_active_policy = idea_variation_act_114
                has_active_policy = idea_variation_act_132
                has_active_policy = idea_variation_act_409
                has_active_policy = idea_variation_act_419
                has_active_policy = idea_variation_act_450
                has_active_policy = idea_variation_act_470
                has_active_policy = idea_variation_act_488
                has_active_policy = idea_variation_act_497
                }
            }
        }
        
        fire_damage_received = -0.1	
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_451 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = shock0
            has_idea_group = justiz0 
            
        }
        allow = {
            full_idea_group = shock0
            full_idea_group = justiz0 
        }
        
        land_morale = 0.07				
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_452 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = shock0
            has_idea_group = entwicklung0
            
        }
        allow = {
            full_idea_group = shock0
            full_idea_group = entwicklung0
            
            NOT = {
            calc_true_if = {
                amount = 2
                has_idea = organised_construction
                has_idea = zentra1
                }
            }
        }
        
        build_time = -0.5
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_453 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = shock0
            has_idea_group = gesundheit0 
            
        }
        allow = {
            full_idea_group = shock0
            full_idea_group = gesundheit0 
        }
        
        global_unrest = -3
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_454 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = shock0
            has_idea_group = diktatur0
            
        }
        allow = {
            full_idea_group = shock0
            full_idea_group = diktatur0
        }
        
        shock_damage = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_455 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = shock0
            has_idea_group = gross0 
            
        }
        allow = {
            full_idea_group = shock0
            full_idea_group = gross0 
        }
        
        heavy_ship_power = 0.15						# Marine
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_456 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = shock0
            has_idea_group = handel0
            
        }
        allow = {
            full_idea_group = shock0
            full_idea_group = handel0
        }
        
        light_ship_power = 0.2						# Marine
        transport_power = 0.2
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_457 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = shock0
            has_idea_group = galle0
            
        }
        allow = {
            full_idea_group = shock0
            full_idea_group = galle0
        }
        
        galley_power = 0.15					# Marine
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_458 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = shock0
            has_idea_group = kolonialimperium0
            
        }
        allow = {
            full_idea_group = shock0
            full_idea_group = kolonialimperium0
        }
        
        reduced_liberty_desire = 10
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_459 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = shock0
            has_idea_group = assimilation0 
            
        }
        allow = {
            full_idea_group = shock0
            full_idea_group = assimilation0 
        }
        
        cavalry_power = 0.1		
        cav_to_inf_ratio = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_460 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = shock0
            has_idea_group = gesellschaft0
            
        }
        allow = {
            full_idea_group = shock0
            full_idea_group = gesellschaft0
        }
        
        culture_conversion_cost = -0.2
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_461 = {
    
        monarch_power = MIL
    
        potential = {
            current_age = age_of_discovery
            has_idea_group = shock0
            has_idea_group = propaganda0
            
        }
        allow = {
            current_age = age_of_discovery
            full_idea_group = shock0
            full_idea_group = propaganda0
        }
        
        global_manpower = 10.0
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_461_1 = {
    
        monarch_power = MIL
    
        potential = {
            current_age = age_of_reformation
            has_idea_group = shock0
            has_idea_group = propaganda0
            
        }
        allow = {
            current_age = age_of_reformation
            full_idea_group = shock0
            full_idea_group = propaganda0
        }
        
        global_manpower = 20.0
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_461_2 = {
    
        monarch_power = MIL
    
        potential = {
            current_age = age_of_absolutism
            has_idea_group = shock0
            has_idea_group = propaganda0
            
        }
        allow = {
            current_age = age_of_absolutism
            full_idea_group = shock0
            full_idea_group = propaganda0
        }
        
        global_manpower = 30.0
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_461_3 = {
    
        monarch_power = MIL
    
        potential = {
            current_age = age_of_revolutions
            has_idea_group = shock0
            has_idea_group = propaganda0
            
        }
        allow = {
            current_age = age_of_revolutions
            full_idea_group = shock0
            full_idea_group = propaganda0
        }
        
        global_manpower = 40.0
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_462 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_discovery
            has_idea_group = shock0
            has_idea_group = flottenbasis0
            
        }
        allow = {
            current_age = age_of_discovery
            full_idea_group = shock0
            full_idea_group = flottenbasis0
        }
        
        global_sailors = 2500
        naval_forcelimit = 10
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_462_1 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_reformation
            has_idea_group = shock0
            has_idea_group = flottenbasis0
            
        }
        allow = {
            current_age = age_of_reformation
            full_idea_group = shock0
            full_idea_group = flottenbasis0
        }
        
        global_sailors = 5000
        naval_forcelimit = 20
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_462_2 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_absolutism
            has_idea_group = shock0
            has_idea_group = flottenbasis0
            
        }
        allow = {
            current_age = age_of_absolutism
            full_idea_group = shock0
            full_idea_group = flottenbasis0
        }
        
        global_sailors = 7500
        naval_forcelimit = 30
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_462_3 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_revolutions
            has_idea_group = shock0
            has_idea_group = flottenbasis0
            
        }
        allow = {
            current_age = age_of_revolutions
            full_idea_group = shock0
            full_idea_group = flottenbasis0
        }
        
        global_sailors = 10000
        naval_forcelimit = 40
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_463 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = shock0
            has_idea_group = nationalismus0
            
        }
        allow = {
            full_idea_group = shock0
            full_idea_group = nationalismus0
        }
        
        shock_damage = 0.05
        shock_damage_received = -0.05
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_464 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_discovery
            has_idea_group = shock0
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
            
        }
        allow = {
            current_age = age_of_discovery
            full_idea_group = shock0
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
        }
        
        global_sailors = 5000
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_464_1 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_reformation
            has_idea_group = shock0
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
            
        }
        allow = {
            current_age = age_of_reformation
            full_idea_group = shock0
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
        }
        
        global_sailors = 10000
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_464_2 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_absolutism
            has_idea_group = shock0
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
            
        }
        allow = {
            current_age = age_of_absolutism
            full_idea_group = shock0
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
        }
        
        global_sailors = 15000
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_464_3 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_revolutions
            has_idea_group = shock0
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
            
        }
        allow = {
            current_age = age_of_revolutions
            full_idea_group = shock0
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
        }
        
        global_sailors = 20000
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_465 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = shock0
            has_idea_group = staatsverwaltung0 
            
        }
        allow = {
            full_idea_group = shock0
            full_idea_group = staatsverwaltung0 
        }
        
        global_trade_goods_size_modifier = 0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_466 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = shock0
            has_idea_group = zentra0
            
        }
        allow = {
            full_idea_group = shock0
            full_idea_group = zentra0
        }
        
        shock_damage = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_467 = {
    
        monarch_power = MIL
    
        potential = {
            current_age = age_of_discovery
            has_idea_group = shock0
            has_idea_group = dezentra0
            
        }
        allow = {
            current_age = age_of_discovery
            full_idea_group = shock0
            full_idea_group = dezentra0
        }
        
        global_manpower = 7.5
        global_manpower_modifier = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_467_1 = {
    
        monarch_power = MIL
    
        potential = {
            current_age = age_of_reformation
            has_idea_group = shock0
            has_idea_group = dezentra0
            
        }
        allow = {
            current_age = age_of_reformation
            full_idea_group = shock0
            full_idea_group = dezentra0
        }
        
        global_manpower = 15
        global_manpower_modifier = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_467_2 = {
    
        monarch_power = MIL
    
        potential = {
            current_age = age_of_absolutism
            has_idea_group = shock0
            has_idea_group = dezentra0
            
        }
        allow = {
            current_age = age_of_absolutism
            full_idea_group = shock0
            full_idea_group = dezentra0
        }
        
        global_manpower = 22.5
        global_manpower_modifier = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_467_3 = {
    
        monarch_power = MIL
    
        potential = {
            current_age = age_of_revolutions
            has_idea_group = shock0
            has_idea_group = dezentra0
            
        }
        allow = {
            current_age = age_of_revolutions
            full_idea_group = shock0
            full_idea_group = dezentra0
        }
        
        global_manpower = 30
        global_manpower_modifier = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_468 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = fire0
            OR = {
            has_idea_group = religious_ideas   
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = orthodox0
            has_idea_group = islam0
            has_idea_group = cathar0
            has_idea_group = shinto0
            has_idea_group = norse0
            has_idea_group = budda0
            has_idea_group = confuci0 
            has_idea_group = hindu0
            has_idea_group = tengri0
            has_idea_group = coptic0
            has_idea_group = helle0
            has_idea_group = slav0
            has_idea_group = jew0
            has_idea_group = suomi0
            has_idea_group = romuva0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = mane0
            has_idea_group = ancli0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = nahu0
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
            }
            
        }
        allow = {
            full_idea_group = fire0
            OR = {
                full_idea_group = religious_ideas 
                full_idea_group = katholisch0
                full_idea_group = protestant0
                full_idea_group = reformiert0
                full_idea_group = orthodox0
                full_idea_group = islam0
                full_idea_group = cathar0
                full_idea_group = shinto0
                full_idea_group = norse0
                full_idea_group = budda0
                full_idea_group = confuci0 
                full_idea_group = hindu0
                full_idea_group = tengri0
                full_idea_group = coptic0
                full_idea_group = helle0
                full_idea_group = slav0
                full_idea_group = jew0
                full_idea_group = suomi0
                full_idea_group = romuva0
                full_idea_group = animist0
                full_idea_group = feti0
                full_idea_group = zoro0
                full_idea_group = mane0
                full_idea_group = ancli0
                full_idea_group = mesoam0
                full_idea_group = inti0
                full_idea_group = tote0
                full_idea_group = nahu0
                full_idea_group = shia0
                full_idea_group = ibadi0
                full_idea_group = hussite0
            }	
        }
        
        legitimacy = 2
        republican_tradition = 1
        devotion = 1
        horde_unity = 1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_469 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = fire0
            OR = {
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = monarchie0
            has_idea_group = horde0
            }
            
        }
        allow = {
            full_idea_group = fire0
            OR = {
            full_idea_group = republik0 
            full_idea_group = aristo0
            full_idea_group = monarchie0
            full_idea_group = horde0
            }	
        }
        
        artillery_cost = -0.2
        infantry_cost = -0.1			
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_470 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            
        }
        allow = {
            full_idea_group = fire0
            full_idea_group = innovativeness_ideas
            
            NOT = {
            calc_true_if = {
                amount = 5
                has_active_policy = idea_variation_act_108
                has_active_policy = idea_variation_act_114
                has_active_policy = idea_variation_act_132
                has_active_policy = idea_variation_act_409
                has_active_policy = idea_variation_act_419
                has_active_policy = idea_variation_act_450
                has_active_policy = idea_variation_act_470
                has_active_policy = idea_variation_act_488
                has_active_policy = idea_variation_act_497
                }
            }
        }
        
        fire_damage_received = -0.1	
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_471 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = fire0
            has_idea_group = spy_ideas
            
        }
        allow = {
            full_idea_group = fire0
            full_idea_group = spy_ideas
        }
        
        diplomatic_reputation = 1
        diplomatic_upkeep = 1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_472 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = fire0
            has_idea_group = dynasty0
            
        }
        allow = {
            full_idea_group = fire0
            full_idea_group = dynasty0
        }
        
        manpower_recovery_speed = 0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_473 = {
    
        monarch_power = MIL			
    
        potential = {
            has_idea_group = fire0
            has_idea_group = influence_ideas
            
        }
        allow = {
            full_idea_group = fire0
            full_idea_group = influence_ideas
            
            NOT = {
            calc_true_if = {
                amount = 4
                has_active_policy = idea_variation_act_96
                has_active_policy = idea_variation_act_336
                has_active_policy = idea_variation_act_418
                has_active_policy = idea_variation_act_438
                has_active_policy = idea_variation_act_445
                has_active_policy = idea_variation_act_473
                }
            }
        }
        
        shock_damage_received = -0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_474 = {
    
        monarch_power = MIL				
    
        potential = {
            has_idea_group = fire0
            has_idea_group = trade_ideas 
            
        }
        allow = {
            full_idea_group = fire0
            full_idea_group = trade_ideas 
        }
        
        fire_damage = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_475 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = fire0
            has_idea_group = economic_ideas
            
        }
        allow = {
            full_idea_group = fire0
            full_idea_group = economic_ideas
        }
        
        production_efficiency = 0.3
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_476 = {
    
        monarch_power = MIL			
    
        potential = {
            has_idea_group = fire0
            has_idea_group = exploration_ideas
            
        }
        allow = {
            full_idea_group = fire0
            full_idea_group = exploration_ideas
        }
        
        fire_damage = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_477 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = fire0
            has_idea_group = maritime_ideas
            
        }
        allow = {
            full_idea_group = fire0
            full_idea_group = maritime_ideas
        }
        
        heavy_ship_power = 0.075
        galley_power = 0.075				# Marine
        light_ship_power = 0.075
        transport_power = 0.075
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_478 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = fire0
            has_idea_group = expansion_ideas
            
        }
        allow = {
            full_idea_group = fire0
            full_idea_group = expansion_ideas
        }
        
        land_morale = 0.07
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_479 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = fire0
            has_idea_group = administrative_ideas
            
        }
        allow = {
            full_idea_group = fire0
            full_idea_group = administrative_ideas
        }
        
        fire_damage = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_480 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = fire0
            has_idea_group = humanist_ideas
            
        }
        allow = {
            full_idea_group = fire0
            full_idea_group = humanist_ideas
        }
        
        land_morale = 0.07
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_481 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = fire0
            has_idea_group = justiz0 
            
        }
        allow = {
            full_idea_group = fire0
            full_idea_group = justiz0 
        }
        
        province_warscore_cost = -0.2
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_482 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = fire0
            has_idea_group = entwicklung0
            
        }
        allow = {
            full_idea_group = fire0
            full_idea_group = entwicklung0
        }
        
        siege_ability = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_483 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = fire0
            has_idea_group = gesundheit0 
            
        }
        allow = {
            full_idea_group = fire0
            full_idea_group = gesundheit0 
        }
        
        reinforce_speed = 0.15
        manpower_recovery_speed = 0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_484 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = fire0
            has_idea_group = diktatur0
            
        }
        allow = {
            full_idea_group = fire0
            full_idea_group = diktatur0
        }
        
        reinforce_speed = 0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_485 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = fire0
            has_idea_group = gross0 
            
        }
        allow = {
            full_idea_group = fire0
            full_idea_group = gross0 
        }
        
        heavy_ship_power = 0.15				# Marine
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_486 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = fire0
            has_idea_group = handel0
            
        }
        allow = {
            full_idea_group = fire0
            full_idea_group = handel0
        }
    
        light_ship_power = 0.3				# Marine
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_487 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = fire0
            has_idea_group = galle0
            
        }
        allow = {
            full_idea_group = fire0
            full_idea_group = galle0
        }
        
        galley_power = 0.15				# Marine
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_488 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = fire0
            has_idea_group = kolonialimperium0
            
        }
        allow = {
            full_idea_group = fire0
            full_idea_group = kolonialimperium0
            
            NOT = {
            calc_true_if = {
                amount = 5
                has_active_policy = idea_variation_act_108
                has_active_policy = idea_variation_act_114
                has_active_policy = idea_variation_act_132
                has_active_policy = idea_variation_act_409
                has_active_policy = idea_variation_act_419
                has_active_policy = idea_variation_act_450
                has_active_policy = idea_variation_act_470
                has_active_policy = idea_variation_act_488
                has_active_policy = idea_variation_act_497
                }
            }
        }
        
        fire_damage_received = -0.1	
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_489 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = fire0
            has_idea_group = assimilation0 
            
        }
        allow = {
            full_idea_group = fire0
            full_idea_group = assimilation0 
        }
        
        fire_damage = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_490 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = fire0
            has_idea_group = gesellschaft0
            
        }
        allow = {
            full_idea_group = fire0
            full_idea_group = gesellschaft0
        }
        
        yearly_absolutism = 1.0
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_491 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = fire0
            has_idea_group = propaganda0
            
        }
        allow = {
            full_idea_group = fire0
            full_idea_group = propaganda0
            
            NOT = {
            calc_true_if = {
                amount = 2
                has_active_policy = idea_variation_act_611
                has_active_policy = idea_variation_act_617
                has_active_policy = idea_variation_act_620
                has_active_policy = idea_variation_act_50
                has_active_policy = idea_variation_act_152
                has_active_policy = idea_variation_act_215
                has_active_policy = idea_variation_act_491
                has_active_policy = idea_variation_act_500
    
                }
            }
        }
        
        improve_relation_modifier = 0.2
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_492 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = fire0
            has_idea_group = flottenbasis0
            
        }
        allow = {
            full_idea_group = fire0
            full_idea_group = flottenbasis0
        }
        
        fire_damage = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_493 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = fire0
            has_idea_group = nationalismus0
            
        }
        allow = {
            full_idea_group = fire0
            full_idea_group = nationalismus0
        }
        
        land_maintenance_modifier = -0.2
    
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_494 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = fire0
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
            
        }
        allow = {
            full_idea_group = fire0
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
        }
        
        prestige = 2
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_495 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = fire0
            has_idea_group = staatsverwaltung0 
            
        }
        allow = {
            full_idea_group = fire0
            full_idea_group = staatsverwaltung0 
        }
        
        trade_efficiency = 0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_496 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = fire0
            has_idea_group = zentra0
            
        }
        allow = {
            full_idea_group = fire0
            full_idea_group = zentra0
        }
        
        global_trade_goods_size_modifier = 0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_497 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = fire0
            has_idea_group = dezentra0
            
        }
        allow = {
            full_idea_group = fire0
            full_idea_group = dezentra0
            
            NOT = {
            calc_true_if = {
                amount = 5
                has_active_policy = idea_variation_act_108
                has_active_policy = idea_variation_act_114
                has_active_policy = idea_variation_act_132
                has_active_policy = idea_variation_act_409
                has_active_policy = idea_variation_act_419
                has_active_policy = idea_variation_act_450
                has_active_policy = idea_variation_act_470
                has_active_policy = idea_variation_act_488
                has_active_policy = idea_variation_act_497
                }
            }
        }
        
        fire_damage_received = -0.1	
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    
    idea_variation_act_498 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = zentra0
            has_idea_group = spy_ideas
            
        }
        allow = {
            full_idea_group = zentra0
            full_idea_group = spy_ideas
            
            NOT = {
            calc_true_if = {
                amount = 3
                has_active_policy = idea_variation_act_13
                has_active_policy = idea_variation_act_578
                has_active_policy = idea_variation_act_206
                has_active_policy = idea_variation_act_219
                has_active_policy = idea_variation_act_227
                has_active_policy = idea_variation_act_333
                has_active_policy = idea_variation_act_498
    
                }
            }
        }
        
        idea_cost = -0.075
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_499 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = zentra0
            has_idea_group = dynasty0
            
        }
        allow = {
            full_idea_group = zentra0
            full_idea_group = dynasty0
        }
        
        diplomats = 1
        diplomatic_upkeep = 1
    
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_500 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = zentra0
            has_idea_group = influence_ideas
            
        }
        allow = {
            full_idea_group = zentra0
            full_idea_group = influence_ideas
            
            NOT = {
            calc_true_if = {
                amount = 2
                has_active_policy = idea_variation_act_611
                has_active_policy = idea_variation_act_617
                has_active_policy = idea_variation_act_620
                has_active_policy = idea_variation_act_50
                has_active_policy = idea_variation_act_152
                has_active_policy = idea_variation_act_215
                has_active_policy = idea_variation_act_491
                has_active_policy = idea_variation_act_500
    
                }
            }
        }
        
        improve_relation_modifier = 0.2
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_501 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = zentra0
            has_idea_group = offensive_ideas
            
        }
        allow = {
            full_idea_group = zentra0
            full_idea_group = offensive_ideas
        }
        
        land_morale = 0.05
        artillery_power = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_502 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = zentra0
            has_idea_group = defensive_ideas
            
        }
        allow = {
            full_idea_group = zentra0
            full_idea_group = defensive_ideas
            
            NOT = {
            calc_true_if = {
                amount = 3
                has_active_policy = idea_variation_act_588
                has_active_policy = idea_variation_act_591
                has_active_policy = idea_variation_act_21
                has_active_policy = idea_variation_act_138
                has_active_policy = idea_variation_act_425
                has_active_policy = idea_variation_act_502
                has_active_policy = idea_variation_act_551
                has_active_policy = idea_variation_act_529
                has_active_policy = idea_variation_act_516
    
                }
            }
        }
        
        build_cost = -0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_503 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = zentra0
            has_idea_group = trade_ideas
            
        }
        allow = {
            full_idea_group = zentra0
            full_idea_group = trade_ideas
            NOT = {
            calc_true_if = {
                amount = 2
                has_active_policy = idea_variation_act_23
                has_active_policy = idea_variation_act_153
                has_active_policy = idea_variation_act_169
                has_active_policy = idea_variation_act_238
                has_active_policy = idea_variation_act_302
                has_active_policy = idea_variation_act_340
                has_active_policy = idea_variation_act_92
                has_active_policy = idea_variation_act_566
                has_active_policy = idea_variation_act_532
                has_active_policy = idea_variation_act_528
                has_active_policy = idea_variation_act_514
                has_active_policy = idea_variation_act_503
                }
            }
        }
        
        development_cost = -0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_504 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = zentra0
            has_idea_group = exploration_ideas
            
        }
        allow = {
            full_idea_group = zentra0
            full_idea_group = exploration_ideas
        }
        
        colonists = 1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_505 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = zentra0
            has_idea_group = maritime_ideas
            
        }
        allow = {
            full_idea_group = zentra0
            full_idea_group = maritime_ideas
        }
        
        naval_forcelimit_modifier = 0.1
        naval_maintenance_modifier = -0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_506 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = zentra0
            has_idea_group = quality_ideas
            
        }
        allow = {
            full_idea_group = zentra0
            full_idea_group = quality_ideas
        }
        
        leader_naval_manuever = 2			# Marine
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_507 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = zentra0
            has_idea_group = quantity_ideas
            
        }
        allow = {
            full_idea_group = zentra0
            full_idea_group = quantity_ideas
        }
        
        discipline = 0.03
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_508 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = zentra0
            has_idea_group = gross0
            
        }
        allow = {
            full_idea_group = zentra0
            full_idea_group = gross0
        }
        
        naval_forcelimit_modifier = 0.15
        global_sailors_modifier = 0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_509 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = zentra0
            has_idea_group = handel0
            
        }
        allow = {
            full_idea_group = zentra0
            full_idea_group = handel0
        }
        
        naval_forcelimit_modifier = 0.33
        
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_510 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_discovery
            has_idea_group = zentra0
            has_idea_group = galle0
            
        }
        allow = {
            current_age = age_of_discovery
            full_idea_group = zentra0
            full_idea_group = galle0
        }
        
        naval_forcelimit = 10
        global_sailors = 1000
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_510_1 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_reformation
            has_idea_group = zentra0
            has_idea_group = galle0
            
        }
        allow = {
            current_age = age_of_reformation
            full_idea_group = zentra0
            full_idea_group = galle0
        }
        
        naval_forcelimit = 20
        global_sailors = 2000
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_510_2 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_absolutism
            has_idea_group = zentra0
            has_idea_group = galle0
            
        }
        allow = {
            current_age = age_of_absolutism
            full_idea_group = zentra0
            full_idea_group = galle0
        }
        
        naval_forcelimit = 30
        global_sailors = 3000
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_510_3 = {
    
        monarch_power = DIP
    
        potential = {
            current_age = age_of_revolutions
            has_idea_group = zentra0
            has_idea_group = galle0
            
        }
        allow = {
            current_age = age_of_revolutions
            full_idea_group = zentra0
            full_idea_group = galle0
        }
        
        naval_forcelimit = 40
        global_sailors = 4000
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_511 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = zentra0
            has_idea_group = kolonialimperium0
            
        }
        allow = {
            full_idea_group = zentra0
            full_idea_group = kolonialimperium0
        }
        
        global_tariffs = 0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_512 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = zentra0
            has_idea_group = assimilation0
            
        }
        allow = {
            full_idea_group = zentra0
            full_idea_group = assimilation0
        }
        
        global_colonial_growth = 15
        culture_conversion_cost = -0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_513 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = zentra0
            has_idea_group = gesellschaft0
            
        }
        allow = {
            full_idea_group = zentra0
            full_idea_group = gesellschaft0
            
            NOT = {
            calc_true_if = {
                amount = 3
                has_active_policy = idea_variation_act_105
                has_active_policy = idea_variation_act_144
                has_active_policy = idea_variation_act_214
                has_active_policy = idea_variation_act_229
                has_active_policy = idea_variation_act_248
                has_active_policy = idea_variation_act_334
                has_active_policy = idea_variation_act_397
                has_active_policy = idea_variation_act_513
                }
            }
        }
        
        interest = -2
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_514 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = zentra0
            has_idea_group = propaganda0
            
        }
        allow = {
            full_idea_group = zentra0
            full_idea_group = propaganda0
            NOT = {
            calc_true_if = {
                amount = 2
                has_active_policy = idea_variation_act_23
                has_active_policy = idea_variation_act_153
                has_active_policy = idea_variation_act_169
                has_active_policy = idea_variation_act_238
                has_active_policy = idea_variation_act_302
                has_active_policy = idea_variation_act_340
                has_active_policy = idea_variation_act_92
                has_active_policy = idea_variation_act_566
                has_active_policy = idea_variation_act_532
                has_active_policy = idea_variation_act_528
                has_active_policy = idea_variation_act_514
                has_active_policy = idea_variation_act_503
                }
            }
        }
        
        development_cost = -0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_515 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = zentra0
            has_idea_group = flottenbasis0
            
        }
        allow = {
            full_idea_group = zentra0
            full_idea_group = flottenbasis0
        }
        
        range = 0.5
    
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_516 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = zentra0
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
            
        }
        allow = {
            full_idea_group = zentra0
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
            NOT = {
            calc_true_if = {
                amount = 3
                has_active_policy = idea_variation_act_588
                has_active_policy = idea_variation_act_591
                has_active_policy = idea_variation_act_21
                has_active_policy = idea_variation_act_138
                has_active_policy = idea_variation_act_425
                has_active_policy = idea_variation_act_502
                has_active_policy = idea_variation_act_551
                has_active_policy = idea_variation_act_529
                has_active_policy = idea_variation_act_516
    
                }
            }
        }
        
        build_cost = -0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_517 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = zentra0
            has_idea_group = nationalismus0
            
        }
        allow = {
            full_idea_group = zentra0
            full_idea_group = nationalismus0
        }
        
        global_tax_modifier = 0.3
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    
    idea_variation_act_518 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = zentra0
            has_idea_group = stehendesheer0
            
        }
        allow = {
            full_idea_group = zentra0
            full_idea_group = stehendesheer0
        }
        
        land_forcelimit_modifier = 0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_519 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = zentra0
            has_idea_group = generalstab0
            
        }
        allow = {
            full_idea_group = zentra0
            full_idea_group = generalstab0
        }
        
        land_maintenance_modifier = -0.1
        naval_maintenance_modifier = -0.1
        fort_maintenance_modifier = -0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_520 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = zentra0
            has_idea_group = soldnerheer0
            
        }
        allow = {
            full_idea_group = zentra0
            full_idea_group = soldnerheer0
        }
        
        mercenary_manpower = 0.5
    
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_521 = {
    
        monarch_power = MIL				# Besonderer Fall
    
        potential = {
            has_idea_group = zentra0
            has_idea_group = wehrpflicht0 
            
        }
        allow = {
            full_idea_group = zentra0
            full_idea_group = wehrpflicht0 
        }
        
        manpower_recovery_speed = 0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_522 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = zentra0
            has_idea_group = waffenqualitat0
            
        }
        allow = {
            full_idea_group = zentra0
            full_idea_group = waffenqualitat0
        }
        
        siege_ability = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_523 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = zentra0
            has_idea_group = festung0 
            
        }
        allow = {
            full_idea_group = zentra0
            full_idea_group = festung0 
        }
        
        defensiveness = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_524 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = zentra0
            has_idea_group = kriegsproduktion0
            
        }
        allow = {
            full_idea_group = zentra0
            full_idea_group = kriegsproduktion0
        }
        
        fire_damage = 0.05
        shock_damage = 0.05
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_525 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = zentra0
            has_idea_group = formation0
            
        }
        allow = {
            full_idea_group = zentra0
            full_idea_group = formation0
        }
        
        diplomats = 1
        diplomatic_reputation = 1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_526 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = zentra0
            has_idea_group = militarismus0
            
        }
        allow = {
            full_idea_group = zentra0
            full_idea_group = militarismus0
        }
        
        army_tradition = 1
        army_tradition_decay = -0.01
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_527 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = dezentra0
            has_idea_group = spy_ideas
            
        }
        allow = {
            full_idea_group = dezentra0
            full_idea_group = spy_ideas
        }
        
        province_warscore_cost = -0.2
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_528 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = dezentra0
            has_idea_group = dynasty0
            
        }
        allow = {
            full_idea_group = dezentra0
            full_idea_group = dynasty0
            NOT = {
            calc_true_if = {
                amount = 2
                has_active_policy = idea_variation_act_23
                has_active_policy = idea_variation_act_153
                has_active_policy = idea_variation_act_169
                has_active_policy = idea_variation_act_238
                has_active_policy = idea_variation_act_302
                has_active_policy = idea_variation_act_340
                has_active_policy = idea_variation_act_92
                has_active_policy = idea_variation_act_566
                has_active_policy = idea_variation_act_532
                has_active_policy = idea_variation_act_528
                has_active_policy = idea_variation_act_514
                has_active_policy = idea_variation_act_503
                }
            }
        }
        
        development_cost = -0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_529 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = dezentra0
            has_idea_group = influence_ideas
            
        }
        allow = {
            full_idea_group = dezentra0
            full_idea_group = influence_ideas
            
            NOT = {
            calc_true_if = {
                amount = 3
                has_active_policy = idea_variation_act_588
                has_active_policy = idea_variation_act_591
                has_active_policy = idea_variation_act_21
                has_active_policy = idea_variation_act_138
                has_active_policy = idea_variation_act_425
                has_active_policy = idea_variation_act_502
                has_active_policy = idea_variation_act_551
                has_active_policy = idea_variation_act_529
                has_active_policy = idea_variation_act_516
    
                }
            }
        }
        
        build_cost = -0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_530 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = dezentra0
            has_idea_group = offensive_ideas
            
        }
        allow = {
            full_idea_group = dezentra0
            full_idea_group = offensive_ideas
        }
        
        advisor_pool = 2
        imperial_authority_value = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_531 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = dezentra0
            has_idea_group = defensive_ideas
            
        }
        allow = {
            full_idea_group = dezentra0
            full_idea_group = defensive_ideas
        }
        
        land_morale = 0.07
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_532 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = dezentra0
            has_idea_group = trade_ideas
            
        }
        allow = {
            full_idea_group = dezentra0
            full_idea_group = trade_ideas
            NOT = {
            calc_true_if = {
                amount = 2
                has_active_policy = idea_variation_act_23
                has_active_policy = idea_variation_act_153
                has_active_policy = idea_variation_act_169
                has_active_policy = idea_variation_act_238
                has_active_policy = idea_variation_act_302
                has_active_policy = idea_variation_act_340
                has_active_policy = idea_variation_act_92
                has_active_policy = idea_variation_act_566
                has_active_policy = idea_variation_act_532
                has_active_policy = idea_variation_act_528
                has_active_policy = idea_variation_act_514
                has_active_policy = idea_variation_act_503
                }
            }
        }
        
        development_cost = -0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_533 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = dezentra0
            has_idea_group = exploration_ideas
            
        }
        allow = {
            full_idea_group = dezentra0
            full_idea_group = exploration_ideas
        }
        
        colonists = 1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_534 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = dezentra0
            has_idea_group = maritime_ideas
            
        }
        allow = {
            full_idea_group = dezentra0
            full_idea_group = maritime_ideas
        }
        
        navy_tradition = 2
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_535 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = dezentra0
            has_idea_group = quality_ideas
            
        }
        allow = {
            full_idea_group = dezentra0
            full_idea_group = quality_ideas
        }
        
        infantry_power = 0.1
        cavalry_power = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_536 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = dezentra0
            has_idea_group = quantity_ideas
            
        }
        allow = {
            full_idea_group = dezentra0
            full_idea_group = quantity_ideas
        }
        
        global_manpower_modifier = 0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_537 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = dezentra0
            has_idea_group = gross0
            
        }
        allow = {
            full_idea_group = dezentra0
            full_idea_group = gross0
        }
        
        naval_morale = 0.15				# Marine
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_538 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = dezentra0
            has_idea_group = handel0
            
        }
        allow = {
            full_idea_group = dezentra0
            full_idea_group = handel0
        }
        
        heavy_ship_power = 0.075
        galley_power = 0.075				# Marine
        light_ship_power = 0.075
        transport_power = 0.075
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_539 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = dezentra0
            has_idea_group = galle0
            
        }
        allow = {
            full_idea_group = dezentra0
            full_idea_group = galle0
        }
        
        naval_morale = 0.15				# Marine
        
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_540 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = dezentra0
            has_idea_group = kolonialimperium0
            
        }
        allow = {
            full_idea_group = dezentra0
            full_idea_group = kolonialimperium0
        }
        
        range = 0.5
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_541 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = dezentra0
            has_idea_group = assimilation0
            
        }
        allow = {
            full_idea_group = dezentra0
            full_idea_group = assimilation0
        }
        
        num_accepted_cultures = 1
        culture_conversion_cost = -0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_542 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = dezentra0
            has_idea_group = gesellschaft0
            
        }
        allow = {
            full_idea_group = dezentra0
            full_idea_group = gesellschaft0
        }
        
        reduced_liberty_desire = 10
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_543 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = dezentra0
            has_idea_group = propaganda0
            
        }
        allow = {
            full_idea_group = dezentra0
            full_idea_group = propaganda0
        }
        
        yearly_absolutism = 1.0
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_544 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = dezentra0
            has_idea_group = flottenbasis0
            
        }
        allow = {
            full_idea_group = dezentra0
            full_idea_group = flottenbasis0
        }
        
        range = 0.5
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_545 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = dezentra0
            OR = {
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            }
            
        }
        allow = {
            full_idea_group = dezentra0
            OR = {
            full_idea_group = imperialismus0
            full_idea_group = konigreich0
            }
        }
        
        global_tax_modifier = 0.15
        production_efficiency = 0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_546 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = dezentra0
            has_idea_group = nationalismus0
            
        }
        allow = {
            full_idea_group = dezentra0
            full_idea_group = nationalismus0
        }
        
        enemy_core_creation = 0.5
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_547 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = dezentra0
            has_idea_group = stehendesheer0
            
        }
        allow = {
            full_idea_group = dezentra0
            full_idea_group = stehendesheer0
        }
    
        land_forcelimit_modifier = 0.1
        land_maintenance_modifier = -0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_548 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = dezentra0
            has_idea_group = generalstab0
            
        }
        allow = {
            full_idea_group = dezentra0
            full_idea_group = generalstab0
        }
        
        global_manpower_modifier = 0.125
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_549 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = dezentra0
            has_idea_group = soldnerheer0
            
        }
        allow = {
            full_idea_group = dezentra0
            full_idea_group = soldnerheer0
        }
        
        mercenary_manpower = 0.25
        war_exhaustion_cost = -0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_550 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = dezentra0
            has_idea_group = wehrpflicht0 
            
        }
        allow = {
            full_idea_group = dezentra0
            full_idea_group = wehrpflicht0 
        }
        
        land_morale = 0.07
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_551 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = dezentra0
            has_idea_group = waffenqualitat0
            
        }
        allow = {
            full_idea_group = dezentra0
            full_idea_group = waffenqualitat0
            
            NOT = {
            calc_true_if = {
                amount = 3
                has_active_policy = idea_variation_act_588
                has_active_policy = idea_variation_act_591
                has_active_policy = idea_variation_act_21
                has_active_policy = idea_variation_act_138
                has_active_policy = idea_variation_act_425
                has_active_policy = idea_variation_act_502
                has_active_policy = idea_variation_act_551
                has_active_policy = idea_variation_act_529
                has_active_policy = idea_variation_act_516
    
                }
            }
        }
        
        build_cost = -0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_552 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = dezentra0
            has_idea_group = festung0 
            
        }
        allow = {
            full_idea_group = dezentra0
            full_idea_group = festung0 
        }
        
        shock_damage = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_553 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = dezentra0
            has_idea_group = kriegsproduktion0
            
        }
        allow = {
            full_idea_group = dezentra0
            full_idea_group = kriegsproduktion0
        }
        
        global_trade_goods_size_modifier = 0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_554 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = dezentra0
            has_idea_group = formation0
            
        }
        allow = {
            full_idea_group = dezentra0
            full_idea_group = formation0
        }
        
        shock_damage = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    idea_variation_act_555 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = dezentra0
            has_idea_group = militarismus0
            
        }
        allow = {
            full_idea_group = dezentra0
            full_idea_group = militarismus0
        }
        
        advisor_cost = -0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    ###############################################################
    #### Idea Variation Policies 2 by flogi
    ###############################################################
    
    
    basic_idea_variation_act_1 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = katholisch0
            
                
        }
        allow = {
            full_idea_group = katholisch0
            
            hidden_trigger = {
                OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        papal_influence = 3
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_2 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = protestant0
            
                
        }
        allow = {
            full_idea_group = protestant0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        church_power_modifier = 0.5
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_3 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = reformiert0
            
                
        }
        allow = {
            full_idea_group = reformiert0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        
        monthly_fervor_increase = 3
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_4 = {
    
        monarch_power = ADM
    
        potential = {
            OR = {
            has_idea_group = islam0
            has_idea_group = shia0
            has_idea_group = ibadi0
            }
        }
        allow = {
            OR = {
            full_idea_group = islam0
            full_idea_group = ibadi0
            full_idea_group = shia0
            }
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
    
                }
            }
            NOT = { has_active_policy = basic_idea_variation_act_5 }
        }
        
        monthly_piety = -0.005
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_5 = {
    
        monarch_power = ADM
        
        potential = {
        OR = {
            has_idea_group = islam0
            has_idea_group = shia0
            has_idea_group = ibadi0
            }
        }
        allow = {
            OR = {
            full_idea_group = islam0
            full_idea_group = ibadi0
            full_idea_group = shia0
            }
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
    
                }
            }
            NOT = { has_active_policy = basic_idea_variation_act_4 }
        }
        
        monthly_piety = 0.005
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    
    basic_idea_variation_act_6 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = confuci0
            
                
        }
        allow = {
            full_idea_group = confuci0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        harmonization_speed = 0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_7 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = budda0
            
                
        }
        allow = {
            full_idea_group = budda0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
            NOT = { has_active_policy = basic_idea_variation_act_7_2 }
        }
        
        monthly_karma = -0.5
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_7_2 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = budda0
            
                
        }
        allow = {
            full_idea_group = budda0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
            NOT = { has_active_policy = basic_idea_variation_act_7 }
        }
        
        monthly_karma = 0.5
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    
    basic_idea_variation_act_8 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = cathar0
            
                
        }
        allow = {
            full_idea_group = cathar0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        #female_advisor_chance = 0.25
        cb_on_religious_enemies = yes
        advisor_cost = -0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_9 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = ancli0
            
                
        }
        allow = {
            full_idea_group = ancli0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        innovativeness_gain = 0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_10 = {
    
        monarch_power = ADM
    
        potential = {
        
            OR = {
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            }
            
                
        }
        allow = {
            OR = {
            full_idea_group = orthodox0
            full_idea_group = tengri0
            full_idea_group = norse0
            full_idea_group = shinto0
            full_idea_group = coptic0
            full_idea_group = romuva0
            full_idea_group = suomi0
            full_idea_group = jew0
            full_idea_group = slav0
            full_idea_group = helle0 
            full_idea_group = mane0
            full_idea_group = animist0
            full_idea_group = feti0
            full_idea_group = zoro0
            full_idea_group = nahu0
            full_idea_group = mesoam0
            full_idea_group = inti0
            full_idea_group = tote0
            full_idea_group = religious_ideas
            full_idea_group = hindu0
            }
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        prestige_per_development_from_conversion = 0.5
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_11 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = entwicklung0
            
                
        }
        allow = {
            full_idea_group = entwicklung0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        build_time = -0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_12 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = justiz0
            
                
        }
        allow = {
            full_idea_group = justiz0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        inflation_action_cost = -0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_13 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = gesundheit0
            
                
        }
        allow = {
            full_idea_group = gesundheit0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        war_exhaustion_cost = -0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_14 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = monarchie0
            
                
        }
        allow = {
            full_idea_group = monarchie0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        global_autonomy = -0.05
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_15 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = republik0
            
                
        }
        allow = {
            full_idea_group = republik0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        war_taxes_cost_modifier = -0.2 
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_16 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = aristo0
            
                
        }
        allow = {
            full_idea_group = aristo0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        devotion = 1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_17 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = diktatur0
            
                
        }
        allow = {
            full_idea_group = diktatur0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        autonomy_change_time = -0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_18 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = horde0
            
                
        }
        allow = {
            full_idea_group = horde0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        raze_power_gain = 0.2
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_19 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = gross0
            
                
        }
        allow = {
            full_idea_group = gross0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        artillery_bonus_vs_fort = 1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_20 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = galle0
            
                
        }
        allow = {
            full_idea_group = galle0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        siege_ability = 0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_21 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = handel0
            
                
        }
        allow = {
            full_idea_group = handel0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        siege_blockade_progress = 1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_22 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = kolonialimperium0
            
                
        }
        allow = {
            full_idea_group = kolonialimperium0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        native_assimilation = 0.5
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_23 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = assimilation0
            
                
        }
        allow = {
            full_idea_group = assimilation0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        reduced_liberty_desire = 10
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_24 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = gesellschaft0
            
                
        }
        allow = {
            full_idea_group = gesellschaft0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        institution_spread_from_true_faith = 0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_25 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = propaganda0
            
                
        }
        allow = {
            full_idea_group = propaganda0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        claim_duration = 1.0
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_26 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = flottenbasis0
            
                
        }
        allow = {
            full_idea_group = flottenbasis0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        range = 0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_27 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = nationalismus0
            
                
        }
        allow = {
            full_idea_group = nationalismus0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        enemy_core_creation = 0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_28 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = konigreich0
            
                
        }
        allow = {
            full_idea_group = konigreich0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        rival_border_fort_maintenance = -0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_29 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = imperialismus0
            
                
        }
        allow = {
            full_idea_group = imperialismus0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        core_decay_on_your_own = -0.5
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_30 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = generalstab0
            
                
        }
        allow = {
            full_idea_group = generalstab0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        drill_gain_modifier = 0.5
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_31 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = stehendesheer0
            
                
        }
        allow = {
            full_idea_group = stehendesheer0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        global_regiment_recruit_speed = -0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_32 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = soldnerheer0
            
                
        }
        allow = {
            full_idea_group = soldnerheer0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        privateer_efficiency = 0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_33 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = wehrpflicht0
            
                
        }
        allow = {
            full_idea_group = wehrpflicht0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        land_maintenance_modifier = -0.1	
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_34 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = waffenqualitat0
            
                
        }
        allow = {
            full_idea_group = waffenqualitat0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        artillery_cost = -0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_35 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = festung0
            
                
        }
        allow = {
            full_idea_group = festung0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        fort_maintenance_modifier = -0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_36 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = kriegsproduktion0
            
                
        }
        allow = {
            full_idea_group = kriegsproduktion0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        global_regiment_cost = -0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_37 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = staatsverwaltung0
            
                
        }
        allow = {
            full_idea_group = staatsverwaltung0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        stability_cost_modifier = -0.5
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_38 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = zentra0
            
                
        }
        allow = {
            full_idea_group = zentra0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        culture_conversion_cost = -0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_39 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = dezentra0 
            
                
        }
        allow = {
            full_idea_group = dezentra0 
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        embracement_cost = -0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_40 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = formation0
            
                
        }
        allow = {
            full_idea_group = formation0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        recover_army_morale_speed = 0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_41 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = militarismus0
            
                
        }
        allow = {
            full_idea_group = militarismus0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        harsh_treatment_cost = -0.1
        monthly_militarized_society = 0.1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_42 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = shock0
            
                
        }
        allow = {
            full_idea_group = shock0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        cavalry_cost = -0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_43 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = fire0
            
                
        }
        allow = {
            full_idea_group = fire0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        artillery_cost = -0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_44 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = innovativeness_ideas
            
                
        }
        allow = {
            full_idea_group = innovativeness_ideas
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        global_spy_defence = 0.35
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_45 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = spy_ideas
            
                
        }
        allow = {
            full_idea_group = spy_ideas
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        spy_offence = 0.5
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_46 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = dynasty0
            
                
        }
        allow = {
            full_idea_group = dynasty0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        heir_chance = 1.0
        prestige_decay = -0.01
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_47 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = influence_ideas
            
                
        }
        allow = {
            full_idea_group = influence_ideas
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        vassal_income = 1.0
        reduced_liberty_desire = -25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_48 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = offensive_ideas
            
                
        }
        allow = {
            full_idea_group = offensive_ideas
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        cavalry_cost = -0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_49 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = defensive_ideas
            
                
        }
        allow = {
            full_idea_group = defensive_ideas
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        infantry_cost = -0.15	
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_50 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = trade_ideas
            
                
        }
        allow = {
            full_idea_group = trade_ideas
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        embargo_efficiency = 0.5
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_51 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = economic_ideas
            
                
        }
        allow = {
            full_idea_group = economic_ideas
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        inflation_action_cost = -0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    
    basic_idea_variation_act_52 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = exploration_ideas
            
                
        }
        allow = {
            full_idea_group = exploration_ideas
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        native_assimilation = 0.5
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    
    basic_idea_variation_act_53 = {
    
        monarch_power = DIP
    
        potential = {
            has_idea_group = maritime_ideas 
            
                
        }
        allow = {
            full_idea_group = maritime_ideas 
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        sea_repair = yes
        #may_perform_slave_raid = yes
        may_perform_slave_raid_on_same_religion = yes
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    
    basic_idea_variation_act_54 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = quality_ideas
            
                
        }
        allow = {
            full_idea_group = quality_ideas
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        war_taxes_cost_modifier = -0.5
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    
    basic_idea_variation_act_55 = {
    
        monarch_power = MIL
    
        potential = {
            has_idea_group = quantity_ideas
            
                
        }
        allow = {
            full_idea_group = quantity_ideas
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        infantry_cost = -0.15
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_56 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = expansion_ideas
            
                
        }
        allow = {
            full_idea_group = expansion_ideas
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        range = 0.25
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_57 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = administrative_ideas
            
                
        }
        allow = {
            full_idea_group = administrative_ideas
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        embracement_cost = -0.5
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_58 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = humanist_ideas
            
                
        }
        allow = {
            full_idea_group = humanist_ideas
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
    
                }
            }
        }
        
        num_accepted_cultures = 1
        
        ai_will_do = {
            factor = 1
            
        }
    }
    
    basic_idea_variation_act_59 = {
    
        monarch_power = ADM
    
        potential = {
            has_idea_group = hussite0
            
                
        }
        allow = {
            full_idea_group = hussite0
            hidden_trigger = {
            OR = {
            has_idea_group = katholisch0
            has_idea_group = protestant0
            has_idea_group = reformiert0
            has_idea_group = islam0
            has_idea_group = confuci0
            has_idea_group = budda0
            has_idea_group = cathar0
            has_idea_group = ancli0
            has_idea_group = orthodox0
            has_idea_group = tengri0
            has_idea_group = norse0
            has_idea_group = shinto0
            has_idea_group = coptic0
            has_idea_group = romuva0
            has_idea_group = suomi0
            has_idea_group = jew0
            has_idea_group = slav0
            has_idea_group = helle0 
            has_idea_group = mane0
            has_idea_group = animist0
            has_idea_group = feti0
            has_idea_group = zoro0
            has_idea_group = nahu0
            has_idea_group = mesoam0
            has_idea_group = inti0
            has_idea_group = tote0
            has_idea_group = religious_ideas
            has_idea_group = hindu0
            has_idea_group = entwicklung0		
            has_idea_group = justiz0
            has_idea_group = gesundheit0
            has_idea_group = monarchie0
            has_idea_group = republik0
            has_idea_group = aristo0
            has_idea_group = diktatur0
            has_idea_group = horde0
            has_idea_group = gross0
            has_idea_group = galle0
            has_idea_group = handel0
            has_idea_group = kolonialimperium0
            has_idea_group = assimilation0
            has_idea_group = gesellschaft0
            has_idea_group = propaganda0
            has_idea_group = flottenbasis0
            has_idea_group = nationalismus0
            has_idea_group = konigreich0
            has_idea_group = imperialismus0
            has_idea_group = generalstab0
            has_idea_group = stehendesheer0
            has_idea_group = wehrpflicht0
            has_idea_group = soldnerheer0
            has_idea_group = waffenqualitat0
            has_idea_group = festung0
            has_idea_group = kriegsproduktion0
            has_idea_group = staatsverwaltung0
            has_idea_group = zentra0
            has_idea_group = dezentra0 
            has_idea_group = formation0
            has_idea_group = militarismus0
            has_idea_group = shock0
            has_idea_group = fire0
            has_idea_group = innovativeness_ideas
            has_idea_group = spy_ideas
            has_idea_group = dynasty0
            has_idea_group = influence_ideas
            has_idea_group = offensive_ideas
            has_idea_group = defensive_ideas
            has_idea_group = trade_ideas
            has_idea_group = economic_ideas
            has_idea_group = exploration_ideas
            has_idea_group = maritime_ideas 
            has_idea_group = quality_ideas
            has_idea_group = quantity_ideas
            has_idea_group = expansion_ideas
            has_idea_group = administrative_ideas
            has_idea_group = humanist_ideas
            has_idea_group = shia0
            has_idea_group = ibadi0
            has_idea_group = hussite0
                }
            }
        }
        
        church_power_modifier = 0.5
        
        ai_will_do = {
            factor = 1
            
        }
    }
    `;
}

function getIdeas(){
    return `innovativeness_ideas = {
        category = ADM
    
        bonus = {
            advisor_cost = -0.33
        }
    
        patron_of_art_2  = {
            prestige_decay = -0.01
            global_institution_growth = 0.1
        }
        pragmatism = {
            mercenary_cost = -0.25
        }
        scientific_revolution = {
            reform_progress_growth = 0.33
            innovativeness_gain = 0.15
        }
        dynamic_court = {
            advisor_pool = 1
        }
        resilient_state = {
            inflation_action_cost = -0.25
        }
        optimism = {
            war_exhaustion = -0.05
        }
        formalized_officer_corps = {
            free_leader_pool = 1
        }
    
        ai_will_do = {
            factor = 10
            modifier = {			
                factor = 1.5
                any_neighbor_country = {
                    is_rival = ROOT
                }
            }
            modifier = {
                factor = 50
                is_colonial_nation = yes
            }
            modifier = {
                factor = 3
                    government = merchant_republic
                
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            modifier = {
                factor = 2
                personality = ai_militarist 
            }
            modifier = {
                factor = 2
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
        
        }
    }
    
    
    religious_ideas = {
        category = ADM
    
        bonus = {
            culture_conversion_cost = -0.25
        }
    
        trigger = {
            
            NOT = {
                OR = {
    
                religion = catholic
                religion = protestant
                religion = reformed
                religion = orthodox
                religion_group  = muslim
                religion  = cathar
                religion  = shinto
                religion = norse_pagan_reformed
                religion = buddhism
                religion  = confucianism
                religion_group  = dharmic
                religion = tengri_pagan_reformed
                religion  = coptic
                religion = baltic_pagan_reformed
                religion = romuva
                religion = finnish_pagan_reformed
                religion = suomenusko
                religion_group = jewish_group
                religion = slavic_pagan_reformed
                religion = slavic
                religion_group = hellenic
                religion = hellenic_pagan
                religion = animism
                religion = manichean
                religion = manichaeism
                religion = shamanism 
                religion_group = african_pagan 
                religion = zoroastrian 
                religion = vajrayana
                religion = mahayana
                religion = anglican
                religion = mesoamerican_religion
                religion = inti
                religion = totemism
                religion = nahuatl
                religion = hussite
                
                }
            }
            
    
        }
    
        deus_vult = {
            cb_on_religious_enemies = yes
        }
        missionary_schools = {
            missionaries = 1
        }
        church_attendance_duty = {
            stability_cost_modifier = -0.25
        }
        divine_supremacy = {
            global_missionary_strength = 0.03
        }
        devoutness = {
            tolerance_own = 1
            papal_influence = 2
            devotion = 0.5
            monthly_fervor_increase = 0.25
            church_power_modifier = 0.1
        }
        religious_tradition = {
            prestige = 1
        }
        inquisition = {
            missionary_maintenance_cost = -0.5
        }
    
        ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 10
                is_emperor = yes 
            }
            
        }
    }
    
    
    spy_ideas = {
        category = DIP
    
    
        bonus = {
            rebel_support_efficiency = 0.50
            advisor_cost = -0.10
        }
    
        efficient_spies = {
            spy_offence = 0.5	
            can_fabricate_for_vassals = yes
        }	
        
        
        agent_training = {
            discipline = 0.025
                
        }
    
        vetting = {
            global_spy_defence = 0.33
        }	
        
        additional_loyalist_recruitment = {
            reduced_liberty_desire = 10
        }
    
        
        spion5 = {
            diplomats = 1	
            trade_efficiency = 0.1
        }
    
        
        privateers = {
            embargo_efficiency = 0.25
            privateer_efficiency = 0.33
        }
        
        audit_checks = {
            yearly_corruption = -0.1
        }
    
    
    
        ai_will_do = {
            factor = 10
            modifier = {
                factor = 4
                personality = ai_diplomat
            }
            
            modifier = {
                factor = 2
                personality = ai_militarist 
            }
            modifier = {
                factor = 3
                government = monarchy
            }
            
            modifier = {
                factor = 2
                government = republic
            }
            modifier = {
                factor = 7
                is_emperor = yes
            }
        }
    }
    
    
    dynasty0 = {
        category = DIP
        bonus = {
            reduced_stab_impacts = yes
            heir_chance = 0.5
        }
    
        
        foreign_embassies_2 = {
            diplomats = 1
            decision = dynastie_promoten
            elective_monarchy_dip_buff = yes
        }
        establish_cadet_branches = {
            legitimacy = 1
            prestige = 1
        }
        cabinet = {
            diplomatic_upkeep = 2
        }
        
        diplomatic_corps_2 = {
            dip_tech_cost_modifier = -0.1
            add_cb = cb_dynastie
        }
        
        benign_diplomats = {
            improve_relation_modifier = 0.2
        }
        experienced_diplomats  = {
            diplomatic_reputation = 2
        }
        dynastie4 = {
            shock_damage = 0.05
        }
    
        ai_will_do = {
            factor = 10
    
            modifier = {
                factor = 5
                is_emperor = yes
            }
            modifier = {
                factor = 4
                any_country = {
                    is_rival = yes
                }
                
                NOT = { is_vassal = yes }
                NOT = { is_subject = yes }
                
            }
            
            modifier = {
                factor = 2
                personality = ai_diplomat 
            }
            
    
        }
    }
    
    influence_ideas = {
        category = DIP
    
        bonus = {
            unjustified_demands = -0.5
        }
    
        tribute_system = {
            diplomatic_upkeep = 2
        }
        flexible_negotiation = {
            province_warscore_cost = -0.2
        }
        integrated_elites = {
            yearly_absolutism = 1.0
            diplomatic_annexation_cost = -0.15
        }
        state_propaganda = {
            ae_impact = -0.15
        }
        diplomatic_influence = {
            diplomatic_reputation = 2
        }
        postal_service = {
            relation_with_heretics = 25
        }
        marcher_lords = {
            land_forcelimit_modifier = 0.05
        }
    
        ai_will_do = {
            factor = 10
    
            modifier = {
                factor = 1.5
                is_emperor = yes
            }
            modifier = {
                factor = 1.25
                personality = ai_diplomat 
            }
    
            
    
        }	
    }
    
    
    offensive_ideas = {
        category = MIL
    
        bonus = {
            land_attrition = -0.33
        }
    
        bayonet_leaders = {
            leader_land_shock = 1
        }
        national_conscripts = {
            global_regiment_recruit_speed = -0.1
        }
        improved_manuever = {
            leader_land_manuever = 2
        }
        glorious_arms = {
            prestige_from_land = 1.0
        }
        engineer_corps = {
            siege_ability = 0.20
        }
        grand_army = {
            global_supply_limit_modifier = 0.5
        }
        napoleonic_warfare = {
            discipline = 0.035
        }
    
        ai_will_do = {
            factor = 15
            modifier = {
                factor = 30
                personality = ai_militarist 
            }
            modifier = {			
                factor = 4.5
                any_neighbor_country = {
                    is_rival = yes
                }
            }
    
            modifier = {
                factor = 2
                total_development = 200
            }
            modifier = {
                factor = 10
                total_development = 500
            }
            modifier = {
                factor = 4
                total_development = 700
            }
            modifier = {
                factor = 5
                total_development = 800
            }
            modifier = {
                factor = 6
                total_development = 1000
            }
            modifier = {
                factor = 2
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
        }
    }
    
    
    defensive_ideas = {
        category = MIL
    
        bonus = {
            hostile_attrition = 1
        }
    
        battlefield_commisions = {
            army_tradition = 1
        }
        military_drill = {
            land_morale = 0.075
            recover_army_morale_speed = 0.05	
        }
        superior_firepower = {
            leader_land_fire = 1
        }
        regimental_system = {
            fire_damage_received = -0.05
        }
        defensive_mentality = {
            shock_damage_received = -0.05
            defensiveness = 0.1
        }
        supply_trains = {
            reinforce_speed = 0.33
        }
        improved_foraging = {
            land_maintenance_modifier = -0.10
        }
    
        ai_will_do = {
            factor = 15
            modifier = {
                factor = 30
                personality = ai_militarist 
            }
            modifier = {			
                factor = 4.5
                any_neighbor_country = {
                    is_rival = yes
                }
            }
    
            modifier = {
                factor = 2
                total_development = 200
            }
            modifier = {
                factor = 10
                total_development = 500
            }
            modifier = {
                factor = 4
                total_development = 700
            }
            modifier = {
                factor = 5
                total_development = 800
            }
            modifier = {
                factor = 6
                total_development = 1000
            }
            modifier = {
                factor = 2
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
        }
    }
    
    
    trade_ideas = {
        category = DIP
    
        bonus = {
            merchants = 1
        }
    
        shrewd_commerce_practise = {
             global_trade_power = 0.2
          }
          free_trade = {
              merchants = 1
          }
        merchant_adventures = {
            trade_range_modifier = 0.25
        }
        national_trade_policy = {
            trade_efficiency = 0.1
        }
        overseas_merchants = {
            merchants = 1
        }
        trade_manipulation = {
            trade_steering = 0.25
        }
        fast_negotiations = {
            caravan_power = 0.25
        }
    
        ai_will_do = {
            factor = 10
            modifier = {
                factor = 10
                is_colonial_nation = yes
            }
            modifier = {
                factor = 0
                NOT = { trade_income_percentage = 0.25 }
                NOT = { is_colonial_nation = yes }
            }
            modifier = {
                factor = 0.33
                NOT = { trade_income_percentage = 0.33 }
            }
            modifier = {
                factor = 1.5
                trade_income_percentage = 0.25
                personality = ai_capitalist
            }
            modifier = {
                factor = 6
                trade_income_percentage = 0.33
            }
    
    
        }
    }
    
    
    
    
    economic_ideas = {
        category = ADM
    
        bonus = {
            development_cost = -0.2
        }
    
        bureaucracy = {
            global_tax_modifier = 0.1
        }
        organised_construction = {
            build_cost = -0.1
            build_time = -0.25
        }
        national_bank = {
            inflation_reduction = 0.1
        }
        debt_and_loans = {
            interest = -1
        }
        centralization = {
            global_autonomy = -0.05
        }
        nationalistic_enthusiasm = {
            land_maintenance_modifier = -0.10
        }
        smithian_economics = {
            production_efficiency = 0.1
         }
    
        ai_will_do = {
            factor = 10
            modifier = {
                factor = 6
                personality = ai_capitalist 
            }
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 4
                is_emperor = yes 
            }
            modifier = {
                factor = 2
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
        }
    }
    
    
    exploration_ideas = {
        category = DIP
        important = yes
    
        bonus = {
            cb_on_primitives = yes
        }
    
        colonial_ventures = {
            colonists = 1
        }
        quest_for_the_new_world	= {
            may_explore = yes
        }
        overseas_exploration = {
            range = 0.5
        }
        land_of_opportunity = {
            global_colonial_growth = 20
        }
        vice_roys  = {
             global_tariffs = 0.20
         }
        free_colonies = {
            colonists = 1
            expel_minorities_cost = -0.25
        }
        global_empire = {
            naval_forcelimit_modifier = 0.25
        }
    
        ai_will_do = {
            factor = 10
            modifier = {
                factor = 0
                OR = {
                    is_subject = yes
                    is_vassal = yes
                    is_colonial_nation = yes
                    is_tribal = yes
                    primitives = yes
                }
            }
            modifier = {
                factor = 0
                NOT = { num_of_ports = 1 }
            }
            modifier = {
                factor = 0.5
                NOT = { num_of_ports = 2 }
            }
            modifier = {
                factor = 0.5
                NOT = { num_of_ports = 3 }
            }
            modifier = {
                factor = 0.5
                NOT = { num_of_ports = 4 }
                num_of_cities = 4
            }
            modifier = {
                factor = 50
                OR = {
                    tag = POR
                    tag = GAL
                    tag = ICE
                }
            }
            modifier = {
                factor = 0.1
                NOT = { technology_group = western }
                NOT = { technology_group = high_american }
            }
            modifier = {
                factor = 0.1
                capital_scope = {
                    NOT = {
                        region = france_region
                        region = iberia_region
                        region = british_isles_region
                        region = low_countries_region
                    }
                }
                NOT = { technology_group = high_american }
            }
            modifier = {
                factor = 0.5
                tag = ARA
            }	
            modifier = {
                factor = 0.1
                NOT = { is_year = 1490 }
                capital_scope = {
                    NOT = {
                        region = iberia_region
                    }
                }
            }
            modifier = {
                factor = 10
                technology_group = high_american
            }
            modifier = {
                factor = 2.0
                num_of_ports = 5
            }
            modifier = {
                factor = 2.0
                num_of_ports = 10
            }
            modifier = {
                factor = 2.0
                num_of_ports = 15
            }
            modifier = {
                factor = 2.0
                num_of_ports = 20
            }
            modifier = {
                factor = 40
                OR = {
                    tag = GBR
                    tag = NED
                    tag = ENG
                    tag = FRA
                    tag = CAS
                }
            }
            modifier = {
                factor = 50
                technology_group = western
                capital_scope = { region = iberia_region }
                any_known_country = {
                    has_idea_group = exploration_ideas
                }
                num_of_ports = 3 
            }
            modifier = {
                factor = 10
                personality = ai_colonialist
                has_idea_group = expansion_ideas
            }
    
            modifier = {	
                factor = 3
                technology_group = western 
                num_of_ports = 5
                any_neighbor_country = {
                    has_idea_group = exploration_ideas
                        num_of_colonies = 1
                    
                }
            }
            modifier = {			
                factor = 3
                technology_group = western 
                num_of_ports = 3
                any_rival_country = {
                    has_idea_group = exploration_ideas
        
                        num_of_colonies = 1
                    
                }
            }
            modifier = {			
                factor = 3
                num_of_ports = 9
                any_neighbor_country = {
                    has_idea_group = exploration_ideas
    
                        num_of_colonies = 1
                    
                }
            }
            modifier = {			
                factor = 3
                num_of_ports = 7
                any_rival_country = {
                    has_idea_group = exploration_ideas
    
                        num_of_colonies = 1
                    
                }
            }
            modifier = {
                factor = 0.75
                is_year = 1600
            }
                            
        }
    }
    
    
    maritime_ideas = {
        category = DIP
    
        trigger = {
            primitives = no
        }
    
        bonus = {
            navy_tradition = 4
        }
        
        maritim1 = {
            may_explore = yes
            naval_maintenance_modifier = -0.25
        }
        maritim2 = {
            siege_blockade_progress = 1
    
        }
        maritim3 = {
            naval_forcelimit_modifier = 0.5
            add_building = navyforcelimit_lvl_2
            add_building = navyforcelimit_lvl_3
            add_building = navymanpower_lvl_2
            add_building = navymanpower_lvl_3
        }
    
        maritim4 = {
            global_sailors_modifier = 0.5
            sailors_recovery_speed = 0.5
        }
    
        maritim5 = {
            admiral_cost = -0.9
        }
        maritim6 = {
            global_ship_recruit_speed = -0.5
        }
        maritim7 = {
            allowed_marine_fraction = 0.25
        }
        
        ai_will_do = {
            factor = 10
            modifier = {
                factor = 0
                NOT = { num_of_ports = 3 }
            }
            modifier = {
                factor = 0
                NOT = { num_of_ports = 5 }
                num_of_cities = 5
            }
            modifier = {
                factor = 2
                OR = {
                tag = SPA
                tag = ENG
                tag = GBR
                tag = CAS
                tag = POR
                tag = NED
                tag = HOL
                tag = BUR
                }
            }
            modifier = {
                factor = 0
                NOT = { num_of_ports = 8 }
                num_of_cities = 10
            }
            modifier = {
                factor = 3
                OR = {
                    num_of_heavy_ship = 20
                    num_of_light_ship = 50
                    num_of_galley = 70
                }
            }
        
        }
    }
    
    
    quality_ideas = {
        category = MIL
    
        bonus = {
            discipline = 0.035
        }
    
        private_to_marshal = {
            infantry_power = 0.075
        }
        quality_education = {
            army_tradition = 1
        }
        finest_of_horses = {
            cavalry_power = 0.075
        }
        escort_ships = {
            ship_durability = 0.05
        }
        naval_drill = {
            naval_morale = 0.10
        }
        copper_bottoms = {
            naval_attrition = -0.25
        }
        massed_battery = {
            artillery_power = 0.075
        }
    
        ai_will_do = {
            factor = 15
            modifier = {
                factor = 30
                personality = ai_militarist 
            }
            modifier = {			
                factor = 4.5
                any_neighbor_country = {
                    is_rival = yes
                }
            }
    
            modifier = {
                factor = 2
                total_development = 200
            }
            modifier = {
                factor = 10
                total_development = 500
            }
            modifier = {
                factor = 4
                total_development = 700
            }
            modifier = {
                factor = 5
                total_development = 800
            }
            modifier = {
                factor = 6
                total_development = 1000
            }
            modifier = {
                factor = 2
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
        }
    }
    
    
    quantity_ideas = {
        category = MIL
    
        bonus = {
            land_forcelimit_modifier  = 0.15
            special_unit_forcelimit = 0.15
        }
        mass_army = {
            global_manpower_modifier = 0.50
        }
        the_young_can_serve = {
            manpower_recovery_speed = 0.50
        }
        enforced_service = {
            global_regiment_cost = -0.1
        }
        quanti3 = {
            global_sailors_modifier = 0.5
        }
        quanti1 = {  
            mercenary_cost = -0.25
        }
        quanti2 = {  
            allowed_marine_fraction = 0.5
        }
        expanded_supply_trains = {
            land_attrition = -0.1
        }
    
        ai_will_do = {
            factor = 15
            modifier = {
                factor = 30
                personality = ai_militarist 
            }
            modifier = {			
                factor = 4.5
                any_neighbor_country = {
                    is_rival = yes
                }
            }
    
            modifier = {
                factor = 2
                total_development = 200
            }
            modifier = {
                factor = 10
                total_development = 500
            }
            modifier = {
                factor = 4
                total_development = 700
            }
            modifier = {
                factor = 5
                total_development = 800
            }
            modifier = {
                factor = 6
                total_development = 1000
            }
            modifier = {
                factor = 2
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
        }
    }
    
    
    expansion_ideas = {
        category = ADM
        important = yes
    
        bonus = {
            merchants = 1
            global_trade_power = 0.2
        }
        
        additional_colonists = {
            colonists = 1
        }
        
        expan2 = {
            cb_on_overseas = yes
        }
        
        faster_colonists = {
            global_colonial_growth = 20
        }
        
        organised_recruiting = {
            global_manpower_modifier = 0.1
        }
        
        expan5 = {
            core_creation = -0.15
        }
        
        expan6 = {
            governing_capacity_modifier = 0.15
            trade_company_governing_cost = -0.15
        }
        
        expan7 = {
            harsh_treatment_cost = -0.75
        }
        
    
        ai_will_do = {
            factor = 10
            
            modifier = {
                factor = 10
                has_idea_group = exploration_ideas
            }
            modifier = {
                factor = 0.3
                NOT = {
                    technology_group = western
                    technology_group = eastern
                    technology_group = muslim
                }
            }
            
            modifier = {
                factor = 10
                OR = {
                    technology_group = western
                    technology_group = high_american
                }
                personality = ai_colonialist
            }
            modifier = {
                factor = 10
                technology_group = western
                personality = ai_capitalist
                OR = {
                    has_idea_group = trade_ideas
                    has_idea_group = maritime_ideas
                    has_idea_group = naval_ideas
                }
                any_known_country = {
                    OR = {
                        technology_group = indian
                        technology_group = chinese
                    }
                }
                num_of_ports = 5
            }
            modifier = {
                factor = 50
                is_colonial_nation = yes
            }
            modifier = {
                factor = 10
                NOT = { has_idea_group = exploration_ideas }
                any_owned_province = {
                    has_empty_adjacent_province = yes
                }
                OR = {
                    monthly_income = 15
                    culture_group = east_slavic
                    adm_tech = 13
                    AND = {
                        adm_tech = 9
                        personality = ai_capitalist
                    }
                    AND = {
                        capital_scope = { region = russia_region }
                        NOT = { government = steppe_horde }
                    }
                }
            }
            modifier = {
                factor = 5
                OR = {
                    religion = totemism
                    religion = inti 
                    religion = nahuatl 
                    religion = mesoamerican_religion 
                }
            }
            modifier = {
                factor = 3
                NOT = { has_idea_group = exploration_ideas }
                OR = {
                    any_neighbor_country = {
                        has_idea_group = expansion_ideas
                    }
                    any_rival_country = {
                        has_idea_group = expansion_ideas
                    }
                }
                any_owned_province = {
                    has_empty_adjacent_province = yes
                }
            }
        }
    }
    
    
    administrative_ideas = {
        category = ADM
    
        bonus = {
            governing_capacity_modifier = 0.25
        }
    
        organised_mercenary_payment = {
            mercenary_cost = -0.25
        }
        adaptability = {
            core_creation = -0.25
        }
        benefits_for_mercenaries = {
            merc_maintenance_modifier = -0.25
        }
        bookkeeping = {
            interest = -1
        }
        organised_mercenary_recruitment = {
            mercenary_manpower = 0.33
        }
        administrative_efficiency_idea = {
            advisor_pool = 2
        }
        civil_servants = {
            adm_tech_cost_modifier = -0.1
        }
    
        ai_will_do = {
            factor = 10
            modifier = {
                factor = 10
                personality = ai_capitalist 
            }
            modifier = {
                factor = 2.0
                has_idea_group = administrative_ideas
            }
            modifier = {
                factor = 2.0
                has_idea_group = justiz0
            }
            modifier = {
                factor = 2
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
            
            modifier = {
                factor = 3
                government = monarchy
            }
            
            modifier = {
                factor = 2
                government = republic
            }
        }
    }
    
    humanist_ideas = {
        category = ADM
    
        bonus = {
            idea_cost = -0.075
            yearly_harmony = 0.25
        }
    
        tolerance_idea_2 = {
            religious_unity = 0.25
            decision = hire_advisor
        }
        local_traditions = {
            global_unrest = -2
        }
        ecumenism = {
            tolerance_heretic = 3
        }
        indirect_rule = {
            years_of_nationalism = -10
        }
        cultural_ties_2 = {
            num_accepted_cultures = 2
            morale_bonus_5_cultures = yes
        }
        benevolence = {
            improve_relation_modifier = 0.15
        }
        humanist_tolerance = {
            tolerance_heathen = 3
        }
    
        ai_will_do = {
            factor = 15
        
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 1.5
                num_of_cities = 17
                NOT = { religious_unity = 1.0 }
            }
            modifier = {
                factor = 1.5
                num_of_cities = 24
                NOT = { religious_unity = 1.0 }
            }
            modifier = {
                factor = 1.5
                num_of_cities = 30
                NOT = { religious_unity = 1.0 }
            }
            modifier = {
                factor = 0.5
                NOT = { num_of_cities = 4 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.6 }
            }
            modifier = {
                factor = 0.5
                religious_unity = 1.0
            }
            modifier = {
                factor = 2
                government = republic
            }
            modifier = {
                factor = 2
                personality = ai_diplomat
            }
            modifier = {
                factor = 2.0
                has_idea_group = administrative_ideas
            }
            
        }
    }
    
    ########################################################
    ####### Catholic / Katholisch
    ########################################################
    
    
    katholisch0 = {
        category = ADM
    
        bonus = {
            #extra_manpower_at_religious_war = yes
            manpower_recovery_speed = 0.2
    
        }
    
        trigger = {
            
                religion = catholic
            
            
    
        }
            
        
        katholisch1 = {
            missionaries = 1
            free_cardinal = 1
        }
        katholisch2 = {
            global_missionary_strength = 0.04
            missionary_maintenance_cost = -0.25
        }
        katholisch3 = {
            cb_on_religious_enemies = yes
        }
    
        katholisch4 = {
            papal_influence = 3
            devotion = 2
        }
    
        katholisch5 = {
            tolerance_own = 1
            prestige = 1
        }
        katholisch6 = {
            enforce_religion_cost = -0.5
            #legitimacy = 1
            imperial_authority_value = 0.05
        }
        katholisch7 = {
            land_morale = 0.075
            
        }
        
        ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 10
                is_emperor = yes 
            }
            
            
            
            
        }
    }
    
    ########################################################
    ####### Protestant / Protestant
    ########################################################
    
    
    protestant0 = {
        category = ADM
    
        bonus = {
            global_tax_modifier = 0.1
        }
            
    
        trigger = {
                religion = protestant
        }
    
        
        protestant1 = {
            cb_on_religious_enemies = yes
            free_leader_pool = 1
        }
        protestant2 = {
            missionaries = 1
            church_power_modifier = 0.5
        }
        protestant3 = {
            idea_cost = -0.075
        }
    
        protestant4 = {
            global_missionary_strength = 0.01
            global_heretic_missionary_strength = 0.03
        }
    
        protestant5 = {
            defensiveness = 0.2
        }
        protestant6 = {
            technology_cost = -0.05
        }
        protestant7 = {
            advisor_cost = -0.2
            advisor_pool = 1
        }
        
        ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 4
                is_emperor = yes 
            }
                
            
        }
    }
    
    ########################################################
    ####### Reformed / Reformiert
    ########################################################
    
    
    reformiert0 = {
        category = ADM
    
        bonus = {
            cb_on_religious_enemies = yes
        }
            
            trigger = {
            
                religion = reformed
            
            
    
        }
    
        
        reformiert1 = {
            global_missionary_strength = 0.02
            missionary_maintenance_cost = -0.25
            
        }
        reformiert2 = {
            tolerance_heretic = 2
        }
        reformiert3 = {
            siege_ability = 0.15
        }
    
        reformiert4 = {
            trade_range_modifier = 0.25
        }
    
        reformiert5 = {
            stability_cost_modifier = -0.15
        }
        reformiert6 = {
            discipline = 0.035
            
        }
        reformiert7 = {
            monthly_fervor_increase = 6
        }
        
        ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 4
                is_emperor = yes 
            }	
            
        }
    }
    
    
    ########################################################
    ####### Orthodox
    ########################################################
    
    
    orthodox0 = {
        category = ADM
    
        bonus = {
            cb_on_religious_enemies = yes
            land_morale = 0.05
        }
            
    
        trigger = {
            
                religion = orthodox
            
            
    
        }
        
        orthodox1 = {
            missionaries = 1
        }
        orthodox2 = {
            yearly_patriarch_authority = 0.01
            #stability_cost_modifier = -0.25
        }
        orthodox3 = {
            global_missionary_strength = 0.03
        }
    
        orthodox4 = {
            culture_conversion_cost = -0.20
            missionary_maintenance_cost = -0.25
        }
    
        orthodox5 = {
            adm_tech_cost_modifier = -0.1
        }
        orthodox6 = {
            religious_unity = 0.15
            state_maintenance_modifier = -0.15
        }
        orthodox7 = {
            diplomatic_reputation = 1
            legitimacy = 1
        }
        
        ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
                
            
        }
    }
    
    ########################################################
    ####### Sunni Ideas
    ########################################################
    
    
    islam0 = {
        category = ADM
    
        bonus = {
            global_missionary_strength = 0.02
        }
            
            trigger = {
            
                religion = sunni
    
        }
            
        
        islam1 = {
            global_tax_modifier = 0.2
        }
        islam2 = {
            cb_on_religious_enemies = yes
        }
        islam3 = {
            missionaries = 1
            missionary_maintenance_cost = -0.5
        }
    
        islam4 = {
            core_creation = -0.1
        }
    
        islam5 = {
            artillery_power = 0.05
        }
        islam6 = {
            global_trade_power = 0.1
        }
        islam7 = {
            allowed_marine_fraction = 0.1
        }
        
        ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
                
            
        }
    }
    
    ########################################################
    ####### Tengri Ideas/ Tengri Ideen 
    ########################################################
    
    tengri0 = {
        category = ADM
        
        
        trigger = {
            
                religion = tengri_pagan_reformed
    
        }
        
        bonus = {
            missionaries = 1
            missionary_maintenance_cost = -0.25
        }
            
        
        tengri1 = {
        horde_unity = 1
        legitimacy = 1
        }
        tengri2 = {
        tolerance_heathen = 2
        }
        tengri3 = {
        cavalry_power = 0.15
        cav_to_inf_ratio = 0.10
        }
    
        tengri4 = {
        leader_land_manuever = 1
        }
    
        tengri5 = {
        hostile_attrition = 2
        }
        tengri6 = {
        global_missionary_strength = 0.02
        
        }
        tengri7 = {
        religious_unity = 0.25
        }
        
    ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 10
                is_emperor = yes 
            }
            
            
            
            
        }
    }
    
    ########################################################
    ####### Dharmic Ideas / Hindu Ideen
    ########################################################
    
    hindu0 = {
        category = ADM
    
        trigger = {
            
                religion_group  = dharmic
    
        }
        
        bonus = {
            land_morale = 0.075
        }
            
        
        hindu1 = {
            technology_cost = -0.05
        }
        hindu2 = {
            global_missionary_strength = 0.03
            missionaries = 1
        }
        hindu3 = {
            num_accepted_cultures = 1
            missionary_maintenance_cost = -0.25
        }
    
        hindu4 = {
            diplomatic_reputation = 2
        }
    
        hindu5 = {
            heir_chance = 0.25
            advisor_cost = -0.1	
        }
        hindu6 = {
            global_unrest = -1
            dip_tech_cost_modifier = -0.05
        }
        hindu7 = {
            prestige = 1
        }
        
        ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 10
                is_emperor = yes 
            }
            
            
            
            
        }
    }
    
    ########################################################
    ####### Confucianism Ideas / Konfuzianische Ideen
    ########################################################
    
    confuci0 = {
        category = ADM
    
        trigger = {
            
                religion  = confucianism
    
        }
        
        bonus = {
            siege_ability = 0.1
        }
            
        
        confuci1 = {
            legitimacy = 1
            yearly_harmony = 0.5
        }
        confuci2 = {
            global_autonomy = -0.1
        }
        confuci3 = {
            num_accepted_cultures = 1
        }
    
        confuci4 = {
            advisor_cost = -0.15
        }
    
        confuci5 = {
            imperial_mandate = 0.1
            governing_capacity_modifier = 0.15
        }
        confuci6 = {
            harmonization_speed = 0.15
        }
        confuci7 = {
            idea_cost = -0.1
        }
        
        ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 10
                is_emperor = yes 
            }
            
        }
    }
    
    ########################################################
    ####### Buddhism Ideas / Buddhismus Ideen
    ########################################################
    
    budda0 = {
        category = ADM
        
        trigger = {
            
            OR = {
                religion = buddhism
                religion = vajrayana
                religion = mahayana
                }
    
        }
    
        bonus = {
            technology_cost = -0.05
        }
            
        
        budda1 = {
            idea_cost = -0.05
        }
        budda2 = {
            prestige = 1
        }
        budda3 = {
            diplomatic_reputation = 2
        }
    
        budda4 = {
            global_unrest = -2
        }
    
        budda5 = {
            tolerance_heathen = 1
            tolerance_heretic = 1
        }
        budda6 = {
            production_efficiency = 0.15
        }
        budda7 = {
            merchants = 1
            missionaries = 1
        }
        
    ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 10
                is_emperor = yes 
            }
            
        }
    }
    
    
    ########################################################
    ####### Norse Ideas / Nordische Ideen
    ########################################################
    
    norse0 = {
        category = ADM
        
        trigger = {
            
                religion = norse_pagan_reformed
    
        }
    
        bonus = {
            leader_naval_shock = 1
        }
            
        
        norse1 = {
            may_perform_slave_raid = yes
            add_cb = cb_coast
        }
        norse2 = {
            land_morale = 0.075
            naval_morale = 0.075
            
        }
        norse3 = {
            colonists = 1
        }
    
        norse4 = {
            global_ship_cost = -0.2
        }
    
        norse5 = {
            loot_amount = 1
        }
        norse6 = {
            global_missionary_strength = 0.04
            missionaries = 1	
        }
        norse7 = {
            production_efficiency = 0.1
        }
        
        ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 10
                is_emperor = yes 
            }	
            
        }
    }
    
    ########################################################
    ####### Shinto Ideas / Shinto Ideen
    ########################################################
    
    shinto0 = {
        category = ADM
    
        trigger = {
            
                religion  = shinto
    
        }
        
        bonus = {
            global_missionary_strength = 0.02
            missionaries = 1
            missionary_maintenance_cost = -0.1
        }
            
        
        shinto1 = {
            infantry_power = 0.075
        }
        shinto2 = {
            development_cost = -0.1
        }
        
        shinto3 = {
            technology_cost = -0.05
        }
    
        shinto4 = {
            global_manpower_modifier = 0.15
        }
    
        shinto5 = {
            global_sailors_modifier = 0.15
        }
        shinto6 = {
            heir_chance = 0.5
        }
        shinto7 = {
            legitimacy = 1
        }
        
        ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 10
                is_emperor = yes 
            }
            
        }
    }
    
    ########################################################
    ####### Cathar Ideas / Katharische Ideen
    ########################################################
    
    cathar0 = {
        category = ADM
        
        trigger = {
            
                religion  = cathar
    
        }	
    
        bonus = {
            infantry_power = 0.075
        }
            
        
        cathar1 = {
            female_advisor_chance = 0.5
            advisor_pool = 1
        }
        cathar2 = {
            state_maintenance_modifier = -0.15
        }
        cathar3 = {
            defensiveness = 0.1
        }
    
        cathar4 = {
            religious_unity = 0.25
            missionaries = 1
            missionary_maintenance_cost = -0.25
        }
    
        cathar5 = {
            extra_manpower_at_religious_war = yes
        }
        cathar6 = {
            num_accepted_cultures = 1
        }
        cathar7 = {
            idea_cost = -0.1
        }
        
        ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 10
                is_emperor = yes 
            }
            
        }
    }
        
    
    ########################################################
    ####### Coptic Ideas / Koptische Ideen
    ########################################################
    
    coptic0 = {
        category = ADM
        
        trigger = {
            
                religion  = coptic
    
        }	
    
        bonus = {
            cb_on_religious_enemies = yes
        }
            
        
        coptic1 = {
            defensiveness = 0.2
        }
        coptic2 = {
            tolerance_heathen = 1
            tolerance_heretic = 1
            
        }
        coptic3 = {
            global_missionary_strength = 0.02
        }
    
        coptic4 = {
            technology_cost = -0.05
        }
    
        coptic5 = {
            land_morale = 0.05
        }
        coptic6 = {
            idea_cost = -0.05
        }
        coptic7 = {
            missionaries = 1
            missionary_maintenance_cost = -0.1
        }
        
        ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 10
                is_emperor = yes 
            }
            
        }
    }	
    
    
    ########################################################
    ####### Romuva Ideen / Romuva Ideas
    ########################################################
    
    
    romuva0 = {
        category = ADM
    
        trigger = {
                OR = {
                religion = baltic_pagan_reformed
                religion = romuva
                }
            
    
        }
        
        bonus = {
            years_of_nationalism = -3
        }
            
        
        romuva1 = {
            build_cost = -0.1 #lauko sargei
        }
        romuva2 = {
            global_missionary_strength = 0.02 # geschichten
    
        }
        romuva3 = {
            land_morale = 0.075 # Menschenopfer
            siege_ability = 0.1
        }
    
        romuva4 = {
            missionaries = 1    # geschichten erz�hler
            missionary_maintenance_cost = -0.1
        }
    
        romuva5 = {
            num_accepted_cultures = 1 # moralfragen	
        }
        romuva6 = {
            global_unrest = -2 # Feier zur Sonnenwende
        }
        romuva7 = {
            naval_forcelimit_modifier = 0.1		# Sonne und Mond
            land_forcelimit_modifier = 0.1
        }
    
        ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 10
                is_emperor = yes 
            }
            
        }
     }
     
    ########################################################
    ####### Suomi Ideen / Suomi Ideas
    ########################################################
    
    
    suomi0 = {
        category = ADM
        
        trigger = {
                OR = {	
                religion = finnish_pagan_reformed
                religion = suomenusko
                }
    
        }
        
        bonus = {
            global_colonial_growth = 15
        }
            
        
        suomi1 = {
            shock_damage = 0.05 # Ukko
        }
        suomi2 = {
            heir_chance = 0.25 # Akka
        }
        suomi3 = {
            missionaries = 1    # geschichten erz�hler
            missionary_maintenance_cost = -0.1
        }
    
        suomi4 = {
            global_tax_modifier = 0.1 # Hela
        }
    
        suomi5 = {
                global_missionary_strength = 0.02 # geschichten
        }
        suomi6 = {
            production_efficiency = 0.15 # Juhannus
        }
        suomi7 = {
            hostile_attrition = 1
        }
    
        ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 10
                is_emperor = yes 
            }
            
        }
     }
     
     
    ########################################################
    ####### J�dische Ideen / Jewish Ideas
    ########################################################
    
    
    jew0 = {
        category = ADM
    
        trigger = {
            
                religion_group = jewish_group
            
            
    
        }
        
        bonus = {
            global_tax_modifier = 0.2
        }
            
        
        jew1 = {
            global_trade_power = 0.1
            institution_spread_from_true_faith = 0.1
        }
        jew2 = {
            tolerance_own = 2
        }
        jew3 = {
            merchants = 1
            siege_ability = 0.15
        }
    
        jew4 = {
            reduced_liberty_desire = 5
        }
    
        jew5 = {
            inflation_reduction = 0.05
            
        }
        jew6 = {
            interest = -1	
        }
        jew7 = {
            discipline = 0.035
        }
    
        ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 10
                is_emperor = yes 
            }
            
        }
     }
    
    
    ########################################################
    ####### Slawische Ideen / Slav Ideas
    ########################################################
    
    
    slav0 = {
        category = ADM
        
        trigger = {
                OR = {
                religion = slavic_pagan_reformed
                religion = slavic
                }
    
        }
        
        bonus = {
            prestige_decay = -0.01
        }
            
        
        slav1 = {
            global_missionary_strength = 0.02 # geschichten
        }
        slav2 = {
            land_morale = 0.05 # Hausgeister
        }
        slav3 = {
            missionaries = 1    # geschichten erz�hler
            missionary_maintenance_cost = -0.1
        }
    
        slav4 = {
            naval_morale = 0.1
            leader_naval_manuever = 1 # wassergeister
            
        }
    
        slav5 = {
            global_trade_goods_size_modifier = 0.075 # Elemente Lehre
        }
        slav6 = {
            improve_relation_modifier = 0.1 # Parallelen zu andern Kulturen
        }
        slav7 = {
            war_exhaustion_cost = -0.2
        }
    
        ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 10
                is_emperor = yes 
            }
            
        }
     }
    
    
    ########################################################
    ####### Hellenische Ideen / Hellenism Ideas
    ########################################################
    
    
    helle0 = {
        category = ADM
        
        trigger = {
            
                OR = {
                religion_group = hellenic
                religion = hellenic_pagan
                }
            
    
        }
        
        bonus = {
            missionaries = 1    
            missionary_maintenance_cost = -0.1
        }
            
        
        helle1 = {
            heavy_ship_power = 0.1 # poseidon
            galley_power = 0.1
        }
        helle2 = {
            infantry_power = 0.075
    
        }
        helle3 = {
            adm_tech_cost_modifier = -0.05
        }
    
        helle4 = {
            global_institution_spread = 0.15 # Studientradition
        }
    
        helle5 = {
            diplomatic_upkeep = 2	
        }
        helle6 = {
            development_cost = -0.1
        }
        helle7 = {
            global_missionary_strength = 0.02
        }
    
        ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 10
                is_emperor = yes 
            }
            
        }
     } 
        
    
    ########################################################
    ####### Manechismus
    ########################################################
    
    
    mane0 = {
        category = ADM
    
        trigger = {
            OR = {
                religion = manichean
                religion = manichaeism
    
            }
        }
        
        bonus = {
            build_cost = -0.1
        }
            
        
        mane1 = {
            tolerance_heathen = 1
            tolerance_heretic = 1
        }
        mane2 = {
            missionaries = 1
            global_missionary_strength = 0.02
            missionary_maintenance_cost = -0.1
        }
        mane3 = {
            global_autonomy = -0.05
            liberty_desire_from_subject_development = -0.1
        }
    
        mane4 = {
            land_morale = 0.05
        }
    
        mane5 = {
            global_unrest = -1
        }
        mane6 = {
            production_efficiency = 0.1
        }
        mane7 = {
            legitimacy = 1
            horde_unity = 0.5
            republican_tradition = 0.5
            devotion = 0.5	
        }
    
        
        ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 10
                is_emperor = yes 
            }
            
        }
    }
    
    ########################################################
    ####### Animist
    ########################################################
    
    
    animist0 = {
        category = ADM
        
        trigger = {
            
                religion = animism
            
            
        }
    
        bonus = {
            autonomy_change_time = -0.25
        }
            
        
        animist1 = {
            global_missionary_strength = 0.04
        }
        animist2 = {
            missionaries = 1
        }
        animist3 = {
            shock_damage = 0.075
        }
    
        animist4 = {
            enemy_core_creation = 0.15
        }
    
        animist5 = {
            cb_on_religious_enemies = yes
        }
        animist6 = {
            interest = -1
        }
        animist7 = {
            global_tax_modifier = 0.1
        }
    
        
        ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 10
                is_emperor = yes 
            }
            
        }
    }
    
    
    ########################################################
    ####### Fetishismus
    ########################################################
    
    
    feti0 = {
        category = ADM
        
        trigger = {
            OR = {
                religion = shamanism 
                religion_group = african_pagan 
    
            }
        }
        
    
        bonus = {
            reinforce_speed = 0.1
        }
            
        
        feti1 = {
            missionaries = 1
        }
        feti2 = {
            fire_damage_received = -0.075
        }
        feti3 = {
            war_taxes_cost_modifier = -0.25
        }
    
        feti4 = {
            cb_on_religious_enemies = yes
        }
    
        feti5 = {
            global_manpower_modifier = 0.1
        }
        feti6 = {
            reduced_liberty_desire = 5
        }
        feti7 = {
            global_missionary_strength = 0.02
        }
    
        
        ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 10
                is_emperor = yes 
            }
            
        }
    }
    
    
    ########################################################
    ####### Zororastrier
    ########################################################
    
    
    zoro0 = {
        category = ADM
    
        trigger = {
            
                religion = zoroastrian 
                
            
            
        }
        
        bonus = {
            land_forcelimit_modifier = 0.1
        }
            
        
        zoro1 = {
            cb_on_religious_enemies = yes
            siege_ability = 0.1
        }
        zoro2 = {
            missionaries = 1
        }
        zoro3 = {
            governing_capacity_modifier = 0.15
        }
    
        zoro4 = {
            prestige = 1
            yearly_absolutism = 1.0
        }
    
        zoro5 = {
            infantry_power = 0.075
        }
        zoro6 = {
            global_missionary_strength = 0.02
        }
        zoro7 = {
            global_spy_defence = 0.1
        }
    
        
        ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 10
                is_emperor = yes 
            }
            
        }
    }
        
        
    ########################################################
    ####### Anglikanisch
    ########################################################
    
    
    ancli0 = {
        category = ADM
    
        trigger = {
            
                religion = anglican
                
            
            
        }
        
        bonus = {
            cb_on_religious_enemies = yes
            global_missionary_strength = 0.02
        }
            
        
        ancli1 = {
            missionaries = 1
        }
        ancli2 = {
            global_tax_modifier = 0.15
        }
        ancli3 = {
            global_heretic_missionary_strength = 0.03
        }
    
        ancli4 = {
            harsh_treatment_cost = -0.25
            global_unrest = -1	
        }
    
        ancli5 = {
            global_colonial_growth = 15
            range = 0.2	
        }
        ancli6 = {
            monthly_splendor = 1
            embracement_cost = -0.25
        }
        ancli7 = {
            artillery_power = 0.075
        }
    
        
        ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 10
                is_emperor = yes 
            }
            
        }
    }	
        
        
    ########################################################
    ####### Nahuatl
    ########################################################
    
    
    nahu0 = {
        category = ADM
    
        trigger = {
            
                religion = nahuatl
                
            
            
        }
        
        bonus = {
            missionaries = 1
        }	
        
        nahu1 = {
            diplomatic_upkeep = 2
        }
        nahu2 = {
            discipline = 0.035
        }
        nahu3 = {
            cb_on_religious_enemies = yes
        }
    
        nahu4 = {
            yearly_army_professionalism = 0.025
        }
    
        nahu5 = {
            global_missionary_strength = 0.03
        }
        nahu6 = {
            trade_efficiency = 0.15
        }
        nahu7 = {
            monarch_diplomatic_power = 1
        }	
        
    
        ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 10
                is_emperor = yes 
            }
            
        }
    }		
        
    
    ########################################################
    ####### Mesoamerican
    ########################################################
    
    
    mesoam0 = {
        category = ADM
    
        trigger = {
            
                religion = mesoamerican_religion
                
            
            
        }
        
        bonus = {
            global_missionary_strength = 0.03
        }	
        
        mesoam1 = {
            global_tax_modifier = 0.1
        }
        mesoam2 = {
            monthly_splendor = 3
        }
        mesoam3 = {
            monarch_military_power = 1
        }
    
        mesoam4 = {
            ae_impact = -0.15
        }
    
        mesoam5 = {
            cb_on_religious_enemies = yes
        }
        mesoam6 = {
            missionaries = 1
            advisor_pool = 1
        }
        mesoam7 = {
            idea_cost = -0.1
        }	
        
    
        ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 10
                is_emperor = yes 
            }
            
        }
    }	
    
    ########################################################
    ####### Inti
    ########################################################
    
    
    inti0 = {
        category = ADM
    
        trigger = {
            
                religion = inti
                
            
            
        }
        
        bonus = {
            cb_on_religious_enemies = yes
        }	
        
        inti1 = {
            production_efficiency = 0.15
        }
        inti2 = {
            monarch_admin_power = 1
        }
        inti3 = {
            global_colonial_growth = 15
        }
    
        inti4 = {
            missionaries = 1
            global_missionary_strength = 0.02
        }
    
        inti5 = {
            same_culture_advisor_cost = -0.33
        }
        inti6 = {
            female_advisor_chance = 0.5	
            }
        inti7 = {
            global_trade_goods_size_modifier = 0.15
        }	
        
    
        ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 10
                is_emperor = yes 
            }
            
        }
    }		
    
    ########################################################
    ####### Totemism
    ########################################################
    
    
    tote0 = {
        category = ADM
    
        trigger = {
            
                religion = totemism
                
            
            
        }
        
        bonus = {
            production_efficiency = 0.1
        }	
        
        tote1 = {
            global_manpower_modifier = 0.15
        }
        tote2 = {
            land_attrition = -0.15
        }
        tote3 = {
            global_missionary_strength = 0.03
        }
    
        tote4 = {
            cb_on_religious_enemies = yes
        }
    
        tote5 = {
            missionaries = 1	
        }
        tote6 = {
            global_unrest = -2
        }
        tote7 = {
            land_morale = 0.075
        }	
        
    
        ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 10
                is_emperor = yes 
            }
            
        }
    }		
    
    ########################################################
    ####### Shiite 
    ########################################################
    
    
    shia0 = {
        category = ADM
    
        trigger = {
            
                religion = shiite
        }
        
        bonus = {
            cavalry_power = 0.075
        }	
        
        shia1 = {
            missionaries = 1 
        }
        shia2 = {
            army_tradition = 1
        }
        shia3 = {
            tolerance_own = 2
        }
    
        shia4 = {
            reform_progress_growth = 0.15
        }
    
        shia5 = {
            technology_cost = -0.05	
        }
        shia6 = {
            cb_on_religious_enemies = yes
        }
        shia7 = {
            global_missionary_strength = 0.02
            missionary_maintenance_cost = -0.5
        }	
        
    
        ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 10
                is_emperor = yes 
            }
            
        }
    }		
    
    ########################################################
    ####### Ibadi
    ########################################################
    
    
    ibadi0 = {
        category = ADM
    
        trigger = {
            
                religion = ibadi
        }
        
        bonus = {
            cb_on_religious_enemies = yes
        }	
        
        ibadi1 = {
            same_culture_advisor_cost = -0.25
        }
        ibadi2 = {
            development_cost = -0.1
        }
        ibadi3 = {
            idea_cost = -0.075
        }
    
        ibadi4 = {
            prestige = 1
        }
    
        ibadi5 = {
            defensiveness = 0.1
        }
        ibadi6 = {
            manpower_in_true_faith_provinces = 0.25
        }
        ibadi7 = {
            global_spy_defence = 0.5
        }	
        
    
        ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 10
                is_emperor = yes 
            }
            
        }
    }	
    
    ########################################################
    ####### Hussite
    ########################################################
    
    
    hussite0 = {
        category = ADM
    
        trigger = {
            
                religion = hussite
        }
        
        bonus = {
            missionaries = 1
        }	
        
        hussite1 = {
            global_religious_conversion_resistance = 0.25
        }
        hussite2 = {
            innovativeness_gain = 0.5
        }
        hussite3 = {
            governing_capacity_modifier = 0.15
        }
    
        hussite4 = {
            global_missionary_strength = 0.04
        }
    
        hussite5 = {
            shock_damage = 0.075
        }
        hussite6 = {
            cb_on_religious_enemies = yes
        }
        hussite7 = {
            global_institution_spread = 0.25
        }	
        
    
        ai_will_do = {
            factor = 10
            
            modifier = {			
                factor = 1.25
                any_rival_country = {
                    NOT = { religion = ROOT }
                }
            }	
            modifier = {
                factor = 2
                has_dlc = "Common Sense"
                NOT = { devotion = 70 }
                OR = {
                    government = theocratic_government
                    government = papal_government
                    government = monastic_order_government 
                }
            }
            modifier = {
                factor = 1.33
                NOT = { religious_unity = 0.9 }
            }
            modifier = {
                factor = 1.4
                NOT = { religious_unity = 0.8 }
            }
            modifier = {
                factor = 2.25
                NOT = { religious_unity = 0.7 }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 10
                is_emperor = yes 
            }
            
        }
    }	
        
    ########################################################
    ####### Judiciary / Justiz
    ########################################################
    
    
    justiz0 = {
        category = ADM
    
        bonus = {
            ae_impact = -0.15
    
        }
            
        
        justiz1 = {
            legitimacy = 1
            republican_tradition = 1
            horde_unity = 1
            devotion = 1
            meritocracy = 1
        }
        justiz2 = {
            yearly_corruption = -0.1
        }
        justiz3 = {
            idea_cost = -0.075
            imperial_authority = 0.1
        }
    
        justiz4 = {
            trade_efficiency = 0.1
        }
    
        justiz5 = {
            interest = -1
        }
        justiz6 = {
            core_creation = -0.1
            diplomatic_annexation_cost = -0.1
        }
        justiz7 = {
            tolerance_heathen = 1
            tolerance_heretic = 1
            enemy_core_creation = 0.1
        }
        
        ai_will_do = {
            factor = 10
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            modifier = {
                factor = 2
                is_elector = yes 
            }
            modifier = {
                factor = 4
                is_emperor = yes 
            }
            modifier = {
                factor = 2
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
        }
    }
    
    ########################################################
    ####### Development / Entwicklung
    ########################################################
    
    
    entwicklung0 = {
        category = ADM
    
        bonus = {
            development_cost = -0.1
        }
            
        
        entwicklung1 = {
            development_cost = -0.05
            decision = improve_development
            
        }
        entwicklung2 = {
            production_efficiency = 0.05
        }
        entwicklung3 = {
            global_tax_modifier = 0.05
        }
    
        entwicklung4 = {
            trade_efficiency = 0.05
        }
    
        entwicklung5 = {
            global_autonomy = -0.05
        }
        entwicklung6 = {
            build_cost = -0.1
            build_cost_in_subject_nation = -0.25
        }
        entwicklung7 = {
            inflation_reduction = 0.05
        }
        
        ai_will_do = {
            factor = 8
            modifier = {
                factor = 4
                    OR = {
                    is_march = yes
                    is_colonial_nation = yes
                }
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            modifier = {
                factor = 1.5
                total_development = 20
            }
            modifier = {
                factor = 1.2
                total_development = 50
            }
            modifier = {
                factor = 1.2
                total_development = 100
            }
            modifier = {
                factor = 1.2
                total_development = 150
            }
            modifier = {
                factor = 2
                inflation = 5
            }
            modifier = {
                factor = 1.5
                gold = 1
            }
            modifier = {
                factor = 1.5
                government_rank = 0 
            }
            modifier = {
                factor = 1.5
                government_rank = 1  
            }
            modifier = {
                factor = 0.5
                government_rank = 2
            }
            modifier = {
                factor = 0.5
                government_rank = 3
            }
        }
    }
    
    ########################################################
    ####### Health / Gesundheit
    ########################################################
    
    
    gesundheit0 = {
        category = ADM
    
        bonus = {
            global_unrest = -2
        }
            
        
        gesundheit1 = {
            production_efficiency = 0.1
        }
        gesundheit2 = {
            defensiveness = 0.1
        }
        gesundheit3 = {
            global_manpower_modifier = 0.1
            
        }
    
        gesundheit4 = {
            siege_ability = 0.1
        }
    
        gesundheit5 = {
            manpower_recovery_speed = 0.15
        }
        gesundheit6 = {
            idea_cost = -0.075
        }
        gesundheit7 = {
            global_tax_modifier = 0.10
            
        }
        
        ai_will_do = {
            factor = 10
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            modifier = {
                factor = 3
                num_of_colonists = 1
            }
            
            modifier = {
                factor = 2
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
            modifier = {
                factor = 0.2
                NOT = { num_of_ports = 1 }
            }
            modifier = {
                factor = 0.5
                NOT = { num_of_ports = 2 }
            }
            modifier = {
                factor = 0.5
                NOT = { num_of_ports = 3 }
            }
            modifier = {
                factor = 0.5
                NOT = { num_of_ports = 4 }
                num_of_cities = 4
            }
            
            modifier = {
                factor = 1.5
                num_of_ports = 16
            }
        }
    }
    
    ########################################################
    ####### Monarchy / Monarchie
    ########################################################
    
    
    monarchie0 = {
        category = ADM
    
        bonus = {
            cav_to_inf_ratio = 0.10
        }
            
        trigger = {
        
            has_government_attribute = enables_monarchie_idea_group
        
        }
        
        monarchie1 = {
            legitimacy = 2
            decision = monarchie_dec	
            elective_monarchy_add_buff = yes
        }
        
        monarchie2 = {
            heir_chance = 0.5
        }
        
        monarchie3 = {
            global_unrest = -1
            
        }
        
        monarchie4 = {
            cavalry_power = 0.075
        }
        
        monarchie5 = {
            yearly_absolutism = 1.0
        }
        
        monarchie6 = {
            ae_impact = -0.1
        }
    
        monarchie7 = {
            global_manpower_modifier = 0.1
            stand_interaktion = Nobil_1
        }
        
        
        ai_will_do = {
            factor = 10
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            modifier = {
                factor = 2
                personality = ai_militarist 
            }
            modifier = {
                factor = 2
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
        }
    }
    
    ########################################################
    ####### Republic / Republik (Plutokratie)
    ########################################################
    
    
    republik0 = {
        category = ADM
    
        bonus = {
            manpower_recovery_speed = 0.1
        }
            
        trigger = {
        has_government_attribute = enables_republik_idea_group
        }	
        
        
        republik1 = {
            diplomatic_upkeep = 2
        }
        
        republik2 = {
            land_morale = 0.075
        }
        republik3 = {
            global_unrest = -2
        }
        
        republik4 = {
            promote_culture_cost = -1.0
        }
        
        republik5 = {
            reform_progress_growth = 0.2
            stand_interaktion = Burg_1
        }
        
        
        republik6 = {
            global_trade_goods_size_modifier = 0.1
        }
        
        republik7 = {
            max_absolutism = 20
        }
        
        ai_will_do = {
            factor = 10
            modifier = {			
                factor = 1.5
                any_neighbor_country = {
                    is_rival = ROOT
                }
            }
            modifier = {
                factor = 50
                is_colonial_nation = yes
            }
            modifier = {
                factor = 3
                    government = merchant_republic
                
            }
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            modifier = {
                factor = 2
                personality = ai_militarist 
            }
            modifier = {
                factor = 2
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
        
        }
    }
    
    ########################################################
    ####### Theokratie/Theocracy
    ########################################################
    
    
    aristo0 = {
        category = ADM
    
        bonus = {
            war_exhaustion = -0.03
        }
    
        trigger = {
    
            has_government_attribute = enables_theokratie_idea_group
    
        }
    
        aristo1 = {
            devotion = 1
        }
        aristo2 = {
            shock_damage = 0.075
        }
        aristo3 = {
            missionaries = 1
            enforce_religion_cost = -0.25
        }
    
        aristo4 = {
            papal_influence = 1
            monthly_fervor_increase = 1
            church_power_modifier = 0.15
            stand_interaktion = Chur_1
        }
    
        aristo5 = {
            artillery_cost = -0.1
        }
        aristo6 = {
            warscore_cost_vs_other_religion = -0.15
        }
        aristo7 = {
            unjustified_demands = -0.25
        }
    
        ai_will_do = {
            factor = 10
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            modifier = {
                factor = 2
                personality = ai_militarist 
            }
            modifier = {
                factor = 2
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
        }
    }
    
    
    ########################################################
    ####### Dictatorship / Diktatur
    ########################################################
    
    
    diktatur0 = {
        category = ADM
    
        bonus = {
            mercenary_discipline = 0.05	
        }
        
        trigger = {
    
            has_government_attribute = enables_diktatur_idea_group
        }	
        
        diktatur1 = {
            global_tax_modifier = 0.1
        }
        diktatur2 = {
            production_efficiency = 0.1
        }
        diktatur3 = {
            mercenary_manpower = 0.1
            
        }
    
        diktatur4 = {
            loot_amount = 0.5
        }
    
        diktatur5 = {
            land_forcelimit_modifier = 0.05
        }
        diktatur6 = {
            diplomatic_annexation_cost = -0.1
            decision = diktatur_dec
        }
        diktatur7 = {
            mil_tech_cost_modifier = -0.05
        }
        
        ai_will_do = {
            factor = 10
            modifier = {
                factor = 2
                personality = ai_militarist 
            }
            modifier = {			
                factor = 1.5
                any_neighbor_country = {
                    is_rival = yes
                }
            }
            
            modifier = {
                factor = 2
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
        }
    }
    
    ########################################################
    ####### Horde Ideas / Horde Ideen
    ########################################################
    
    horde0 = {
        category = ADM
    
        bonus = {
            diplomatic_reputation = 1
        }
            
        trigger = {
        
        has_government_attribute = enables_horde_idea_group
                
        }
        
        horde1 = {
            raze_power_gain = 0.25
        }
        horde2 = {
            cavalry_cost = -0.2	
        }
        horde3 = {
            claim_duration = 0.25
        }
        horde4 = {
            cavalry_power = 0.075
        }
        horde5 = {
            horde_unity = 1
        }
        horde6 = {
            governing_capacity = 50
            reduced_dev_malus = yes
        }
        horde7 = {
            reduced_liberty_desire = 5
        }
        
        ai_will_do = {
            factor = 10
            modifier = {
                factor = 2
                personality = ai_capitalist 
            }
            modifier = {
                factor = 2
                personality = ai_militarist 
            }
            modifier = {
                factor = 2
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
        }
    }
    
    ########################################################
    ####### Gro�schiff / Heavy Ship Idea
    ########################################################
    
    gross0 = {
        category = DIP
    
        trigger = {
            primitives = no
            NOT = {
                has_idea_group = handel0
                has_idea_group = galle0
                }
        }
        
        bonus = {
            recover_navy_morale_speed = 0.15
        }
            
        
        gross1 = {
            heavy_ship_cost = -0.2
        }
        gross2 = {
            heavy_ship_power = 0.3
        }
        gross3 = {
            global_ship_recruit_speed = -0.2
        }
    
        gross4 = {
            global_sailors_modifier = 0.25
        }
    
        gross5 = {
            ship_durability = 0.15
        }
        gross6 = {
            naval_forcelimit_modifier = 0.25
            add_building = navyforcelimit_lvl_2
            add_building = navyforcelimit_lvl_3
        }
        gross7 = {
            sailor_maintenance_modifer = -0.1
            extra_navy tradition_heavy_ships = yes
        }
        
        ai_will_do = {
            factor = 10
            modifier = {
                factor = 0
                NOT = { num_of_ports = 3 }
            }
            modifier = {
                factor = 0
                NOT = { num_of_ports = 5 }
                num_of_cities = 5
            }
            modifier = {
                factor = 10
                OR = {
                tag = SPA
                tag = ENG
                tag = GBR
                tag = CAS
                tag = POR
                tag = NED
                tag = HOL
                tag = BUR
                }
            }
            modifier = {
                factor = 0
                NOT = { num_of_ports = 8 }
                num_of_cities = 10
            }
            modifier = {
                factor = 1.5
                has_idea_group = maritime_ideas
            }
            modifier = {
                factor = 2
                OR = {
                    num_of_heavy_ship = 12
                    num_of_light_ship = 18
                    num_of_galley = 28
                }
                personality = ai_militarist 
            }
        
        }
    }
    
    ########################################################
    ####### Galeerenidee / Galley Idea
    ########################################################
    
    galle0 = {
        category = DIP
    
        trigger = {
            primitives = no
            
            NOT = {
                has_idea_group = handel0
                has_idea_group = gross0
                }
            
        }
        
        bonus = {
            
            global_sailors_modifier = 0.35
            sailors_recovery_speed = 0.15
        }
            
        
        galle1 = {
            naval_forcelimit = 100
            heavy_ship_cost = 0.5
            add_age_forcelimit_naval = 100
            add_building = navymanpower_lvl_2
            add_building = navymanpower_lvl_3
        }
        galle2 = {
            galley_cost = -0.2
            
        }
        galle3 = {
            galley_power = 0.15
        }
    
        galle7 = {
            naval_morale = 0.1
        }
    
        galle5 = {
            sailor_maintenance_modifer = -0.25
            extra_navy tradition_galley = yes
        }
        galle6 = {
            ship_durability = 0.1
        }
        galle4 = {
            blockade_efficiency = 0.5
        }
        
        ai_will_do = {
            factor = 10
            modifier = {
                factor = 0
                NOT = { num_of_ports = 3 }
            }
            modifier = {
                factor = 0
                NOT = { num_of_ports = 5 }
                num_of_cities = 5
            }
    
            modifier = {
                factor = 4
                    num_of_galley = 25
                
            }
            modifier = {
                factor = 15
                OR = {
                tag = TUR
                tag = VEN
                tag = GEN
                }
            }
            modifier = {
                factor = 10
                capital_scope = {
                    OR = {
                        region = italy_region
                        region = baltic_region
                        region = balkan_region
                        region = maghreb_region
                        region = anatolia_region
                        
                    }
                }
                NOT = { technology_group = high_american }
            }
            
        }
    }
    
    ########################################################
    ####### Handelsschiff / Light Ship Ideas
    ########################################################
    
    handel0 = {
        category = DIP
    
        trigger = {
            primitives = no
            NOT = {
                has_idea_group = galle0
                has_idea_group = gross0
                }
        }
        
        bonus = {
            merchants = 1
        }
            
        
        handel1 = {
            light_ship_cost = -0.2
            transport_cost = -0.2
        }
        handel2 = {
            light_ship_power = 0.2
            transport_power = 0.2
        }
        handel3 = {
            trade_efficiency = 0.1
            extra_navy tradition_light_ships = yes
        }
    
        handel4 = {
            sailor_maintenance_modifer = -0.75
        }
    
        handel5 = {
            naval_forcelimit_modifier = 0.5
            global_ship_trade_power = 0.25
            add_building = navymanpower_lvl_2
            add_building = navymanpower_lvl_3
        }
        handel6 = {
            privateer_efficiency = 0.25
            embargo_efficiency = 0.25
            
        }
        handel7 = {
            naval_morale = 0.2
        }
        
        ai_will_do = {
            factor = 10
            modifier = {
                factor = 0
                NOT = { num_of_ports = 3 }
            }
            modifier = {
                factor = 0
                NOT = { num_of_ports = 5 }
                num_of_cities = 5
            }
            modifier = {
                factor = 0
                NOT = { num_of_ports = 8 }
                num_of_cities = 10
            }
            modifier = {
                factor = 1.5
                has_idea_group = maritime_ideas
            }
            modifier = {
                factor = 1.5
                has_idea_group = flottenbasis0
            }
            modifier = {
                factor = 20
    
                    num_of_light_ship = 50
            }
            
        }
    }
    
    ########################################################
    ####### Colonial Empire / Kolonialimperium
    ########################################################
    
    
    kolonialimperium0 = {
        category = DIP
    
        bonus = {
            diplomatic_upkeep = 2
        }
            
    
        kolonialimperium2 = {
            colonists = 1
            
        }
        
        kolonialimperium1 = {
            trade_company_governing_cost = -0.25
        }
        
        kolonialimperium4 = {
            global_tariffs = 0.25
            global_tariffs = 0.05/Colonial Nation
            Inflation reduction = -0.025/Colonial Nation
        }
        
        kolonialimperium3 = {
            global_manpower_modifier = 0.1
            global_sailors_modifier = 0.1
            global_manpower_modifier = 0.05/Colonial Nation
            global_sailors_modifier = 0.05/Colonial Nation
        }
        
        kolonialimperium6 = {
            naval_forcelimit_modifier = 0.25
            naval_forcelimit_modifier = 0.05/Colonial Nation
        }
    
        kolonialimperium5 = {
            build_cost = -0.01
            build_cost_in_colo_nation = -0.5
        }
        
        kolonialimperium7 = {
            liberty_desire_from_subject_development = -0.5
        }
        
        ai_will_do = {
            factor = 15
            modifier = {
                factor = 0
                num_of_colonists = 0
            }
            modifier = {
                factor = 5
                num_of_colonists = 1 
            }
            modifier = {
                factor = 10
                num_of_colonists = 2
            }
            modifier = {
                factor = 2
                personality = ai_diplomat
            }
            
            modifier = {
                factor = 2
                personality = ai_militarist 
            }
            modifier = {
                factor = 0
                OR = {
                    is_subject = yes
                    is_vassal = yes
                    is_colonial_nation = yes
                    is_tribal = yes
                    primitives = yes
                }
            }
            modifier = {
                factor = 0
                NOT = { num_of_ports = 1 }
            }
            modifier = {
                factor = 0.5
                NOT = { num_of_ports = 2 }
            }
            modifier = {
                factor = 0.5
                NOT = { num_of_ports = 3 }
            }
            modifier = {
                factor = 0.5
                NOT = { num_of_ports = 4 }
                num_of_cities = 4
            }
            modifier = {
                factor = 2.0
                num_of_ports = 5
            }
            modifier = {
                factor = 2.0
                num_of_ports = 10
            }
            modifier = {
                factor = 2.0
                num_of_ports = 15
            }
            modifier = {
                factor = 2.0
                num_of_ports = 20
            }
            modifier = {
                factor = 2
                OR = {
                    tag = GBR
                    tag = NED
                    tag = ENG
                    tag = FRA
                    tag = CAS
                    tag = POR
                }
            }
            modifier = {
                factor = 2.5
                OR = {
                    has_idea_group = maritime_ideas
                    has_idea_group = naval_ideas
                }
            }
            modifier = {
                factor = 25
                technology_group = western
                capital_scope = { region = iberia_region }
                any_known_country = {
                    has_idea_group = exploration_ideas
                }
                num_of_ports = 3 
            }
            modifier = {
                factor = 10
                personality = ai_colonialist
            }
            modifier = {
                factor = 0.5
                personality = ai_militarist
            }
            modifier = {	
                factor = 3
                technology_group = western 
                num_of_ports = 5
                any_neighbor_country = {
                    has_idea_group = exploration_ideas
                        num_of_colonies = 1
                    
                }
            }
            modifier = {			
                factor = 3
                technology_group = western 
                num_of_ports = 3
                any_rival_country = {
                    has_idea_group = exploration_ideas
        
                        num_of_colonies = 1
                    
                }
            }
            modifier = {			
                factor = 3
                num_of_ports = 9
                any_neighbor_country = {
                    has_idea_group = exploration_ideas
        
                        num_of_colonies = 1
                    
                }
            }
            modifier = {			
                factor = 3
                num_of_ports = 7
                any_rival_country = {
                    has_idea_group = exploration_ideas
        
                        num_of_colonies = 1
                    
                }
            }
            modifier = {
                factor = 2.0
                has_idea_group = exploration_ideas
            }
            modifier = {
                factor = 2.0
                has_idea_group = expansion_ideas
            }
        }
    }
    
    ########################################################
    ####### Assimilation
    ########################################################
    
    
    assimilation0 = {
        category = DIP
    
        bonus = {
            diplomatic_reputation = 2
        }
            
        
        assimilation1 = {
            culture_conversion_cost = -0.5
        }
        assimilation2 = {
            diplomatic_annexation_cost = -0.25
        }
        
        assimilation7 = {
            global_manpower_modifier = 0.15
        }
        
        assimilation3 = {
            religious_unity = 0.2
        }
    
        assimilation4 = {
            
            years_of_nationalism = -5
        }
    
        assimilation5 = {
            reform_progress_growth = 0.1
            stability_cost_modifier = -0.15
        }
        assimilation6 = {
            shock_damage_received = -0.025
        }
    
        
        ai_will_do = {
            factor = 10
            modifier = {
                factor = 2
                personality = ai_diplomat
            }
            modifier = {
                factor = 2
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
            
        }
    }
    
    ########################################################
    ####### Society / Gesellschaft
    ########################################################
    
    
    gesellschaft0 = {
        category = DIP
    
        bonus = {
            advisor_pool = 1
        }
            
        
        gesellschaft1 = {
            land_maintenance_modifier = -0.05
        }
        gesellschaft2 = {
            improve_relation_modifier = 0.15
        }
        gesellschaft3 = {
            global_institution_spread = 0.1
            global_institution_growth = 0.05
        }
    
        gesellschaft4 = {
            advisor_cost = -0.1
        }
    
        gesellschaft5 = {
            spy_offence = 0.1
            global_spy_defence = 0.1
        }
        gesellschaft6 = {
            global_unrest = -1
        }
        gesellschaft7 = {
            land_morale = 0.05
        }
        
        ai_will_do = {
            factor = 10
            modifier = {
                factor = 5
                personality = ai_diplomat
            }
            
            modifier = {
                factor = 2
                personality = ai_militarist 
            }
            modifier = {
                factor = 0.5
                government = monarchy
            }
            
            modifier = {
                factor = 3
                government = republic
            }
        }
    }
    
    ########################################################
    ####### Propaganda
    ########################################################
    
    
    propaganda0 = {
        category = DIP
    
        bonus = {
            global_manpower_modifier = 0.1
        }
            
        
        propaganda1 = {
            war_exhaustion = -0.025
        }
        propaganda2 = {
            diplomats = 1
        }
        propaganda3 = {
            improve_relation_modifier = 0.15
        }
    
        propaganda4 = {
            diplomatic_reputation = 2
        }
    
        propaganda5 = {
            reform_progress_growth = 0.15
            yearly_absolutism = 1.0
        }
        propaganda6 = {
            unjustified_demands = -0.25
        }
        propaganda7 = {
            siege_ability = 0.1
        }
        
        ai_will_do = {
            factor = 10
            modifier = {
                factor = 2
                personality = ai_diplomat
            }
            modifier = {			
                factor = 1.5
                any_neighbor_country = {
                    is_rival = yes
                }
            }
            modifier = {
                factor = 3
                government = monarchy
            }
            
            modifier = {
                factor = 3
                government = republic
            }
            modifier = {
                factor = 2
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
            
        }
    }
    
    ########################################################
    ####### Fleet Base / Flottenbasis
    ########################################################
    
    
    flottenbasis0 = {
        category = DIP
    
        bonus = {
            allowed_marine_fraction = 0.25
        }
            
        
        flottenbasis2 = {
            sailor_maintenance_modifer = -0.25
            add_building = navalbase_lvl_1
            add_building = navalbase_lvl_2
            
        }
        flottenbasis3 = {
            naval_forcelimit_modifier = 0.25
        }
        
        flottenbasis1 = {
            global_manpower = 2.5
            add_age_manpower = 2.5	
            add_cb = cb_coast
        }
    
        flottenbasis4 = {
            global_sailors = 2500
            add_age_sailors = 2500
        }
    
        flottenbasis5 = {
            naval_morale = 0.1
            
        }
        flottenbasis6 = {
            heavy_ship_power = 0.1
        }
        flottenbasis7 = {
            global_ship_repair = 0.2
        }
        
        ai_will_do = {
            factor = 10
            modifier = {
                factor = 0
                NOT = { num_of_ports = 1 }
            }
            modifier = {
                factor = 0.5
                NOT = { num_of_ports = 2 }
            }
            modifier = {
                factor = 0.5
                NOT = { num_of_ports = 3 }
            }
            modifier = {
                factor = 0.5
                NOT = { num_of_ports = 4 }
                num_of_cities = 4
            }
            
            modifier = {
                factor = 1.5
                num_of_ports = 16
            }
            
            modifier = {
                factor = 2
                OR = {
                    num_of_heavy_ship = 12
                    num_of_light_ship = 18
                    num_of_galley = 28
                }
                
            }
            modifier = {			
                factor = 1.5
                any_neighbor_country = {
                    is_rival = yes
                }
            }
            
            modifier = {
                factor = 10
                num_of_colonists = 1 
            }
            
            modifier = {
                factor = 2
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
            modifier = {
                factor = 2
                personality = ai_diplomat
            }
            
            modifier = {
                factor = 4
                personality = ai_militarist 
            }
        }
    }
    
    ########################################################
    ####### Nationalism / Nationalismus
    ########################################################
    
    
    nationalismus0 = {
        category = DIP
    
        bonus = {
            prestige = 1
        }
            
        
        nationalismus1 = {
            war_exhaustion_cost = -0.25
            add_stand = estate_nationalist
        }
    
        nationalismus3 = {
            global_regiment_cost = -0.10
        }
    
        nationalismus4 = {
            hostile_attrition = 1
    
        }
    
        nationalismus5 = {
            enemy_core_creation = 0.25
        }
        
        nationalismus2 = {
            global_manpower = 2.5
            add_age_manpower = 2.5
        }
        
        nationalismus6 = {
            max_absolutism = 10
            global_unrest = -1
        }
        nationalismus7 = {
            prestige_from_land = 1
        }
        
        ai_will_do = {
            factor = 15
            modifier = {
                factor = 2
                personality = ai_diplomat
            }
            
            modifier = {
                factor = 2
                personality = ai_militarist 
            }
            modifier = {			
                factor = 5
                any_neighbor_country = {
                    is_rival = yes
                }
            }
            modifier = {
                factor = 2
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
        }
    }
    
    ########################################################
    #######  K�nigreich Ideen / Kingdom Ideas
    ########################################################
    
    
    konigreich0 = {
        category = DIP
    
        bonus = {
            land_morale = 0.05
        }
            
        trigger = {
                
                government_rank = 2
                 
                 NOT = {
                 OR = {
                government_rank = 3 
                is_emperor = yes 
                }
                }
                
        }
        
        konigreich1 = {
            prestige_decay = -0.01
            decision = konigreich_dec
        }
        konigreich2 = {
            land_forcelimit = 3
            add_age_forcelimit_land = 3
        }
        konigreich3 = {
            development_cost = -0.1
        }
    
        konigreich4 = {
            institution_spread_from_true_faith = 0.15
        }
    
        konigreich5 = {
            naval_forcelimit = 20
            add_age_forcelimit_naval = 20
        }
        konigreich6 = {
            reinforce_cost_modifier = -0.15
        }
        konigreich7 = {
            diplomatic_upkeep = 1
            add_cb = cb_herzog
        }
        
        
        
        ai_will_do = {
            factor = 10
            modifier = {
                factor = 3
                total_development = 500
            }
            modifier = {
                factor = 4
                total_development = 700
            }
            modifier = {
                factor = 5
                total_development = 800
            }
            modifier = {
                factor = 6
                total_development = 1000
            }
            modifier = {
                factor = 5
                government = monarchy
            }
            
            modifier = {
                factor = 2.5
                num_of_ports = 25
            }
            
            modifier = {
                factor = 2
                OR = {
                    num_of_heavy_ship = 12
                    num_of_light_ship = 18
                    num_of_galley = 28
                }
                
            }
            modifier = {
                factor = 2
                personality = ai_diplomat
            }
            
            modifier = {
                factor = 2
                personality = ai_militarist 
            }
            modifier = {			
                factor = 4.5
                any_neighbor_country = {
                    is_rival = yes
                }
            }
        }
    }
    
    ########################################################
    ####### Imperialism / Imperialismus
    ########################################################
    
    
    imperialismus0 = {
        category = DIP
    
        bonus = {
            max_absolutism = 10
        }
            
        trigger = {
                OR = {
                government_rank = 3 
                is_emperor = yes 
                }
        }
        
        
        imperialismus1 = {
            core_creation = -0.15
        }
        imperialismus2 = {
            imperial_authority_value = 0.05
            imperial_mandate = 0.05
            add_age_authority = 0.05
        }
        imperialismus3 = {
            prestige_decay = -0.01
        }
    
        imperialismus4 = {
            global_tax_modifier = 0.1
            global_unrest = 1
        }
    
        imperialismus5 = {
            naval_forcelimit_modifier = 0.15
    
        }
        imperialismus6 = {
            land_forcelimit_modifier = 0.05
        }
        imperialismus7 = {
            discipline = 0.025
        }
        
        ai_will_do = {
            factor = 10
            modifier = {
                factor = 3
                total_development = 500
            }
            modifier = {
                factor = 4
                total_development = 700
            }
            modifier = {
                factor = 5
                total_development = 800
            }
            modifier = {
                factor = 6
                total_development = 1000
            }
            modifier = {
                factor = 5
                government = monarchy
            }
            
            modifier = {
                factor = 2.5
                num_of_ports = 25
            }
            
            modifier = {
                factor = 2
                OR = {
                    num_of_heavy_ship = 12
                    num_of_light_ship = 18
                    num_of_galley = 28
                }
                
            }
            modifier = {
                factor = 2
                personality = ai_diplomat
            }
            
            modifier = {
                factor = 2
                personality = ai_militarist 
            }
            modifier = {			
                factor = 4.5
                any_neighbor_country = {
                    is_rival = yes
                }
            }
        }
    }
    
    ########################################################
    ####### General Staff / Generalstab
    ########################################################
    
    
    generalstab0 = {
        category = MIL
    
        bonus = {
            free_leader_pool = 1
        }
            
        
        generalstab1 = {
            leader_land_shock = 1
        }
        generalstab2 = {
            leader_land_fire = 1
        }
        generalstab3 = {
            leader_land_manuever = 1
            leader_naval_manuever = 1
        }
    
        generalstab4 = {
            leader_siege = 1
        }
    
        generalstab5 = {
            leader_naval_fire = 1
            leader_naval_shock = 1
        }
        generalstab6 = {
            yearly_army_professionalism = 0.025
        }
        generalstab7 = {
            free_leader_pool = 1
        }
        
        ai_will_do = {
            factor = 15
            modifier = {
                factor = 30
                personality = ai_militarist 
            }
            modifier = {			
                factor = 4.5
                any_neighbor_country = {
                    is_rival = yes
                }
            }
            modifier = {
                factor = 2
                total_development = 200
            }
            modifier = {
                factor = 3
                total_development = 500
            }
            modifier = {
                factor = 4
                total_development = 700
            }
            modifier = {
                factor = 5
                total_development = 800
            }
            modifier = {
                factor = 6
                total_development = 1000
            }
            modifier = {
                factor = 2
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
        }
    }
    
    ########################################################
    ####### Standing Army / Stehendes Heer
    ########################################################
    
    
    stehendesheer0 = {
        category = MIL
    
        bonus = {
            drill_decay_modifier = -0.5
            land_maintenance_modifier = 0.075
        }
            
            trigger = {
            NOT = {
                has_idea_group = soldnerheer0
                has_idea_group = wehrpflicht0 
                }
            }
        
        stehendesheer1 = {
            infantry_power = 0.1
        }
        stehendesheer2 = {
            cavalry_power = 0.1
        }
        stehendesheer3 = {
            artillery_power = 0.1
        }
    
        stehendesheer5 = {
            drill_gain_modifier = 0.25
        }
        stehendesheer6 = {
            prestige_from_land = 1
            
        }
        stehendesheer7 = {
            siege_ability = 0.1
            
        }
        
        stehendesheer4 = {
            discipline = 0.05
        }
        
        ai_will_do = {
            factor = 30
            modifier = {
                factor = 30
                personality = ai_militarist 
            }
            modifier = {			
                factor = 4.5
                any_neighbor_country = {
                    is_rival = yes
                }
            }
    
            modifier = {
                factor = 2
                total_development = 200
            }
            modifier = {
                factor = 10
                total_development = 500
            }
            modifier = {
                factor = 4
                total_development = 700
            }
            modifier = {
                factor = 5
                total_development = 800
            }
            modifier = {
                factor = 6
                total_development = 1000
            }
            modifier = {
                factor = 2
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
        }
    }
    
    ########################################################
    ####### Mercenary Army / Soldnerheer
    ########################################################
    
    
    soldnerheer0 = {
        category = MIL
    
        bonus = {
            merc_maintenance_modifier = -0.25
            #yearly_army_professionalism = 0.005
        }
            
            trigger = {
            NOT = {
                has_idea_group = stehendesheer0
                has_idea_group = wehrpflicht0 
                }
            }
        
        soldnerheer1 = {
            loot_amount = 0.5
        }
        soldnerheer2 = {
            mercenary_cost = -0.5
            
        }
        soldnerheer3 = {
            war_exhaustion = -0.05
        }
    
        soldnerheer4 = {
            merc_maintenance_modifier = -0.5
        }
    
        soldnerheer5 = {
            free_leader_pool = 1
        }
        soldnerheer6 = {
            mercenary_discipline = 0.05
        }
        soldnerheer7 = {
            mercenary_manpower = 1.0
            no_prof_loss_for_mercs = yes
        }
        
        ai_will_do = {
            factor = 30
            modifier = {
                factor = 30
                personality = ai_militarist 
            }
            modifier = {			
                factor = 4.5
                any_neighbor_country = {
                    is_rival = yes
                }
            }
            modifier = {
                factor = 2
                total_development = 200
            }
            modifier = {
                factor = 3
                total_development = 500
            }
            modifier = {
                factor = 10
                total_development = 700
            }
            modifier = {
                factor = 5
                total_development = 800
            }
            modifier = {
                factor = 6
                total_development = 1000
            }
            modifier = {
                factor = 5
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
            modifier = {
                factor = 5
                government = republic
            }
        }
    }
    
    ########################################################
    ####### Conscription / Wehrpflicht
    ########################################################
    
    
    wehrpflicht0 = {
        category = MIL
    
        bonus = {
            manpower_recovery_speed = 0.5
        }
            
            trigger = {
            NOT = {
                has_idea_group = stehendesheer0
                has_idea_group = soldnerheer0
                }
            }
        
        wehrpflicht3 = {
            reinforce_speed = 0.2
        }
        wehrpflicht2 = {
            land_morale = 0.15
        }
        wehrpflicht1 = {
            global_manpower = 5.0
            add_age_manpower = 5.0
        }
    
        wehrpflicht4 = {
            army_tradition = 1
        }
    
        wehrpflicht5 = {
            mil_tech_cost_modifier = -0.075
        }
        wehrpflicht6 = {
            global_manpower_modifier = 0.25
        }
        wehrpflicht7 = {
            drill_gain_modifier = 0.5
        }
        
        ai_will_do = {
            factor = 30
            modifier = {
                factor = 30
                personality = ai_militarist 
            }
            modifier = {			
                factor = 4.5
                any_neighbor_country = {
                    is_rival = yes
                }
            }
            modifier = {
                factor = 10
                total_development = 200
            }
            modifier = {
                factor = 3
                total_development = 500
            }
            modifier = {
                factor = 4
                total_development = 700
            }
            modifier = {
                factor = 5
                total_development = 800
            }
            modifier = {
                factor = 6
                total_development = 1000
            }
            modifier = {
                factor = 5
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
        }
    }
    
    ########################################################
    ####### Weapons Quality / Waffenqualit�t
    ########################################################
    
    
    waffenqualitat0 = {
        category = MIL
    
        bonus = {
            discipline = 0.035
        }
            
        
        waffenqualitat1 = {
            global_trade_goods_size_modifier = 0.075
        }
        waffenqualitat2 = {
            infantry_power = 0.075
        }
        waffenqualitat3 = {
            cavalry_power = 0.075
        }
    
        waffenqualitat4 = {
            merchants = 1
        }
    
        waffenqualitat5 = {
            siege_ability = 0.1
        }
        waffenqualitat6 = {
            production_efficiency = 0.075
        }
        waffenqualitat7 = {
            artillery_power = 0.075
        }
        
        ai_will_do = {
            factor = 15
            modifier = {
                factor = 30
                personality = ai_militarist 
            }
            modifier = {			
                factor = 20
                any_neighbor_country = {
                    is_rival = yes
                }
            }
            modifier = {
                factor = 2.0
                has_idea_group = quality_ideas
            }
            modifier = {
                factor = 2
                total_development = 200
            }
            modifier = {
                factor = 3
                total_development = 300
            }
            modifier = {
                factor = 4
                total_development = 400
            }
            modifier = {
                factor = 5
                total_development = 500
            }
            modifier = {
                factor = 6
                total_development = 600
            }
            modifier = {
                factor = 4
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 4
                government_rank = 2  # Kingdom
            }
        }
    }
    
    ########################################################
    ####### Fortress / Festung
    ########################################################
    
    
    festung0 = {
        category = MIL
    
        bonus = {
            reinforce_speed = 0.25
            
        }
            
            
        festung7 = {
            reinforce_cost_modifier = -0.25
            
        }
        festung1 = {
            defensiveness = 0.25
            
        }
        
        festung4 = {
            fort_maintenance_modifier = -0.5
            add_building = fortress_keep
            add_building = fortress_barracks
            add_building = fortress_towers
            add_building = fortress_artillery
            add_building = fortress_wall
            add_building = fortress_supply
        }
        
        festung6 = {
            shock_damage_received = -0.05
        }
        
        festung2 = {
            garrison_size = 0.50
            global_garrison_growth = 0.25
        }
    
        festung5 = {
            hostile_attrition = 2
        }
        
        festung3 = {
            artillery_power = 0.15
            artillery_cost = -0.1
        }
        
        
        ai_will_do = {
            factor = 15
            modifier = {
                factor = 5
                    is_march = yes
                
            }
            modifier = {
                factor = 30
                personality = ai_militarist 
            }
            modifier = {			
                factor = 4.5
                any_neighbor_country = {
                    is_rival = yes
                }
            }
    
            modifier = {
                factor = 2
                total_development = 200
            }
            modifier = {
                factor = 10
                total_development = 500
            }
            modifier = {
                factor = 4
                total_development = 700
            }
            modifier = {
                factor = 5
                total_development = 800
            }
            modifier = {
                factor = 6
                total_development = 1000
            }
            modifier = {
                factor = 2
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
        }
    }
    
    ########################################################
    ####### War Production / Kriegsproduktion
    ########################################################
    
    
    kriegsproduktion0 = {
        category = MIL
    
        bonus = {
            land_morale = 0.075
        }
            
        
        kriegsproduktion1 = {
            infantry_cost = -0.15
        }
        kriegsproduktion2 = {
            cavalry_cost = -0.15
        }
        kriegsproduktion3 = {
            interest = -1
        }
    
        kriegsproduktion4 = {
            reinforce_speed = 0.5
            reinforce_cost_modifier = -0.25
        }
    
        kriegsproduktion5 = {
            fire_damage = 0.075
        }
        kriegsproduktion6 = {
            artillery_cost = -0.15
        }
        kriegsproduktion7 = {
            naval_forcelimit_modifier = 0.15
            land_forcelimit_modifier = 0.15
        }
        
        ai_will_do = {
            factor = 15
            modifier = {
                factor = 30
                
                    is_march = yes
                
            }
            modifier = {
                factor = 5
                
                    is_vassal = yes
                
            }
            modifier = {
                factor = 30
                personality = ai_militarist 
            }
            modifier = {			
                factor = 20
                any_neighbor_country = {
                    is_rival = yes
                }
            }
            modifier = {
                factor = 2
                total_development = 200
            }
            modifier = {
                factor = 3
                total_development = 300
            }
            modifier = {
                factor = 4
                total_development = 400
            }
            modifier = {
                factor = 5
                total_development = 500
            }
            modifier = {
                factor = 6
                total_development = 600
            }
            modifier = {
                factor = 3
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
        }
    }
    
    ########################################################
    ####### Public Administration / Staatsverwaltung 
    ########################################################
    
    
    staatsverwaltung0 = {
        category = ADM
    
        bonus = {
            core_creation = -0.1
        }
            
        
        staatsverwaltung1 = {
            governing_capacity_modifier = 0.25
            
        }
        staatsverwaltung2 = {
            state_maintenance_modifier = -0.5
        }
        staatsverwaltung3 = {
            caravan_power = 0.2
        }
    
        staatsverwaltung4 = {
            yearly_corruption = -0.1
        }
    
        staatsverwaltung5 = {
            merchants = 1
        }
        staatsverwaltung6 = {
            embracement_cost = -0.25
            
        }
        staatsverwaltung7 = {
            global_trade_goods_size_modifier = 0.1
        }
        
        ai_will_do = {
            factor = 10
            modifier = {
                factor = 10
                personality = ai_capitalist 
            }
            modifier = {
                factor = 2.0
                has_idea_group = administrative_ideas
            }
            modifier = {
                factor = 2.0
                has_idea_group = justiz0
            }
            modifier = {
                factor = 2
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
            
            modifier = {
                factor = 3
                government = monarchy
            }
            
            modifier = {
                factor = 2
                government = republic
            }
        }
    }
    
    ########################################################
    ####### Zentralismus Ideen / Centralism Ideas
    ########################################################
    
    
    zentra0 = {
        category = ADM
    
        trigger = {
            
            NOT = {
                has_idea_group = dezentra0
                }	
                
            }
        
        bonus = {
            defensiveness = 0.1
        }
            
        
        zentra1 = {
            build_time = -0.33
        }
        zentra2 = {
            global_trade_goods_size_modifier = 0.1
        }
        zentra3 = {
            development_cost = -0.025
            development_cost_over_25 = yes
        }
    
        zentra4 = {
            autonomy_change_time = -0.5
        }
    
        zentra5 = {
            global_manpower = 2.5
            global_sailors = 1250
            add_age_manpower = 2.5
            add_age_sailors = 1250
        }
        zentra6 = {
            state_maintenance_modifier = -0.5
            governing_capacity = -50
        }
        zentra7 = {
            global_tax_modifier = 0.1
        }
        
        ai_will_do = {
            factor = 10
            modifier = {
                factor = 10
                personality = ai_capitalist 
            }
            modifier = {
                factor = 2.0
                has_idea_group = administrative_ideas
            }
            modifier = {
                factor = 2.0
                has_idea_group = justiz0
            }
            modifier = {
                factor = 2
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
            
            modifier = {
                factor = 3
                government = monarchy
            }
            
            modifier = {
                factor = 2
                government = republic
            }
        }
    }
    
    ########################################################
    ####### Dezentralismus Ideen / Decentralism Ideas
    ########################################################
    
    
    dezentra0 = {
        category = ADM
        
            trigger = {
            
            NOT = {
                has_idea_group = zentra0
                }	
                
            }
        bonus = {
            development_cost = -0.1
        }
            
        
        dezentra1 = {
            build_cost = -0.1
            reduced_dev_malus = yes
        }
        dezentra2 = {
            yearly_corruption = -0.1
        }
        dezentra3 = {
            trade_efficiency = 0.1
        }
    
        dezentra4 = {
            idea_cost = -0.075
            global_institution_spread = 0.15
        }
    
        dezentra5 = {
            governing_capacity_modifier = 0.33
        }
        dezentra6 = {
            global_manpower_modifier = 0.1
            global_sailors_modifier = 0.1
        }
        dezentra7 = {
            global_prov_trade_power_modifier = 0.2
        }
        
        ai_will_do = {
            factor = 10
            modifier = {
                factor = 10
                personality = ai_capitalist 
            }
            modifier = {
                factor = 2.0
                has_idea_group = administrative_ideas
            }
            modifier = {
                factor = 2.0
                has_idea_group = justiz0
            }
            modifier = {
                factor = 2
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
            
            modifier = {
                factor = 3
                government = monarchy
            }
            
            modifier = {
                factor = 2
                government = republic
            }
        }
    }
    
    ########################################################
    ####### Taktik Ideen / Tactics Ideas
    ########################################################
    
    
    formation0 = {
        category = MIL
    
        bonus = {
            leader_land_manuever = 1
        }
            
        
        formation1 = {
            movement_speed = 0.25
        }
        formation2 = {
            shock_damage = 0.1
        }
        formation3 = {
            cav_to_inf_ratio = 0.25
            cavalry_flanking = 0.5
        }
    
        formation4 = {
            shock_damage_received = -0.05
        }
    
        formation5 = {
            fire_damage = 0.1
        }
        formation6 = {
            global_supply_limit_modifier = 1.0
            land_attrition = -0.15
        }
        formation7 = {
            fire_damage_received = -0.05
        }
        
        ai_will_do = {
            factor = 15
            modifier = {
                factor = 30
                personality = ai_militarist 
            }
            modifier = {			
                factor = 20
                any_neighbor_country = {
                    is_rival = yes
                }
            }
            modifier = {
                factor = 2
                total_development = 200
            }
            modifier = {
                factor = 3
                total_development = 300
            }
            modifier = {
                factor = 4
                total_development = 400
            }
            modifier = {
                factor = 5
                total_development = 500
            }
            modifier = {
                factor = 6
                total_development = 600
            }
            modifier = {
                factor = 3
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
        }
    }
    
    ########################################################
    ####### Militarismus Ideen / Militarism Ideas
    ########################################################
    
    
    militarismus0 = {
        category = MIL
    
        bonus = {
            war_exhaustion = -0.03
        }
            
        
        militarismus1 = {
            land_forcelimit_modifier = 0.1
        }
        militarismus2 = {
            free_leader_pool = 1
        }
        militarismus3 = {
            discipline = 0.035
        }
    
        militarismus4 = {
            global_manpower = 5.0
            add_age_manpower = 5.0
        }
    
        militarismus5 = {
            global_garrison_growth = 0.25
            garrison_size = 0.25	
        }
        militarismus6 = {
            monthly_militarized_society = 0.05
            land_attrition = -0.1
        }
        militarismus7 = {
            shock_damage_received = -0.05
        }
        
        ai_will_do = {
            factor = 15
            modifier = {
                factor = 30
                personality = ai_militarist 
            }
            modifier = {			
                factor = 20
                any_neighbor_country = {
                    is_rival = yes
                }
            }
            modifier = {
                factor = 2
                total_development = 200
            }
            modifier = {
                factor = 3
                total_development = 300
            }
            modifier = {
                factor = 4
                total_development = 400
            }
            modifier = {
                factor = 5
                total_development = 500
            }
            modifier = {
                factor = 6
                total_development = 600
            }
            modifier = {
                factor = 3
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
        }
    }
    
    ########################################################
    ####### Shock Fokus Ideen / Shock Focus Ideas
    ########################################################
    
    
    shock0 = {
        category = MIL
        
        trigger = {
            
            NOT = {
                has_idea_group = fire0
                }	
                
            }
        
        bonus = {
            cavalry_power = 0.075
        }
            
        
        shock2 = {
            cavalry_flanking = 1.0
        }
        shock1 = {
            fire_damage_received = -0.05
            add_age_fire_damage_received = -0.05
        }
        shock3 = {
            cavalry_cost = -0.33
        }
        shock6 = {
            cav_to_inf_ratio = 0.25
        }
        shock4 = {
            shock_damage = 0.05
        }
        shock5 = {
            cavalry_power = 0.075
        }
        shock7 = {
            leader_land_shock = 1
        }
        
        ai_will_do = {
            factor = 15
            modifier = {
                factor = 30
                personality = ai_militarist 
            }
            modifier = {			
                factor = 20
                any_neighbor_country = {
                    is_rival = yes
                }
            }
            modifier = {
                factor = 2
                total_development = 200
            }
            modifier = {
                factor = 3
                total_development = 300
            }
            modifier = {
                factor = 4
                total_development = 400
            }
            modifier = {
                factor = 5
                total_development = 500
            }
            modifier = {
                factor = 6
                total_development = 600
            }
            modifier = {
                factor = 3
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
        }
    }
    
    
    ########################################################
    ####### Feuer Fokus Ideen / Fire Focus Ideas
    ########################################################
    
    
    fire0 = {
        category = MIL
        
        trigger = {
            
            NOT = {
                has_idea_group = shock0
                }	
                
            }
        
        bonus = {
            shock_damage_received = -0.05
        }
            
        
        fire1 = {
            shock_damage_received = -0.05
        }
        fire2 = {
            artillery_bonus_vs_fort = 1
        }
        fire3 = {
            artillery_power = 0.075
        }
    
        fire4 = {
            fire_damage = 0.05
        }
    
        fire5 = {
            defensiveness = 0.1
        }
        fire6 = {
            backrow_artillery_damage = 0.1
        }
        fire7 = {
            leader_land_fire = 1
        }
        
        ai_will_do = {
            factor = 15
            modifier = {
                factor = 30
                personality = ai_militarist 
            }
            modifier = {			
                factor = 20
                any_neighbor_country = {
                    is_rival = yes
                }
            }
            modifier = {
                factor = 2
                total_development = 200
            }
            modifier = {
                factor = 3
                total_development = 300
            }
            modifier = {
                factor = 4
                total_development = 400
            }
            modifier = {
                factor = 5
                total_development = 500
            }
            modifier = {
                factor = 6
                total_development = 600
            }
            modifier = {
                factor = 3
                government_rank = 3  # Empire
            }
            
            modifier = {
                factor = 2
                government_rank = 2  # Kingdom
            }
        }
    }
    
    
    
    
    `;
}