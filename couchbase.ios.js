"use strict";
var Couchbase = (function () {
    function Couchbase(databaseName) {
        this.manager = CBLManager.sharedInstance();
        if (!this.manager) {
            console.log("MANAGER ERROR:Can not create share instance of CBLManager");
        }
        var errorRef = new interop.Reference();
        this.database = this.manager.databaseNamedError(databaseName, errorRef);
        if (!this.database) {
            console.log(errorRef.value);
        }
    }
    Couchbase.prototype.createDocument = function (data) {
        var doc = this.database.createDocument();
        var documentId = doc.documentID;
        var errorRef = new interop.Reference();
        var revision = doc.putPropertiesError(data, errorRef);
        if (!errorRef) {
            console.log("DOCUMENT ERROR:" + errorRef.value);
        }
        return documentId;
    };
    Couchbase.prototype.getDocument = function (documentId) {
        var document = this.database.documentWithID(documentId);
        return JSON.parse(this.mapToJson(document.properties));
    };
    Couchbase.prototype.updateDocument = function (documentId, data) {
        var document = this.database.documentWithID(documentId);
        var errorRef = new interop.Reference();
        var revision = document.putPropertiesError(data, errorRef);
        if (!errorRef) {
            console.error("DOCUMENT ERROR", errorRef.value);
        }
    };
    Couchbase.prototype.deleteDocument = function (documentId) {
        var document = this.database.documentWithID(documentId);
        var errorRef = new interop.Reference();
        document.deleteDocument(errorRef);
        if (!errorRef) {
            return false;
        }
        return true;
    };
    Couchbase.prototype.createView = function (viewName, viewRevision, callback) {
        var self = this;
        var view = this.database.viewNamed(viewName);
        view.setMapBlockVersion(function (document, emit) {
            callback(self.mapToJson(document), {
                emit: emit
            });
        }, viewRevision);
    };
    Couchbase.prototype.executeQuery = function (viewName) {
        var view = this.database.viewNamed(viewName);
        var query = view.createQuery();
        var errorRef = new interop.Reference();
        var resultSet = query.run(errorRef);
        var row = resultSet.nextRow();
        var results = [];
        var index = 0;
        while (row) {
            results[index++] = row.value;
            row = resultSet.nextRow();
        }
        if (!errorRef) {
            console.log(errorRef.value);
        }
        return results;
    };
    Couchbase.prototype.createPullReplication = function (remoteUrl) {
        var url = NSURL.URLWithString(remoteUrl);
        var replication = this.database.createPushReplication(url);
        if (!replication) {
            console.error("PULL ERROR");
        }
        return replication;
    };
    Couchbase.prototype.createPushReplication = function (remoteUrl) {
        var url = NSURL.URLWithString(remoteUrl);
        var replication = this.database.createPushReplication(url);
        if (!replication) {
            console.error("PUSH ERROR");
        }
        return replication;
    };
    Couchbase.prototype.addDatabaseChangeListener = function (callback) {
        NSNotificationCenter.defaultCenter().addObserverForNameObjectQueueUsingBlock(kCBLReplicationChangeNotification, null, NSOperationQueue.mainQueue(), function (notification) {
            callback(notification);
        });
    };
    Couchbase.prototype.destroyDatabase = function () {
        var errorRef = new interop.Reference();
        this.database.deleteDatabase(errorRef);
        if (!errorRef) {
            console.error("DESTROY", errorRef.value);
        }
    };
    Couchbase.prototype.mapToJson = function (properties) {
        var errorRef = new interop.Reference();
        var data = NSJSONSerialization.dataWithJSONObjectOptionsError(properties, NSJSONWritingPrettyPrinted, errorRef);
        var jsonString = NSString.alloc().initWithDataEncoding(data, NSUTF8StringEncoding);
        return jsonString;
    };
    return Couchbase;
}());
exports.Couchbase = Couchbase;
