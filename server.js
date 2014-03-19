var _ = require('underscore');
var express = require('express');
var https = require('https');
var app = express();

app.use(express.compress());

app.set('org', 'nukomeet');
app.set('client_id', '1c261069c274bc4ee749');
app.set('client_secret', 'e527a4bd591c1d7437f3dec92916d507c38c3016');

var options = {
  headers: {
    'User-Agent': app.get('org')
  },
  hostname: 'api.github.com'
};

app.get('/pull-requests', function (request, response) {
  response.type('html');
  response.writeHead(200);
  fetchRepos(fetchPullRequests, response);
  app.on('pull-requests:fetched', function (pullRequestsByRepo) {
    _.each(pullRequestsByRepo, function (pullRequests) {
      response.write('There is <strong>'+ pullRequests.length +'</strong> pending pull request(s) for <strong>'+ pullRequests[0].title +'</strong>:');
      response.write('<ul>');
      _.each(pullRequests, function (pullRequest) {
        response.write('<li><em>'+ pullRequest.title +'</em> (<a href="'+ pullRequest.url +'">'+ pullRequest.url +'</a>)</li>');
      });
      response.write('</ul>');
    });
    response.end();
  });
});

function fetchRepos (callback, response) {
  options.path = '/orgs/'+ app.get('org') +'/repos?client_id='+ app.get('client_id') +'&client_secret='+ app.get('client_secret');

  // Fetch the list of repos for a given organisation
  var request = https.get(options, function (res) {
    data = "";

    res.on('data', function (chunk) {
      data += chunk;
    });

    res.on('end', function () {
      var repos = JSON.parse(data);
      return callback(repos, response);
    });
  });

  request.on('error', function (error) {
    console.log('Problem with request: '+ e);
  });
}

function fetchPullRequests (repos, response) {
  var pullRequests = [];
  _.each(repos, function (repo, index) {
    options.path = '/repos/'+ app.get('org') +'/'+ repo.name +'/pulls?client_id='+ app.get('client_id') +'&client_secret='+ app.get('client_secret');
    var request = https.get(options, function (res) {
      (function () {
        var data = "";

        res.on('data', function (chunk) {
          data += chunk;
        });

        res.on('end', function () {
          data = JSON.parse(data);
          if (data.length > 0) {
            pullRequests.push(data);
          }

          if (index == (repos.length - 1)) {
            app.emit('pull-requests:fetched', pullRequests);
          }
        });
      })();
    });
  });
}

var server = app.listen(3000, function () {
  console.log('Listening on port %d', server.address().port);
});
