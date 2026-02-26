app.controller('mainController', ['$scope', '$location', 'authService', '$rootScope', function($scope, $location, authService, $rootScope) {
    $scope.isLoggedIn = authService.isLoggedIn();
    $scope.currentUser = authService.getCurrentUser();

    $scope.logout = function() {
        authService.logout();
        $scope.isLoggedIn = false;
        $scope.currentUser = null;
        $location.path('/login');
    };

    $scope.$on('$routeChangeSuccess', function() {
        $scope.isLoggedIn = authService.isLoggedIn();
        $scope.currentUser = authService.getCurrentUser();
        $scope.$apply();
    });

    $scope.$on('$locationChangeSuccess', function() {
        $scope.isLoggedIn = authService.isLoggedIn();
        $scope.currentUser = authService.getCurrentUser();
        $scope.$apply();
    });
}]);
