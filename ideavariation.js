(function(){
   
    var data = window.getData();
    var searchBonus = data.ideaBonuses.reduce((prev, cur) =>
        Object.assign({[cur]: false}, prev),
        {});
    var searchIdeas = data.ideas.map(x => x.name).reduce((prev, cur) =>
        Object.assign({[cur]: false}, prev),
        {});
    var app = new Vue({
        el: '#app',
        data: {
            ideas: data.ideas,
            policies: data.policies,
            tab: 'searchbybonus',
            bonuses: data.ideaBonuses.sort(),
            search: {
                bonus: searchBonus,
                ideas: Object.assign({}, searchIdeas)
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
                this.search.bonus[bonus] = !this.search.bonus[bonus];
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
                var searchedBonuses = this.bonuses.filter(x => this.search.bonus[x]);
                return Object.getOwnPropertyNames(bonus).some(x => searchedBonuses.indexOf(x) > -1);
            },
            getAllow(allow){
                var key = 'full_idea_group';
                var keys = Object.getOwnPropertyNames(allow).filter(x => x.startsWith(key)).map(x => allow[x]);
                return keys.join("/");
            }
            
        },
        computed:{
            ideaSearchResults: function(){
                var activeSearches = this.bonuses
                    .filter(x => this.search.bonus[x]);
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
                    .filter(x => this.search.bonus[x]);
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