var monarchPowerMappings = {
    "ADM": "Administrative_power.png",
    "DIP": "Diplomatic_power.png",
    "MIL": 'Military_power.png',
};

var bonusMappings = {
    "Infantry combat ability": "Infantry_combat_ability.png",
    "Cavalry combat ability": "Cavalry_combat_ability.png",
    "Artillery combat ability": "Artillery_combat_ability.png",
    "Colonial range": "Colonial_range.png",
    "Colonists": "Colonists.png",
    "Idea cost": "Idea_cost.png",
    "May explore": "May_explore.png",
    "Missionaries": "Missionaries.png",
    "Missionary strength vs heretics": "Missionary_strength_vs_heretics.png",
    "Missionary maintenance cost": "Missionary_maintenance_cost.png",
    "Missionary strength": "Missionary_strength.png",
    "Monarch admin power": "Monarch_administrative_power.png",
    "Monarch diplomatic power": "Monarch_diplomatic_power.png",
    "Monarch military power": "Monarch_military_power.png",

}

window.imageMap = function(thingToMap){
    if(monarchPowerMappings[thingToMap]){
        return 'Icons/' + monarchPowerMappings[thingToMap];
    }
    if(bonusMappings[thingToMap]){
        return 'Icons/Bonuses/' + bonusMappings[thingToMap];
    }
}

window.imageMapExists = function(thingToMap){
    return monarchPowerMappings[thingToMap] || bonusMappings[thingToMap];
}