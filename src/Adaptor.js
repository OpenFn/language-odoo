import { execute as commonExecute, expandReferences } from 'language-common';
import request from 'request';
import { resolve as resolveUrl } from 'url';
import { createClient } from 'odoo-client'
var Odoo = require('node-odoo');
const Odoo2 = require('odoo-connect');
var xmlrpc = require('xmlrpc')

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
export function execute(...operations) {
  const initialState = {
    references: [],
    data: null
  }

  return state => {
    return commonExecute(...operations)({ ...initialState, ...state })
  };

}

export function xmlRpc() {

  return state => {

    const { username, database, hostUrl, password, port } = state.configuration;

    var client = xmlrpc.createClient({ host: 'localhost', port: 9090, path: '/'})

    return new Promise(function(resolve, reject) {
      // Creates an XML-RPC server to listen to XML-RPC method calls
      var server = xmlrpc.createServer({ host: hostUrl, port: 9090 })
      // Handle methods not found
      server.on('NotFound', function(method, params) {
        console.log('Method ' + method + ' does not exist');
      })
      // Handle method calls by listening for events with the method call name
      server.on('anAction', function (err, params, callback) {
        console.log('Method call params for \'anAction\': ' + params)

        // ...perform an action...

        // Send a method response with a value
        callback(null, 'aResult')
      })
      console.log('XML-RPC server listening on port 9091')

      // Waits briefly to give the XML-RPC server time to start up and start
      // listening
      setTimeout(function () {
        // Creates an XML-RPC client. Passes the host information on where to
        // make the XML-RPC calls.
        var client = xmlrpc.createClient({ host: 'localhost', port: 9090, path: '/'})

        // Sends a method call to the XML-RPC server
        client.methodCall('anAction', ['aParam'], function (error, value) {
          // Results of the method response
          console.log('Method response for \'anAction\': ' + value)
        })

      }, 1000)
    });

  }
};

export function odooConnect() {
  return state => {

    const { username, database, hostUrl, password, port } = state.configuration;

    const odoo = new Odoo2({
    	host: hostUrl,
    	port
    });

    return new Promise((resolve, reject) => {
      odoo
      	.connect({
      		database,
      		username,
      		password
      	})
      	.then(client => {
          client.searchRead('product.product', [['list_price', '>', '50']], {limit: 1});
      	})
      	.then(products => {
      		console.log(products);
      		//=> [{list_price: 52, name: 'Unicorn'}]
          resolve(products)
      	});
    })
  }
}

export function odooXmlRpc() {

  return state => {

    var Odoo = require('odoo-xmlrpc');

    const { username, database, hostUrl, password, port } = state.configuration;

    var odoo = new Odoo({
      url: hostUrl,
      // port: port,
      db: database,
      username: username,
      password: password
    });

    return new Promise((resolve, reject) => {

      odoo.connect(function (err) {
        if (err) { reject(err); }
        console.log('Connected to Odoo server.');
        resolve('Connected.')
      });
    })
  }

}

export function nodeOdoo() {
  return state => {
    const { username, database, hostUrl, password, port } = state.configuration;

    var odoo = new Odoo({
      host: hostUrl,
      port: port,
      database: database,
      username: username,
      password: password
    });

    return new Promise((resolve, reject) => {
      // Connect to Odoo
      odoo.connect(function (err) {
        if (err) { reject(err); }

        // Get a partner
        odoo.get('res.partner', 4, function (err, partner) {
          if (err) { return console.log(err); }
          console.log('Partner', partner);
          resolve(partner)
        });
      });
    })
  }
}

export function odooClient() {

  return state => {

    const { username, database, hostUrl, password } = state.configuration;

    const client = createClient({
      location: hostUrl,
      db: database,
      login: username,
      password: password,
      autologin: false,
    })

    return new Promise((resolve, reject) => {

      client.login({
        password: 'password',
      })
      .then((response) => {
        console.log(response)
        resolve(response)
      })
      .catch((err) => {
        console.error(err)
        reject(err)
      })
    })

  }

}

export function createEntity(params) {

  return state => {

    function assembleError({ response, error }) {
      if (response && ([200,201,202,204].indexOf(response.statusCode) > -1)) return false;
      if (error) return error;
      return new Error(`Server responded with ${response.statusCode}`)
    }

    const { resource, accessToken, apiVersion } = state.configuration;

    const { entityName, body } = expandReferences(params)(state);

    const url = `${resource}/api/data/v${apiVersion}/${entityName}`;

    const headers = {
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0',
      'Content-Type': 'application/json',
      'Authorization': accessToken
    };

    console.log("Posting to url: " + url);
    console.log("With body: " + JSON.stringify(body, null, 2));


    return new Promise((resolve, reject) => {
      request.post ({
        url: url,
        json: body,
        headers
      }, function(error, response, body){
        error = assembleError({response, error})
        if(error) {
          reject(error);
        } else {
          console.log("Create entity succeeded.");
          console.log(body)
          resolve(body);
        }
      })
    }).then((data) => {
      const nextState = { ...state, response: { body: data } };
      return nextState;
    })

  };

};

