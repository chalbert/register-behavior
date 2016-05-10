let observing = false;
const behaviors = Object.create(null);
const behaviorsKey = Symbol('behaviors');

function init() {
    observing = true;
    addBehaviorsOnTree(document);
    observe();
}

function addBehaviorsOnTree(tree) {
    const treeWalker = document.createTreeWalker(tree, NodeFilter.SHOW_ELEMENT);
    while(treeWalker.nextNode()) {
        // @todo may be more efficient to loop through attributes
        for (let behavior in behaviors) {
            if (treeWalker.currentNode.hasAttribute(behaviors[behavior].prototype.type)) {
                addBehavior(treeWalker.currentNode, behaviors[behavior]);
            }
        }
    }
}

function addBehavior(element, behavior) {
    // Only add is not already there
    if (!element[behaviorsKey] || !element[behaviorsKey][behavior.prototype.type]) {
        const behaviorInstance = new behavior();
        behaviorInstance.target = element;

        element[behaviorsKey] = element[behaviorsKey] || Object.create(null);
        element[behaviorsKey][behavior.prototype.type] = behaviorInstance;

        if (behaviorInstance.attachedCallback) {
            behaviorInstance.attachedCallback();
        }
    }
}

function removeBehavior(element, behavior) {
    const targetBehaviors = element[behaviorsKey];
    const behaviorInstance = targetBehaviors[behavior.prototype.type];

    if (behaviorInstance.detachedCallback) {
        behaviorInstance.detachedCallback();
        delete targetBehaviors[behavior.prototype.type];
    }
}

function observe() {
    new MutationObserver((mutations) => {
        for (let mutation of mutations) {
            const behavior = behaviors[mutation.attributeName];
            if (behavior) {
                if (mutation.target.attributes[mutation.attributeName]) {
                    addBehavior(mutation.target, behavior);
                } else {
                    removeBehavior(mutation.target, behavior);
                }
            }

            // Notify each behaviors of attribute change, include attributes from other behaviors
            const targetBehaviors = mutation.target[behaviorsKey];
            if (targetBehaviors) {
                for (let behaviorName in targetBehaviors) {
                    if (behaviorName !== mutation.attributeName) {
                        const behaviorInstance = targetBehaviors[behaviorName];
                        if (behaviorInstance.attributeChangedCallback) {
                            const attr = mutation.target.attributes[mutation.attributeName];
                            const value = attr ? attr.value : null;

                            if (value !== mutation.oldValue) {
                                behaviorInstance.attributeChangedCallback(
                                    mutation.attributeName,
                                    mutation.oldValue,
                                    value
                                );
                            }

                        }
                    }
                }
            }
        }
    }).observe(document.body, {
        subtree: true,
        attributes: true,
        attributeOldValue: true
    });

    new MutationObserver((mutations) => {
        for (let mutation of mutations) {
            // @todo Performance-test other approaches, e.g. tree walker. May depend on number of behaviors / depth
            // of tree
            addBehaviorsOnTree(mutation.target);
        }
    }).observe(document.body, {
        subtree: true,
        childList: true
    });
}

function validate(attributeName) {
    if (!attributeName.includes('-')) {
        throw new DOMException(`Failed to execute 'registerBehavior' on 'Document': Registration failed for type
        '${attributeName}'. The type name is invalid.`)
    }

    if (behaviors[attributeName]) {
        throw new DOMException(`Failed to execute 'registerBehavior' on 'Document': Registration failed for type
        '${attributeName}'. A type with that name is already registered.`);
    }
}

function execute(attributeName, options) {
    validate(attributeName);
    behaviors[attributeName] = class {};
    behaviors[attributeName].prototype = options.prototype;
    // @todo make immutable
    behaviors[attributeName].prototype.type = attributeName;
    return behaviors[attributeName];
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

export default function registerBehavior(attributeName, options) {
    if (!observing) {
        if (document.body) {
            init();
        } else {
            addEventListener('DOMContentLoaded', init);
        }        
    }

    return execute(attributeName, options);
};
