"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAuditAction = void 0;
const prisma_js_1 = require("../prisma.js");
const logAuditAction = async (params) => {
    try {
        return await prisma_js_1.prisma.auditLog.create({
            data: {
                userId: params.userId || null,
                userName: params.userName || 'System / Automated Engine',
                action: params.action,
                entity: params.entity,
                entityId: params.entityId,
                previousStateJson: params.previousState ? JSON.stringify(params.previousState) : null,
                newStateJson: params.newState ? JSON.stringify(params.newState) : null,
                metadataJson: params.metadata ? JSON.stringify(params.metadata) : null,
            },
        });
    }
    catch (error) {
        console.error('Failed to create audit log:', error);
        return null;
    }
};
exports.logAuditAction = logAuditAction;
