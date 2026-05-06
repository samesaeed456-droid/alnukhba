process.env.NODE_ENV = 'production';
import app from './server.ts';
import request from 'supertest';

request(app)
  .post('/api/webauthn/register/generate')
  .send({ uid: "test", email: "test@test.com" })
  .expect(200)
  .end((err, res) => {
    if (err) console.error(err, res.status, res.text);
    else console.log("OK!", res.body);
  });
