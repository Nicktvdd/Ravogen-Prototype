import express from 'express';
import cors from 'cors';
import router from './routes';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Mount the api router
app.use('/api', router);

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
