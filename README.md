# FashionHub MERN Store Management

A MERN stack fashion store management dashboard inspired by the supplied UI references and translated from the original Python/MySQL backend behavior.

## What It Includes

- Products, stock, purchases, sales, and reports workflows
- Express API with MongoDB/Mongoose models
- In-memory fallback when MongoDB is not running, so the app can still be previewed
- Product add/edit/delete flow with image preview
- Purchase and sale forms that update stock automatically
- Dashboard, stock overview, sales report, and responsive mobile layout

## Run Locally

```bash
npm install
npm run dev
```

The React app runs at `http://127.0.0.1:5173` and the API runs at `http://127.0.0.1:5000`.

To use MongoDB, copy `.env.example` to `.env` and make sure MongoDB is running. Without MongoDB, the server automatically uses seeded in-memory data.
