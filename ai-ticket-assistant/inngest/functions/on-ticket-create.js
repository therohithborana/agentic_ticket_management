import { inngest } from "../client.js";
import Ticket from "../../models/ticket.js";
import User from "../../models/user.js";
import { NonRetriableError } from "inngest";
import { sendMail } from "../../utils/mailer.js";
import analyzeTicket from "../../utils/ai.js";

export const onTicketCreated = inngest.createFunction(
  { id: "on-ticket-created", retries: 2 },
  { event: "ticket/created" },
  async ({ event, step }) => {
    try {
      const { ticketId } = event.data;

      //fetch ticket from DB
      const ticketObject = await step.run("fetch-ticket", async () => {
        const foundTicket = await Ticket.findById(ticketId);
        if (!foundTicket) {
          throw new NonRetriableError("Ticket not found");
        }
        return foundTicket;
      });

      await step.run("update-ticket-status", async () => {
        await Ticket.findByIdAndUpdate(ticketObject._id, { status: "TODO" });
      });

      const aiResponse = await analyzeTicket(ticketObject);

      const relatedskills = await step.run("ai-processing", async () => {
        let skills = [];
        if (aiResponse) {
          await Ticket.findByIdAndUpdate(ticketObject._id, {
            priority: !["low", "medium", "high"].includes(aiResponse.priority)
              ? "medium"
              : aiResponse.priority,
            helpfulNotes: aiResponse.helpfulNotes,
            status: "IN_PROGRESS",
            relatedSkills: aiResponse.relatedSkills,
          });
          skills = aiResponse.relatedSkills;
        }
        return skills;
      });

      const moderator = await step.run("assign-moderator", async () => {
        let user = await User.findOne({
          role: "moderator",
          skills: {
            $elemMatch: {
              $regex: relatedskills.join("|"),
              $options: "i",
            },
          },
        });
        if (!user) {
          user = await User.findOne({
            role: "admin",
          });
        }
        await Ticket.findByIdAndUpdate(ticketObject._id, {
          assignedTo: user?._id || null,
        });
        return user;
      });

      await step.run("send-email-notification", async () => {
        if (moderator) {
          const finalTicket = await Ticket.findById(ticketObject._id).populate('createdBy', 'email');
          const emailContent = `
New Ticket Assigned to You

Ticket Details:
---------------
Title: ${finalTicket.title}
Description: ${finalTicket.description}
Priority: ${finalTicket.priority}
Status: ${finalTicket.status}
Created By: ${finalTicket.createdBy?.email || 'Unknown'}
Created At: ${new Date(finalTicket.createdAt).toLocaleString()}

AI Analysis:
-----------
Summary: ${aiResponse?.summary || 'Not available'}
Required Skills: ${finalTicket.relatedSkills?.join(', ') || 'Not specified'}

Helpful Notes for Resolution:
---------------------------
${finalTicket.helpfulNotes || 'No additional notes available'}

You can view the full ticket details and respond at: ${process.env.APP_URL}/tickets/${finalTicket._id}
`;

          await sendMail(
            moderator.email,
            `[${finalTicket.priority.toUpperCase()}] New Ticket Assigned: ${finalTicket.title}`,
            emailContent
          );
        }
      });

      return { success: true };
    } catch (err) {
      console.error("❌ Error running the step", err.message);
      return { success: false };
    }
  }
);
