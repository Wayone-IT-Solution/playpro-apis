type TemplateContext = Record<string, string | number>;

interface NotificationTemplate {
  title: string | number;
  message: string | number;
}

interface DualNotificationTemplate {
  sender: (ctx?: TemplateContext) => NotificationTemplate;
  receiver: (ctx?: TemplateContext) => NotificationTemplate;
}

export const NotificationMessages: Record<string, DualNotificationTemplate> = {
  "bill-uploaded": {
    sender: (ctx) => ({
      title: "Bill Uploaded",
      message: `You've uploaded a bill worth ₹${ctx?.amount}. It is under review.`,
    }),
    receiver: (ctx) => ({
      title: "New Bill Submission",
      message: `${ctx?.userName} submitted a bill of ₹${ctx?.amount}. Please verify.`,
    }),
  },

  "all-videos-completed": {
    sender: (ctx) => ({
      title: "All Videos Completed 🎉",
      message: `You've completed all videos for a ₹${ctx?.billAmount} bill. ${ctx?.points} points credited to your account.`,
    }),
    receiver: (ctx) => ({
      title: "All Videos Done",
      message: `${ctx?.userName} completed all videos for bill of ₹${ctx?.billAmount}. ${ctx?.points} points credited.`,
    }),
  },

  "withdrawal-requested": {
    sender: (ctx) => ({
      title: "Withdrawal Request",
      message: `You requested withdrawal of ₹${ctx?.amount}. Awaiting admin approval.`,
    }),
    receiver: (ctx) => ({
      title: "New Withdrawal Request",
      message: `${ctx?.userName} requested ₹${ctx?.amount} withdrawal.`,
    }),
  },

  "transaction-approved": {
    sender: (ctx) => ({
      title: "Withdrawal Approved ✅",
      message: `Your withdrawal of ₹${ctx?.amount} has been approved.`,
    }),
    receiver: (ctx) => ({
      title: "Withdrawal Approved",
      message: `Approved ₹${ctx?.amount} for ${ctx?.userName}.`,
    }),
  },
};
