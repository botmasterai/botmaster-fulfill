# Markup for your chatbot.
```html
 Chabot: "Let me see if I can place your order, <pause /> <placeOrder id=12 />"
 ```

You just built a chatbot. Its funny, and it says useful stuff. But how do you get it to do something?

```html
Shaquille O'Neal: Little man, I ordered tomatoes on this Good Burger, and I don't see no tomatoes!

Ed: Well, hang on... <modifyOrder style='slap'>Tomatoes</modifyOrder>
```
_Good Burger, Brian Robbins (1997)_

Fulfill makes this easy with declarative markup that is easy to understand for non-technical chat authors and is easy to integrate into your current botmaster stack.

# How to use the fulfill API

`require('fulfill-outgoing-ware')` takes an array of strings as well as a list of actions and executes them. An action specifies a controller that is a javascript function that can return either by callback, promise or even synchronously. The action controller receives the content, attributes, and a context object which it can use as parameters. It can update the context and its return value will replace the tag. If the returned value from an action includes another action, this action will also be evaluated.

You get back an updated array of strings and an updated context.

# Action Format

You should provide an `actions` object where the key is the name of the xml element that will be matched. The value should specify another object that has the key `controller` which as a value should have a function that takes `params` and an optional callback.

```javascript
actions = {
  raiseSkull: {
    controller: function(params) {
      params.context.monolog = true;
      return "<img url='myLongSkullImageUrl.jpg'>";
    }
  }, modifyOrder: {
    controller: function(params, cb) {
      myOrderAPI.modify(params.context.orderId, params.content, params.attributes.style, function(err) {
        if (! err) {
          cb(null, "There, consider yourself tomatoed!");
        } else {
          cb(null, "Sorry I can't modify your order now. Please check again later")
        }
        });
    }
  }, hi: {
    controller: function(params) {
        return new Promise(function(resolve, reject) {
          resolve("hello world");
        });
    }
  }
};
```

## More info on params:

Params argument provides several variables that can control its behavior.

* `params.context`: a reference to the context object which can be updated or read
* `params.content`: the literal text between the xml element opening and closing
* `params.attributes`: an object where keys are the name of an attribute against the xml element and the the value is the value of that attribute.

### Suggested context setup:

TODO

`context` provides a great deal of control and allows you to pass custom dependencies down to your controllers.
It should not be confused with the `context` variable that your NLU like IBM Conversations uses.

Here's a good setup for context that will allow your actions a great deal of flexibility:

```js
const fullfillContext = {
    chatContext: myNLUContext, // specific to your NLU
    next: // send a message indepentanlly down the pipeline
}
```

## Additional controller configuration options

By default, an action modifies the response text by replacing the xml tag with its response inline. This allows multiple actions in a response to not conflict.

There are however other modes available.

`action.replace`:
1. `= 'first'` The whole response text is replaced by the first response of the action. This is useful to condition a response on exception checking.
2. `= last` Pretty much the same as with the first, except the last response from any of the evaluated actions tags is used to replace the response.
3. `= join` Replace the response by joining the output of all the action outputs.
4. `= replaceFunction($, responses)` Under the hood fulfill uses cheerio. You can specify a replace function that receives the cheerio object representing the response and the responses. You should return a plain string that will finally go to sendMessage or downstream outgoing middleware.


# Using Fulfill

```javascript
const fulfill = require('cogpipeline-fulfill');
// the input and context would be from your chatbot, but assume they look like this.
// also assume actions above
var input = ["<hi />"];
var context = {};
fulfill(actions, context, input, function(err, response)  {
    // response = [ 'hello world!']
})
```

# Examples

There is an example in the examples folder. You can run it with `npm run start`. There are also more examples in the tests. (Template-spec has single string examples.)

# FAQs

> Is there a limit to the number of times a string is evaluated for actions?

Yes, to avoid infinite loops leading to a runtime overflow because of what is likely a bug in an action controller, the maximum number of times that an action will be evaluated has been set to 100.

> Why the long name prepended by cogpipeline?

 Well, there are some other steps that we think make up part of a pipeline for chatbots, or cognitive (AI) stuff in general. If we can release those, then fulfill will be one function of several that you can chain.
