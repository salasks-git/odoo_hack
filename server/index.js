require('dotenv').config({path: require('path').join(__dirname, '.env')});
const express = require('express');
const cors = require('cors');
const db = require('./db');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const productsRoutes = require('./routes/products');
const variantsRoutes = require('./routes/variants');
const plansRoutes = require('./routes/plans');
const discountsRoutes = require('./routes/discounts');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/variants', variantsRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/discounts', discountsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>console.log(`Server running on port ${PORT}`));

