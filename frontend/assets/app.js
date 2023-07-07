/*
    The depression app itself.

    Controllers correspond to template names - for example, "root" -> templates/root.html
*/
angular.module("depression-app", ["ngRoute", "ngCookies", "medlio", "catalyze", "angles"])
// entry page
.controller("root", function ($scope, $location) {
    $scope.start = function() {
        $location.url("/questionnaire");
    };
})
// the 10 questions
.controller("questionnaire", function ($scope, $location) {
    // The PHQ-9 questions, in order.
    $scope.questions = [
        {text: "Little interest or pleasure in doing things", threshold: 2},
        {text: "Feeling down, depressed, or hopeless", threshold: 2},
        {text: "Trouble falling asleep, staying asleep, or sleeping too much", threshold: 2},
        {text: "Feeling tired or having little energy", threshold: 2},
        {text: "Poor appetite or overeating", threshold: 2},
        {text: "Feeling bad about yourself -  or that you are a failure or have let yourself or your family down", threshold: 2},
        {text: "Trouble concentrating on things, such as reading the newspaper or watching television", threshold: 2},
        {text: "Moving or speaking so slowly that other people could have noticed. Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual", threshold: 2},
        {text: "Thoughts that you would be better off dead or of hurting yourself in some way", threshold: 1}
    ];

    // The first 9 questions have the same answers. Position corresponds to point value - the first option
    // is worth 0 points, but the third is worth 3.
    $scope.questionOptions = [
        "Not at all",
        "Several days",
        "More than half the days",
        "Nearly every day"
    ];

    // The last question has a different set of answers.
    $scope.finalQuestionOptions = [
        "Not difficult at all",
        "Somewhat difficult",
        "Very difficult",
        "Extremely difficult"
    ];

    // Counter for the question we're on (1-indexed).
    $scope.questionNumber = 1;
    // Sum of score from question answers.
    $scope.pointSum = 0;
    // Rolling total for the number of questions answered with a point value beyond the set threshold.
    $scope.indicatorCount = 0;

    $scope.answerAndAdvance = function(answer) {
        $scope.pointSum += answer;
        // advance the threshold counter if needed
        if (answer >= $scope.questions[$scope.questionNumber - 1].threshold) {
            $scope.indicatorCount += 1;
        }
        $scope.questionNumber += 1;
    };

    // special handler for the final question
    $scope.answerFinal = function(answer) {
        $location.url("/results/" + $scope.pointSum + "/" + $scope.indicatorCount + "/" + answer);
    };
})
// results page
.controller("results", function($scope, $route) {
    $scope.score = $route.current.params.total;
    $scope.checks = $route.current.params.indicator;
    $scope.hadDifficulties = $route.current.params.final == 0;
})
// search form
.controller("search", function($scope, medlio) {
    $scope.statesError = false;

    $scope.states = [];
    medlio.getStates()
    .then(function(states) {
        $scope.states = states;
    }, function(error) {
        $scope.statesError = error;
    });

    $scope.results = [];
    $scope.errors = [];

    $scope.findPhysicians = function() {
        $scope.errors = [];
        $scope.results = [];
        if (!$scope.city || !$scope.state) {
            $scope.errors.push("Please fill in both City and State above!");
        } else {
            $scope.loading = true;
            medlio.getPhysicians($scope.city, $scope.state, "psych") // need to find a better query, but this one is _ok_ for now
            .then(function(data) {
                $scope.results = data.matches;
            }, function(error) {
                $scope.errors.push(error);
            })
            .then(function() {
                $scope.loading = false;
            });
        }
    };

    $scope.formatPhone = function(result) {
        var raw = result.practice_location_phone;
        if (!raw) {
            return "(none)";
        }

        return "(" + raw.substring(0, 3) + ") " + raw.substring(3, 6) + " - " + raw.substring(6);
    };

    $scope.mapLink = function(result) {
        var address = [
            result.practice_location_address1,
            result.practice_location_address2,
            result.practice_location_city,
            result.practice_location_state,
            result.practice_location_zip
        ].join(" ");
        return "http://maps.google.com/?q=" + encodeURIComponent(address);
    };
})
// sign up / register form
.controller("auth", function($scope, catalyze, $cookies, $location) {
    $scope.email = "";
    $scope.password = "";
    $scope.errors = [];
    $scope.messages = [];
    $scope.loading = false;

    $scope.signIn = function() {
        $scope.errors = [];
        $scope.messages = [];
        $scope.loading = true;
        catalyze.signIn($scope.email, $scope.password)
        .success(function(data) {
            $cookies.usersId = data.usersId;
            $cookies.sessionToken = data.sessionToken;
            $location.url("/stats/" + $scope.score);
        })
        .error(function(resp) {
            resp.errors.forEach(function(error) {
                $scope.errors.push(error.message);
            });
            $scope.loading = false;
        });
    };

    $scope.signUp = function() {
        $scope.errors = [];
        $scope.messages = [];
        $scope.loading = true;
        catalyze.signUp($scope.email, $scope.password, $scope.email, $scope.email, "-")
        .success(function(data) {
            $scope.messages.push("Success! Check your email for a verification link. Once you click that, come back to this page and click Sign In (don't leave this page!).");
            $scope.loading = false;
        })
        .error(function(resp) {
            resp.errors.forEach(function(error) {
                $scope.errors.push(error.message);
            });
            $scope.loading = false;
        });
    };
})
// graph of stats over time
.controller("stats", function($scope, $route, catalyze, $cookies, $location) {
    $scope.errors = [];

    if ($route.current.params.newCount) {
        catalyze.addCustomClassData($cookies.sessionToken, "history", {content: {score: parseInt($route.current.params.newCount)}})
        .success(function(data) {
            $location.url("/stats");
        })
        .error(function(resp) {
            resp.errors.forEach(function(error) {
                $scope.errors.push(error.message);
            });
        });
    }

    $scope.options = {
        bezierCurve: false,
        datasetFill: false,
        scaleOverride: true,
        scaleSteps: 15,
        scaleStepWidth: 2,
        scaleStartValue: 0,
        animation: false
    };
    $scope.chart = {
        labels: [],
        datasets: [{
            strokeColor: "#00F",
            pointColor: "#090",
            data: []
        }]
    };
    catalyze.getCustomClassData($cookies.sessionToken, $cookies.usersId, "history", 1000)
    .success(function(data) {
        data.sort(function(item, other) { return item.createdAt - other.createdAt; });
        var labels = [];
        var values = [];
        data.forEach(function(entry) {
            var score = entry.content.score;
            var date = new Date(entry.createdAt);
            var ds = date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate();
            labels.push(ds);
            values.push(score);
        });
        $scope.chart.labels = labels;
        $scope.chart.datasets[0].data = values;
    })
    .error(function(resp) {
        resp.errors.forEach(function(error) {
            $scope.errors.push(error.message);
        });
    });
})
.config(function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);

    $routeProvider
    .when("/", {
        templateUrl: "/templates/root.html",
        controller: "root"
    })
    .when("/questionnaire", {
        templateUrl: "/templates/questionnaire.html",
        controller: "questionnaire"
    })
    .when("/results/:total/:indicator/:final", {
        templateUrl: "/templates/results.html",
        controller: "results"
    })
    .when("/stats/:newCount", {
        templateUrl: "/templates/stats.html",
        controller: "stats"
    })
    .when("/stats", {
        templateUrl: "/templates/stats.html",
        controller: "stats"
    })
    .when("/search", {
        templateUrl: "/templates/search.html",
        controller: "search"
    })
});;
