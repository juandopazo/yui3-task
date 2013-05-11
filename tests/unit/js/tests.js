YUI.add('task-tests', function(Y) {

    var Assert = Y.Test.Assert;

    var suite = new Y.Test.Suite('task');

    function sleep(ms, value) {
        return new Y.Promise(function (resolve) {
            setTimeout(function () {
                resolve(value);
            });
        });
    }

    suite.add(new Y.Test.Case({
        name: 'Task tests',
        'task() returns a promise': function () {
            Assert.isInstanceOf(Y.Promise, Y.task(function () {}), 'Y.task should return a promise');
        },
        'wait for a promise': function () {
            var test = this,
                expected = 'hello world';

            Y.task(function () {
                var value = yield sleep(15, expected);

                test.resume(function () {
                    Assert.areEqual(expected, value, 'yielded promise did not resolve to the expected value');
                });
            });

            test.wait();
        }
    }));

    Y.Test.Runner.add(suite);


},'', { requires: [ 'test' ] });
