## Local Setup
Dependencies:

* [Node JS](http://nodejs.org/)
* Bower (`npm install bower`) (`npm` comes with node)

Setup:

1. Clone this repo
2. Edit `frontend/assets/config.js`, adding your Catalyze v2 and [medl.io](http://medl.io) API keys).
3. Install Bower and node dependencies via command line:
    
    ```
    $ bower install
    $ npm install
    ```
4. Start the node server:
    
    ```
    $ node backend/app.js
    ```
5. Navigate your browser to [http://localhost:8000/](http://localhost:8000/).

(the node dependency is needed because some browsers have security policies that don't allow `file:/` URLs to access cross-origin resources - if your browser doesn't, or you change that policy in your browser, you can stop after `bower install`)

