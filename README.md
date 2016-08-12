# Jsparsy

Jsparsy will scan a set of URLs for javascript runtime errors, console.log() outputs, as well as server errors.
It is capable of doing a full POST or GET login prior checking the given URLs.

## Requirements

* [CasperJS](http://casperjs.org/)
* [PhantomJS](http://phantomjs.org/)


## Usage

```shell
casperjs jsparsy.js --config=/path/to/config.json --urls=/path/to/urls.json
```

## How to configure jsparsy

See [jsparsy.config.json-sample](https://github.com/cytopia/jsparsy/blob/master/jsparsy.config.json-sample).

It is also possible and even recommended to use the configuration file from [crawlpy](https://github.com/cytopia/crawlpy),
as you will need that anyway to generate the URL's (next section).


## Howto generate the URLs?

You can use [crawlpy](https://github.com/cytopia/crawlpy) to generate the URL json file.
