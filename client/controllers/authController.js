app.controller('authController', ['$scope', '$location', 'authService', function($scope, $location, authService) {
    $scope.user = {};
    $scope.error = '';
    $scope.success = '';
    $scope.loading = false;

    $scope.register = function() {
        $scope.loading = true;
        $scope.error = '';
        $scope.success = '';

        authService.register($scope.user)
            .then(function(response) {
                authService.setToken(response.data.token);
                $scope.success = 'Registration successful! Redirecting...';
                setTimeout(function() {
                    $location.path('/dashboard');
                    $scope.$apply();
                }, 2000);
            })
            .catch(function(error) {
                $scope.error = error.data.message || 'Registration failed';
            })
            .finally(function() {
                $scope.loading = false;
            });
    };

    $scope.login = function() {
        $scope.loading = true;
        $scope.error = '';
        $scope.success = '';

        authService.login($scope.user)
            .then(function(response) {
                authService.setToken(response.data.token);
                $scope.success = 'Login successful! Redirecting...';
                setTimeout(function() {
                    $location.path('/dashboard');
                    $scope.$apply();
                }, 1500);
            })
            .catch(function(error) {
                $scope.error = error.data.message || 'Login failed';
            })
            .finally(function() {
                $scope.loading = false;
            });
    };

    $scope.logout = function() {
        authService.logout();
        $location.path('/login');
    };

    $scope.getProfile = function() {
        $scope.loading = true;
        authService.getProfile()
            .then(function(response) {
                $scope.profile = response.data;
            })
            .catch(function(error) {
                $scope.error = error.data.message || 'Failed to load profile';
            })
            .finally(function() {
                $scope.loading = false;
            });
    };

    $scope.formatDate = function(dateString) {
        var date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    if ($location.path() === '/profile') {
        $scope.getProfile();
    }
}]);
