/* jshint evil: true */
var supportsES6Syntax = false,
    isPromise = Y.Promise.isPromise;

try {
    // check if a function with an asterisk is valid syntax by evaluating it
    eval("function* f(){}");
    supportsES6Syntax = true;
    Y.log('Using ES6 syntax generators', 'info');
} catch (e) {
    Y.log('Using Old Firefox generators', 'info');
}

/**
Wraps a generator function in a Task. Tasks allow you to yield a promise,
effectively treating your promise based code as synchronous.

@method task
@for YUI
@param {Function} spawn Function that yield generators.
@return {Promise} Promise that gets resolved or rejected based on the result of
                the generator function
@example
YUI().use('gallery-io-utils', 'gallery-task', function (Y) {
   
  Y.task(function () {
    var data = yield Y.io.getJSON('/foo.json');
    yield Y.io.postJSON('/bar', {data: data});
    Y.log('done');
  });

});

**/
function task(spawn) {
    return new task.Task(spawn()).promise;
}

/**
This class is not intended to be instantiated by the user, but to be used
internally by `Y.task()`.

@class task.Task
@constructor
@param {Generator} generator A generator returned by a generator function
**/
function Task(generator) {
    var self = this;

    /**
    The generator instance.

    @property thread
    @type {Object}
    **/
    this.thread = generator;
    /**
    A promise to be returned by `Y.task()`.

    @property promise
    @type {Promise}
    **/
    this.promise = new Y.Promise(function (resolve, reject) {
        /**
        Resolves the exposed promise with the provided value

        @method resolve
        @param {Any} value Any value
        **/
        self.resolve = resolve;
        /**
        Rejects the exposed promise with the provided reason

        @method reject
        @param {Any} reason Any value for the rejection reason. Usually an error.
        **/
        self.reject = reject;
    });
    this.next();
}
/**
Step function that gets called every time the generator function yields.
When a promise is yielded, it observes the promise's result. If the promise
is successfully resolved, it calls itself with a null error and the value
of the promise. If the promise was rejected, it calls itself with an error.

Internally it passes the value or the error to the generator's `throw()`
or `send()` methods, so that the error or value passed to it are the value
taken by the left side of the yield expression:

<pre><code>
// the value of foo is the value passed as the second parameter
// of task.next()
var foo = yield somePromise;
</code></pre>

This function rewrites itself for all instances of Task the first time it
is called, being replaced by _nextES6 or _nextFF depending on the platform.

@method next
@param {Any} [error] An optional error to pass to the generator function
@param {Any} [value] A value to pass to the generator function
**/
Task.prototype.next = supportsES6Syntax ? function (error, value) {
    var self = this,
        result;

    try {
        // using arguments.length to allow rejections for falsy reasons
        result = arguments.length === 1 ? this.thread.throw(error) :
                this.thread.send(value);
    } catch (e) {
        // error thrown inside the generator function are turned into
        // rejections for the promise that Y.task() returns
        return this.reject(e);
    }

    function accept(value) {
        self.next(null, value);
    }
    
    // ES6 generators return an object that in the last iteration have a
    // "done" property. When done, resolve the promise.
    if (result.done) {
        this.resolve(result.value);
    // Using isPromise and not Y.when() to prevent speedbumps in Node
    // This may be revisited if there is an async behavior we want to keep
    } else if (isPromise(result.value)) {
        result.value.then(accept, function (err) {
            self.next(err);
        });
    } else {
        this.next(null, result.value);
    }
} : function (error, value) {
    var self = this,
        result;

    try {
        // using arguments.length to allow rejections for falsy reasons
        result = arguments.length === 1 ? this.thread.throw(error) :
                this.thread.send(value);
    } catch (e) {
        // Old Firefox iterators throw an exception when done
        if (e instanceof StopIteration) {
            this.resolve(result);
        } else {
            this.reject(e);
        }
        return;
    }

    function accept(value) {
        self.next(null, value);
    }

    // Using isPromise and not Y.when() to prevent speedbumps in Node
    // This may be revisited if there is an async behavior we want to keep
    if (isPromise(result)) {
        result.then(accept, function (err) {
            self.next(err);
        });
    } else {
        accept(result);
    }
};

task.Task = Task;

Y.task = task;
