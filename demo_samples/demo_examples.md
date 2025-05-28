# Demo Email Examples - Task & Follow-up Extraction

## 📧 **Sample Emails for Task Extraction Demo**

### **Email 1: Project Management Email**
```
From: sarah.johnson@designstudio.com
To: you@company.com
Subject: Website Redesign Project - Next Steps Required
Date: May 25, 2025, 2:30 PM

Hi there,

Hope you're doing well! I wanted to follow up on our website redesign discussion from last week.

We need to finalize the homepage wireframes by June 5th to stay on schedule. Could you please review the attached mockups and provide your feedback by Wednesday? 

Also, we'll need the company logo files in high resolution (vector format preferred) and the brand guidelines document. The design team is waiting on these assets to proceed with the color scheme.

Don't forget to schedule a meeting with the development team for next Friday to discuss technical requirements. They mentioned they need at least 2 hours to go through everything.

Let me know if you have any questions!

Best,
Sarah Johnson
Lead Designer
Design Studio Inc.
```

**Expected AI Extraction:**
- **Task 1:** Review homepage wireframes and provide feedback (Due: May 28)
- **Task 2:** Provide company logo files in vector format (Due: May 28)
- **Task 3:** Send brand guidelines document (Due: May 28)
- **Task 4:** Schedule meeting with development team (Due: May 30)

---

### **Email 2: Client Request Email**
```
From: michael.chen@abccorp.com
To: you@company.com
Subject: Urgent: Q2 Financial Report Needed
Date: May 26, 2025, 9:15 AM

Good morning,

I hope this email finds you well. As we're approaching the end of Q2, we need to prepare our quarterly financial report for the board meeting on June 15th.

Can you please compile the following by June 1st:
- Revenue analysis for April-June 2025
- Expense breakdown by department
- Comparison with Q1 2025 and Q2 2024
- Cash flow projections for Q3

The CFO specifically requested that we include the marketing ROI analysis this time, so please make sure to get those numbers from the marketing team.

Also, could you prepare a PowerPoint presentation summarizing the key findings? The board prefers visual data representation, so please include charts and graphs.

This is high priority as the board meeting cannot be delayed. Please confirm receipt and your availability to complete this by the deadline.

Thanks in advance for your help on this.

Best regards,
Michael Chen
Finance Director
ABC Corporation
```

**Expected AI Extraction:**
- **Task 1:** Compile Q2 revenue analysis (Due: June 1, Priority: High)
- **Task 2:** Create expense breakdown by department (Due: June 1, Priority: High)
- **Task 3:** Prepare Q1/Q2 comparison analysis (Due: June 1, Priority: High)
- **Task 4:** Generate Q3 cash flow projections (Due: June 1, Priority: High)
- **Task 5:** Get marketing ROI data from marketing team (Due: May 30, Priority: High)
- **Task 6:** Create PowerPoint presentation with charts (Due: June 1, Priority: High)

---

### **Email 3: Simple Task Email**
```
From: lisa.park@vendor.com
To: you@company.com
Subject: Contract Review Required
Date: May 26, 2025, 11:45 AM

Hi,

Could you please review the attached service contract and send back your comments by Thursday? 

We need to finalize this before the weekend so we can start the project on Monday.

Thanks!

Lisa Park
Account Manager
Vendor Solutions
```

**Expected AI Extraction:**
- **Task 1:** Review service contract and provide comments (Due: May 29, Priority: Medium)

---

## 📧 **Sample Emails for Follow-up Extraction Demo**

### **Email 4: Client Proposal Response**
```
From: jennifer.martinez@techcorp.com
To: you@company.com
Subject: Re: Digital Transformation Project Proposal
Date: May 24, 2025, 4:20 PM

Hello,

Thank you for the comprehensive proposal you sent last week. The team and I have had a chance to review it, and we're very impressed with your approach.

We're currently evaluating proposals from three vendors, and yours is definitely a strong contender. The AI integration component you've proposed is particularly interesting and aligns well with our strategic goals.

I need to discuss the budget allocation with our finance team, as the $150,000 investment requires board approval. We should have a decision by early next week, and I'll reach out to you with our feedback.

Could you clarify one thing about the timeline? You mentioned 6 months for completion - is there any flexibility if we need to expedite certain phases?

I'll be in touch soon with our decision.

Best regards,
Jennifer Martinez
CTO
TechCorp Industries
```

**Expected AI Follow-up Detection:**
- **Follow-up Needed:** YES
- **Reason:** Client is reviewing proposal and promised decision by early next week
- **Suggested Due Date:** June 2, 2025
- **Key Points:** Budget requires board approval, timeline flexibility question, competing with 2 other vendors
- **Priority:** High

---

### **Email 5: Job Interview Follow-up**
```
From: hr@startupxyz.com
To: you@company.com
Subject: Thank you for interviewing with StartupXYZ
Date: May 24, 2025, 6:30 PM

Dear Candidate,

Thank you for taking the time to interview for the Senior Developer position yesterday. It was great meeting you and learning about your experience with React and Node.js.

The team was impressed with your portfolio, especially the e-commerce platform you built. Your approach to handling scalability challenges shows great technical depth.

We're still in the process of interviewing candidates and will be making our decision within the next 3-5 business days. We'll reach out to you with an update regardless of the outcome.

If you have any questions in the meantime, please don't hesitate to reach out.

Best regards,
David Park
HR Manager
StartupXYZ
```

**Expected AI Follow-up Detection:**
- **Follow-up Needed:** YES
- **Reason:** HR promised update within 3-5 business days after interview
- **Suggested Due Date:** May 29, 2025
- **Key Points:** Interview went well, decision pending, 3-5 day timeline given
- **Priority:** Medium

