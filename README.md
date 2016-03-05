# registerBehavior

`registerBehavior` registers a new Web Behavior. Web Behaviors are special attributes which, when added to an HTML element, extend the behavior of this element. They are a complement to Web Components.

At this point, `registerBehavior` is still considered highly experimental.

## Register a behavior

```
registerBehavior.default('toggle-bold', {
    prototype: {
        attachedCallback() {
            this.toggleBold = this.toggleBold.bind(this);
            this.target.addEventListener('click', this.toggleBold);
        },
        detachedCallback() {
            this.target.removeEventListener('click', this.toggleBold);
        },
        toggleBold() {
            this.target.style.fontWeight = (this.target.style.fontWeight === 'bold' ? '' : 'bold');
        }
    }
});
```

The name of a behavior must respect the same rule as for Custom Element names. In summary, it must only contain lower
case letters, numbers, at least 1 hyphen and must start by a letter. See https://www.w3.org/TR/custom-elements/#dfn-custom-element-type.

For a more compact declaration, use a `class`.

```
registerBehavior('toggle-bold', class {
   attachedCallback() {...}
});
```

## Use a behavior

```
<button toggle-bold>Toggle bold</button>
```

## Callbacks

The callback are always triggered asynchronously.

### attachedCallback()

Callback when the behavior's attribute is added to a DOM element, or when an element with a behavior's attribute is
added to the DOM.

### detachedCallback

Callback when the behavior's attribute is removed from a DOM element, or when an element with a behavior's attribute is removed from the DOM.

### attributeChangedCallback(attributeName, oldValue, newValue)

Callback when an attribute changes on the same element on which the behavior is attached.

## Browser support

As `registerBehavior` depends on `MutationObserver`, it will work on every browser that supports it. See [http://caniuse.com/#search=MutationObserver]. If support for older browser is desired, it is possible to use a [polyfill](https://github.com/Polymer/MutationObservers), although it will have performance implication.
