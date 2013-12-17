var config  = {};

// node.js http settings
config.SERVER_URL = 'http://localhost/elektrofried/';
config.DEFAULT_PORT = 8080;

// twitter settings
config.DEFAULT_PLACE_ID = '@appsaloon';
config.DEFAULT_TITLE = 'Elektrofried!';
config.DEFAULT_MESSAGE = 'Test twitpic upload';
config.USE_PROXY = false;

config.BOUNDARY = '---------------------------10102754414578508781458777923';
config.SEPARATOR = '--' + config.BOUNDARY;

// twitter oAuth settings
config.accessToken = '2233328443-hXmonPb82V7kxcNy2NbwdGFIEZrxWtSxWbef59Y';
config.tokenSecret= 'GhfeIp4fIJMV6qGJbDAJ7Fj7vceHMb9rz5vZpIYrrsM5V';
config.consumerKey = 'YdkLUWxHIAn0u2mlRV6Nkw';
config.consumerSecret = 'SLlTcBtUeqzvoqXxTNzAkXylkuTYAR7oSvromKi9c';
config.apiKey = '2b8b27c20a414b31bbbd94bb06e714fc';

// serial interfacing
config.TTY_NAME = "/dev/ttyUSB0";
config.BAUD_RATE = 9600;
config.SERIAL_SEPARATOR = "\n";

// teensy commandes
config.DEMO_MODE = "d";
// would expect this to be an l (as documented)
config.LIGHT_MODE = "b";
config.ENABLE_SHOCK = "s";
config.DISABLE_SHOCK = "e";
config.SHOCK = "x";

// framegrabber settings
config.JPEG_QUALITY = 95;

// filesystem settings
config.FILE_ROOT = '/home/jekkos/workspace/elektrofried/';
config.TMP_DIR = 'tmp/camelot/';
config.TMP_TILE_DIR = 'tmp/tiles';

module.exports = config;