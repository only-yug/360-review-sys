'use strict';

/**
 * Seeds the default 11 skills with their employee and manager weights.
 * This ensures the system is ready to use out-of-the-box without admin setup.
 * 
 * Idempotent: skips any skill whose name already exists in the table.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const defaultSkills = [
      { skill_name: 'Technical Knowledge',        category: 'technical',     weight_employee: 16, weight_manager: 12 },
      { skill_name: 'Problem Solving',             category: 'technical',     weight_employee: 14, weight_manager: 14 },
      { skill_name: 'Code / Work Quality',         category: 'technical',     weight_employee: 12, weight_manager:  8 },
      { skill_name: 'Ownership & Accountability',  category: 'non_technical', weight_employee:  6, weight_manager: 12 },
      { skill_name: 'Learning Ability',            category: 'technical',     weight_employee: 12, weight_manager:  8 },
      { skill_name: 'Leadership',                  category: 'non_technical', weight_employee:  2, weight_manager: 14 },
      { skill_name: 'Communication',               category: 'non_technical', weight_employee: 10, weight_manager: 10 },
      { skill_name: 'Teamwork',                    category: 'non_technical', weight_employee:  8, weight_manager:  6 },
      { skill_name: 'Time Management',             category: 'non_technical', weight_employee:  8, weight_manager:  8 },
      { skill_name: 'Punctuality',                 category: 'non_technical', weight_employee:  6, weight_manager:  4 },
      { skill_name: 'Attendance',                  category: 'non_technical', weight_employee:  6, weight_manager:  4 },
    ];

    // Check which skills already exist to make the seeder idempotent
    const [existingSkills] = await queryInterface.sequelize.query(
      `SELECT skill_name FROM skills WHERE deleted_at IS NULL`
    );

    const existingNames = new Set(existingSkills.map(s => s.skill_name));

    const skillsToInsert = defaultSkills
      .filter(skill => !existingNames.has(skill.skill_name))
      .map(skill => ({
        ...skill,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      }));

    if (skillsToInsert.length === 0) {
      console.log('\n⚠  [Seed] All default skills already exist. Skipping.\n');
      return;
    }

    await queryInterface.bulkInsert('skills', skillsToInsert);

    console.log(`\n✓  [Seed] ${skillsToInsert.length} default skill(s) seeded successfully.`);
    console.log('-----------------------------------');
    skillsToInsert.forEach(s => {
      console.log(`  • ${s.skill_name.padEnd(30)} | Emp: ${String(s.weight_employee).padStart(2)} | Mgr: ${String(s.weight_manager).padStart(2)}`);
    });
    console.log('-----------------------------------\n');
  },

  down: async (queryInterface, Sequelize) => {
    const defaultSkillNames = [
      'Technical Knowledge',
      'Problem Solving',
      'Code / Work Quality',
      'Ownership & Accountability',
      'Learning Ability',
      'Leadership',
      'Communication',
      'Teamwork',
      'Time Management',
      'Punctuality',
      'Attendance',
    ];

    await queryInterface.bulkDelete('skills', {
      skill_name: defaultSkillNames,
    });

    console.log('\n✓  [Seed] Default skills removed.\n');
  },
};
