# Reviewer Assistant

This application list all the pending pull requests across all the projects of
an organisation. Know that to make it works for your organisation, you'll have
to change a few parameters in `server.js`.

# How to start the app

Go [there](https://github.com/settings/applications) to fetch the `client_id` and
the `client_secret` for the app..

Then run the following command:

```
$ GB_AUTH_TOKEN='<your_github_auth_token>'; \
  BB_AUTH_TOKEN='<your_bitbucket_auth_token>' \
  HIPCHAT_KEY='<your_hipchat_key>' \
  node app.js
```

> Note: I advise you to install [`nodemon`](https://github.com/remy/nodemon)
> Then, just run `nodemon app.js` instead `node app.js`.

# TODO

[] Make it works for private repository
