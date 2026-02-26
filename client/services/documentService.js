app.factory('documentService', ['$http', function($http) {
    var documentFactory = {};

    documentFactory.uploadDocument = function(formData) {
        return $http.post('/api/documents/upload', formData, {
            transformRequest: angular.identity,
            headers: {
                'Content-Type': undefined
            }
        });
    };

    documentFactory.getDocuments = function(params) {
        return $http.get('/api/documents', { params: params });
    };

    documentFactory.getDocument = function(id) {
        return $http.get('/api/documents/' + id);
    };

    documentFactory.updateDocument = function(id, documentData) {
        return $http.put('/api/documents/' + id, documentData);
    };

    documentFactory.deleteDocument = function(id) {
        return $http.delete('/api/documents/' + id);
    };

    documentFactory.updatePermissions = function(id, permissions) {
        return $http.put('/api/documents/' + id + '/permissions', permissions);
    };

    return documentFactory;
}]);
