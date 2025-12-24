import nodemailer from 'nodemailer';

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM
  } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: SMTP_SECURE === 'true', // true for 465, false for others
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
    // record a default from address for this transporter
    transporter.defaultFrom = SMTP_FROM || `"College Management" <${SMTP_USER}>`;
  } else {
    // If transporter isn't configured from env, create an Ethereal test account
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      transporter.defaultFrom = SMTP_FROM || `"College Management" <${testAccount.user}>`;
      console.info('No SMTP config found — using Ethereal test account for emails');
    } catch (err) {
      console.warn('Email not sent: SMTP configuration is missing and test account creation failed');
      console.error(err);
      return null;
    }
  }
  return transporter;
};

const sendEmailSafe = async (options) => {
  const mailTransport = await getTransporter();

  if (!mailTransport) return;

  try {
    const info = await mailTransport.sendMail({
      from: mailTransport.defaultFrom || `"College Management" <no-reply@example.com>`,
      ...options
    });

    // If using preview (Ethereal) logic check
    // If the host is smtp.ethereal.email, it's a test account
    if (mailTransport.transporter.host === 'smtp.ethereal.email' || info.messageId.includes('ethereal')) {
      try {
        const preview = nodemailer.getTestMessageUrl(info);
        if (preview) console.info('Preview email at:', preview);
      } catch (e) { }
    }
  } catch (err) {
    console.error('Error sending email:', err.message || err);
  }
};

export const sendFineEmail = async (student, fine) => {
  if (!student?.email) return;

  const subject = `Notice: Fine Imposed - ${fine.department.toUpperCase()} Department`;
  const text = `
Dear ${student.name},

A fine has been imposed on your account by the ${fine.department} department.

Details:
Amount: ₹${fine.amount}
Reason: ${fine.reason}
Date: ${new Date().toLocaleDateString()}

Please log in to the portal to review and clear this due immediately.

Regards,
College Management System
`.trim();

  const html = `
    <div style="font-family: 'Merriweather', serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
      <div style="text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 15px; margin-bottom: 20px;">
        <h2 style="color: #4338ca; margin: 0; font-family: 'Merriweather', serif;">Official Fine Notice</h2>
        <p style="color: #64748b; font-size: 0.9em; margin-top: 5px;">${fine.department.toUpperCase()} DEPARTMENT</p>
      </div>

      <p style="color: #334155; font-size: 16px;">Dear <strong>${student.name}</strong>,</p>
      <p style="color: #334155; line-height: 1.6;">This is an official notification that a fine has been imposed on your account. Please find the details below:</p>
      
      <div style="background-color: #fff; padding: 20px; border-radius: 6px; border-left: 4px solid #ef4444; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; width: 100px;"><strong>Amount:</strong></td>
            <td style="padding: 8px 0; color: #dc2626; font-size: 18px; font-weight: bold;">₹${fine.amount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;"><strong>Reason:</strong></td>
            <td style="padding: 8px 0; color: #334155;">${fine.reason}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;"><strong>Date:</strong></td>
            <td style="padding: 8px 0; color: #334155;">${new Date().toLocaleDateString()}</td>
          </tr>
          <tr>
             <td style="padding: 8px 0; color: #64748b;"><strong>Status:</strong></td>
             <td style="padding: 8px 0;"><span style="background-color: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase;">${fine.status}</span></td>
          </tr>
        </table>
      </div>

      <p style="color: #334155;">Please log in to your student portal to pay this fine immediately.</p>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="http://localhost:5173/student" style="background-color: #4f46e5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-family: sans-serif;">Login to Portal</a>
      </div>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 30px;">
      <p style="color: #94a3b8; font-size: 0.8em; text-align: center; font-family: sans-serif;">College Management System • Automated Notification</p>
    </div>
  `;

  await sendEmailSafe({
    to: student.email,
    subject,
    text,
    html
  });
};

export const sendHostelAllotmentEmail = async (student, allotment) => {
  if (!student?.email) return;

  const room = allotment.room;
  const subject = `Hostel room allotment ${allotment.status}`;
  const statusLine =
    allotment.status === 'approved'
      ? 'Your hostel room allotment request has been approved.'
      : allotment.status === 'rejected'
        ? 'Your hostel room allotment request has been rejected.'
        : `Your hostel room allotment status is: ${allotment.status}.`;

  const roomLine =
    allotment.status === 'approved' && room
      ? `\nRoom: ${room.roomNumber}, Block: ${room.block}, Floor: ${room.floor}\n`
      : '';

  const text = `
Dear ${student.name},

${statusLine}
${roomLine}

Please log in to the portal for more details.

Regards,
College Management System
`.trim();

  await sendEmailSafe({
    to: student.email,
    subject,
    text
  });
};

