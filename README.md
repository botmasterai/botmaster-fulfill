[![Build Status](https://travis-ci.org/botmasterai/botmaster-fulfill.svg?branch=master)](https://travis-ci.org/botmasterai/botmaster-fulfill)
[![Coverage Status](https://coveralls.io/repos/github/botmasterai/botmaster-fulfill-actions/badge.svg?branch=master)](https://coveralls.io/github/botmasterai/botmaster-fulfill-actions?branch=master)

# Botmaster fulfill

Battle-tested middleware for botmaster <https://botmasterai.github.io/>).

Now updated to handle malformed tags! This is a breaking change since it requires negative look-behind in nodejs, so only nodejs > 9 is supported. You can get it at 

Enable chatbots to perform actions on Node.js.

Developers write "action specs" that specify how an XML tag should be replaced in a chatbot response, such as confirming that the action was performed simply returning an empty string so that the tag is removed.

Chatbot designers then place the XML tags in their flows for easy integration.

<!--
Find the full documentation at the main botmaster website: <http://botmasterai.com/middlewares/fulfill/>
-->

Also check out our pre-made actions:

| Actions         | Repository                                                                            |
| --------------- | ------------------------------------------------------------------------------------- |
| pause, greet    | [botmaster-fulfill-actions](https://github.com/botmasterai/botmaster-fulfill-actions) |
| button, buttons | [botmaster-button](https://github.com/botmasterai/botmaster-button)                   |

## Quick start

```js
// 1. Import botmaster and setup your bots, for example telegram
const Botmaster = require('botmaster');
const Telegram = require('botmaster-telegram');
const telegramSettings = require('./my-telegram-bots-settings');
const botmaster = new Botmaster();
const telegramBot = new TelegramBot(telegramSettings);
botmaster.addBot(TelegramBot);

// 2. set up any incoming middleware that you might need

// 3. at the end set up fulfill outgoing ware...
const {fulfillOutgoingWare} = require('botmaster-fulfill');
const actions = {
        hi: {
            controller: () => 'hi there!'
        },
        bye: {
            controller: () => 'bye please come again'
        }
}
botmaster.use(fulfillOutgoingWare({actions}));

// Profit. Any messages that telegram bot sends will be processed by fulfill
telegramBot.sendTextMessageTo('<hi />', 1234);
telegramBot.sendTextMessageTo('<bye />', 1234);
```

## API Reference

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### isPendingActions

Test for remaining actions in a string

**Parameters**

-   `string` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** input string to test for actions
-   `actions` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** actions to test for

Returns **[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** whether any actions were found

### fulfill

Fulfill any actions found in the input text

**Parameters**

-   `actions` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** actions to run
-   `context` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** an object of aditional properties to expost though `params`
-   `input` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the string to look for actions in
-   `tree` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)?** provided as a way to speed up recursion. You probably don't need to use this and providing it without fulfillPromise (or vice versa) will cause an error.
-   `fulfillPromise` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)?** Used to let controllers know that fulfill has completed (or hit an error) even though this is a recursed function. You probably don't need to use this.
-   `cb` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** error first callback

### defaultInput

Default function to extraxt input for fulfill from botmaster context. Uses simply message.message.text. If it does not exist then fulfill does not run.

**Parameters**

-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** context object consisting of botmaster objects and next
    -   `$0.message` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** the botmaster message

### defaultResponse

Default function to update botmaster middleware context with fulfill response and call next. It only sets message.message.text if the response is a non empty string after trimming. Otherwise it calls next with "cancels" which cancels  the outgoing message.

**Parameters**

-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** context object consisting of botmaster objects, fulfill response, and next
    -   `$0.message` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** botmaster message
    -   `$0.response` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** respopnse from fulfill
    -   `$0.next` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** next function from botmaster outgoing middleware

### FulfillWare

Generate outgoing middleware for fulfill

**Parameters**

-   `options` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** options
    -   `options.actions` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** the actions to use
    -   `options.inputTransformer` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)?** a function that receives {bot, message, update} and returns the fulfill input or a falsy value to skip running fulfill.
    -   `options.reponseTransformer` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)?** a function that receives ({bot, message, update, response, next}) updates the message and calls next.
    -   `options.params` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)?** an object of additional names to provide in params.

Returns **[function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** outgoing middleware
