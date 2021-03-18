(function(){
   
    var data = window.getData();
    var searchBonus = data.ideaBonuses.reduce((prev, cur) =>
        Object.assign({[cur]: false}, prev),
        {});
    var searchIdeas = data.ideas.map(x => x.name).reduce((prev, cur) =>
        Object.assign({[cur]: false}, prev),
        {});
    window.data = data;
    var app = new Vue({
        el: '#app',
        data: {
            ideas: data.ideas,
            policies: data.policies,
            tab: 'idea-groups',
            searchByBonusTab: 'ideas',
            bonuses: data.ideaBonuses.sort(),
            search: {
                searchBonus: searchBonus,
                policyBonus: Object.assign({}, searchBonus),
                ideas: Object.assign({}, searchIdeas),
                ideaMonarch: '',
                policyMonarch: '',
            }
        },
        methods:{
            getBonusDisplay: function(b){
                var parts = b.split(' ');
                var output = '';
                for(var i = 0; i < parts.length; i++){
                    if(i == 0){
                        output += (parts[i][0].toUpperCase() + parts[i].substring(1));
                    } else {
                        output += parts[i];
                    }
                    if(i < (parts.length - 1)){
                        output += ' ';
                    }
                }
                return output;
            },
            getBonusAcronym: function(b){
                return b.split(' ')
                    .map(function(x){ return x[0].toUpperCase() })
                    .join('');
            },
            toggleBonusSearch(bonus){
                this.search.searchBonus[bonus] = !this.search.searchBonus[bonus];
            },
            toggleSearchByIdea(name){
                if(this.search.ideas[name]){
                    this.search.ideas[name] = false;
                } else{
                    this.search.ideas = Object.assign({}, searchIdeas);
                    this.search.ideas[name] = true;
                }
            },
            bonusIsSearched(bonus){
                var searchedBonuses = this.bonuses.filter(x => this.search.searchBonus[x]);
                return Object.getOwnPropertyNames(bonus).some(x => searchedBonuses.indexOf(x) > -1);
            },
            getAllow(allow){
                var key = 'full_idea_group';
                var keys = Object.getOwnPropertyNames(allow).filter(x => x.startsWith(key)).map(x => allow[x]);
                return keys.join("/");
            },
            getImageLink(item){
                return window.imageMap(item);
            },
            hasImageLink(item){
                return window.imageMapExists(item);
            },
            displayBonusVal(bonusName, bonusVal){
                // Has decimal place but shouldnt be percentaged
                if(["Interest", "Yearly inflation reduction"].indexOf(bonusName) !== -1){
                    return parseFloat(bonusVal).toFixed(2);
                }
                if(["Yearly absolutism"].indexOf(bonusName) !== -1){
                    return bonusVal;
                }
                // Has decimal place or otherwise SHOULD be percentaged
                if(bonusVal.indexOf('.') > -1 || [].indexOf(bonusName) !== -1){
                    var valNum = parseFloat(bonusVal);
                    var percentNum = valNum * 100;
                    if(Number.isInteger(percentNum)){
                        return `${(valNum * 100).toFixed(0)}%`;
                    }
                    return `${(valNum * 100).toFixed(1)}%`;
                }
                return bonusVal;
            }
            
        },
        computed:{
            filteredIdeas: function(){
                var activeBonusFilters = this.bonuses
                    .filter(x => this.search.searchBonus[x]);
                var activeMonarchFilters = this.search
                    .ideaMonarch;
                if(!activeMonarchFilters && !activeBonusFilters){
                    return [];
                }
                var ideas = this.ideas;
                if(activeBonusFilters.length){
                    ideas = activeBonusFilters.map(s =>
                        ideas.filter(x => x.bonuses.some(x => x.bonus[s] !== undefined)))
                        .flat().filter((value, i, a) => a.indexOf(value) === i);
                }
                if(activeMonarchFilters){
                    ideas = ideas.filter(x => x.category == activeMonarchFilters);
                }
                return ideas;
            },
            filteredPolicies: function(){
                var activeBonusFilters = this.bonuses
                    .filter(x => this.search.policyBonus[x]);
                var activeMonarchFilters = this.search
                    .policyMonarch;
                var activeIdeaGroups = this.ideas.map(x => x.name)
                    .filter(x => this.search.ideas[x]);
                if(!activeBonusFilters && !activeMonarchFilters && !activeIdeaGroups){
                    return [];
                }
                var policies = this.policies;
                if(activeBonusFilters.length){
                    policies = activeBonusFilters.map(s =>
                        policies.filter(x => x.bonuses.some(x => x.bonus[s] !== undefined)))
                        .flat().filter((value, i, a) => a.indexOf(value) === i);
                }
                if(activeMonarchFilters){
                    policies = policies.filter(x => x.category == activeMonarchFilters);
                }
                return policies;
            },
            ideaSearchResults: function(){
                var activeSearches = this.bonuses
                    .filter(x => this.search.searchBonus[x]);
                if(!activeSearches.length > 0){
                    return [];
                } else{
                    return activeSearches.map(s =>
                        this.ideas.filter(x => x.bonuses.some(x => x.bonus[s] !== undefined)))
                        .flat().filter((value, i, a) => a.indexOf(value) === i);
                }
            },
            policySearchResults: function(){
                var activeSearches = this.bonuses
                    .filter(x => this.search.searchBonus[x]);
                if(!activeSearches.length > 0){
                    return [];
                } else{
                    var results = activeSearches.map(s =>
                        this.policies.filter(x => x.bonuses.some(x => x.name == s)))
                        .flat().filter((value, i, a) => a.indexOf(value) === i);
                    return results;
                }
            },
            policyByIdeaSearchResults(){
                var activeSearches = this.ideas.map(x => x.name)
                    .filter(x => this.search.ideas[x]);
                if(!activeSearches.length > 0){
                    return [];
                } else{
                    return activeSearches.map(x => 
                        this.policies.filter(p => {
                            var allow = p.allow;
                            var key = 'full_idea_group';
                            var keys = Object.getOwnPropertyNames(allow).filter(x => x.startsWith(key)).map(x => allow[x]);
                            return keys.indexOf(x) > -1;
                        })
                    ).flat().filter((value, i, a) => a.indexOf(value) === i);
                }
            }
        }
    })
}());