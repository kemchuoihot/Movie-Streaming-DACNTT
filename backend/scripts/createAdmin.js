const mongoose = require('mongoose');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://thinhpx33:thinhea33@films.tl7fqgl.mongodb.net/?retryWrites=true&w=majority&appName=films', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('Connected to MongoDB');
  const username = 'admin';
  const password = 'admin';
  await User.findOneAndUpdate(
    { username },
    { username, password, email: 'admin@moviecity.com', isAdmin: true, uid: 'admin_uid' },
    { upsert: true }
  );
  console.log('Admin user created');
  mongoose.disconnect();
}).catch(err => console.error('Error:', err));