const mongoose = require('mongoose');

// Need to define a minimal schema or use existing
const Project = require('./models/Project');

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb+srv://dasmiita:innu2013@vibegit.ksnhxcx.mongodb.net/vibegit', {
      family: 4
    });
    
    console.log('Migrating existing projects...');
    // Find all projects missing rootCreatorId
    const projects = await Project.find({ rootCreatorId: { $exists: false } });
    console.log(`Found ${projects.length} projects without rootCreatorId.`);
    
    let updatedCount = 0;
    for (let project of projects) {
      if (project.userId) {
        project.rootCreatorId = project.userId;
        // Skip validation just for updating rootCreatorId or update directly in db
        await Project.updateOne({ _id: project._id }, { $set: { rootCreatorId: project.userId } });
        updatedCount++;
      }
    }

    // Also handle projects where it is null just in case
    const nullProjects = await Project.find({ rootCreatorId: null });
    console.log(`Found ${nullProjects.length} projects with null rootCreatorId.`);
    for (let project of nullProjects) {
        if (project.userId) {
            await Project.updateOne({ _id: project._id }, { $set: { rootCreatorId: project.userId } });
            updatedCount++;
        }
    }
    
    console.log(`Migration complete. Updated ${updatedCount} projects.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
