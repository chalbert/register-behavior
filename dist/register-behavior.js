(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports);
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports);
        global.registerBehavior = mod.exports;
    }
})(this, function (exports) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.default = registerBehavior;
    var observing = false;
    var behaviors = Object.create(null);
    var behaviorsKey = Symbol('behaviors');

    function init() {
        observing = true;
        addBehaviorOnTree(document);
        observe();
    }

    function addBehaviorOnTree(tree) {
        for (var behavior in behaviors) {
            var elements = tree.querySelectorAll('[' + behavior + ']');
            for (var n = 0, l = elements.length; n < l; n++) {
                addBehavior(elements[n], behaviors[behavior]);
            }
        }
    }

    function addBehavior(element, behavior) {
        // Only add is not already there
        if (!element[behaviorsKey] || !element[behaviorsKey][behavior.type]) {
            var behaviorInstance = Object.create(behavior);
            behaviorInstance.target = element;

            element[behaviorsKey] = element[behaviorsKey] || Object.create(null);
            element[behaviorsKey][behavior.type] = behaviorInstance;

            if (behaviorInstance.attachedCallback) {
                behaviorInstance.attachedCallback();
            }
        }
    }

    function removeBehavior(element, behavior) {
        var targetBehaviors = element[behaviorsKey];
        var behaviorInstance = targetBehaviors[behavior.type];

        if (behaviorInstance.detachedCallback) {
            behaviorInstance.detachedCallback();
            delete targetBehaviors[behavior.type];
        }
    }

    function observe() {
        new MutationObserver(function (mutations) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = mutations[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var mutation = _step.value;

                    var behavior = behaviors[mutation.attributeName];
                    if (behavior) {
                        if (mutation.target.attributes[mutation.attributeName]) {
                            addBehavior(mutation.target, behavior);
                        } else {
                            removeBehavior(mutation.target, behavior);
                        }
                    }

                    // Notify each behaviors of attribute change, include attributes from other behaviors
                    var targetBehaviors = mutation.target[behaviorsKey];
                    if (targetBehaviors) {
                        for (var behaviorName in targetBehaviors) {
                            if (behaviorName !== mutation.attributeName) {
                                var behaviorInstance = targetBehaviors[behaviorName];
                                if (behaviorInstance.attributeChangedCallback) {
                                    var attr = mutation.target.attributes[mutation.attributeName];
                                    var value = attr ? attr.value : null;

                                    if (value !== mutation.oldValue) {
                                        behaviorInstance.attributeChangedCallback(mutation.attributeName, mutation.oldValue, value);
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        }).observe(document.body, {
            subtree: true,
            attributes: true,
            attributeOldValue: true
        });

        new MutationObserver(function (mutations) {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = mutations[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var mutation = _step2.value;

                    var behavior = behaviors[mutation.attributeName];
                    addBehaviorOnTree(mutation.target, behavior);
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }
        }).observe(document.body, {
            childList: true
        });
    }

    function validate(attributeName) {
        if (!attributeName.match(/^[a-z][a-z0-9]*\-[a-z0-9\-]+$/)) {
            throw new DOMException('Failed to execute \'registerBehavior\' on \'Document\': Registration failed for type\n        \'' + attributeName + '\'. The type name is invalid.');
        }

        if (behaviors[attributeName]) {
            throw new DOMException('Failed to execute \'registerBehavior\' on \'Document\': Registration failed for type\n        \'' + attributeName + '\'. A type with that name is already registered.');
        }
    }

    function execute(attributeName, options) {
        validate(attributeName);
        behaviors[attributeName] = options.prototype;
        behaviors[attributeName].type = attributeName;
    }

    function registerBehavior(attributeName, options) {
        if (document.body) {
            init();
        } else {
            addEventListener('DOMContentLoaded', init);
        }

        // The init only applies when the first behavior is defined; no point checking again.
        document.registerBehavior = execute;
        execute(attributeName, options);
    }

    function registerBehavior(attributeName, options) {
        attributeName = attributeName.toLowerCase();

        if (!observing) {
            if (document.body) {
                init();
            } else {
                addEventListener('DOMContentLoaded', init);
            }
        }

        execute(attributeName, options);
    };
});