export function query(params) {

  return state => {

    function assembleError({ response, error }) {
      if (response && ([200,201,202,204].indexOf(response.statusCode) > -1)) return false;
      if (error) return error;
      return new Error(`Server responded with ${response.statusCode}`)
    }

    const { resource, accessToken, apiVersion } = state.configuration;
    const { entityName, entityId, query } = expandReferences(params)(state);

    const url = `${resource}/api/data/v${apiVersion}/${entityName}`;

    const urlId = ( entityId ? `${url}(${entityId})` : url );

    // TODO: find a better way of running these ternaries.
    // Here we initialize an empty object if no query is present.
    const ternaryQuery = query || {};

    const selectors = ( ternaryQuery.fields ? `$select=${query.fields.join(',')}` : null );
    const orderBy = ( ternaryQuery.orderBy ? `$orderby=${query.orderBy.field} ${query.orderBy.direction}` : null );
    const filter = ( ternaryQuery.filter ? `$filter=${query.filter}` : null );
    const limit = ( ternaryQuery.limit ?  query.limit : 0 );

    const queryUrl = [selectors, orderBy, filter]
                      .filter( i => {
                        return i != null
                      })
                      .join('&');

    const fullUrl = ( queryUrl ? `${urlId}?${queryUrl}` : urlId );

    console.log("Full URL: " + fullUrl);

    const headers = {
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0',
      'Content-Type': 'application/json',
      'Authorization': accessToken,
      'Prefer': 'odata.maxpagesize=' + limit
    };

    return new Promise((resolve, reject) => {
      request.get ({
        url: fullUrl,
        headers
      }, function(error, response, body){
        error = assembleError({response, error})
        if(error) {
          reject(error);
        } else {
          console.log("Query succeeded.");
          console.log(body)
          resolve(body);
        }
      })
    }).then((data) => {
      const nextState = { ...state, response: { body: data } };
      return nextState;
    })

  };

};

export function updateEntity(params) {

  return state => {

    function assembleError({ response, error }) {
      if (response && ([200,201,202,204].indexOf(response.statusCode) > -1)) return false;
      if (error) return error;
      return new Error(`Server responded with ${response.statusCode}`)
    }

    const { resource, accessToken, apiVersion } = state.configuration;

    const { entityName, entityId, body } = expandReferences(params)(state);

    const url = `${resource}/api/data/v${apiVersion}/${entityName}(${entityId})`;

    const headers = {
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0',
      'Content-Type': 'application/json',
      'Authorization': accessToken
    };

    console.log("Posting to url: " + url);
    console.log("With body: " + JSON.stringify(body, null, 2));


    return new Promise((resolve, reject) => {
      request.patch ({
        url: url,
        json: body,
        headers
      }, function(error, response, body){
        error = assembleError({response, error})
        if(error) {
          reject(error);
        } else {
          console.log("Update succeeded.");
          console.log(body)
          resolve(body);
        }
      })
    }).then((data) => {
      const nextState = { ...state, response: { body: data } };
      return nextState;
    })

  };

};

export function deleteEntity(params) {

  return state => {

    function assembleError({ response, error }) {
      if (response && ([200,201,202,204].indexOf(response.statusCode) > -1)) return false;
      if (error) return error;
      return new Error(`Server responded with ${response.statusCode}`)
    }

    const { resource, accessToken, apiVersion } = state.configuration;

    const { entityName, entityId } = expandReferences(params)(state);

    const url = `${resource}/api/data/v${apiVersion}/${entityName}(${entityId})`;

    const headers = {
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0',
      'Content-Type': 'application/json',
      'Authorization': accessToken
    };

    console.log("Posting to url: " + url);

    return new Promise((resolve, reject) => {
      request.delete ({
        url: url,
        headers
      }, function(error, response, body){
        error = assembleError({response, error})
        if(error) {
          reject(error);
        } else {
          console.log("Delete succeeded.");
          console.log(body)
          resolve(body);
        }
      })
    }).then((data) => {
      const nextState = { ...state, response: { body: data } };
      return nextState;
    })

  };

};

export {
  field, fields, sourceValue, alterState, each,
  merge, dataPath, dataValue, lastReferenceValue
} from 'language-common';
