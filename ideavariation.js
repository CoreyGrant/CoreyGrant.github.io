(async function(){
    
    var data = await window.getData();
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
            exclusiveCategories: ["General", "Imperial", "Ship", "Army", "Government", "Damage", "Centralism", "Religious"],
            ideaBonuses: data.ideaBonuses.sort(),//.concat(data.policyBonuses)
            //     .filter((value, i, a) => a.indexOf(value) === i)
            //     .sort(),
            policyBonuses: data.policyBonuses.sort(),
            search: {
                ideaBonus: '',
                ideaExclusiveCategory: '',
                policyBonus: '',
                ideas: searchIdeas,
                ideaMonarch: '',
                policyMonarch: '',
            }
        },
        methods:{
            getAllow(allow){
                var key = 'full_idea_group';
                var keys = Object.getOwnPropertyNames(allow).filter(x => x.startsWith(key)).map(x => allow[x]);
                var name = keys.join("/");
                return name;
            },
            getAge(allow){
                return allow.current_age ? `[${allow.current_age}]` : '';
            },
            getImageLink(item){
                return window.imageMap(item);
            },
            displayBonusVal(bonusName, bonusVal){
                if(!bonusName || !bonusVal){return '';}
                return window.formatDisplay(bonusName, bonusVal);
            },
            toggleIdeaMonarch(val){
                this.search.ideaMonarch = this.search.ideaMonarch === val
                    ? ''
                    : val;
            },
            togglePolicyMonarch(val){
                this.search.policyMonarch = this.search.policyMonarch === val
                    ? ''
                    : val;
            },
            displayBonusName(val){
                return val.indexOf("__") > -1
                    ? val.split('__')[0]
                    : val;
            }
        },
        computed:{
            filteredIdeas: function(){
                var activeBonusFilter = this.search.ideaBonus;
                var activeMonarchFilters = this.search
                    .ideaMonarch;
                    var activeIdeaExclusiveCategory = this.search.ideaExclusiveCategory;
                var ideas = this.ideas;
                if(activeBonusFilter.length){
                    ideas = 
                        ideas.filter(idea =>{
                            var bonusNames = idea.bonuses.map(x => Object.getOwnPropertyNames(x.bonus).map(this.displayBonusName))
                                .flat();
                            return bonusNames.indexOf(activeBonusFilter) > -1;
                        })
                }
                if(activeIdeaExclusiveCategory.length){
                    ideas = 
                        ideas.filter(x => x.exclusiveCategory === activeIdeaExclusiveCategory);
                        
                }
                if(activeMonarchFilters){
                    ideas = ideas.filter(x => x.category == activeMonarchFilters);
                }
                return ideas.sort((a, b) => a.name > b.name );
            },
            filteredPolicies: function(){
                var activeBonusFilter = this.search.policyBonus;
                var activeMonarchFilters = this.search
                    .policyMonarch;
                var activeIdeaGroups = this.ideas.map(x => x.name)
                    .filter(x => this.search.ideas[x]);
                var policies = this.policies;
                if(activeBonusFilter.length){
                    policies = 
                        policies.filter(x => x.bonuses.some(x => x.name == activeBonusFilter));
                      
                }
                if(activeMonarchFilters){
                    policies = policies.filter(x => x.monarchPower == activeMonarchFilters);
                }
                return policies;
            },
        }
    })
}());