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

`require('fulfill-outgoing-ware')` returns a middleware generator function that takes a settings object. Most importantly you can specify an actions object. Each action in the actions objects specifies a controller that is a javascript function that can return either by callback, promise or even synchronously. The action controller receives the content, attributes, and a context object which it can use as parameters. It can update the context and its return value will replace the tag. If the returned value from an action includes another action, this action will also be evaluated.

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

`context` provides a great deal of control and allows you to pass custom dependencies down to your controllers.
It should not be confused with the `context` variable that your NLU like IBM Conversations uses.

Here's a good setup for context that will allow your actions a great deal of flexibility:

```js
const fullfillContext = {
    chatContext, // specific to your NLU
    apis // configured APIs connector libraries to call in your actions
}
```

### Where did my NLU context go?

In botmaster the fulfill context will also have `context.update` available. To get an NLU's context the update handler or one of the middleware's should have set it in `update`. So for example your context might be in `context.update.context`.

### Getting impatient - emitting updates before fulfill has completed

You might want to "cascade" messages and separate them by one minute pauses. Or you want to let your user know that you are working on it. Whatever your use case, emitting multiple updates is not a problem. In botmaster you will also have available `context.bot.sendMessage` which you can use to send another template response down the pipeline. This will be processed again by fulfill since fulfill is part of the outgoing middleware stack. This is actually advantageous because this way you can be sure that there are no further actions to fulfill from the emitted message.

If you are not using botmaster you can achieve the same thing by including in the context an emitter which should set off a handler that calls fulfill.


## Additional controller configuration options

By default, an action modifies the response text by replacing the xml tag with its response inline. This allows multiple actions in a response to not conflict. Note that this default does not allow you to modify any text surrounding the tag.

Take the following example:
```xml
<optional /> hi how are <you /> today?
```
With the default mode you can only replace the tag. There are however other modes available that allow you to modify surrounding text.

`action.replace`:
1. `= 'before'` Replace the tag and text before the tag until another tag is reached. In the example above setting `you` to this mode will have the controller control up to `hi how are <you />`.
2. `= after` Replace the tag and text after the tag until another tag is reached. In the example above setting `after` to this mode will set the controller to control `<optional /> hi how are you`.
3. `= adjacent` Replace the tag and text before and after the tag until other tags are reached. In the example above setting `you` to this mode will set the controller to control `hi how are <you /> today ?`.
4. `= replaceFunction($, responses)` Under the hood fulfill uses cheerio. You can specify a replace function that receives the cheerio object representing the response and the responses. You should return a plain string that will finally go to sendMessage or downstream outgoing middleware.


# Using botmaster-fulfill

Botmaster-fulfill exports two functions. The first is `fulfill` and implements the fulfill API. The second `outgoing` produces botmaster outgoing middleware. Since botmaster is the preferred integration method let's start with an example of that first:

```js
const {outgoing} = require('botmaster-fulfill');
const Botmaster = require('botmaster');
const botsSettings = require('./my-bots-settings');
const botmaster = new Botmaster({botsSettings});
const actions = {
        hi: {
            controller: () => 'hi there!'
        }
}
botmaster.use('outgoing', outgoing({actions}));
botmaster.on('update', bot => bot.sendMessage('<hi />'));
```

Here we require the necessary dependencies (getting the outgoing function through destructuring), connect our bots to botmaster. Before connecting our middleware we define a simple "hello world" action. We use this as part of the settings we pass to outgoing for it to generate our middleware.

## Additional middleware options

All of these settings are optional and have reasonable defaults.

1. `settings.context` By default `{bot, update}` is passed as the context object which is made available to actions. If you want any other variables available in the context assign them as values in the `settings.object`. `bot` and `update` will still be passed into the fulfill context and will overwrite any `bot` or `update` in your custom context.
2. `settings.updateToInput` By default `update.message.text` is used as the input into response. If this is not acceptable you can define your own function. It will receive an object `{bot, update}` and expect a string response.
3. `settings.responseToUpdate` By default `update.message.text` is replaced with the response from fulfill. To define your own setter define a function that accepts `update` and `response` and modifies the update in place.

# Using standalone without botmaster

```javascript
const {fulfill} = require('botmaster-fulfill');
// the input and context would be from your chatbot, but assume they look like this.
// also assume actions above
var input = "<hi />";
var context = {};
fulfill(actions, context, input, function(err, response)  {
    // response =  'hello world!'
})
```

# Debug

You can enable debug mode by setting `DEBUG = botmaster:fulfill:*` in your environment.
