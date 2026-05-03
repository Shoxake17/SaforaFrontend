// src/config/iceServers.ts


export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  {
    urls: 'turn:a.relay.metered.ca:80',
    username: '72bca145595f1ddb5ebf4257',
    credential: 'a9f+0iK5TMpNMAXx',
  },
  {
    urls: 'turn:a.relay.metered.ca:80?transport=tcp',
    username: '72bca145595f1ddb5ebf4257',
    credential: 'a9f+0iK5TMpNMAXx',
  },
  {
    urls: 'turn:a.relay.metered.ca:443',
    username: '72bca145595f1ddb5ebf4257',
    credential: 'a9f+0iK5TMpNMAXx',
  },
  {
    urls: 'turn:a.relay.metered.ca:443?transport=tcp',
    username: '72bca145595f1ddb5ebf4257',
    credential: 'a9f+0iK5TMpNMAXx',
  },
  {
    urls: 'turns:a.relay.metered.ca:443',
    username: '72bca145595f1ddb5ebf4257',
    credential: 'a9f+0iK5TMpNMAXx',
  },
];