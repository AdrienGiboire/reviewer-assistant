var _ = require('underscore');
var express = require('express');
var hipchat = require('node-hipchat');
var https = require('https');
var url = require('url');
var querystring = require('querystring');
var app = express();

app.use(express.compress());

app.set('ORGANISATION', 'nukomeet');
app.set('BASE_URL', process.env.BASE_URL || 'http://localhost:5000/');
app.set('GITHUB_AUTH_TOKEN', process.env.GH_AUTH_TOKEN);
app.set('HIPCHAT_KEY', process.env.HIPCHAT_KEY);

var _options = {
  headers: {
    'User-Agent': app.get('ORGANISATION'),
    'Authorization': 'token '+ app.get('GITHUB_AUTH_TOKEN')
  },
  hostname: 'api.github.com'
};

app.get('/pull-requests', function (request, response) {
  fetchRepos(fetchPullRequests);

  app.once('pull-requests:fetched', function (pullRequestsByRepo) {
    response.writeHead(200, {'Content-Type': 'text/html'});
    var html = "";

    _.each(pullRequestsByRepo, function (pullRequests, index) {
      html += 'There is <strong>'+ pullRequests.data.length +'</strong> pending pull request(s) for <strong>'+ pullRequestsByRepo[index].repo +'</strong>:';
      html += '<ul>';
      _.each(pullRequests.data, function (pullRequest) {
        html += '<li><em>'+ pullRequest.title +'</em> (<a href="'+ pullRequest.html_url +'">'+ pullRequest.html_url +'</a>)</li>';
      });
      html += '</ul>';
    });

    var HC = new hipchat(app.get('HIPCHAT_KEY'));

    var params = {
      room: 55413,
      from: 'Assistant',
      message: html,
      color: 'yellow'
    };

    HC.postMessage(params, function(data) {});

    response.write(html);
    response.end();
  });
});

function fetchRepos (callback) {
  _options.path = '/orgs/'+ app.get('ORGANISATION') +'/repos';

  // Fetch the list of repos for a given organisation
  var request = https.get(_options, function (res) {
    data = "";

    res.on('data', function (chunk) {
      data += chunk;
    });

    res.on('end', function () {
      var repos = JSON.parse(data);
      return callback(repos);
    });
  });

  request.on('error', function (error) {
    console.log('Problem with request: '+ error);
  });
}

function fetchPullRequests (repos) {
  var pullRequests = [];
  _.each(repos, function (repo, index) {
    _options.path = '/repos/'+ app.get('ORGANISATION') +'/'+ repo.name +'/pulls';
    var request = https.get(_options, function (res) {
      (function (repo) {
        var data = "";

        res.on('data', function (chunk) {
          data += chunk;
        });

        res.on('end', function () {
          data = JSON.parse(data);
          if (data.length > 0) {
            pullRequests.push({repo: repo.name, data: data});
          }

          if (index == (repos.length - 1)) {
            app.emit('pull-requests:fetched', pullRequests);
          }
        });
      })(repo);
    });
  });
}

app.get('/', function (request, response) {
  response.redirect('/pull-requests');
  response.end();
});

var port = Number(process.env.PORT || 5000);
var server = app.listen(port, function () {
  console.log('Listening on port %d', server.address().port);
});
