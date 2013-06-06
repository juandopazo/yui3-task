#!/usr/bin/env node

var YUITest = require('yuitest'),
    path = require('path'),
    YUI = require('yui').YUI;


YUI({useSync: true}).use('test', function(Y) {
    Y.Test.Runner = YUITest.TestRunner;
    Y.Test.Case = YUITest.TestCase;
    Y.Test.Suite = YUITest.TestSuite;
    Y.Assert = Y.Test.Assert = YUITest.Assert;
    Y.ArrayAssert = YUITest.ArrayAssert;
    Y.Test.ArrayAssert = YUITest.ArrayAssert;

    Y.applyConfig({
        modules: {
            'gallery-task': {
                fullpath: path.normalize('../../build/gallery-task/gallery-task-min.js'),
                requires: ['promise']
            },
            'task-tests':  {
                fullpath: path.normalize('../unit/js/tests-es6.js'),
                requires: ['gallery-task', 'test']
            }
        }
    });

    Y.use('task-tests');

    Y.Test.Runner.setName('gallery-task cli tests');
    
});