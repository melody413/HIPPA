/* Angular service for interfacing with Catalyze's API */
angular.module("catalyze", []).service("catalyze", function($http) {
    var apikey = Config.catalyze_apikey;
    var host = "https://api.catalyze.io";

    // Construct necessary headers for an unauthenticated API call.
    var buildHeaders = function() {
        return {
            "X-Api-Key": apikey
        };
    };

    // Construct necessary headers for an authenticated API call.
    var buildAuthedHeaders = function(token) {
        var headers = buildHeaders();
        headers.Authorization = "Bearer " + token;
        return headers;
    };

    // Sign a user in, retrieving the full user object and the authentication token.
    this.signIn = function(username, password) {
        return $http.post(host + "/v2/auth/signin",
                {username: username, password: password},
                {headers: buildHeaders()});
    };

    // Sign a user out, invaliding their token.
    this.signOut = function(token) {
        return $http.get(host + "/v2/auth/signout",
                {headers: buildAuthedHeaders(token)});
    };

    // Register a user for an application.
    this.signUp = function(username, password, email) {
        var user = {username: username, password: password, email: {primary: email}, name: {}};
        return $http.post(host + "/v2/users",
            user,
            {headers: buildHeaders()});
    };

    // Add an entry to a custom class for the authenticated user.
    this.addCustomClassData = function(token, cls, data) {
        return $http.post(host + "/v2/classes/" + cls + "/entry",
                data,
                {headers: buildAuthedHeaders(token)});
    };

    // Retrieve up to a given number of entries for a custom class.
    this.getCustomClassData = function(token, userId, cls, resultCount) {
        return $http.get(host + "/v2/classes/" + cls + "/query/" + userId,
                {params: {pageSize: resultCount}, headers: buildAuthedHeaders(token)});
    };

    return this;
});
