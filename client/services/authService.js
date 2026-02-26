app.factory('authService', ['$http', '$window', function($http, $window) {
    var authFactory = {};

    authFactory.register = function(userData) {
        return $http.post('/api/auth/register', userData);
    };

    authFactory.login = function(userData) {
        return $http.post('/api/auth/login', userData);
    };

    authFactory.getProfile = function() {
        return $http.get('/api/auth/profile');
    };

    authFactory.isLoggedIn = function() {
        var token = $window.localStorage.getItem('token');
        if (token) {
            var payload = JSON.parse($window.atob(token.split('.')[1]));
            return payload.exp > Date.now() / 1000;
        }
        return false;
    };

    authFactory.getCurrentUser = function() {
        if (authFactory.isLoggedIn()) {
            var token = $window.localStorage.getItem('token');
            var payload = JSON.parse($window.atob(token.split('.')[1]));
            return payload;
        }
        return null;
    };

    authFactory.setToken = function(token) {
        $window.localStorage.setItem('token', token);
    };

    authFactory.logout = function() {
        $window.localStorage.removeItem('token');
    };

    return authFactory;
}]);
