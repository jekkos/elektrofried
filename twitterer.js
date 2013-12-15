var OAuthEcho = require('oauth').OAuthEcho;
var OAuth = require('oauth').OAuth;
var fs = require('fs');
var logger = require('winston');
var http = require('http');


exports.upload = (function() {
	
	var accessToken = '2233328443-hXmonPb82V7kxcNy2NbwdGFIEZrxWtSxWbef59Y';
	var tokenSecret = 'GhfeIp4fIJMV6qGJbDAJ7Fj7vceHMb9rz5vZpIYrrsM5V';
	var consumerKey = 'YdkLUWxHIAn0u2mlRV6Nkw';
	var consumerSecret = 'SLlTcBtUeqzvoqXxTNzAkXylkuTYAR7oSvromKi9c';
	var apiKey = '2b8b27c20a414b31bbbd94bb06e714fc';
	
	var useProxy = false;
	
	var boundary = '---------------------------10102754414578508781458777923';
	var separator = '--' + boundary;
	var crlf = "\r\n";
	
	var tweet = function(tweet) {
		var twitterer = new OAuth(
				"https://api.twitter.com/oauth/request_token",
				"https://api.twitter.com/oauth/access_token",
				consumerKey,
				consumerSecret,
				"1.0",
				null,
				"HMAC-SHA1"
		);

		var authorization = twitterer.authHeader(
				'http://api.twitter.com/1.1/statuses/update_with_media.json',
				accessToken, tokenSecret, 'POST');
		logger.debug("Auth headers: " + authorization);
		var multipartBody = buildMultipartBody(tweet, boundary);
		
		var hostname = 'api.twitter.com';
		
		var headers = {
				'Host': hostname,
				'Accept' : "*/*",
				'Authorization' : authorization,
				'Content-Length': multipartBody.length,
				'Content-Type': 'multipart/form-data; boundary=' + boundary
		};
		
		var options = {
//				host: hostname,
				host: useProxy ? "localhost" : hostname,
				port: useProxy ? 8090 : 80,
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
		+ separator + crlf;
	};
	
	var buildMultipartBody = function(tweet, boundary) {
		var data = fs.readFileSync(tweet.getPath());

		var footer = crlf + separator + '--' + crlf;
		var fileHeader = 'Content-Disposition: form-data; name="media"; filename="' + tweet.getTitle() + '"';
		
		var contents = separator + crlf
		+ addFormData("key", apiKey)
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
			response.on('data', function (chunk) {
				logger.info(chunk.entities);
				// TODO get url back 
				//tweet.tweetUrl = media && media.url;
				//logger.info("Media url is " + tweet.tweetUrl);
			});
			response.on('end', function () {
				logger.info(response.statusCode +'\n');
			});
		});    
	};
	
	// deprecated
	var twitpic = function(tweet) {
		
		var oauth = new OAuthEcho(
				'http://api.twitter.com/',
				'http://api.twitter.com/1.1/account/verify_credentials.json',
				consumerKey,
				consumerSecret,
				'1.0', 'HMAC-SHA1');
		
		var multipartBody = buildMultipartBody(tweet, boundary);
		
		var hostname = 'api.twitpic.com';
		// this is correct..
		var authorization = oauth.authHeader(
				'http://api.twitpic.com/2/upload.json',
				accessToken, tokenSecret, 'POST');
		logger.debug("Auth headers: " + authorization);
		var headers = {
				'Host': hostname,
				'Accept' : "*/*",
				'X-Auth-Service-Provider' : 'http://api.twitter.com/1.1/account/verify_credentials.json',
				'X-Verify-Credentials-Authorization' : authorization,
				'Content-Length': multipartBody.length,
				'Content-Type': 'multipart/form-data; boundary=' + boundary
		};
		
		var options = {
				host: useProxy ? "localhost" : hostname,
				port: useProxy ? 8090 : 80,
				path: 'http://api.twitter.com/1.1/statuses/update_with_media.json',
				method: 'POST',
				headers: headers
		};
		
		var options = {
				host: useProxy ? "localhost" : hostname,
				port: useProxy ? 8090 : 80,
				port: 80,
				path: 'http://api.twitpic.com/2/upload.json',
				method: 'POST',
				headers: headers
		};
		
		makeMultipartRequest(tweet, options, multipartBody);
		
	};
	
	return tweet;
	
})();
