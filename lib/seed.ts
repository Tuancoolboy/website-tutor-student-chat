import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { generateAllMockData } from './mockData.js';

/**
 * Seed database with mock data
 */
async function seed() {
  try {
    console.log('🌱 Starting database seed...\n');

    // Ensure data directory exists
    const dataDir = join(process.cwd(), 'data');
    try {
      await mkdir(dataDir, { recursive: true });
      console.log('✅ Data directory created/verified\n');
    } catch (error) {
      console.log('ℹ️  Data directory already exists\n');
    }

    // Generate all mock data
    const mockData = await generateAllMockData();

    // Write users
    await writeFile(
      join(dataDir, 'users.json'),
      JSON.stringify(mockData.users, null, 2),
      'utf-8'
    );
    console.log(`✅ Created ${mockData.users.length} users`);

    // Write sessions
    await writeFile(
      join(dataDir, 'sessions.json'),
      JSON.stringify(mockData.sessions, null, 2),
      'utf-8'
    );
    console.log(`✅ Created ${mockData.sessions.length} sessions`);

    // Write evaluations
    await writeFile(
      join(dataDir, 'evaluations.json'),
      JSON.stringify(mockData.evaluations, null, 2),
      'utf-8'
    );
    console.log(`✅ Created ${mockData.evaluations.length} evaluations`);

    // Write progress
    await writeFile(
      join(dataDir, 'progress.json'),
      JSON.stringify(mockData.progress, null, 2),
      'utf-8'
    );
    console.log(`✅ Created ${mockData.progress.length} progress entries`);

    // Write library resources
    await writeFile(
      join(dataDir, 'library.json'),
      JSON.stringify(mockData.library, null, 2),
      'utf-8'
    );
    console.log(`✅ Created ${mockData.library.length} library resources`);

    // Write forum posts
    await writeFile(
      join(dataDir, 'forum-posts.json'),
      JSON.stringify(mockData.forum.posts, null, 2),
      'utf-8'
    );
    console.log(`✅ Created ${mockData.forum.posts.length} forum posts`);

    // Write forum comments
    await writeFile(
      join(dataDir, 'forum-comments.json'),
      JSON.stringify(mockData.forum.comments, null, 2),
      'utf-8'
    );
    console.log(`✅ Created ${mockData.forum.comments.length} forum comments`);

    // Write notifications
    await writeFile(
      join(dataDir, 'notifications.json'),
      JSON.stringify(mockData.notifications, null, 2),
      'utf-8'
    );
    console.log(`✅ Created ${mockData.notifications.length} notifications`);

    // Write availability
    await writeFile(
      join(dataDir, 'availability.json'),
      JSON.stringify(mockData.availability, null, 2),
      'utf-8'
    );
    console.log(`✅ Created ${mockData.availability.length} availability records`);

    // Write approval requests
    await writeFile(
      join(dataDir, 'approvals.json'),
      JSON.stringify(mockData.approvals, null, 2),
      'utf-8'
    );
    console.log(`✅ Created ${mockData.approvals.length} approval requests`);

    // Write classes
    await writeFile(
      join(dataDir, 'classes.json'),
      JSON.stringify(mockData.classes, null, 2),
      'utf-8'
    );
    console.log(`✅ Created ${mockData.classes.length} classes`);

    // Write enrollments
    await writeFile(
      join(dataDir, 'enrollments.json'),
      JSON.stringify(mockData.enrollments, null, 2),
      'utf-8'
    );
    console.log(`✅ Created ${mockData.enrollments.length} enrollments`);

    // Write course contents
    await writeFile(
      join(dataDir, 'course-contents.json'),
      JSON.stringify(mockData.courseContents, null, 2),
      'utf-8'
    );
    console.log(`✅ Created ${mockData.courseContents.length} course contents`);

    // Write quizzes
    await writeFile(
      join(dataDir, 'quizzes.json'),
      JSON.stringify(mockData.quizzes, null, 2),
      'utf-8'
    );
    console.log(`✅ Created ${mockData.quizzes.length} quizzes`);

    // Write assignments
    await writeFile(
      join(dataDir, 'assignments.json'),
      JSON.stringify(mockData.assignments, null, 2),
      'utf-8'
    );
    console.log(`✅ Created ${mockData.assignments.length} assignments`);

    // Write grades
    await writeFile(
      join(dataDir, 'grades.json'),
      JSON.stringify(mockData.grades, null, 2),
      'utf-8'
    );
    console.log(`✅ Created ${mockData.grades.length} grades`);

    // Write quiz submissions
    await writeFile(
      join(dataDir, 'quiz-submissions.json'),
      JSON.stringify(mockData.quizSubmissions, null, 2),
      'utf-8'
    );
    console.log(`✅ Created ${mockData.quizSubmissions.length} quiz submissions`);

    // Write assignment submissions
    await writeFile(
      join(dataDir, 'assignment-submissions.json'),
      JSON.stringify(mockData.assignmentSubmissions, null, 2),
      'utf-8'
    );
    console.log(`✅ Created ${mockData.assignmentSubmissions.length} assignment submissions`);

    // Write session requests
    await writeFile(
      join(dataDir, 'session-requests.json'),
      JSON.stringify(mockData.sessionRequests, null, 2),
      'utf-8'
    );
    console.log(`✅ Created ${mockData.sessionRequests.length} session requests`);

    // Create empty messages file
    await writeFile(
      join(dataDir, 'messages.json'),
      JSON.stringify([], null, 2),
      'utf-8'
    );
    console.log('✅ Created messages.json (empty)');

    // Create empty conversations file
    await writeFile(
      join(dataDir, 'conversations.json'),
      JSON.stringify([], null, 2),
      'utf-8'
    );
    console.log('✅ Created conversations.json (empty)');

    // Create empty analytics file
    await writeFile(
      join(dataDir, 'analytics.json'),
      JSON.stringify({
        totalUsers: mockData.users.length,
        totalSessions: mockData.sessions.length,
        totalTutors: mockData.users.filter(u => u.role === 'tutor').length,
        totalStudents: mockData.users.filter(u => u.role === 'student').length,
        lastUpdated: new Date().toISOString()
      }, null, 2),
      'utf-8'
    );
    console.log('✅ Created analytics.json');

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Users: ${mockData.users.length}`);
    console.log(`   - Students: ${mockData.users.filter(u => u.role === 'student').length}`);
    console.log(`   - Tutors: ${mockData.users.filter(u => u.role === 'tutor').length}`);
    console.log(`   - Management: ${mockData.users.filter(u => u.role === 'management').length}`);
    console.log(`   - Sessions: ${mockData.sessions.length}`);
    console.log(`   - Classes: ${mockData.classes.length}`);
    console.log(`   - Enrollments: ${mockData.enrollments.length}`);
    console.log(`   - Course Contents: ${mockData.courseContents.length}`);
    console.log(`   - Quizzes: ${mockData.quizzes.length}`);
    console.log(`   - Assignments: ${mockData.assignments.length}`);
    console.log(`   - Grades: ${mockData.grades.length}`);
    console.log(`   - Quiz Submissions: ${mockData.quizSubmissions.length}`);
    console.log(`   - Assignment Submissions: ${mockData.assignmentSubmissions.length}`);
    console.log(`   - Session Requests: ${mockData.sessionRequests.length}`);
    console.log(`   - Evaluations: ${mockData.evaluations.length}`);
    console.log(`   - Progress Entries: ${mockData.progress.length}`);
    console.log(`   - Library Resources: ${mockData.library.length}`);
    console.log(`   - Forum Posts: ${mockData.forum.posts.length}`);
    console.log(`   - Forum Comments: ${mockData.forum.comments.length}`);
    console.log(`   - Notifications: ${mockData.notifications.length}`);
    console.log(`   - Availability: ${mockData.availability.length}`);
    console.log(`   - Approval Requests: ${mockData.approvals.length}`);
    console.log('\n📝 Default password for all users: password123');
    console.log('📝 Default password for management: admin123\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Always run seed when this file is imported/executed
seed().catch(console.error);

export default seed;

