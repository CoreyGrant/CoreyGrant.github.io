var monarchPowerMappings = {
    "ADM": "Administrative_power.png",
    "DIP": "Diplomatic_power.png",
    "MIL": 'Military_power.png',
};

var bonusMappings = {
    "Interest": "Interest_per_annum.png",
    "Goods Produced": "Goods_produced_modifier.png",
    "Reduce inflation cost reduction" : "Reduce_inflation_cost.png",
    "Institution spread from true faith": "Institution_spread_in_true_faith_provinces.png",
    "Global institution spread": "Institution_spread.png",
    "Global institution growth": "Institution_growth.png",
    "Backrow artillery damage": "Artillery_damage_from_back_row.png",
    "Hostile attrition": "Attrition_for_enemies.png",
    "Fort maintenance modifier": "Fort_maintenance.png",
    "Yearly papal influence": "Papal_influence.png",
    "Church power modifier": "Church_power.png",
    "Monthly fervor increase": "Monthly_fervor.png",
    "Tolerance of true faith": "tolerance_of_the_true_faith.png",
    "Defensiveness": "Fort_defense.png",
    "Fire damage": "Land_fire_damage.png",
    "National manpower": "Manpower.png",
    "Manpower per age": "Manpower.png",
    "National sailors": "Sailors.png",
    "Sailors per age": "Sailors.png",
    "Diplomats": "Diplomat.png",
    "Reduced stability impact from diplo": "Reduced_stab_impacts.png",
    "Improve relations modifier": "Improve_relations.png",
    "Yearly absolutism": "Absolutism.png",
    "Diplo tech cost modifier": "Diplomatic_technology_cost.png",
    "Admin tech cost modifier": "Administrative_technology_cost.png",
    "Military tech cost modifier": "Military_technology_cost.png",
    "Add CB": "Casus_belli.png",
    "Relation with heretics": "Opinion_of_heretics.png",
    "Land attrition": "Attrition.png",
    "Number of accepted cultures": "max_promoted_cultures.png",
    "Tolerance of heathens": "tolerance_heathen.png",
    "Tolerance of heretics": "Tolerance_heretic.png",
    "Autonomy modifier": "Autonomy.png",
    "Global supply limit modifier": "Supply_limit.png",
    "Trade range modifier": "trade_range.png",
    "Global trade power": "Trade_power.png",
    "State maintenance modifier": "State_maintenance.png",
    "Tariffs": "local_tariffs.png",
    "Reinforce cost modifier": "reinforce_cost.png",
    "Marine fraction": "marines_force_limit.png",
    "Siege blockade progress": "ab_siege_blockades.png",
    "Morale bonus from 5 cultures": "morale_of_armies.png",
    "Enforce religion cost": "Cost_of_enforcing_religion_through_war.png",
    "Build cost in subject nation": "construction_cost.png",
    "Sailor maintenance modifier": "sailor_maintainance.png",
    "Add naval force limit per age": "naval_force_limit.png",
    "Extra navy tradition from galleys": "yearly_navy_tradition.png",
    "Devepment cost for provinces over 25 dev": "Development_cost.png"
}

function defaultMap(name){
    return name.split(' ').join('_') + ".png";
}

function format(s){
    return s[0].toUpperCase() + s.substring(1).toLowerCase();
}

window.imageMap = function(thingToMap){
    if(monarchPowerMappings[thingToMap]){
        return 'Icons/' + format(monarchPowerMappings[thingToMap]);
    }
    if(bonusMappings[thingToMap]){
        return 'Icons/Bonuses/' + format(bonusMappings[thingToMap]);
    }
    return 'Icons/Bonuses/' + defaultMap(thingToMap);
}