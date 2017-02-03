# Botmaster fulfill

Battle-tested middleware for botmaster <https://botmasterai.github.io/>).

Enable chatbots to perform actions on Node.js.

Find the documentation at the main botmaster website: <https://botmasterai.github.io/official-middleware/fulfill/>

## API Reference

### fulfill

Fulfill any actions found in the input text

**Parameters**

-   `actions` **Object** actions to run
-   `context` **Object** an object of aditional properties to expost though `params`
-   `input` **String** the string to look for actions in
-   `tree` **[Array]** provided as a way to speed up recursion. You probably don't need to use this.
-   `cb` **Function** error first callback

### FulfillWare

Generate outgoing middleware for fulfill

**Parameters**

-   `options.actions` **Object** the actions to use
-   `options.updateToContext` **Object** optional, a function that receives the botmaster {bot, update} and turns into the fulfill context
-   `options.updateToResponse` **Object** optional, a function that receives the botmaster (bot, update} and turns into the fulfill response
-   `options`  

Returns **function** outgoing middleware

### isPendingActions

Test for remaining actions in a string

**Parameters**

-   `string` **String** input string to test for actions
-   `actions` **Object** actions to test for

Returns **Boolean** whether any actions were found
