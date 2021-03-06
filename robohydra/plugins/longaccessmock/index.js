var heads               = require('robohydra').heads,
    RoboHydraHead       = require("robohydra").heads.RoboHydraHead,
    RoboHydraHeadStatic = heads.RoboHydraHeadStatic,
    token               = require('./tokens.js').token,
    apiPrefix           = "/path/to/api";

exports.getBodyParts = function(config, modules) {
    function mockupload() {
        return { id: 1,
            resource_uri: '/path/to/upload/1',
            token_access_key: '123123',
            token_secret_key: '123123',
            token_session: '123123',
            token_uid: '123123',
            bucket: 'foobucket',
            prefix: 'foobar',
            status: 'pending',
        }
    }
    function meta(n){
        return {
            limit: 20,
            next: null,
            offset: 0,
            previous: null,
            total_count: n
        }
    }
    return {
        heads: [
            new RoboHydraHeadStatic({
                path: apiPrefix + '/',
                content: {
                    capsule: {
                        list_endpoint: apiPrefix + "/capsule/",
                        schema: apiPrefix + "/capsule/schema/"
                    },
                    upload: {
                        list_endpoint: apiPrefix + "/upload/",
                        schema: apiPrefix + "/upload/schema/"
                    },
                    account: {
                        list_endpoint: apiPrefix + "/account/",
                        schema: apiPrefix + "/account/schema/"
                    }
                }
            }),
            new RoboHydraHeadStatic({
                path: apiPrefix + '/capsule/',
                content: {
                    meta: meta(0),
                    objects: []
                }
            }),
            new RoboHydraHead({
                path: apiPrefix + '/upload/',
                handler: function(req, res, next) {
                    modules.assert.equal(req.method, "POST", "Upload resource supports only POST")
                    modules.assert.ok("content-type" in req.headers, "client didn't send content-type")
                    modules.assert.equal(req.headers['content-type'], 'application/json')
                    content = JSON.parse(req.rawBody)
                    modules.assert.ok("title" in content)
                    modules.assert.ok("description" in content)
                    modules.assert.ok("capsule" in content)
                    modules.assert.ok("size" in content)
                    res.statusCode='200';
                    var ret = mockupload();
                    date = new Date();
                    date.setTime(date.getTime()+(60*60*1000));
                    ret['token_expiration'] = date.toISOString();
                    if (res.hasOwnProperty('token')) {
                        for (var attr in res.token) { 
                            ret[attr] = res.token[attr]; 

                        }
                    }
                    res.write(JSON.stringify(ret));
                    res.end(); 
                }
            }),
            new RoboHydraHead({
                path: apiPrefix + '/upload/1',
                handler: function(req, res, next) {
                    if (req.method == "PATCH") {
                        content = JSON.parse(req.rawBody)
                        modules.assert.ok("status" in content)
                    }
                    res.statusCode='200';
                    var ret = mockupload();
                    date = new Date();
                    date.setTime(date.getTime()+(60*60*1000));
                    ret['token_expiration'] = date.toISOString();
                    if (res.hasOwnProperty('token')) {
                        for (var attr in res.token) { 
                            ret[attr] = res.token[attr]; 

                        }
                    }
                    if (res.hasOwnProperty('upload_status'))
                        ret['status'] = res.upload_status;
                        if (res.upload_status == 'completed')
                            ret['archive_key'] = 'https://longaccess.com/yoyoyo';

                    res.write(JSON.stringify(ret));
                    res.end(); 
                }
            }),
            new RoboHydraHead({
                path: apiPrefix + '/account/',
                handler: function(req, res, next) {
                    ret = {displayname: '', email: ''}
                    if (res.hasOwnProperty('authuser_name'))
                        ret['email'] = res.authuser_name;
                    modules.assert.ok(res.hasOwnProperty('authuser_name'),
                        "client asked for account without providing username")
                    res.write(JSON.stringify(ret));
                    res.end();
                }
            })
        ],
        scenarios: {
            uploadError: {
                instructions: "Init an upload and then check it's status. it will be 'error'",
                heads: [
                    new RoboHydraHead({
                        path: apiPrefix + '/upload/1',
                        handler: function(req, res, next) {
                            res.upload_status = 'error';
                            next(req, res);
                        }
                    })
                ]
            },
            uploadComplete: {
                instructions: "Init an upload and then check it's status. it will be 'complete'",
                heads: [
                    new RoboHydraHead({
                        path: apiPrefix + '/upload/1',
                        handler: function(req, res, next) {
                            res.upload_status = 'completed';
                            next(req, res);
                        }
                    })
                ]
            },
            serverProblems: {
                instructions: "Try to upload a file. The client should show some error messaging stating the server couldn't fulfill the request or the API wasn't available",
                heads: [
                    new RoboHydraHead({
                        path: '/.*',
                        handler: function(req, res) {
                            res.statusCode = 500;
                            res.send("500 - (Synthetic) Internal Server Error");
                        }
                    })
                ]
            },
            realToken: {
                instructions: "return real AWS token.",
                heads: [
                    new RoboHydraHead({
                        path: '/.*',
                        handler: function(req, res, next) {
                            res.token = token;
                            next(req, res);
                        }
                    })
                ]
            },
            oneCapsule: {
                instructions: "activate 1 capsule.",
                heads: [
                    new RoboHydraHeadStatic({
                        path: apiPrefix + '/capsule/',
                        content: {
                            meta: meta(1),
                            objects: [
                                {
                                    created: "2013-06-07T10:45:01",
                                    id: 3,
                                    resource_uri: "/api/v1/capsule/3/",
                                    title: "Photos",
                                    user: "/api/v1/user/3/",
                                    remaining: 482,
                                    size: 1024
                                },
                                {
                                    created: "2013-06-07T10:44:38",
                                    id: 2,
                                    resource_uri: "/api/v1/capsule/2/",
                                    title: "Stuff",
                                    user: "/api/v1/user/2/",
                                    remaining: 482,
                                    size: 1024
                                }
                            ]
                        }
                    })
                ]
            },
        }
    };
};
