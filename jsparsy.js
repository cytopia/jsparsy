/**
 * @author:		cytopia <cytopia@everythingcli.org> (0x695128A2)
 * @date:		2016-08-12
 * @version:	v0.3
 *
 * Check given URL's for JS run-time errors, console.log and server errors.
 */



//------------------------------------------------------------
// Requires
//------------------------------------------------------------

// CasperJS
var casper = require('casper').create({
	verbose: true,			// Print log messages?
	logLevel: 'warning',	// 'debug', 'info', 'warning', 'error' overwrite via --loglevel=info
	pageSettings: {
		loadImages:  false,			// Do not load images
		loadPlugins: false,			// Do not load plugins like Flash, Silverlight, etc.
		javascriptEnabled : true,	// Parse Javascript
		XSSAuditingEnabled: false,	// Do not audit xss attempts
		userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_5) AppleWebKit/537.4 (KHTML, like Gecko) Chrome/22.0.1229.94 Safari/537.4'
	}
});

// Filesystem library
var fs = require('fs');



//------------------------------------------------------------
// Command line arguments
//------------------------------------------------------------

// Check configuration file cli argument
if (!casper.cli.has(0)) {
	casper.echo('No configuration file specified', 'ERROR');
	casper.echo('Usage: runtime-errors.js <config.json> <urls.json>');
	//casper.done(1);
	casper.exit(1);
	//phantom.exit(1);
}
// Check url's file cli argument
if (!casper.cli.has(1)) {
	casper.echo('No url file specified', 'ERROR');
	casper.echo('Usage: runtime-errors.js <config.json> <urls.json>');
	//casper.done(1);
	casper.exit(1);
	//phantom.exit(1);
}
// Check if the file actually exists
if (!fs.exists(casper.cli.get(0))) {
	casper.echo('Config file: "' + casper.cli.get(0) + '" does not exist', 'ERROR');
	casper.echo('Usage: runtime-errors.js <config.json> <urls.json>');
	//casper.done(1);
	casper.exit(1);
	//phantom.exit(1);
}
// Check if the file actually exists
if (!fs.exists(casper.cli.get(1))) {
	casper.echo('Url file: "' + casper.cli.get(1) + '" does not exist', 'ERROR');
	casper.echo('Usage: runtime-errors.js <config.json> <urls.json>');
	//casper.done(1);
	casper.exit(1);
	//phantom.exit(1);
}


//------------------------------------------------------------
// Includes
//------------------------------------------------------------
var config	= require(casper.cli.get(0));
var urls	= require(casper.cli.get(1));



//------------------------------------------------------------
// Init globals
//------------------------------------------------------------
var base_url	= config.proto + '://' + config.domain;
var login_url	= base_url + config.login.action;

/**
 * Error storage
 */
var errors_runtime	= [];
var errors_server	= [];
var errors_console	= [];




/********************************************************************************
 *
 * E V E N T   L I S T E N E R
 *
 ********************************************************************************/


/**
 * This function is called when any other callback has failed.
 * Nice self-checking stuff ;-)
 */
casper.on('complete.error', function(err) {
	this.die("Complete callback has failed: " + err);
});


/**
 * On Each Request Start (Initiated)
 */
casper.on('resource.requested', function(resource, request) {
	//this.echo('[-->] ' + resource.url, 'INFO');
});


/**
 * On reach Request End (Received)
 */
casper.on('resource.received', function(resource) {
	//this.echo('[' + resource.status + '] ' + resource.url);
});


/**
 * On Remote Message (console.log found)
 */
casper.on('remote.message', function(msg) {
	this.echo('--------------------------------------------------------------------------------', 'ERROR');
	this.echo('[CONSOLE.LOG]', 'WARNING');
	this.echo('Error:    ' + msg, 'WARNING');
	errors_console.push(msg);
});


/**
 * On Resource Error (Server error)
 */
casper.on('resource.error', function(resourceError) {
	this.echo('--------------------------------------------------------------------------------', 'ERROR');
	this.echo('[SERVER ERROR]', 'WARNING');
	this.echo('Error:    ' + resourceError.errorString, 'WARNING');
	this.echo('URL:      ' + resourceError.url, 'WARNING');
	this.echo('Code:     ' + resourceError.errorCode, 'WARNING');
	this.echo('ID:       ' + resourceError.id, 'WARNING');
	errors_server.push(resourceError.errorString);
});


/**
 * On Page Error (Client error)
 */
casper.on('page.error', function(msg, trace) {
	this.echo('--------------------------------------------------------------------------------', 'ERROR');
	this.echo('[CLIENT ERROR]', 'ERROR');
	this.echo('Error:    ' + msg, 'ERROR');
	this.echo('URL:      ' + this.getCurrentUrl(), 'WARNING');
	this.echo('file:     ' + trace[0].file, 'WARNING');
	this.echo('line:     ' + trace[0].line, 'WARNING');
	this.echo('function: ' + trace[0]['function'], 'WARNING');
	errors_runtime.push(msg);
});



/********************************************************************************
 *
 * RUN
 *
 ********************************************************************************/


// Do a Login before continuing
if (config.login.enabled) {

	// Initial request is to start on the login page itself
	// instead of the base url, as many sites require
	// a pre-session to be setup.
	casper.start(login_url);

	// Login
	casper.log('Initiating login at: ' + login_url, 'info');
	casper.thenOpen(login_url, {
		'method': config.login.method,
		'data': config.login.fields
	});

	// Check if Login was successful
	casper.then(function() {
		var htmlSource = this.getPageContent();
		var failString = config.login.failure;

		// Login failed
		if (htmlSource.search(failString) != -1) {
			casper.log('Login failed', 'error');
			//casper.done(1);
			casper.exit(1);
			//phantom.exit(1);
		} else {
			casper.log('Login successful', 'info');
		}
	})
}
// No Login required
else {
	// Start on the base url
	casper.start(base_url);
	casper.log('No login required', 'info');
}



/**
 * Iterate over all URL's
 */
for (var i=0; i<urls.length; i++) {
	casper.thenOpen(urls[i].url, function(response) {
		//casper.log('[' + response.status + '] ' + response.url, 'info');
	});
}


/**
 * Run
 */
casper.run(function() {

	var exit_code = 0;

	// Runtime errors (Abort with error)
	if (errors_runtime.length > 0) {
		this.echo(errors_runtime.length + ' Javascript errors found', 'WARNING');
		exit_code = 1;
	} else {
		this.echo('No Javascript errors found', 'INFO');
	}

	// Console.log found (Abort with error)
	if (errors_console.length > 0) {
		this.echo(errors_console.length + ' console.log found', 'WARNING');
		exit_code = 1;
	} else {
		this.echo('No console.log found', 'INFO');
	}

	// Server errors (http >= 500) [don't give a shit]
	if (errors_server.length > 0) {
		this.echo(errors_server.length + ' Server errors found', 'WARNING');
	} else {
		this.echo('No Server errors found', 'INFO');
	}

	casper.exit(exit_code);
});

