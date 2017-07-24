'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.lastReferenceValue = exports.dataValue = exports.dataPath = exports.merge = exports.each = exports.alterState = exports.sourceValue = exports.fields = exports.field = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.execute = execute;
exports.xmlRpc = xmlRpc;
exports.odooConnect = odooConnect;
exports.odooXmlRpc = odooXmlRpc;
exports.nodeOdoo = nodeOdoo;
exports.odooClient = odooClient;
exports.createEntity = createEntity;
exports.query = query;
exports.updateEntity = updateEntity;
exports.deleteEntity = deleteEntity;

var _languageCommon = require('language-common');

Object.defineProperty(exports, 'field', {
  enumerable: true,
  get: function get() {
    return _languageCommon.field;
  }
});
Object.defineProperty(exports, 'fields', {
  enumerable: true,
  get: function get() {
    return _languageCommon.fields;
  }
});
Object.defineProperty(exports, 'sourceValue', {
  enumerable: true,
  get: function get() {
    return _languageCommon.sourceValue;
  }
});
Object.defineProperty(exports, 'alterState', {
  enumerable: true,
  get: function get() {
    return _languageCommon.alterState;
  }
});
Object.defineProperty(exports, 'each', {
  enumerable: true,
  get: function get() {
    return _languageCommon.each;
  }
});
Object.defineProperty(exports, 'merge', {
  enumerable: true,
  get: function get() {
    return _languageCommon.merge;
  }
});
Object.defineProperty(exports, 'dataPath', {
  enumerable: true,
  get: function get() {
    return _languageCommon.dataPath;
  }
});
Object.defineProperty(exports, 'dataValue', {
  enumerable: true,
  get: function get() {
    return _languageCommon.dataValue;
  }
});
Object.defineProperty(exports, 'lastReferenceValue', {
  enumerable: true,
  get: function get() {
    return _languageCommon.lastReferenceValue;
  }
});

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _url = require('url');

var _odooClient = require('odoo-client');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Odoo = require('node-odoo');
var Odoo2 = require('odoo-connect');
var xmlrpc = require('xmlrpc');

/** @module Adaptor */

/**
 * Execute a sequence of operations.
 * Wraps `language-common/execute`, and prepends initial state for http.
 * @example
 * execute(
 *   create('foo'),
 *   delete('bar')
 * )(state)
 * @constructor
 * @param {Operations} operations - Operations to be performed.
 * @returns {Operation}
 */
function execute() {
  for (var _len = arguments.length, operations = Array(_len), _key = 0; _key < _len; _key++) {
    operations[_key] = arguments[_key];
  }

  var initialState = {
    references: [],
    data: null
  };

  return function (state) {
    return _languageCommon.execute.apply(undefined, operations)(_extends({}, initialState, state));
  };
}

function xmlRpc() {

  return function (state) {
    var _state$configuration = state.configuration,
        username = _state$configuration.username,
        database = _state$configuration.database,
        hostUrl = _state$configuration.hostUrl,
        password = _state$configuration.password,
        port = _state$configuration.port;


    var client = xmlrpc.createClient({ host: 'localhost', port: 9090, path: '/' });

    return new Promise(function (resolve, reject) {
      // Creates an XML-RPC server to listen to XML-RPC method calls
      var server = xmlrpc.createServer({ host: hostUrl, port: 9090 });
      // Handle methods not found
      server.on('NotFound', function (method, params) {
        console.log('Method ' + method + ' does not exist');
      });
      // Handle method calls by listening for events with the method call name
      server.on('anAction', function (err, params, callback) {
        console.log('Method call params for \'anAction\': ' + params);

        // ...perform an action...

        // Send a method response with a value
        callback(null, 'aResult');
      });
      console.log('XML-RPC server listening on port 9091');

      // Waits briefly to give the XML-RPC server time to start up and start
      // listening
      setTimeout(function () {
        // Creates an XML-RPC client. Passes the host information on where to
        // make the XML-RPC calls.
        var client = xmlrpc.createClient({ host: 'localhost', port: 9090, path: '/' });

        // Sends a method call to the XML-RPC server
        client.methodCall('anAction', ['aParam'], function (error, value) {
          // Results of the method response
          console.log('Method response for \'anAction\': ' + value);
        });
      }, 1000);
    });
  };
};

