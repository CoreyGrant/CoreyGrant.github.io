////fetch("tasks.json").then(x => x.json())
////    .then(tasks => {
var regionNames = ["General/Multiple Regions", "Misthalin", "Karamja", "Asgarnia", "Fremennik Provinces", "Kandarin", "Kharidian Desert", "Morytania", "Tirannwn", "Wilderness"];
        var app = new Vue({
            el: '#app',
            data: {
                tasks: window.tasks,
                taskList: [],
                completeTaskIds: [],
                expandedTask: null,
                regionNames: regionNames,
                taskListFilters: {
                    open: false,
                    difficulty: {
                        open: false,
                        easy: false,
                        medium: false,
                        hard: false,
                        elite: false,
                        master: false
                    }, // multiselect
                    region: {
                        open: false,
                        "0": false,
                        "1": false,
                        "2": false,
                        "3": false,
                        "4": false,
                        "5": false,
                        "6": false,
                        "7": false,
                        "8": false,
                        "9": false,
                    }, // multiselect
                    skill: null, // any or I can do
                    text: null, // text search over name, task or other reqs
                },
                allTasksFilters: {
                    open: false,
                    difficulty: {
                        open: false,
                        easy: false,
                        medium: false,
                        hard: false,
                        elite: false,
                        master: false
                    }, // multiselect
                    region: {
                        open: false,
                        "0": false,
                        "1": false,
                        "2": false,
                        "3": false,
                        "4": false,
                        "5": false,
                        "6": false,
                        "7": false,
                        "8": false,
                        "9": false,
                    }, // multiselect
                    skill: false, // any or I can do
                    text: null, // text search over name, task or other reqs
                }
            },
            methods: {
                completeClick: function (id) {
                    if (this.isComplete(id)) {
                        this.removeTaskFromList(id);
                        this.tasks.splice(this.tasks.indexOf(this.tasks.find(x => x.name == id)), 1);
                    }
                },
                isComplete: function (id) {
                    return this.completeTaskIds.some(x => x == id);
                },
                isInTaskList: function (id) {
                    return this.taskList.some(x => x.name == id);
                },
                addTaskToList: function (id) {
                    var task = this.tasks.find(x => x.name == id);
                    this.taskList.push(task);
                },
                removeTaskFromList: function (id) {
                    var taskToRemove = this.taskList.find(x => x.name == id);
                    this.taskList.splice(this.taskList.indexOf(taskToRemove), 1);
                },
                markTaskAsComplete: function (id) {
                    this.completeTaskIds.push(id);
                    this.completeClick(id);
                },
                completeStyle: function (id) {
                    if (this.completeTaskIds.indexOf(id) > -1) {
                        return "complete";
                    }
                    return "";
                }
            },
            computed: {
                filteredAllTasks: function () {
                    var allTasks = this.tasks;
                    var filter = this.allTasksFilters;
                    var filteredTasks = allTasks;
                    if (filter.region.open) {
                        // group all selectedRegions;
                        var regions = [];
                        for (var i = 0; i < 10; i++) {
                            if (filter.region[i.toString()]) {
                                regions.push(regionNames[i]);
                            }
                        }
                        if (regions.length) {
                            filteredTasks = filteredTasks.filter(x => regions.indexOf(x.region) > -1);
                        }
                    }
                    if (filter.difficulty.open) {
                        var difficulties = [];
                        if (filter.difficulty.easy) {
                            difficulties.push("Easy");
                        }
                        if (filter.difficulty.medium) {
                            difficulties.push("Medium");
                        }
                        if (filter.difficulty.hard) {
                            difficulties.push("Hard");
                        }
                        if (filter.difficulty.elite) {
                            difficulties.push("Elite");
                        }
                        if (filter.difficulty.master) {
                            difficulties.push("Master");
                        }
                        if (difficulties.length) {
                            filteredTasks = filteredTasks.filter(x => difficulties.indexOf(x.difficulty) > -1);
                        }
                    }
                    if (filter.text && filter.text.length) {
                        var text = filter.text.toLowerCase();
                        filteredTasks = filteredTasks.filter(x =>
                            (x.name.toLowerCase().indexOf(text) > -1 || x.task.toLowerCase().indexOf(text) > -1 || (x.otherReqs && x.otherReqs.toLowerCase().indexOf(text) > -1))
                        );
                    }
                    return filteredTasks;
                },
                filteredTaskList: function () {
                    var allTasks = this.taskList;
                    var filter = this.taskListFilters;
                    var filteredTasks = allTasks;
                    if (filter.region.open) {
                        // group all selectedRegions;
                        var regions = [];
                        for (var i = 0; i < 10; i++) {
                            if (filter.region[i.toString()]) {
                                regions.push(regionNames[i]);
                            }
                        }
                        if (regions.length) {
                            filteredTasks = filteredTasks.filter(x => regions.indexOf(x.region) > -1);
                        }
                    }
                    if (filter.difficulty.open) {
                        var difficulties = [];
                        if (filter.difficulty.easy) {
                            difficulties.push("Easy");
                        }
                        if (filter.difficulty.medium) {
                            difficulties.push("Medium");
                        }
                        if (filter.difficulty.hard) {
                            difficulties.push("Hard");
                        }
                        if (filter.difficulty.elite) {
                            difficulties.push("Elite");
                        }
                        if (filter.difficulty.master) {
                            difficulties.push("Master");
                        }
                        if (difficulties.length) {
                            filteredTasks = filteredTasks.filter(x => difficulties.indexOf(x.difficulty) > -1);
                        }
                        
                    }
                    if (filter.text && filter.text.length) {
                        var text = filter.text.toLowerCase();
                        filteredTasks = filteredTasks.filter(x =>
                            (x.name.toLowerCase().indexOf(text) > -1 || x.task.toLowerCase().indexOf(text) > -1 || (x.otherReqs && x.otherReqs.toLowerCase().indexOf(text) > -1))
                        );
                    }
                    return filteredTasks;
                }
            }
        });
    //})

