const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const {
  EVENTBRITE_CLIENT_ID,
  EVENTBRITE_CLIENT_SECRET,
  EVENTBRITE_REFRESH_TOKEN,
} = process.env;

async function getAccessToken() {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: EVENTBRITE_REFRESH_TOKEN || '',
    client_id: EVENTBRITE_CLIENT_ID || '',
    client_secret: EVENTBRITE_CLIENT_SECRET || '',
  });

  const res = await fetch('https://www.eventbrite.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    throw new Error(`Token error ${res.status}`);
  }
  const data = await res.json();
  return data.access_token;
}

app.get('/api/eventbrite/events', async (req, res) => {
  try {
    const token = await getAccessToken();
    const url = new URL('https://www.eventbriteapi.com/v3/events/search');
    Object.entries(req.query).forEach(([k, v]) =>
      url.searchParams.append(k, v)
    );

    const apiRes = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await apiRes.json();
    if (!apiRes.ok) {
      return res.status(apiRes.status).json(data);
    }
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
