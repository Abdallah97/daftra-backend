const express = require("express");
const cors = require("cors");

const PORT = process.env.PORT || 8081;

const app = express();
app.use(cors());
app.use(express.json());

// Remove the random error middleware for production
if (process.env.NODE_ENV !== 'production') {
  const errorChance = 0.1;
  app.use((req, res, next) => {
    if (Math.random() <= errorChance) return res.status(500).send(undefined);
    else next();
  });
}

// Default navigation data
const defaultNav = [
  { id: 1, title: "Dashboard", target: "/" },
  {
    id: 2,
    title: "Job Applications",
    target: "/applications",
    children: [
      { id: 7, title: "John Doe", target: "/applications/john-doe" },
      { id: 10, title: "James Bond", target: "/applications/james-bond" },
      {
        id: 20,
        title: "Scarlett Johansson",
        target: "/applications/scarlett-johansson",
        visible: false,
      },
    ],
  },
  {
    id: 3,
    title: "Companies",
    target: "/companies",
    visible: false,
    children: [
      { id: 8, title: "Tanqeeb", target: "/companies/1" },
      { id: 9, title: "Daftra", target: "/companies/2" },
      { id: 11, title: "TBD", target: "/companies/14" },
    ],
  },
  {
    id: 4,
    title: "Qualifications",
    children: [
      { id: 14, title: "Q1", target: "/q1" },
      { id: 15, title: "Q2", target: "/q2" },
    ],
  },
  { id: 5, title: "About", target: "/about" },
  { id: 6, title: "Contact", target: "/contact" },
];

// In-memory cache for development
let navCache = null;

app.post("/track", (req, res) => {
  const { id, from = undefined, to = undefined } = req.body;
  if (!id || typeof from === "undefined" || typeof to === "undefined")
    return res.status(400).json({ error: "Bad Request" });
  else return res.status(204).send(null);
});

app.get("/nav", async (req, res) => {
  try {
    // Use in-memory cache in development
    if (process.env.NODE_ENV !== 'production') {
      return res.json(navCache || defaultNav);
    }
    
    // In production, try to get from KV storage
    if (process.env.VERCEL_ENV === 'production' && process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const response = await fetch(`${process.env.KV_REST_API_URL}/get/navigation`, {
        headers: {
          'Authorization': `Bearer ${process.env.KV_REST_API_TOKEN}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return res.json(data.value || defaultNav);
      }
    }
    
    return res.json(defaultNav);
  } catch (error) {
    console.error('Error fetching navigation:', error);
    return res.json(defaultNav);
  }
});

app.post("/nav", async (req, res) => {
  try {
    const items = req.body;
    if (!(items instanceof Array)) {
      return res.status(400).send("Bad Request");
    }

    // In development, store in memory
    if (process.env.NODE_ENV !== 'production') {
      navCache = items;
      return res.status(204).send(null);
    }

    // In production, store in KV storage
    if (process.env.VERCEL_ENV === 'production' && process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const response = await fetch(`${process.env.KV_REST_API_URL}/set/navigation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.KV_REST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: items })
      });

      if (!response.ok) {
        throw new Error('Failed to save navigation data');
      }
    }

    return res.status(204).send(null);
  } catch (error) {
    console.error('Error saving navigation:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT);
