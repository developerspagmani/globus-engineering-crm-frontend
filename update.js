const fs = require('fs');
const path = 'd:/globus-engineering-crm-backend/src/controllers/emailReminderController.ts';

let content = fs.readFileSync(path, 'utf8');

const target1 = `      const milestoneAlreadySent = await prisma.emailLog.findFirst({
        where: {
          reminderType: \`lead_visit_\${lead.id}\`
        }
      });
      if (milestoneAlreadySent) continue;

      const salesPerson = await prisma.user.findUnique({
        where: { id: lead.agent_id }
      });

      if (!salesPerson || !salesPerson.email) continue;

      const visitDateStr = lead.next_visit_date ? new Date(lead.next_visit_date).toLocaleDateString('en-GB') : 'Tomorrow';`;

const replacement1 = `      const visitDateStr = lead.next_visit_date ? new Date(lead.next_visit_date).toLocaleDateString('en-GB') : 'Tomorrow';
      const reminderUniqueKey = \`lead_visit_\${lead.id}_\${visitDateStr}\`;

      const milestoneAlreadySent = await prisma.emailLog.findFirst({
        where: {
          reminderType: reminderUniqueKey
        }
      });
      if (milestoneAlreadySent) continue;

      const salesPerson = await prisma.user.findUnique({
        where: { id: lead.agent_id }
      });

      if (!salesPerson || !salesPerson.email) continue;`;

content = content.replace(target1, replacement1);

const target2 = 'reminderType: `lead_visit_${lead.id}`';
const replacement2 = 'reminderType: reminderUniqueKey';
content = content.replace(target2, replacement2);

fs.writeFileSync(path, content);
console.log('Update successful');
