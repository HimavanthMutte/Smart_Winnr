app.factory('documentService', ['$http', function ($http) {
    var documentFactory = {};

    documentFactory.uploadDocument = function (formData) {
        return $http.post('/api/documents/upload', formData, {
            transformRequest: angular.identity,
            headers: {
                'Content-Type': undefined
            }
        });
    };

    documentFactory.getDocuments = function (params) {
        return $http.get('/api/documents', { params: params });
    };

    documentFactory.getDocument = function (id) {
        return $http.get('/api/documents/' + id);
    };

    documentFactory.updateDocument = function (id, documentData) {
        return $http.put('/api/documents/' + id, documentData);
    };

    documentFactory.deleteDocument = function (id) {
        return $http.delete('/api/documents/' + id);
    };

    documentFactory.updatePermissions = function (id, permissions) {
        return $http.put('/api/documents/' + id + '/permissions', permissions);
    };

    documentFactory.shareViaEmail = function (id, shareData) {
        return $http.post('/api/documents/' + id + '/share', shareData);
    };

    documentFactory.uploadNewVersion = function (id, formData) {
        return $http.post('/api/documents/' + id + '/version', formData, {
            transformRequest: angular.identity,
            headers: {
                'Content-Type': undefined
            }
        });
    };

    documentFactory.restoreVersion = function (id, versionNumber) {
        return $http.post('/api/documents/' + id + '/restore/' + versionNumber);
    };

    return documentFactory;
}]);