---

### **Email 6: Vendor Information Request**
```
From: you@company.com
To: sales@cloudservice.com
Subject: Enterprise SaaS Pricing Request
Date: May 22, 2025, 10:00 AM

Hello,

We're evaluating cloud services for our growing team and are interested in your enterprise plan. 

Could you please provide detailed pricing information for:
- 500+ user licenses
- Integration capabilities with Salesforce CRM
- Annual vs monthly payment options
- Any custom features for large enterprises

We're looking to make a decision by the end of June, so any information you can provide soon would be greatly appreciated.

Best regards,
[Your Name]
```

**Expected Response (for follow-up demo):**
```
From: amanda.foster@cloudservice.com
To: you@company.com
Subject: Re: Enterprise SaaS Pricing Request
Date: May 22, 2025, 2:15 PM

Hi,

Thanks for your interest in our enterprise solution! 

I've received your requirements and they look great. Our enterprise plan would be perfect for your needs, especially with the Salesforce integration you mentioned.

I need to loop in our technical team to provide accurate pricing for the custom features you're looking for. They're currently reviewing similar implementations and should have feedback by early next week.

I'll send over the detailed pricing breakdown and integration specifications as soon as I hear back from them.

Looking forward to working together!

Best,
Amanda Foster
Enterprise Sales
CloudService Solutions
```

**Expected AI Follow-up Detection:**
- **Follow-up Needed:** YES
- **Reason:** Vendor promised detailed pricing by early next week but hasn't delivered
- **Suggested Due Date:** May 27, 2025
- **Key Points:** Waiting for technical team input, pricing for 500+ users needed, Salesforce integration
- **Priority:** Medium

---

### **Email 7: Meeting Follow-up**
```
From: robert.kim@bigtech.com
To: you@company.com
Subject: Great meeting today - Next steps
Date: May 25, 2025, 3:45 PM

Hi,

It was fantastic meeting with you today to discuss the potential partnership opportunity. I'm excited about the possibilities for collaboration between our companies.

The co-marketing approach you outlined makes a lot of sense, and I think there's real potential for mutual benefit here. The revenue-sharing model you proposed is interesting, though I'll need to run it by our finance team to see how it fits with our existing partnerships.

I'd like to set up a follow-up call next week to dive deeper into the technical integration requirements. My team will need to understand the API capabilities and data-sharing protocols.

Would you be available for a call next Tuesday or Wednesday? I'll send over some technical questions beforehand so we can make the most of our time.

I'm optimistic about moving this forward!

Best,
Robert Kim
VP of Partnerships
BigTech Corp
```

**Expected AI Follow-up Detection:**
- **Follow-up Needed:** YES
- **Reason:** Partner wants to schedule follow-up call for next week and will send technical questions
- **Suggested Due Date:** May 30, 2025
- **Key Points:** Positive interest, needs finance approval, technical integration discussion needed
- **Priority:** High

---

### **Email 8: Customer Support Issue**
```
From: operations@retailclient.com
To: support@company.com
Subject: URGENT: Production System Down - Immediate Assistance Required
Date: May 26, 2025, 2:00 PM

URGENT - HIGH PRIORITY

Our production system has been down since 2:00 PM EST today, affecting our entire e-commerce platform. This is causing significant revenue loss as we process over 10,000 transactions daily.

We've activated our backup systems, but customers are still experiencing issues with checkout and order processing. Our IT team has been troubleshooting, but we need your immediate assistance as this appears to be related to the recent update you deployed.

Can you please:
1. Investigate the issue immediately
2. Provide hourly updates on your progress
3. Escalate to your senior engineering team
4. Provide ETA for resolution

This is affecting our biggest sales day of the month. Our CEO is directly involved and expects constant communication.

Please call me immediately at (555) 123-4567.

Lisa Chen
Operations Director
RetailClient Inc.
```

**Expected AI Follow-up Detection:**
- **Follow-up Needed:** YES
- **Reason:** Critical system outage requiring immediate investigation and hourly updates
- **Suggested Due Date:** May 26, 2025 (immediate)
- **Key Points:** Production down since 2 PM, $50K/hour revenue impact, CEO involved, hourly updates required
- **Priority:** URGENT

---

## 🎯 **Demo Instructions**

### **Task Extraction Demo Flow:**
1. **Show Email 1 (Website Redesign)** - Demonstrate multiple task extraction
2. **Show Email 2 (Financial Report)** - Complex task breakdown with priorities
3. **Show Email 3 (Contract Review)** - Simple task extraction

### **Follow-up Detection Demo Flow:**
1. **Show Email 4 (Client Proposal)** - Business development follow-up
2. **Show Email 5 (Job Interview)** - HR communication follow-up
3. **Show Email 6-Response (Vendor)** - Vendor follow-up tracking
4. **Show Email 7 (Partnership)** - Strategic meeting follow-up
5. **Show Email 8 (Support Issue)** - Urgent customer follow-up

### **Demo Script:**
1. **"Let me show you how our AI extracts tasks from emails automatically..."**
2. **"Watch as the system identifies deadlines, priorities, and action items..."**
3. **"Now let's see follow-up detection - the AI analyzes conversation context..."**
4. **"Notice how it suggests appropriate due dates and identifies key points..."**

### **Key Features to Highlight:**
- ✅ Automatic deadline detection
- ✅ Priority level assignment
- ✅ Multiple task extraction from single email
- ✅ Context-aware follow-up detection
- ✅ Key points identification
- ✅ Appropriate due date suggestions
- ✅ Priority assignment based on urgency