export const sendOtpEmail = async (email, otp) => {
  const subject = 'Your Verification OTP - College Management System';
  const text = `
Your One-Time Password (OTP) for verification is: ${otp}

This OTP is valid for 10 minutes.

If you did not request this, please ignore this email.
`.trim();

  await sendEmailSafe({
    to: email,
    subject,
    text
  });
};

export const sendGatepassInfoToStudent = async (studentEmail, studentName, gatepassDetails) => {
  const subject = `Gatepass Request Submitted`;
  const text = `
Dear ${studentName},

Your gatepass request has been successfully submitted.

Details:
From: ${new Date(gatepassDetails.fromDate).toLocaleString()}
To: ${new Date(gatepassDetails.toDate).toLocaleString()}
Reason: ${gatepassDetails.reason}

Status: Pending Parent Approval

Regards,
College Management System
`.trim();

  await sendEmailSafe({
    to: studentEmail,
    subject,
    text
  });
};

export const sendGatepassRequestToParent = async (parentEmail, studentName, gatepassId, approvalLink, rejectionLink, gatepassDetails) => {
  const subject = `Gatepass Request Approval for ${studentName}`;
  const text = `
Dear Parent/Guardian,

Your ward ${studentName} has requested a gatepass.

Request Details:
From: ${new Date(gatepassDetails.fromDate).toLocaleString()}
To: ${new Date(gatepassDetails.toDate).toLocaleString()}
Reason: ${gatepassDetails.reason}

Please review the request and take action:

To APPROVE, visit: ${approvalLink}
To REJECT, visit: ${rejectionLink}

Regards,
College Management System
`.trim();

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Gatepass Request Approval</h2>
      <p>Dear Parent/Guardian,</p>
      <p>Your ward <strong>${studentName}</strong> has requested a gatepass.</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Request Details</h3>
        <p><strong>From:</strong> ${new Date(gatepassDetails.fromDate).toLocaleString()}</p>
        <p><strong>To:</strong> ${new Date(gatepassDetails.toDate).toLocaleString()}</p>
        <p><strong>Reason:</strong> ${gatepassDetails.reason}</p>
      </div>

      <p>Please review the request and click one of the buttons below to take action:</p>

      <div style="display: flex; gap: 20px; margin: 30px 0;">
        <a href="${approvalLink}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
          Approve Request
        </a>
        <a href="${rejectionLink}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
          Reject Request
        </a>
      </div>

      <p style="font-size: 0.9em; color: #666;">
        If the buttons above do not work, you can copy and paste the following links into your browser:<br>
        Approve: ${approvalLink}<br>
        Reject: ${rejectionLink}
      </p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin-top: 30px;">
      <p style="color: #888; font-size: 0.8em; text-align: center;">College Management System</p>
    </div>
  `;

  await sendEmailSafe({
    to: parentEmail,
    subject,
    text,
    html
  });
};

export const sendGatepassRequestToWarden = async (wardenEmail, studentName, gatepassDetails, approvalLink, rejectionLink) => {
  const subject = `Gatepass Request Pending Action: ${studentName}`;
  const text = `
Dear Warden,

A gatepass request for ${studentName} has been approved by their parent and is now pending your approval.

Request Details:
From: ${new Date(gatepassDetails.fromDate).toLocaleString()}
To: ${new Date(gatepassDetails.toDate).toLocaleString()}
Reason: ${gatepassDetails.reason}

Please review the request and take action:

To APPROVE, click here: ${approvalLink}
To REJECT, click here: ${rejectionLink}

Regards,
College Management System
`.trim();

  await sendEmailSafe({
    to: wardenEmail,
    subject,
    text: text + `\n\n(Note: If links are not clickable, copy and paste them into your browser)`
  });
};

export const sendGatepassStatusToStudent = async (studentEmail, status, rejectionReason = '') => {
  const subject = `Gatepass Request Update: ${status}`;
  const text = `
Your gatepass request status has been updated to: ${status}

${rejectionReason ? `Reason: ${rejectionReason}` : ''}

Regards,
College Management System
`.trim();

  await sendEmailSafe({
    to: studentEmail,
    subject,
    text
  });
};


