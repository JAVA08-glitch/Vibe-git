const mongoose = require('mongoose');

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb+srv://dasmiita:innu2013@vibegit.ksnhxcx.mongodb.net/vibegit');
    
    const User = mongoose.model('User');
    const Project = mongoose.model('Project');
    
    console.log('Setting default user roles and acceptedProjects...');
    await User.updateMany({ role: { $exists: false } }, { $set: { role: 'user', acceptedProjects: [] } });
    
    // Specifically set Soumya as Admin
    await User.updateOne({ username: 'soumya_08' }, { $set: { role: 'admin' } });
    
    console.log('Updating project owner roles...');
    const users = await User.find({ role: 'admin' });
    const adminIds = users.map(u => u._id);
    
    await Project.updateMany({ userId: { $in: adminIds } }, { $set: { ownerRole: 'admin' } });
    await Project.updateMany({ userId: { $nin: adminIds } }, { $set: { ownerRole: 'user' } });

    console.log('Migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

// Since I don't have the models loaded in this stand-alone script, I'll define simple ones or use the existing ones if I can.
// Better yet, I'll use the existing models by requiring them if possible, but absolute paths are tricky.
// I'll just use the raw collection if needed.

migrate();
