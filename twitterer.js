var config = require('./config');
var OAuthEcho = require('oauth').OAuthEcho;
var OAuth = require('oauth').OAuth;
var fs = require('fs');
var logger = require('winston');
var http = require('http');


exports.upload = (function() {
	
	var crlf = "\r\n";
	
	var tweet = function(tweet) {
		var twitterer = new OAuth(
				"https://api.twitter.com/oauth/request_token",
				"https://api.twitter.com/oauth/access_token",
				config.consumerKey,
				config.consumerSecret,
				"1.0",
				null,
				"HMAC-SHA1"
		);

		var authorization = twitterer.authHeader(
				'http://api.twitter.com/1.1/statuses/update_with_media.json',
				config.accessToken, config.tokenSecret, 'POST');
		logger.debug("Auth headers: " + authorization);
		var multipartBody = buildMultipartBody(tweet, config.BOUNDARY);
		
		var hostname = 'api.twitter.com';
		
		var headers = {
				'Host': hostname,
				'Accept' : "*/*",
				'Authorization' : authorization,
				'Content-Length': multipartBody.length,
				'Content-Type': 'multipart/form-data; boundary=' + config.BOUNDARY
		};
		
		var options = {
//				host: hostname,
				host: config.USE_PROXY ? "localhost" : hostname,
				port: config.USE_PROXY ? 8090 : 80,
				path: 'http://api.twitter.com/1.1/statuses/update_with_media.json',
				method: 'POST',
				headers: headers
		};

		makeMultipartRequest(tweet, options, multipartBody);
		
	};
	
	var addFormData = function(fieldName, fieldData) {
		return 'Content-Disposition: form-data; name="' + fieldName + '"' + crlf
		+ crlf
		+ fieldData + crlf
		+ config.SEPARATOR + crlf;
	};
	
	var buildMultipartBody = function(tweet, boundary) {
		var data = fs.readFileSync(tweet.getPath());

		var footer = crlf + config.SEPARATOR + '--' + crlf;
		var fileHeader = 'Content-Disposition: form-data; name="media"; filename="' + tweet.getTitle() + '"';
		
		var contents = config.SEPARATOR + crlf
		+ addFormData("key", config.apiKey)
		+ addFormData("status", tweet.getMessage())
		+ addFormData("place_id", tweet.getPlaceId())
		+ fileHeader + crlf
		+ 'Content-Type: image/jpeg' +  crlf
		+ crlf;
		
		return Buffer.concat([
		                                   new Buffer(contents),
		                                   data,
		                                   new Buffer(footer)]);
	};
	
	var makeMultipartRequest = function(tweet, options, multipartBody) {
		var request = http.request(options);     
		request.write(multipartBody);
		request.end();
		
		request.on('error', function (err) {
			logger.error('Something is wrong.\n'+JSON.stringify(err)+'\n');
		});
		
		request.on('response', function (response) {            
			response.setEncoding('utf8');            
			response.on('end', function () {
				logger.info("Entities: " + response.data);
				logger.info(response.statusCode +'\n');
			});
		});    
	};
	
	// deprecated
	var twitpic = function(tweet) {
		
		var oauth = new OAuthEcho(
				'http://api.twitter.com/',
				'http://api.twitter.com/1.1/account/verify_credentials.json',
				config.consumerKey,
				config.consumerSecret,
				'1.0', 'HMAC-SHA1');
		
		var multipartBody = buildMultipartBody(tweet, config.BOUNDARY);
		
		var hostname = 'api.twitpic.com';
		// this is correct..
		var authorization = oauth.authHeader(
				'http://api.twitpic.com/2/upload.json',
				config.accessToken, config.tokenSecret, 'POST');
		logger.debug("Auth headers: " + authorization);
		var headers = {
				'Host': hostname,
				'Accept' : "*/*",
				'X-Auth-Service-Provider' : 'http://api.twitter.com/1.1/account/verify_credentials.json',
				'X-Verify-Credentials-Authorization' : authorization,
				'Content-Length': multipartBody.length,
				'Content-Type': 'multipart/form-data; config.BOUNDARY=' + config.BOUNDARY
		};
		
		var options = {
				host: config.USE_PROXY ? "localhost" : hostname,
				port: config.USE_PROXY ? 8090 : 80,
				path: 'http://api.twitter.com/1.1/statuses/update_with_media.json',
				method: 'POST',
				headers: headers
		};
		
		var options = {
				host: config.USE_PROXY ? "localhost" : hostname,
				port: config.USE_PROXY ? 8090 : 80,
				port: 80,
				path: 'http://api.twitpic.com/2/upload.json',
				method: 'POST',
				headers: headers
		};
		
		makeMultipartRequest(tweet, options, multipartBody);
		
	};
	
	return tweet;
	
})();
