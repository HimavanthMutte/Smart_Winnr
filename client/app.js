var app = angular.module('dmsApp', ['ngRoute']);

app.config(['$routeProvider', '$locationProvider', '$httpProvider', function($routeProvider, $locationProvider, $httpProvider) {
    $routeProvider
        .when('/', {
            redirectTo: '/dashboard'
        })
        .when('/dashboard', {
            templateUrl: 'views/dashboard.html',
            controller: 'documentController'
        })
        .when('/login', {
            templateUrl: 'views/login.html',
            controller: 'authController'
        })
        .when('/register', {
            templateUrl: 'views/register.html',
            controller: 'authController'
        })
        .when('/documents', {
            templateUrl: 'views/documents.html',
            controller: 'documentController'
        })
        .when('/upload', {
            templateUrl: 'views/upload.html',
            controller: 'documentController'
        })
        .when('/document/:id', {
            templateUrl: 'views/document-detail.html',
            controller: 'documentController'
        })
        .when('/profile', {
            templateUrl: 'views/profile.html',
            controller: 'authController'
        })
        .otherwise({
            redirectTo: '/dashboard'
        });

    // Enable HTML5 mode
    $locationProvider.html5Mode(true);
    $locationProvider.hashPrefix('!');

    $httpProvider.interceptors.push(['$q', '$location', function($q, $location) {
        return {
            'request': function(config) {
                config.headers = config.headers || {};
                if (localStorage.getItem('token')) {
                    config.headers.Authorization = 'Bearer ' + localStorage.getItem('token');
                }
                return config;
            },
            'responseError': function(response) {
                if (response.status === 401) {
                    $location.path('/login');
                }
                return $q.reject(response);
            }
        };
    }]);
}]);

app.run(['$rootScope', '$location', 'authService', function($rootScope, $location, authService) {
    $rootScope.$on('$routeChangeStart', function(event, next, current) {
        var publicRoutes = ['/login', '/register'];
        var currentPath = $location.path();
        
        if (publicRoutes.indexOf(currentPath) === -1) {
            if (!authService.isLoggedIn()) {
                $location.path('/login');
            }
        }
        
        $rootScope.isLoggedIn = authService.isLoggedIn();
        $rootScope.currentUser = authService.getCurrentUser();
    });
}]);
