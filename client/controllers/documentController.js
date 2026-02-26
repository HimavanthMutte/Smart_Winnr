app.controller('documentController', ['$scope', '$location', '$routeParams', 'documentService', function($scope, $location, $routeParams, documentService) {
    $scope.documents = [];
    $scope.document = {};
    $scope.loading = false;
    $scope.error = '';
    $scope.success = '';
    $scope.searchQuery = '';
    $scope.selectedTags = '';
    $scope.selectedCategory = '';
    $scope.currentPage = 1;
    $scope.totalPages = 1;
    $scope.totalDocuments = 0;

    $scope.getDocuments = function(page = 1) {
        $scope.loading = true;
        $scope.error = '';

        var params = {
            page: page,
            limit: 10
        };

        if ($scope.searchQuery) {
            params.search = $scope.searchQuery;
        }
        if ($scope.selectedTags) {
            params.tags = $scope.selectedTags;
        }
        if ($scope.selectedCategory) {
            params.category = $scope.selectedCategory;
        }

        documentService.getDocuments(params)
            .then(function(response) {
                $scope.documents = response.data.documents;
                $scope.totalPages = response.data.totalPages;
                $scope.currentPage = response.data.currentPage;
                $scope.totalDocuments = response.data.total;
            })
            .catch(function(error) {
                $scope.error = error.data.message || 'Failed to load documents';
            })
            .finally(function() {
                $scope.loading = false;
            });
    };

    $scope.getDocument = function() {
        $scope.loading = true;
        $scope.error = '';

        documentService.getDocument($routeParams.id)
            .then(function(response) {
                $scope.document = response.data;
            })
            .catch(function(error) {
                $scope.error = error.data.message || 'Failed to load document';
            })
            .finally(function() {
                $scope.loading = false;
            });
    };

    $scope.uploadDocument = function() {
        if (!$scope.file) {
            $scope.error = 'Please select a file to upload';
            return;
        }

        $scope.loading = true;
        $scope.error = '';
        $scope.success = '';

        var formData = new FormData();
        formData.append('document', $scope.file);
        formData.append('title', $scope.document.title);
        formData.append('description', $scope.document.description || '');
        formData.append('tags', $scope.document.tags || '');
        formData.append('category', $scope.document.category || '');
        formData.append('isPublic', $scope.document.isPublic || false);

        documentService.uploadDocument(formData)
            .then(function(response) {
                $scope.success = 'Document uploaded successfully!';
                $scope.document = {};
                $scope.file = null;
                document.getElementById('fileInput').value = '';
                setTimeout(function() {
                    $location.path('/documents');
                    $scope.$apply();
                }, 2000);
            })
            .catch(function(error) {
                $scope.error = error.data.message || 'Failed to upload document';
            })
            .finally(function() {
                $scope.loading = false;
            });
    };

    $scope.triggerFileInput = function() {
        document.getElementById('fileInput').click();
    };

    $scope.setFile = function(file) {
        $scope.file = file;
        $scope.$apply();
    };

    $scope.handleDrop = function(event) {
        event.preventDefault();
        $scope.isDragging = false;
        var files = event.dataTransfer.files;
        if (files.length > 0) {
            $scope.setFile(files[0]);
        }
    };

    $scope.handleDragover = function(event) {
        event.preventDefault();
        $scope.isDragging = true;
    };

    $scope.handleDragleave = function(event) {
        event.preventDefault();
        $scope.isDragging = false;
    };

    $scope.updateDocument = function() {
        $scope.loading = true;
        $scope.error = '';
        $scope.success = '';

        documentService.updateDocument($routeParams.id, $scope.document)
            .then(function(response) {
                $scope.document = response.data;
                $scope.success = 'Document updated successfully!';
            })
            .catch(function(error) {
                $scope.error = error.data.message || 'Failed to update document';
            })
            .finally(function() {
                $scope.loading = false;
            });
    };

    $scope.deleteDocument = function(id) {
        if (!confirm('Are you sure you want to delete this document?')) {
            return;
        }

        $scope.loading = true;
        $scope.error = '';

        documentService.deleteDocument(id)
            .then(function(response) {
                $scope.success = 'Document deleted successfully!';
                $scope.getDocuments($scope.currentPage);
            })
            .catch(function(error) {
                $scope.error = error.data.message || 'Failed to delete document';
            })
            .finally(function() {
                $scope.loading = false;
            });
    };

    $scope.searchDocuments = function() {
        $scope.currentPage = 1;
        $scope.getDocuments(1);
    };

    $scope.clearSearch = function() {
        $scope.searchQuery = '';
        $scope.selectedTags = '';
        $scope.selectedCategory = '';
        $scope.currentPage = 1;
        $scope.getDocuments(1);
    };

    $scope.getTotalSize = function() {
        if (!$scope.documents || $scope.documents.length === 0) {
            return 0;
        }
        return $scope.documents.reduce(function(total, doc) {
            return total + doc.filesize;
        }, 0);
    };

    $scope.viewDocument = function(id) {
        $location.path('/document/' + id);
    };

    $scope.downloadDocument = function(filename) {
        window.open('/uploads/' + filename, '_blank');
    };

    $scope.downloadVersion = function(filename) {
        window.open('/uploads/' + filename, '_blank');
    };

    $scope.restoreVersion = function(version) {
        if (confirm('Are you sure you want to restore version ' + version.version + '? This will create a new version.')) {
            // In a real implementation, this would upload the old version as a new version
            $scope.success = 'Version ' + version.version + ' restored successfully!';
        }
    };

    $scope.showShareDialog = function() {
        $scope.sharing = {
            emails: '',
            message: '',
            permission: 'view'
        };
        $scope.showShareModal = true;
    };

    $scope.hideShareDialog = function() {
        $scope.showShareModal = false;
        $scope.sharing = {};
    };

    $scope.shareDocument = function() {
        if (!$scope.sharing.emails) {
            $scope.error = 'Please enter at least one email address';
            return;
        }

        const emails = $scope.sharing.emails.split(',').map(email => email.trim()).filter(email => email);
        const shareData = {
            emails: emails,
            message: $scope.sharing.message,
            permission: $scope.sharing.permission
        };

        $scope.loading = true;
        documentService.shareViaEmail($scope.document._id, shareData)
            .then(function(response) {
                $scope.success = response.data.message;
                $scope.hideShareDialog();
            })
            .catch(function(error) {
                $scope.error = error.data.message || 'Failed to share document';
            })
            .finally(function() {
                $scope.loading = false;
            });
    };

    $scope.changePage = function(page) {
        if (page >= 1 && page <= $scope.totalPages) {
            $scope.getDocuments(page);
        }
    };

    $scope.getFileIcon = function(mimetype) {
        if (mimetype.includes('pdf')) return '📄';
        if (mimetype.includes('image')) return '🖼️';
        if (mimetype.includes('word') || mimetype.includes('document')) return '📝';
        if (mimetype.includes('text')) return '📄';
        return '📄';
    };

    $scope.formatFileSize = function(bytes) {
        if (bytes === 0) return '0 Bytes';
        var k = 1024;
        var sizes = ['Bytes', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    $scope.formatDate = function(dateString) {
        var date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    // Initialize based on route
    if ($location.path() === '/documents' || $location.path() === '/dashboard') {
        $scope.getDocuments();
    } else if ($routeParams.id) {
        $scope.getDocument();
    }
}]);
