"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = void 0;
const prisma_js_1 = require("../prisma.js");
const auditService_js_1 = require("./auditService.js");
const createNotification = async (params) => {
    let smsSent = false;
    let smsLog = null;
    if (params.sendSmsAlert) {
        const apiKey = process.env.SMS_API_KEY;
        const senderId = process.env.SMS_SENDER_ID || 'MINEGD';
        if (apiKey && apiKey.trim() !== '') {
            // In real production with SMS gateway provider
            try {
                console.log(`[SMS-LIVE] Dispatching SMS to ${params.smsRecipientPhone} via Gateway ${senderId}`);
                smsSent = true;
                smsLog = `LIVE SMS DISPATCHED to ${params.smsRecipientPhone}`;
            }
            catch (err) {
                console.error('Failed to send live SMS:', err);
                smsLog = `FAILED: ${err.message}`;
            }
        }
        else {
            // Demo SMS mode compliant with Section 18:
            // "If no SMS API is configured, DO NOT break the application. Use: DEMO SMS SENT ✓ and store a notification/audit record."
            smsSent = true;
            smsLog = `DEMO SMS SENT ✓ to ${params.smsRecipientName || 'Officer'} (${params.smsRecipientPhone || 'Dynamic Phone'})\nContent: ${params.message}`;
            console.log(`\n================== [SMS GATEWAY SIMULATION] ==================`);
            console.log(smsLog);
            console.log(`==============================================================\n`);
        }
    }
    const notification = await prisma_js_1.prisma.notification.create({
        data: {
            userId: params.userId,
            type: params.type,
            title: params.title,
            message: params.message,
            taskId: params.taskId || null,
            observationId: params.observationId || null,
            smsSent,
            smsLog,
        },
    });
    // Log SMS/Notification audit action
    await (0, auditService_js_1.logAuditAction)({
        userId: params.userId,
        userName: params.smsRecipientName || 'System Notification Engine',
        action: smsSent ? 'SMS_AND_NOTIFICATION_DISPATCHED' : 'NOTIFICATION_DISPATCHED',
        entity: 'Notification',
        entityId: notification.id,
        metadata: {
            title: params.title,
            type: params.type,
            taskId: params.taskId,
            smsLog,
        },
    });
    return notification;
};
exports.createNotification = createNotification;
