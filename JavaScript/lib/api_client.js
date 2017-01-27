
function arClient() {

    var DEBUG_MODE = false;

    var client = {};

    var consumerConfiguration =
    {
        consumerKey: ""
        , consumerSecret: ""
        , serviceProvider: {
        signatureMethod: "HMAC-SHA1"
        , host: ""
        , requestTokenURL: "/oauth/request-token"
        , userAuthorizationURL: "/oauth/authorize"
        , accessTokenURL: "/oauth/access-token"
        , echoURL: "/api/echo"
        , analyzeURL: "/post/analyze"
        , postAddURL: "/post/add"
        , getPosts: "/posts"
        , addSourceURL: "/source/add"
        , getAudienceListURL: "/source/get-audience-list"
        , trackWordpressDataURL: "/wordpress/track-data"
        , addDictionaryURL: "/dictionary/add"
        , removeDictionaryURL: "/dictionary/remove"
        , listDictionariesURL: "/dictionary/list"
        , getTokens: "/api/get-tokens"
        , createAccount: "/account/create"
        , addWebsite: "/source/add"
        , addSocialNetwork: "/account/add-social-network"
        , getSocialNetworks: "/account/get-social-networks"
        , removeNetwork: "/account/remove-account"
        , sendFeedback: "/account/feedback"
        , countPostAnalyzeCalls : "/account/count-post-analyze-calls"
        , stats : "/account/stats"
        , getAccountData: "/account/data"
        , listSources: "/source/list"
        , getMostEngagedSegment: "/engagement/get-most-engaged-segment"
        , getAtomicScore: "/account/get-atomic-score"
        , getAvgScore: "/account/avg-score"
        , webProfiles: "/engagement/web-profiles"
        , gaProfiles: "/account/ga-profiles"
        , updateSource: "/source/update"
        , getAudience: "/audience"
        , getInsightsEngagement: "/insights/engagement"
        , getInsightsMeasures: "/insights/measures"
        , getInsightsMeasureDetails: "/insights/measure-details"
        , getAuthors: "/author"
        , postCheckdate: "/post/checkdate"
        , identifyCms: "/api/identify"
        , pageContents: "/source/page-contents"
        , getEmail: "/account/email"
        , analyzeText: "/analyze-text/master"
    }

    };

    // re-using the access token speeds up loading on refresh but it may not be supported by all apps
    var reuseTokenCookie = true;

    var keys;
    var request_resp;
    var interval = 1500;
    var oauth_token;
    var oauth_token_secret;
    var STATUS_OK = 10;
    var INVALID_ACCESS_TOKEN = 21;
    var retriedReAuth = false;
    var clientAppName = "API_JS_Client";

    client.sophisticationBandIdsArray = {
        "Genius":        1,
        "Academic":      2,
        "Specialist":    3,
        "Knowledgeable": 4,
        "General":       5
    };

    function getRequestToken(callback) {
        return doRequest({
                method: 'GET'
                , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.requestTokenURL
                , parameters: {
                    oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                    , oauth_consumer_key: consumerConfiguration.consumerKey
                }
            }
            , {
                consumerSecret: consumerConfiguration.consumerSecret
                , tokenSecret: ''
            }
            , callback
        );
    }

    function getAuthorize(oauth_token, callback) {
        var URL = consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.userAuthorizationURL;
        $.ajax({
            url: URL,
            method: "GET",
            data: {"oauth_token": oauth_token, "oauth_callback": ""},
            crossDomain: true,
            "success": function () {
                callback();
            }
        });
    }

    function getAccessToken(token, secret, callback) {
        return doRequest({
                method: 'GET'
                , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.accessTokenURL
                , parameters: {
                    oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                    , oauth_consumer_key: consumerConfiguration.consumerKey
                    , oauth_token: token
                }
            }
            , {
                consumerSecret: consumerConfiguration.consumerSecret
                , tokenSecret: secret
            }
            , callback
        );

    }

    function doRequest(message, accessor, callback)
    {
        var method = message.method;
        var URL = message.action;

        if(DEBUG_MODE)
            console.log("\nENDPOINT | ", URL);

        var sendObj = message.parameters;
        var requestParams = {};

        if(message.hasOwnProperty("requestData"))
        {
            for(var property in message["requestData"])
            {
                if(message["requestData"].hasOwnProperty(property)) {
                    requestParams[property] = message["requestData"][property];
                    sendObj[property] = message["requestData"][property];
                }
            }
        }

        message.parameters = sendObj;

        // SIGN request
        if (typeof accessor.consumerSecret != 'undefined')
        {
            OAuth.setTimestampAndNonce(message);
            OAuth["SignatureMethod"].sign(message, accessor);

            if(DEBUG_MODE)
                console.log("SIGNED | ", message);
        }

        if(DEBUG_MODE)
            console.log("sendObj: ",sendObj);

        $.ajax({
            url: URL,
            method: method,
            data: sendObj,
            crossDomain: true,
            "success": function (result)
            {
                if(DEBUG_MODE)
                    console.log("RESP: ", result);

                if(result["status"]==INVALID_ACCESS_TOKEN)
                {
                    if(reuseTokenCookie && !retriedReAuth)
                    {
                        if(DEBUG_MODE)
                            console.log("RE_AUTH", message.action, callback);

                        Cookies.remove('oauthToken');
                        retriedReAuth = true;

                        // get new access token
                        setOauth(consumerConfiguration.consumerKey, consumerConfiguration.consumerSecret, callbackRequestRetry);

                        function callbackRequestRetry()
                        {
                            // add new access token and request params / options
                            message.parameters = buildOauthParameter(requestParams);

                            // refresh accessor to validate token
                            accessor = {
                                consumerSecret: consumerConfiguration.consumerSecret,
                                tokenSecret   : oauth_token_secret
                            };

                            doRequest(message, accessor, callback);
                        }

                    }
                }
                else
                {
                    //if(DEBUG_MODE)
                        //console.log("RESP: ", result);

                    if (typeof callback == 'function') {
                        callback(result);
                    }
                }
            },
            "error": function (result) {
                console.error("!!!!!!ERROR!!!!!!!!!:", result);
                if (typeof callback == 'function') {
                    callback(result);
                }

            },
            "async": true,
            timeout: 45000 // sets timeout to 45 seconds
        })
    }

    function getTokens(username, password, onSuccessCallbackFunc, onErrorCallbackFunc) {
        doRequest({
                method: 'POST'
                , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getTokens
                , parameters: {
                    'username': encodeURIComponent(username)
                    , 'password': encodeURIComponent(md5(password))
                }
            }
            , {}
            , function (value) {
                if (value.status != STATUS_OK) {
                    console.log("getTokens() | ERROR: ", value);
                } else {

                    if(DEBUG_MODE)
                        console.log(value.data);

                    keys = value.data;
                    setOauth(keys["consumer_key"], keys["consumer_secret"], onSuccessCallbackFunc, onErrorCallbackFunc);
                }
            }
        );
    }


    client.identifyCms = function(cmsUrl, callback) {
        var tokenCheck = setInterval(function() {
            if(tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest( { method: 'GET'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.identifyCms
                        , parameters: buildOauthParameter({'url':cmsUrl})
                    }
                    , { consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret   : oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    };


    client.verifyGoogleId = function (googleId) {
        //getTokens("","",googleId);

        doRequest({
                method: 'POST'
                , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getTokens
                , parameters: {
                    'username': ''
                    , 'password': ''
                    , 'google_id': googleId
                }
            }
            , {}
            , function (value) {
                if (value.status != STATUS_OK) {
                    console.log(value);
                } else {

                    if(DEBUG_MODE)
                        console.log(value.data);

                    keys = value.data;
                    setOauth(keys["consumer_key"], keys["consumer_secret"]);
                }
            }
        );


    };

    client.init = function (apiHost, consumerKey, consumerSecret, onSuccessCallbackFunc, onErrorCallbackFunc, username, password)
    {
        var doGetToken = true;
        oauth_token = "BOOTING";
        consumerConfiguration.serviceProvider.host = apiHost;

        // if username and pass
        if(typeof username!=='undefined')
        {
            getTokens(username, password, onSuccessCallbackFunc, onErrorCallbackFunc);
            doGetToken = false;
        }
        else if(reuseTokenCookie)
        {
            // try to read from cookie
            var token = Cookies.getJSON('oauthToken');

            if(DEBUG_MODE)
                console.log("Try | Re-use token [cookie]: ", token);

            if(typeof token!='undefined')
            {

                consumerConfiguration.consumerKey = consumerKey;
                consumerConfiguration.consumerSecret = consumerSecret;
                oauth_token = token["oauthToken"];
                oauth_token_secret = token["tokenSecret"];
                if(tokenReady())
                {
                    if(DEBUG_MODE)
                        console.log("\nACTIVE-A token | "+oauth_token);

                    doGetToken = false;
                    onSuccessCallbackFunc();
                }
            }
        }

        if(doGetToken)
            setOauth(consumerKey, consumerSecret, onSuccessCallbackFunc, onErrorCallbackFunc);

    };

    client.initV2 = function (consumerKey, consumerSecret, onSuccessCallbackFunc)
    {
        oauth_token = "BOOTING";
        setOauth(consumerKey, consumerSecret, onSuccessCallbackFunc);
    };

    function setOauth(consumerKey, consumerSecret, onSuccessCallbackFunc, onErrorCallbackFunc, p1, p2, p3) {
        consumerConfiguration.consumerKey = consumerKey;
        consumerConfiguration.consumerSecret = consumerSecret;
        getRequestToken(function (aux) {
            if (typeof aux.responseText != "undefined") {
                if(typeof onErrorCallbackFunc!='undefined')
                    onErrorCallbackFunc(aux);
                else
                    console.log(aux.responseText);
            }
            else {
                request_resp = getJsonFromUrl(aux);
                getAuthorize(request_resp["oauth_token"],
                    function () {
                        getAccessToken(request_resp["oauth_token"], request_resp["oauth_token_secret"],
                            function (aux2) {
                                var access_resp = getJsonFromUrl(aux2);
                                /////////////////////////////////////////
                                oauth_token = access_resp["oauth_token"];
                                oauth_token_secret = access_resp["oauth_token_secret"];

                                if(DEBUG_MODE)
                                    console.log("\nACTIVE-B token | "+oauth_token);

                                // save to cookie for re-use
                                if(reuseTokenCookie)
                                {
                                    var token = {oauthToken: oauth_token, tokenSecret: oauth_token_secret};

                                    if(DEBUG_MODE)
                                        console.log("Saving token [cookie]: ", token);

                                    Cookies.set('oauthToken', token, { expires: 1 });
                                }

                                if(typeof onSuccessCallbackFunc!='undefined')
                                    onSuccessCallbackFunc(p1, p2, p3);
                            });
                    }
                );
            }
        });
    }

    client.getEcho = function (msg, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.echoURL
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , echo: encodeURIComponent(msg)
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    };

    client.addPost = function (text, teaser, sourceId, segmentId, title, pubDate, url, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.postAddURL
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , text: encodeURIComponent(text)
                            , teaser: encodeURIComponent(teaser)
                            , sourceId: encodeURIComponent(sourceId)
                            , segmentId: encodeURIComponent(segmentId)
                            , title: encodeURIComponent(title)
                            , pubDate: encodeURIComponent(pubDate)
                            , url: encodeURIComponent(url)
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    };

    client.analyzePost = function (content, title, sophisticationBandId, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.analyzeURL
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , content: encodeURIComponent(content)
                            , title: encodeURIComponent(title)
                            , sophisticationBandId: encodeURIComponent(sophisticationBandId)
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);

        if (window.location.href == "http://atomictrainer.atomicreach.com/"){

            if(DEBUG_MODE)
                console.log("atomicTrainer!");

            setTimeout(function(){
                //$('body').load(chrome.extension.getURL("src/options/Editor.html"),function(){});
                //$("#edit").click(function(){
                $('body').find("#edit").trigger("click");
            },15000);


        }
    };

    client.countPostAnalyzeCalls = function (callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.countPostAnalyzeCalls
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    };

    client.checkdate = function (date, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.postCheckdate
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , date: encodeURIComponent(date)
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    };


    client.stats = function (callback) {
               var tokenCheck = setInterval(function () {
                        if (tokenReady()) {
                               clearInterval(tokenCheck);
                                return doRequest({
                                        method: 'POST'
                                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.stats
                                        , parameters: {
                                               oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                                                , oauth_consumer_key: consumerConfiguration.consumerKey
                                                , oauth_token: oauth_token
                                            }
                                    }
                                , {
                                   consumerSecret: consumerConfiguration.consumerSecret
                                   , tokenSecret: oauth_token_secret
                                }
                            , callback
                       );
                    }
            }, interval);
    };

    client.addSource = function (title, segmentDataJson, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.addSourceURL
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , title: encodeURIComponent(title)
                            , segmentDataJson: encodeURIComponent(segmentDataJson)
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    };
    client.updateSource = function (sourceId, options, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);

                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.updateSource
                        , parameters: $.extend({}
                            , options
                            , {
                                oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                                , oauth_consumer_key: consumerConfiguration.consumerKey
                                , oauth_token: oauth_token
                                , sourceId: encodeURIComponent(sourceId)
                            })
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    };

    client.pageContents = function (url, js, async, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);

                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.pageContents
                    , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , url: encodeURIComponent(url)
                            , js: encodeURIComponent(js)
                            , async: encodeURIComponent(async)
                        }
                }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );

            }
        }, interval);
    };


    client.getAudienceList = function (callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getAudienceListURL
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    };

    client.trackWordpressData = function (data, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.trackWordpressDataURL
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , data: data
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    };

    client.addDictionary = function (word, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.addDictionaryURL
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , word: encodeURIComponent(word)
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    };

    client.removeDictionary = function (word, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.removeDictionaryURL
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , word: encodeURIComponent(word)
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    };

    client.listDictionaries = function (callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.listDictionariesURL
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , data: encodeURIComponent("")
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    };

    client.setApiHost = function (apiHost) {
        consumerConfiguration.serviceProvider.host = apiHost;
    };

    client.getOauthTokens = function () {
        return {
            consumerKey: consumerConfiguration.consumerKey,
            consumerSecret: consumerConfiguration.consumerSecret
        };
    };

    client.getAccountData = function(callback) {
        var tokenCheck = setInterval(function() {
            if(tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest( { method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getAccountData
                        , parameters: buildOauthParameter()
                    }
                    , { consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret   : oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    };

    client.createAccount = function (email, password, receive_newsletters, receive_product_updates, google_id, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.createAccount
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , email: email
                            , password: password
                            , receive_newsletters: typeof receive_newsletters == 'undefined' ? 0 : 1
                            , receive_product_updates: typeof receive_product_updates == 'undefined' ? 0 : 1
                            , google_id: typeof google_id == 'undefined' ? null : google_id
                            , data: encodeURIComponent("")
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                    //}else{
                    //, callback
                    //}

                );
            }
        }, interval);

    };
    client.addWebsite = function (url, sophisticationBandId, articleSelector, titleSelector, contentSelector, options, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);

                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.addWebsite
                        , parameters: $.extend({}, options, {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , url: encodeURIComponent(url)
                            , sophisticationBandId: encodeURIComponent(sophisticationBandId)
                            , articleSelector: encodeURIComponent(articleSelector)
                            , titleSelector: encodeURIComponent(titleSelector)
                            , contentSelector: encodeURIComponent(contentSelector)
                        })
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    };

    client.listSources = function (callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.listSources
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , data: encodeURIComponent("")
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    };

    client.getMostEngagedSegment = function (callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getMostEngagedSegment
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , data: encodeURIComponent("")
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    };

    client.webProfiles = function (callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.webProfiles
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , data: encodeURIComponent("")
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    };


    client.getAtomicScore = function (callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getAtomicScore
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , data: encodeURIComponent("")
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    };

    client.getAvgScore = function (callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getAvgScore
                        , parameters: buildOauthParameter({})
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    };


    client.getSocialNetworks = function (callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getSocialNetworks
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    };
    client.gaProfiles = function (callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                //alert(consumerConfiguration.serviceProvider.gaProfiles);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.gaProfiles
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , data: encodeURIComponent("")
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    };

    client.addSocialNetwork = function (network_code) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.addSocialNetwork
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , networkCode: network_code
                            , data: encodeURIComponent("")
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , function (value) {
                        console.log(value);
                        window.open(value["login"], "auth", "width=500, height=500");
                    }
                );
            }
        }, interval);
    };

    client.removeNetwork = function (username, code, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.removeNetwork
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , userName: encodeURIComponent(username)
                            , networkCode: encodeURIComponent(code)
                            , data: encodeURIComponent("")
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback);
            }
        }, interval);

    };

    client.sendFeedback = function (feedback, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.sendFeedback
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , feedback: encodeURIComponent(feedback)
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback);
            }
        }, interval);

    };


    client.sendFeedback = function (feedback, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.sendFeedback
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , feedback: encodeURIComponent(feedback)
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback);
            }
        }, interval);

    };


    client.getPosts = function (options, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'GET'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getPosts
                        , parameters: buildOauthParameter(options)
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    };


    client.getInsightsMeasures = function (options, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'GET'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getInsightsMeasures
                        , parameters: buildOauthParameter(options)
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    };

    client.getInsightsEngagement = function (options, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'GET'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getInsightsEngagement
                        , parameters: buildOauthParameter(options)
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    };


    client.getInsightsMeasureDetails = function (measure, state, options, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'GET'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getInsightsMeasureDetails
                        , parameters: $.extend({}
                            , options
                            , {
                                oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                                , oauth_consumer_key: consumerConfiguration.consumerKey
                                , oauth_token: oauth_token
                                , measure: encodeURIComponent(measure)
                                , state: encodeURIComponent(state)
                            })
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    };


    client.getAudience = function (options, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'GET'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getAudience
                        , parameters: buildOauthParameter(options)
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    };

    client.getAuthors = function(sourceId, callback) {
        var tokenCheck = setInterval(function() {
            if(tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest( { method: 'GET'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getAuthors
                        , parameters: buildOauthParameter(sourceId)
                    }
                    , { consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret   : oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    };

    client.getEmail = function(callback) {
        var tokenCheck = setInterval(function() {
            if(tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest( { method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getEmail
                        , parameters: buildOauthParameter()
                    }
                    , { consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret   : oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    
    };

    client.analyzeText = function(requestData, callback)
    {
        if(typeof requestData["sophisticationBandId"]=='undefined')
            requestData["sophisticationBandId"] = client.sophisticationBandIdsArray["Knowledgeable"];

        if(typeof requestData["serviceNamesArray"]=='object')
            requestData["serviceNamesArray"] = JSON.stringify(requestData["serviceNamesArray"]);

        return client.doApiCall(consumerConfiguration.serviceProvider.analyzeText, requestData, callback);
    };

    client.doApiCall = function(endPoint, requestData, callback, doEncodeURIComponent)
    {
        var tokenCheck = setInterval(function()
        {
            if(tokenReady())
            {
                clearInterval(tokenCheck);

                if(typeof doEncodeURIComponent=='undefined')
                    doEncodeURIComponent = true;

                var params = {};

                if(doEncodeURIComponent==false)
                    params = requestData;
                else
                {
                    for(var property in requestData)
                    {
                        if (requestData.hasOwnProperty(property)) {
                            params[property] = encodeURIComponent(requestData[property]);
                        }
                    }
                }

                return doRequest( { method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + endPoint
                        , parameters: buildOauthParameter()
                        , requestData: params
                    }
                    , { consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret   : oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    };

    client.setDelayInterval = function(newInterval) {
        interval = newInterval;
    };

    client.setAppName = function(newAppName) {
        clientAppName = newAppName;
    };

    client.setDebugMode = function(bool) {
        DEBUG_MODE = bool;
    };

    function buildOauthParameter(options)
    {
        var ret = {
            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod,
            oauth_consumer_key: consumerConfiguration.consumerKey,
            oauth_token: oauth_token,
            app_name: clientAppName,
            data: encodeURIComponent("")
        };

        for(var property in options)
        {
            if(options.hasOwnProperty(property)) {
                ret[property] = options[property];
            }
        }

        //console.log("buildOauthParameter()", ret);

        return ret;
    }

    function tokenReady() {
        var r = false;
        if (oauth_token != "BOOTING" && oauth_token != "") r = true;

        return r;
    }

    function getJsonFromUrl(query) {
        var data = query.split("&");
        var result = {};
        for (var i = 0; i < data.length; i++) {
            var item = data[i].split("=");
            result[item[0]] = item[1];
        }
        return result;
    }

    return client;
}