import json
import urlparse

import requests
import oauth2 as oauth
import httplib

httplib.HTTPConnection.debuglevel = 1
oauth.httplib2.debuglevel = 1


class AtomicReachAPIClient(object):

    API_HOST = 'https://app.atomicreach.com'
    REQUEST_TOKEN_URL = API_HOST + '/oauth/request-token'
    AUTHORIZE_URL = API_HOST + '/oauth/authorize'
    ACCESS_TOKEN_URL = API_HOST + '/oauth/access-token'

    READER_SOPHISTICATION_LEVEL = {
        'genius': 1,
        'academic': 2,
        'specialist': 3,
        'knowledgeable': 4,
        'general': 5
    }

    def __init__(self, consumer_key, consumer_secret):
        self.consumer_key = consumer_key
        self.consumer_secret = consumer_secret
        self.consumer = oauth.Consumer(key=self.consumer_key, secret=self.consumer_secret)
        self._access_token = None

    @property
    def access_token(self):
        if not self._access_token:
            request_token = self._generate_request_token()
            self._authorize_request(request_token)
            self._access_token = self._generate_access_token(request_token)

        return self._access_token

    def _generate_request_token(self):
        client = oauth.Client(self.consumer)
        _, content = client.request(self.REQUEST_TOKEN_URL, "GET")

        return self._token(content, RequestToken)

    def _authorize_request(self, request_token):
        response = requests.get(self.AUTHORIZE_URL, params={'oauth_token': request_token.key})
        response.raise_for_status()

    def _generate_access_token(self, request_token):
        token = oauth.Token(key=request_token.key, secret=request_token.secret)
        client = oauth.Client(self.consumer, token)
        _, content = client.request(self.ACCESS_TOKEN_URL, "GET")
        return self._token(content, AccessToken)

    @classmethod
    def _token(cls, content, token_cls):
        parsed = urlparse.parse_qs(content)
        return token_cls(parsed['oauth_token'][0], parsed['oauth_token_secret'][0])

    def _request(self, resource, method, params):
        url = self.API_HOST + resource
        access_token = self.access_token

        client = oauth.Client(self.consumer, oauth.Token(key=access_token.key, secret=access_token.secret))
        _, content = client.request(url, method, headers={'Content-Type': 'application/json'},
                                    body=json.dumps(params))

        return json.loads(content)

    def get_keywords(self, content, reader_sophistication_level):
        self._validate_reader_sophistication_level(reader_sophistication_level)
        params = {'content': content, 'sophisticationBandId': reader_sophistication_level,
                  'serviceNamesArray': ['keywords']}
        return self._request('/analyze-text/master', 'POST', params=params)

    def get_readability(self, document_data_array, reader_sophistication_level):

        assert isinstance(document_data_array, list), "document_data_array must be of type list"

        self._validate_reader_sophistication_level(reader_sophistication_level)

        params = {'documentDataArray': document_data_array,
                  'sophisticationBandId': self.READER_SOPHISTICATION_LEVEL[reader_sophistication_level.lower()]}
        return self._request('/analyze-text/get-readability', 'POST', params=params)

    def analyze_post(self, title, content, reader_sophistication_level):
        self._validate_reader_sophistication_level(reader_sophistication_level)

        params = {'title': title.encode('utf-8'), 'content': content.encode('utf-8'),
                  'sophisticationBandId': self.READER_SOPHISTICATION_LEVEL[reader_sophistication_level.lower()]}

        return self._request('/post/analyze', 'POST', params=params)

    def _validate_reader_sophistication_level(self, reader_sophistication_level):
        assert reader_sophistication_level.lower() in self.READER_SOPHISTICATION_LEVEL, \
            "reader_sophistication_level must be one of the values %s" % ', '.join(
                self.READER_SOPHISTICATION_LEVEL.keys())


class Token(object):

    def __init__(self, key, secret):
        self.key = key
        self.secret = secret


class RequestToken(Token):
    pass


class AccessToken(Token):
    pass