function odooConnect() {
  return function (state) {
    var _state$configuration2 = state.configuration,
        username = _state$configuration2.username,
        database = _state$configuration2.database,
        hostUrl = _state$configuration2.hostUrl,
        password = _state$configuration2.password,
        port = _state$configuration2.port;


    var odoo = new Odoo2({
      host: hostUrl,
      port: port
    });

    return new Promise(function (resolve, reject) {
      odoo.connect({
        database: database,
        username: username,
        password: password
      }).then(function (client) {
        client.searchRead('product.product', [['list_price', '>', '50']], { limit: 1 });
      }).then(function (products) {
        console.log(products);
        //=> [{list_price: 52, name: 'Unicorn'}]
        resolve(products);
      });
    });
  };
}

function odooXmlRpc() {

  return function (state) {

    var Odoo = require('odoo-xmlrpc');

    var _state$configuration3 = state.configuration,
        username = _state$configuration3.username,
        database = _state$configuration3.database,
        hostUrl = _state$configuration3.hostUrl,
        password = _state$configuration3.password,
        port = _state$configuration3.port;


    var odoo = new Odoo({
      url: hostUrl,
      // port: port,
      db: database,
      username: username,
      password: password
    });

    return new Promise(function (resolve, reject) {

      odoo.connect(function (err) {
        if (err) {
          reject(err);
        }
        console.log('Connected to Odoo server.');
        resolve('Connected.');
      });
    });
  };
}

function nodeOdoo() {
  return function (state) {
    var _state$configuration4 = state.configuration,
        username = _state$configuration4.username,
        database = _state$configuration4.database,
        hostUrl = _state$configuration4.hostUrl,
        password = _state$configuration4.password,
        port = _state$configuration4.port;


    var odoo = new Odoo({
      host: hostUrl,
      port: port,
      database: database,
      username: username,
      password: password
    });

    return new Promise(function (resolve, reject) {
      // Connect to Odoo
      odoo.connect(function (err) {
        if (err) {
          reject(err);
        }

        // Get a partner
        odoo.get('res.partner', 4, function (err, partner) {
          if (err) {
            return console.log(err);
          }
          console.log('Partner', partner);
          resolve(partner);
        });
      });
    });
  };
}

function odooClient() {

  return function (state) {
    var _state$configuration5 = state.configuration,
        username = _state$configuration5.username,
        database = _state$configuration5.database,
        hostUrl = _state$configuration5.hostUrl,
        password = _state$configuration5.password;


    var client = (0, _odooClient.createClient)({
      location: hostUrl,
      db: database,
      login: username,
      password: password,
      autologin: false
    });

    return new Promise(function (resolve, reject) {

      client.login({
        password: 'password'
      }).then(function (response) {
        console.log(response);
        resolve(response);
      }).catch(function (err) {
        console.error(err);
        reject(err);
      });
    });
  };
}

function createEntity(params) {

  return function (state) {

    function assembleError(_ref) {
      var response = _ref.response,
          error = _ref.error;

      if (response && [200, 201, 202, 204].indexOf(response.statusCode) > -1) return false;
      if (error) return error;
      return new Error('Server responded with ' + response.statusCode);
    }

    var _state$configuration6 = state.configuration,
        resource = _state$configuration6.resource,
        accessToken = _state$configuration6.accessToken,
        apiVersion = _state$configuration6.apiVersion;

    var _expandReferences = (0, _languageCommon.expandReferences)(params)(state),
        entityName = _expandReferences.entityName,
        body = _expandReferences.body;

    var url = resource + '/api/data/v' + apiVersion + '/' + entityName;

    var headers = {
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0',
      'Content-Type': 'application/json',
      'Authorization': accessToken
    };

    console.log("Posting to url: " + url);
    console.log("With body: " + JSON.stringify(body, null, 2));

    return new Promise(function (resolve, reject) {
      _request2.default.post({
        url: url,
        json: body,
        headers: headers
      }, function (error, response, body) {
        error = assembleError({ response: response, error: error });
        if (error) {
          reject(error);
        } else {
          console.log("Create entity succeeded.");
          console.log(body);
          resolve(body);
        }
      });
    }).then(function (data) {
      var nextState = _extends({}, state, { response: { body: data } });
      return nextState;
    });
  };
};

