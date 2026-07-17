import type { Request, Response } from 'express';
import * as service from './leads.service.js';
import { ok, created, noContent } from '../../utils/respond.js';
import { audit, clientIp } from '../../utils/audit.js';

function actor(req: Request) {
  return { id: req.user!.id, role: req.user!.role };
}

export async function list(req: Request, res: Response) {
  const result = await service.list(req.query, actor(req));
  return ok(res, result);
}

export async function getOne(req: Request, res: Response) {
  const lead = await service.getById(Number(req.params.id), actor(req));
  return ok(res, lead);
}

export async function create(req: Request, res: Response) {
  const lead = await service.create(req.body, actor(req));
  audit({ actorId: req.user!.id, action: 'lead.create', entityType: 'lead', entityId: (lead as any)?.id, ip: clientIp(req) });
  return created(res, lead);
}

export async function update(req: Request, res: Response) {
  const lead = await service.update(Number(req.params.id), req.body, actor(req));
  audit({ actorId: req.user!.id, action: 'lead.update', entityType: 'lead', entityId: req.params.id, ip: clientIp(req) });
  return ok(res, lead);
}

export async function changeStatus(req: Request, res: Response) {
  const lead = await service.changeStatus(Number(req.params.id), req.body.status, req.body.lostReason ?? null, actor(req));
  audit({ actorId: req.user!.id, action: 'lead.status', entityType: 'lead', entityId: req.params.id, ip: clientIp(req), meta: { status: req.body.status } });
  return ok(res, lead);
}

export async function assign(req: Request, res: Response) {
  const lead = await service.assign(Number(req.params.id), req.body.assignedTo, actor(req));
  audit({ actorId: req.user!.id, action: 'lead.assign', entityType: 'lead', entityId: req.params.id, ip: clientIp(req), meta: { assignedTo: req.body.assignedTo } });
  return ok(res, lead);
}

export async function addActivity(req: Request, res: Response) {
  const lead = await service.addActivity(Number(req.params.id), req.body, actor(req));
  return created(res, lead);
}

export async function remove(req: Request, res: Response) {
  await service.remove(Number(req.params.id), actor(req));
  audit({ actorId: req.user!.id, action: 'lead.delete', entityType: 'lead', entityId: req.params.id, ip: clientIp(req) });
  return noContent(res);
}

export async function bulk(req: Request, res: Response) {
  const result = await service.bulk(req.body, actor(req));
  audit({ actorId: req.user!.id, action: `lead.bulk.${req.body.action}`, entityType: 'lead', ip: clientIp(req), meta: { count: req.body.ids.length } });
  return ok(res, result);
}
