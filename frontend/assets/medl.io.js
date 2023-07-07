/* Angular service for interfacing with medl.io's API */
angular.module("medlio", [])
.service("medlio", function($http, $q) {
    var apikey = Config.medlio_apikey;
    var host = "https://devapi.medl.io/api/v1/";

    // Retrieve a list of all valid US states
    this.getStates = function() {
        var d = $q.defer();
        $http.get(host + "states", {params: {token: apikey}})
        .success(function(data) {
            var states = [];
            data.forEach(function (obj) {
                if (obj.state) {
                    states.push(obj.state);
                }
            });
            d.resolve(states);
        })
        .error(function(error) {
            d.reject(error);
        });
        return d.promise;
    };

    // Retrieve a list of physicians matching a given query near a given city
    this.getPhysicians = function(city, state, query) {
        var address = city + ", " + state;
        var d = $q.defer();
        $http.get(host + "search", {params: {token: apikey, address: address, query: query}})
        .success(function(data) {
            d.resolve(data);
        })
        .error(function(error) {
            d.reject(error);
        });
        return d.promise;
    };

    return this;
});
