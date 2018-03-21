/*
 * PCC Mobile Platform SDK - v0.1.5
 * 2017/06/14
 */
(function (window) {

  // declare
  var sdk = {};
  var _barcodeScanHandler = null;
  var _ready = false;
  var _readyCallback = null;
  var _initData = null;
  var _callbackMap = new Object();
  var REQUIRE_APP_VERSION = '0.1.5';

  var _onMessage = function (event) {
    var eventDataText = event.data;
    if (eventDataText) {
      var eventData = JSON.parse(eventDataText);
      var module = eventData.module;
      var method = eventData.method;
      var data = eventData.data;
      switch (module) {
        case 'platform':
          if (method === 'ready') {
            onPlatformReady(data);
          } else {
            // getNetInfo
            handleCallbackData(eventData);
          }
          break;
        case 'camera':
          if (method === 'scanBarcode') {
            if (_barcodeScanHandler) {
              _barcodeScanHandler(data);
            }
          }
          break;
        case 'user':
          handleCallbackData(eventData);
          break;
        case 'database':
          // buildSchema, tableGet, tableGetCount, executeSql, sqlBatch
          handleCallbackData(eventData);
          break;
        default:
          log.error('Cannot execute: [' + eventData.module + '.' + eventData.method +
            '], please upgrade SDK to the latest version.');
      }
    }
  };

  function onPlatformReady(data) {
    if (_ready === false) {
      _ready = true;
      _initData = {
        version: data.version,
        os: data.os
      };
      var compareResult = compareVersionNumbers(data.version, REQUIRE_APP_VERSION);
      if (compareResult < 0 || isNaN(compareResult)) {
        alert('Please update app version (current: '
        + data.version + ', require: ' + REQUIRE_APP_VERSION + ').');
      }
      if (_readyCallback) {
        _readyCallback(JSON.parse(JSON.stringify(_initData)));
      }
    }
  }

  function handleCallbackData(eventData) {
    var data = eventData.data;
    var key = eventData.callbackId;
    var successCb;
    var failCb;
    var cbObj = _callbackMap[key];
    if (cbObj) {
      successCb = cbObj.success;
      failCb = cbObj.fail;
    }
    if (eventData.success) {
      if (successCb) {
        successCb(data);
      }
    } else {
      if (failCb) {
        failCb(data);
      }
    }
    delete _callbackMap[key];
  }

  function generateGuid() {
    function _p8(s) {
      var p = (Math.random().toString(16) + "000000000").substr(2, 8);
      return s ? "-" + p.substr(0, 4) + "-" + p.substr(4, 4) : p;
    }
    return _p8() + _p8(true) + _p8(true) + _p8();
  }

  function isEmpty(x) {
    return (x === undefined || x === null || x === '');
  }

  function isNotEmpty(x) {
    return !isEmpty(x);
  }

  /**
   * Compare two software version numbers (e.g. 1.7.1)
   * Returns:
   *  0 if they're identical
   *  negative if v1 < v2
   *  positive if v1 > v2
   *  Nan if they in the wrong format
   */
  function compareVersionNumbers(v1, v2) {
    var v1parts = v1.split('.');
    var v2parts = v2.split('.');

    function isPositiveInteger(x) {
      return /^\d+$/.test(x);
    }

    // First, validate both numbers are true version numbers
    function validateParts(parts) {
      for (var i = 0; i < parts.length; ++i) {
        if (!isPositiveInteger(parts[i])) {
          return false;
        }
      }
      return true;
    }
    if (!validateParts(v1parts) || !validateParts(v2parts)) {
      return NaN;
    }
    for (var i = 0; i < v1parts.length; ++i) {
      if (v2parts.length === i) {
        return 1;
      }
      if (v1parts[i] === v2parts[i]) {
        continue;
      }
      if (v1parts[i] > v2parts[i]) {
        return 1;
      }
      return -1;
    }
    if (v1parts.length != v2parts.length) {
      return -1;
    }
    return 0;
  }

  function isInt(value) {
    if (isNaN(value)) {
      return false;
    }
    var x = parseFloat(value);
    return (x | 0) === x;
  }

  function postData(dataObj) {
    if (_ready) { // wait until ready
      window.postMessage(JSON.stringify(dataObj), '*');
    }
  }

  function postDataWithCallback(dataObj, successCallback, failCallback) {
    _callbackMap[dataObj.callbackId] = {
      success: successCallback,
      fail: failCallback
    }
    postData(dataObj);
  }

  // Module: Platform
  function Platform() {};

  /**
   * This method will be called when SDK is is fully loaded.
   * Must use ES6 arrow function.
   */
  Platform.prototype.ready = function () {
    return new Promise(function(resolve) {
      if (_initData !== null) {
        resolve(JSON.parse(JSON.stringify(_initData)));
      } else {
        var dataObj = {
          callbackId: generateGuid(),
          module: 'platform',
          method: 'ready'
        };
        _readyCallback = function(data) {
          resolve(data);
        };
        // TODO post ready back
        postDataWithCallback(dataObj, _readyCallback);
      }
    });
  }

  Platform.prototype.getNetInfo = function () {
    return new Promise(function(resolve) {
      var dataObj = {
        callbackId: generateGuid(),
        module: 'platform',
        method: 'getNetInfo'
      };
      postDataWithCallback(dataObj,
        function(data) {
          resolve(data);
        }
      );
    });
  }

  Platform.prototype.exit = function () {
    var data = { // no callback
      module: 'platform',
      method: 'exit'
    };
    postData(data);
  }

  // Module: User
  function User() {};

  /**
   * Get user info.
   */
  User.prototype.getProfile = function () {
    return new Promise(function(resolve, reject) {
      var dataObj = {
        callbackId: generateGuid(),
        module: 'user',
        method: 'getProfile'
      };
      postDataWithCallback(dataObj,
        function(data) {
          resolve(data);
        },
        function(error) {
          reject(error);
        }
      );
    });
  }

  /**
   * Get user locale.
   */
  User.prototype.getLocale = function () {
    return new Promise(function(resolve, reject) {
      var dataObj = {
        callbackId: generateGuid(),
        module: 'user',
        method: 'getLocale'
      };
      postDataWithCallback(dataObj,
        function(data) {
          resolve(data);
        }
      );
    });
  }

  // Module: Camera
  function Camera() {};

  /**
   * Open barcode scanner.
   *
   * @param {Function} handler
   */
  Camera.prototype.openBarcodeScanner = function (handler) {
    _barcodeScanHandler = handler;
    var dataObj = {
      module: 'camera',
      method: 'openBarcode'
    };
    postData(dataObj);
  };

  /**
   * Close barcode scanner.
   */
  Camera.prototype.closeBarcodeScanner = function () {
    _barcodeScanHandler = null;
    var dataObj = {
      module: 'camera',
      method: 'closeBarcode'
    };
    postData(dataObj);
  };

  // Module: Database
  function Database() {};

  function CreateTableBuilder(name) {
    this.name = name;
    this.primaryKey = null;
    this.addColumns = [];
    this.addIndexes = [];
  };

  CreateTableBuilder.prototype.addColumn = function (name, type, notNull, defaultValue) {
    var column = {
      name: name,
      type: type,
      notNull: isNotEmpty(notNull) ? notNull : false,
      defaultValue: defaultValue
    };
    this.addColumns.push(column);
    return this;
  }

  CreateTableBuilder.prototype.addPrimaryKey = function (pkArray, autoIncrement) {
    this.primaryKey = {
      columns: pkArray || [],
      autoIncrement: isNotEmpty(autoIncrement) ? autoIncrement : false
    }
    return this;
  }
  // pk cannot be removed

  CreateTableBuilder.prototype.addIndex = function (indexName, columns, unique) {
    var newIndex = {
      name: indexName,
      columns: columns,
      unique: isNotEmpty(unique) ? unique : false
    };
    this.addIndexes.push(newIndex);
    return this;
  }

  CreateTableBuilder.prototype.toPlainObject = function () {
    return {
      name: this.name,
      addColumns: this.addColumns,
      primaryKey: this.primaryKey,
      addIndexes: this.addIndexes
    };
  }

  function AlterTableBuilder(name) {
    this.name = name;
    this.batchExecArray = []; // alter table must batch exec
    // SQLite cannot alter these:
    // 1. remove column
    // 2. add or remove pk
  };

  AlterTableBuilder.prototype.addColumn = function (name, type, notNull, defaultValue) {
    var column = {
      name: name,
      type: type,
      notNull: isNotEmpty(notNull) ? notNull : false,
      defaultValue: defaultValue
    };
    this.batchExecArray.push({
      method: 'ADD_COLUMN',
      data: column
    });
    return this;
  }

  AlterTableBuilder.prototype.addIndex = function (indexName, columns, unique) {
    var newIndex = {
      name: indexName,
      columns: columns,
      unique: isNotEmpty(unique) ? unique : false
    };
    this.batchExecArray.push({
      method: 'ADD_INDEX',
      data: newIndex
    });
    return this;
  }

  AlterTableBuilder.prototype.removeIndex = function (indexName) {
    this.batchExecArray.push({
      method: 'REMOVE_INDEX',
      data: indexName
    });
    return this;
  }

  AlterTableBuilder.prototype.rename = function (newName) {
    this.batchExecArray.push({
      method: 'RENAME',
      data: newName
    });
    return this;
  }

  AlterTableBuilder.prototype.toPlainObject = function () {
    return {
      name: this.name,
      batchExecArray: this.batchExecArray
    };
  }

  function SchemaBuilder() {
    this.batchExecArray = [];
    // init current tables
  }

  SchemaBuilder.prototype.createTable = function (tableName) {
    var table = new CreateTableBuilder(tableName);
    this.batchExecArray.push({
      method: 'CREATE_TABLE',
      data: table
    });
    return table;
  }

  SchemaBuilder.prototype.alterTable = function (tableName) {
    var table = new AlterTableBuilder(tableName);
    this.batchExecArray.push({
      method: 'ALTER_TABLE',
      data: table
    });
    return table;
  }

  SchemaBuilder.prototype.dropTable = function (tableName) {
    this.batchExecArray.push({
      method: 'DROP_TABLE',
      data: tableName
    });
  }

  SchemaBuilder.prototype.build = function () {
    var self = this;
    return new Promise(function(resolve, reject) {
      var buildObj = {
        batchExecArray: []
      };
      for (var i = 0; i < self.batchExecArray.length; i++) {
        var execObj = self.batchExecArray[i];
        if (execObj.method === 'CREATE_TABLE' || execObj.method === 'ALTER_TABLE') {
          buildObj.batchExecArray.push({
            method: execObj.method,
            data: execObj.data.toPlainObject()
          });
        } else {
          buildObj.batchExecArray.push(execObj);
        }
      }
      var msgData = {
        callbackId: generateGuid(),
        module: 'database',
        method: 'buildSchema',
        data: buildObj
      };
      postDataWithCallback(msgData,
        function(data) {
          resolve(data);
        },
        function(error) {
          reject(error);
        }
      );
    });
  }

  function Table(name) {
    this.name = name;
  }

  Table.prototype.get = function (whereCond, orderBy) {
    var self = this;
    return new Promise(function(resolve, reject) {
      var condition = {
        name: self.name,
        where: undefined,
        params: [],
        orderBy: orderBy
      };
      if (isNotEmpty(whereCond) && whereCond.constructor === Array) {
        condition.where = whereCond[0];
        condition.params = whereCond[1];
      } else {
        condition.where = whereCond;
      }
      var dataObj = {
        callbackId: generateGuid(),
        module: 'database',
        method: 'tableGet',
        data: condition
      };
      postDataWithCallback(dataObj,
        function(data) {
          resolve(data);
        },
        function(error) {
          reject(error);
        }
      );
    });
  }

  Table.prototype.getWithPaging = function (pageNumber, pageSize, whereCond, orderBy) {
    var self = this;
    return new Promise(function(resolve, reject) {
      var condition = {
        page: pageNumber,
        pageSize: pageSize,
        name: self.name,
        where: undefined,
        params: [],
        orderBy: orderBy
      };
      if (isNotEmpty(whereCond) && whereCond.constructor === Array) {
        condition.where = whereCond[0];
        condition.params = whereCond[1];
      } else {
        condition.where = whereCond;
      }
      var dataObj = {
        callbackId: generateGuid(),
        module: 'database',
        method: 'tableGetWithPaging',
        data: condition
      };
      postDataWithCallback(dataObj,
        function(data) {
          resolve(data);
        },
        function(error) {
          reject(error);
        }
      );
    });
  }

  Table.prototype.getCount = function (whereCond) {
    var self = this;
    return new Promise(function(resolve, reject) {
      var condition = {
        name: self.name,
        where: undefined,
        params: []
      };
      if (isNotEmpty(whereCond) && whereCond.constructor === Array) {
        condition.where = whereCond[0];
        condition.params = whereCond[1];
      } else {
        condition.where = whereCond;
      }
      var dataObj = {
        callbackId: generateGuid(),
        module: 'database',
        method: 'tableGetCount',
        data: condition
      };
      postDataWithCallback(dataObj,
        function(data) {
          resolve(data);
        },
        function(error) {
          reject(error);
        }
      );
    });
  }

  Table.prototype.insert = function(rows) {
    var self = this;
    return new Promise(function(resolve, reject) {
      var condition = {
        name: self.name,
        rows: rows,
        replaceable: false
      };
      var dataObj = {
        callbackId: generateGuid(),
        module: 'database',
        method: 'tableInsert',
        data: condition
      };
      postDataWithCallback(dataObj,
        function(data) {
          resolve(data);
        },
        function(error) {
          reject(error);
        }
      );
    });
  }

  Table.prototype.insertOrReplace = function(rows) {
    var self = this;
    return new Promise(function(resolve, reject) {
      var condition = {
        name: self.name,
        rows: rows,
        replaceable: true
      };
      var dataObj = {
        callbackId: generateGuid(),
        module: 'database',
        method: 'tableInsert',
        data: condition
      };
      postDataWithCallback(dataObj,
        function(data) {
          resolve(data);
        },
        function(error) {
          reject(error);
        }
      );
    });
  }

  Table.prototype.update = function (updateProp, whereCond) {
    var self = this;
    return new Promise(function(resolve, reject) {
      var condition = {
        name: self.name,
        updateProp: updateProp,
        where: undefined,
        params: []
      };
      if (isNotEmpty(whereCond) && whereCond.constructor === Array) {
        condition.where = whereCond[0];
        condition.params = whereCond[1];
      } else {
        condition.where = whereCond;
      }
      var dataObj = {
        callbackId: generateGuid(),
        module: 'database',
        method: 'tableUpdate',
        data: condition
      };
      postDataWithCallback(dataObj,
        function(data) {
          resolve(data);
        },
        function(error) {
          reject(error);
        }
      );
    });
  }

  Table.prototype.delete = function (whereCond) {
    var self = this;
    return new Promise(function(resolve, reject) {
      var condition = {
        name: self.name,
        where: undefined,
        params: []
      };
      if (isNotEmpty(whereCond) && whereCond.constructor === Array) {
        condition.where = whereCond[0];
        condition.params = whereCond[1];
      } else {
        condition.where = whereCond;
      }
      var dataObj = {
        callbackId: generateGuid(),
        module: 'database',
        method: 'tableDelete',
        data: condition
      };
      postDataWithCallback(dataObj,
        function(data) {
          resolve(data);
        },
        function(error) {
          reject(error);
        }
      );
    });
  }

  Table.prototype.deleteAll = function () {
    return this.delete();
  }

  Database.prototype.getSchemaVersion = function () {
    return new Promise(function(resolve, reject) {
      var dataObj = {
        callbackId: generateGuid(),
        module: 'database',
        method: 'getSchemaVersion'
      };
      postDataWithCallback(dataObj,
        function(data) {
          resolve(data);
        },
        function(error) {
          reject(error);
        }
      );
    });
  }

  Database.prototype.setSchemaVersion = function (version) {
    return new Promise(function(resolve, reject) {
      if (isInt(version)) {
        var dataObj = {
          callbackId: generateGuid(),
          module: 'database',
          method: 'setSchemaVersion',
          data: version
        };
        postDataWithCallback(dataObj,
          function(data) {
            resolve(data);
          },
          function(error) {
            reject(error);
          }
        );
      } else {
        reject(new TypeError('Schema version must be integer.'));
      }
    });
  }

  Database.prototype.getSchemaBuilder = function () {
    return new SchemaBuilder();
  }

  Database.prototype.getTable = function (tableName) {
    return new Table(tableName);
  }

  Database.prototype.executeSql = function (sqlText, params) {
    return new Promise(function(resolve, reject) {
      var dataObj = {
        callbackId: generateGuid(),
        module: 'database',
        method: 'executeSql',
        data: {
          sql: sqlText,
          params: params || []
        }
      };
      postDataWithCallback(dataObj,
        function(data) {
          resolve(data);
        },
        function(error) {
          reject(error);
        }
      );
    });
  };

  Database.prototype.sqlBatch = function (sqlBatchArray) {
    return new Promise(function(resolve, reject) {
      var dataObj = {
        callbackId: generateGuid(),
        module: 'database',
        method: 'sqlBatch',
        data: sqlBatchArray
      };
      postDataWithCallback(dataObj,
        function(data) {
          resolve(data);
        },
        function(error) {
          reject(error);
        }
      );
    });
  };

  sdk.platform = new Platform();
  sdk.user = new User();
  sdk.camera = new Camera();
  sdk.database = new Database();

  // your sdk init function
  sdk.init = function () {
    // ...
  };

  window.document.addEventListener('message', _onMessage);

  // define your namespace
  window.PCCMP = sdk;
})(window, undefined);