function query(params) {

  return function (state) {

    function assembleError(_ref2) {
      var response = _ref2.response,
          error = _ref2.error;

      if (response && [200, 201, 202, 204].indexOf(response.statusCode) > -1) return false;
      if (error) return error;
      return new Error('Server responded with ' + response.statusCode);
    }

    var _state$configuration7 = state.configuration,
        resource = _state$configuration7.resource,
        accessToken = _state$configuration7.accessToken,
        apiVersion = _state$configuration7.apiVersion;

    var _expandReferences2 = (0, _languageCommon.expandReferences)(params)(state),
        entityName = _expandReferences2.entityName,
        entityId = _expandReferences2.entityId,
        query = _expandReferences2.query;

    var url = resource + '/api/data/v' + apiVersion + '/' + entityName;

    var urlId = entityId ? url + '(' + entityId + ')' : url;

    // TODO: find a better way of running these ternaries.
    // Here we initialize an empty object if no query is present.
    var ternaryQuery = query || {};

    var selectors = ternaryQuery.fields ? '$select=' + query.fields.join(',') : null;
    var orderBy = ternaryQuery.orderBy ? '$orderby=' + query.orderBy.field + ' ' + query.orderBy.direction : null;
    var filter = ternaryQuery.filter ? '$filter=' + query.filter : null;
    var limit = ternaryQuery.limit ? query.limit : 0;

    var queryUrl = [selectors, orderBy, filter].filter(function (i) {
      return i != null;
    }).join('&');

    var fullUrl = queryUrl ? urlId + '?' + queryUrl : urlId;

    console.log("Full URL: " + fullUrl);

    var headers = {
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0',
      'Content-Type': 'application/json',
      'Authorization': accessToken,
      'Prefer': 'odata.maxpagesize=' + limit
    };

    return new Promise(function (resolve, reject) {
      _request2.default.get({
        url: fullUrl,
        headers: headers
      }, function (error, response, body) {
        error = assembleError({ response: response, error: error });
        if (error) {
          reject(error);
        } else {
          console.log("Query succeeded.");
          console.log(body);
          resolve(body);
        }
      });
    }).then(function (data) {
      var nextState = _extends({}, state, { response: { body: data } });
      return nextState;
    });
  };
};

function updateEntity(params) {

  return function (state) {

    function assembleError(_ref3) {
      var response = _ref3.response,
          error = _ref3.error;

      if (response && [200, 201, 202, 204].indexOf(response.statusCode) > -1) return false;
      if (error) return error;
      return new Error('Server responded with ' + response.statusCode);
    }

    var _state$configuration8 = state.configuration,
        resource = _state$configuration8.resource,
        accessToken = _state$configuration8.accessToken,
        apiVersion = _state$configuration8.apiVersion;

    var _expandReferences3 = (0, _languageCommon.expandReferences)(params)(state),
        entityName = _expandReferences3.entityName,
        entityId = _expandReferences3.entityId,
        body = _expandReferences3.body;

    var url = resource + '/api/data/v' + apiVersion + '/' + entityName + '(' + entityId + ')';

    var headers = {
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0',
      'Content-Type': 'application/json',
      'Authorization': accessToken
    };

    console.log("Posting to url: " + url);
    console.log("With body: " + JSON.stringify(body, null, 2));

    return new Promise(function (resolve, reject) {
      _request2.default.patch({
        url: url,
        json: body,
        headers: headers
      }, function (error, response, body) {
        error = assembleError({ response: response, error: error });
        if (error) {
          reject(error);
        } else {
          console.log("Update succeeded.");
          console.log(body);
          resolve(body);
        }
      });
    }).then(function (data) {
      var nextState = _extends({}, state, { response: { body: data } });
      return nextState;
    });
  };
};

function deleteEntity(params) {

  return function (state) {

    function assembleError(_ref4) {
      var response = _ref4.response,
          error = _ref4.error;

      if (response && [200, 201, 202, 204].indexOf(response.statusCode) > -1) return false;
      if (error) return error;
      return new Error('Server responded with ' + response.statusCode);
    }

    var _state$configuration9 = state.configuration,
        resource = _state$configuration9.resource,
        accessToken = _state$configuration9.accessToken,
        apiVersion = _state$configuration9.apiVersion;

    var _expandReferences4 = (0, _languageCommon.expandReferences)(params)(state),
        entityName = _expandReferences4.entityName,
        entityId = _expandReferences4.entityId;

    var url = resource + '/api/data/v' + apiVersion + '/' + entityName + '(' + entityId + ')';

    var headers = {
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0',
      'Content-Type': 'application/json',
      'Authorization': accessToken
    };

    console.log("Posting to url: " + url);

    return new Promise(function (resolve, reject) {
      _request2.default.delete({
        url: url,
        headers: headers
      }, function (error, response, body) {
        error = assembleError({ response: response, error: error });
        if (error) {
          reject(error);
        } else {
          console.log("Delete succeeded.");
          console.log(body);
          resolve(body);
        }
      });
    }).then(function (data) {
      var nextState = _extends({}, state, { response: { body: data } });
      return nextState;
    });
  };
};
