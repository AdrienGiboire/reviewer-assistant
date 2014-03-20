var _ = require('underscore');
var express = require('express');
var https = require('https');
var hipchat = require('node-hipchat');
var app = express();

app.use(express.compress());

app.set('ORGANISATION', 'nukomeet');
app.set('GITHUB_CLIENT_ID', '1c261069c274bc4ee749');
app.set('GITHUB_CLIENT_SECRET', 'e527a4bd591c1d7437f3dec92916d507c38c3016');
app.set('HIPCHAT_KEY', '6c35c6f8d1a650d746faec37d3d93b');

var _options = {
  headers: {
    'User-Agent': app.get('ORGANISATION')
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
        html += '<li><em>'+ pullRequest.title +'</em> (<a href="'+ pullRequest.url +'">'+ pullRequest.url +'</a>)</li>';
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
  _options.path = '/orgs/'+ app.get('ORGANISATION') +'/repos?client_id='+ app.get('GITHUB_CLIENT_ID') +'&client_secret='+ app.get('GITHUB_CLIENT_SECRET');

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
    console.log('Problem with request: '+ e);
  });
}

function fetchPullRequests (repos) {
  var pullRequests = [];
  _.each(repos, function (repo, index) {
    _options.path = '/repos/'+ app.get('ORGANISATION') +'/'+ repo.name +'/pulls?client_id='+ app.get('GITHUB_CLIENT_ID') +'&client_secret='+ app.get('GITHUB_CLIENT_SECRET');
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

var port = Number(process.env.PORT || 5000);
var server = app.listen(port, function () {
  console.log('Listening on port %d', server.address().port);
});
