const fs = require('fs');
const path = 'd:/globus-engineering-crm-backend/src/controllers/emailReminderController.ts';

let content = fs.readFileSync(path, 'utf8');

const correctCode = `    for (const lead of leads) {
      if (!lead.agent_id) continue;

      const visitDateStr = lead.next_visit_date ? new Date(lead.next_visit_date).toLocaleDateString('en-GB') : 'Tomorrow';
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

      if (!salesPerson || !salesPerson.email) continue;

      const subject = \`[Reminder] Upcoming Lead Visit Tomorrow - \${lead.name}\`;`;

// We use regex to replace the whole block from "for (const lead of leads) {" up to "const subject ="

const regex = /for\s*\(const\s*lead\s*of\s*leads\)\s*\{[\s\S]*?(?=const\s*subject\s*=\s*`\[Reminder\])/m;
content = content.replace(regex, correctCode);

// Also fix the create block at the bottom
const regexCreate = /reminderType:\s*`lead_visit_\$\{lead\.id\}`/g;
content = content.replace(regexCreate, 'reminderType: reminderUniqueKey');

fs.writeFileSync(path, content);
console.log('Fixed successfully');
